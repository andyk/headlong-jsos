import { FC, useState, useEffect } from "react";
import { OrderedMap } from "immutable";
import { Link, Route } from "wouter";
import './App-compiled.css'
import { Session } from "@supabase/supabase-js";
import { SessionContext } from "./SessionContext";
import { useVarContext, JsosContextProvider, JsosUI } from "jsos-js";
import Auth from "./Auth";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ThoughtBox from "./ThoughtBox";
//import supabase from "./lib/supabase"

const darkTheme = createTheme({
    palette: {
          mode: "dark",
    },
});

type ThoughtContext = { [key: string]: string}; 
type Thought = {
    timestamp: Date,
    body: string,
    context: ThoughtContext,
    open_ai_embedding: number[],
}
type ThoughtChangeHistory = Thought[]; // newest first
type AgentName = string;
type ThoughtList = [Thought, ThoughtChangeHistory][];
type Agent = {name: string, thoughts: ThoughtList};
type AgentMap = OrderedMap<AgentName, Agent>;

export class AppState {
    _selectedAgentName: string | null; // Name of selected agent
    _selectedThoughtIndex: number | null; // index into appState.agents[appState.selectedAgent].thoughts
    agents: AgentMap;
    constructor(selectedAgentName?: string | null, selectedThoughtIndex?: number | null, agents?: AgentMap | null) {
        this._selectedAgentName = selectedAgentName ?? null;
        this._selectedThoughtIndex = selectedThoughtIndex ?? null;
        this.agents = agents ?? OrderedMap();
    }
    copy(
        options: {
            selectedAgentName?: string | null;
            selectedThoughtIndex?: number | null;
            agents?: AgentMap | null
        }
    ) {
        // https://stackoverflow.com/questions/64638771/how-can-i-create-a-new-instance-of-a-class-using-this-from-within-method
        // till we support closing over global state, functions need to close over only state attached to `this`.
        return new (this.constructor as new (
            selectedAgentName?: string | null,
            selectedThoughtIndex?: number | null,
            agents?: AgentMap | null
        ) => this)(
            options.selectedAgentName ?? this._selectedAgentName,
            options.selectedThoughtIndex ?? this._selectedThoughtIndex,
            options.agents ?? this.agents
        );
    }
    selectedAgent(): Agent | undefined {
        if (this._selectedAgentName === null) {
            return
        }
        return this.agents.get(this._selectedAgentName);
    }
    selectedThought(): Thought | undefined {
        if (this._selectedAgentName === null) {
            return
        }
        return this.agents.getIn([this._selectedAgentName, "thoughts", this._selectedThoughtIndex]) as Thought;
    }
    setSelectedAgent(selectedAgentName: string) {   
        return this.copy({selectedAgentName});
    }
    setSelectedThough(selectedThoughtIndex: number) {   
        return this.copy({selectedThoughtIndex})
    }
    addAgent(agent: Agent) {
        const agents = this.agents.set(agent.name, agent);
        if (agents.size === 1) {
            return this.copy({selectedAgentName: agent.name, agents: agents});
        }
        return this.copy({agents})
    }
    addThought(thought: string) {
        let selectedThoughtIndex = 0;
        const agents = this.agents.updateIn(
            [this._selectedAgentName, "thoughts"],
            (thoughts) => {
                console.log("in this.agents.updateIn, thoughts: ", thoughts)
                const castedThoughts = thoughts as ThoughtList;
                selectedThoughtIndex = castedThoughts.length;
                console.log("updating selectedThoughtIndex to: ", selectedThoughtIndex)
                return [
                    ...castedThoughts,
                    [{
                        timestamp: new Date(),
                        body: thought,
                        context: {},
                        open_ai_embedding: [],
                    }, []]
                ]
            }
        )
        return this.copy({agents, selectedThoughtIndex})
    }
    updateSelectedThought(newThoughtStr: string) {
        if (this._selectedThoughtIndex === null) {
            return
        }
        const agents = this.agents.updateIn(
            [this._selectedAgentName, "thoughts", this._selectedThoughtIndex, 0],
            (thought) => {
                const castedThought = thought as Thought;
                return {
                    ...castedThought,
                    body: newThoughtStr
                }
            }
        )
        return this.copy({agents})
    }
}
const defaultAppStateInst = new AppState().addAgent({name: "zany zoo zepplin", thoughts: []}).addThought("some Thought");

const Header: FC = () => {
    const [appState, setAppState]  = useVarContext() as [AppState, (updateFn: (old: AppState) => AppState) => void];
    const selectedAgent = appState.selectedAgent();

    useEffect(() => {
        console.log("appState updated: ", appState);
    }, [appState]);

    return (
        <div className="md:col-span-2 w-screen md:flex border-b border-gray-700">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="61"
                height="49.5"
                viewBox="0 0 61 49.5"
                className="md:flex-none"
            >
                <rect
                    x="8"
                    y="8"
                    width="9"
                    height="34.5"
                    style={{ fill: "#808080" }}
                />
                <rect
                    x="23"
                    y="8"
                    width="9"
                    height="34.5"
                    style={{ fill: "#808080" }}
                />
                <rect
                    x="36.5"
                    y="33.5"
                    width="11.5"
                    height="9"
                    style={{ fill: "#808080" }}
                />
            </svg>
            {selectedAgent ? (
                <select
                    id="agent-selector"
                    className="bg-[#121212] border border-gray-600 px-2 m-2"
                    value={selectedAgent.name}
                    onChange={(event) => {
                        const newAgentNameSelected = event.target.value;
                        if(newAgentNameSelected) {
                            setAppState((old: AppState) => 
                                old.setSelectedAgent(newAgentNameSelected)
                            )
                        }
                    }}
                >
                    {[...appState.agents.keys()].map((agentName) => (
                        <option key={agentName} value={agentName}>
                            {agentName}
                        </option>
                    ))}
                </select>
            ) : null}
            <div className="md:flex-auto md:flex md:flex-row-reverse mr-4">
                <Link
                    to="/thought_builder"
                    className="p-3 border-b border-gray-900 think "
                >
                    Thought Builder
                </Link>
                <Link to="/" className="p-3 border-b border-gray-800">
                    Stream of Thoughts
                </Link>
            </div>
        </div>
    );
};

const Footer = ({ session }: { session: Session | null }) => {
  return (
      <div className="md:col-span-2">
          {!session ? (
              <Auth />
          ) : (
              <div>{session.user.email}, You are logged in.</div>
          )}
      </div>
  );
};

function App() {
    const [session] = useState<Session | null>(null);
    //const [newThoughtStr, setNewThoughtStr] = useState<string>("");
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <SessionContext.Provider value={session}>
                <JsosContextProvider name="headlong" namespace="headlong-vite-v2" defaultVal={defaultAppStateInst}>
                <div className="container 2 md:h-screen md:grid md:gap-3 md:grid-cols-2 grid-rows-[50px_minmax(300px,_1fr)_30px]">
                    <Header/>
                    <Route path="/">
                        <div className="overflow-auto grid grid-rows-[1fr_60px]">
                            <ThoughtBox/>
                        </div>
                    </Route>
                    <Footer session={session} />
                    <JsosUI/>
                </div>
                </JsosContextProvider>
            </SessionContext.Provider>
        </ThemeProvider>
    );
}

export default App
