import { FC, useState, useEffect } from "react";
import { OrderedMap } from "immutable";
import { Link, Route } from "wouter";
import './App-compiled.css'
import { Session } from "@supabase/supabase-js";
import { SessionContext } from "./SessionContext";
import { useVarContext, JsosContextProvider } from "jsos-js";
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
    label: string,
    body: string,
    context: ThoughtContext,
    open_ai_embedding: number[],
}
type ThoughtChangeHistory = Thought[]; // newest first
type AgentName = string;
type Agent = {name: string, thoughts: [Thought, ThoughtChangeHistory][]};
type AgentMap = OrderedMap<AgentName, Agent>;
export type AppState = {
    selectedAgentName: string | null, // Name of selected agent
    getSelectedAgent(): Agent | undefined,
    selectedThoughtIndex: number | null, // index into appState.agents[appState.selectedAgent].thoughts
    getSelectedThought(): Thought | undefined,
    agents: AgentMap
};
const defaultAppState: AppState = {
    selectedAgentName: "zany zoo zonker",
    getSelectedAgent: function() {
        if (this.selectedAgentName === null) {
            return
        }
        return this.agents.get(this.selectedAgentName);
    },
    selectedThoughtIndex: 0,
    getSelectedThought: function() {
        if (this.selectedAgentName === null) {
            return
        }
        return this.agents.getIn([this.selectedAgentName, "thoughts", this.selectedThoughtIndex]) as Thought;
    },
    agents: OrderedMap([
        [
            "zany zoo zonker", // AgentName
            { // Agent
                name: "zany zoo zonker",
                thoughts: [
                    [
                        { // Thought
                            timestamp: new Date(),
                            label: "thought",
                            body: "hi",
                            context: {},
                            open_ai_embedding: [],
                        },
                        [] // ThoughtChangeHistory
                    ]
                ]
            }
        ], [
            "Very Vivid Vander",
            {
                name: "Very Vivid Vander",
                thoughts: []
            }
        ]
    ])
};

const Header: FC = () => {
    const [appState, setAppState]  = useVarContext() as [AppState, (updateFn: (old: AppState) => AppState) => void];
    const selectedAgent = appState.getSelectedAgent();

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
                        if(newAgentNameSelected ) {
                            setAppState((old: AppState) => {
                                const newVal = {
                                ...old,
                                selectedAgentName: newAgentNameSelected
                                }
                                return newVal;
                            })
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
            <div className="ml-2 my-3 text-gray-400 text-xs">
                (Agent Name: { appState.getSelectedAgent()?.name })
            </div>
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
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <SessionContext.Provider value={session}>
                <JsosContextProvider name="headlong" namespace="headlong-vite" defaultVal={defaultAppState}>
                <div className="container 2 md:h-screen md:grid md:gap-3 md:grid-cols-2 grid-rows-[50px_minmax(300px,_1fr)_30px]">
                    <Header/>
                    <Route path="/">
                        <div className="overflow-auto grid grid-rows-[1fr_60px]">
                            <ThoughtBox/>
                        </div>
                    </Route>
                    <Footer session={session} />
                </div>
                </JsosContextProvider>
            </SessionContext.Provider>
        </ThemeProvider>
    );



//                <div className="container 2 md:h-screen md:grid md:gap-3 md:grid-cols-2 grid-rows-[50px_minmax(300px,_1fr)_30px]">
//                    <Header
//                        agents={appState.agents}
//                        selectedAgent={appState.selectedAgent}
//                        setSelectedAgent={(newName) =>
//                            setAppState((appState: AppState) => {
//                                return {...appState, selectedAgent: newName}
//                            })
//                        }
//                    />
//                    <Route path="/">
//                        <div className="overflow-auto grid grid-rows-[1fr_60px]">MAIN</div>
//                    </Route>
//                    <Footer session={session} />
//                </div>
//            </SessionContext.Provider>
//        </ThemeProvider>
//        </JsosContextProvider>
//    );
//    return (
//        <JsosContextProvider name="headlong" namespace="headlong-vite" defaultVal={defaultAppState}>
//        <ThemeProvider theme={darkTheme}>
//            <CssBaseline />
//            <SessionContext.Provider value={session}>
//                <div className="container 2 md:h-screen md:grid md:gap-3 md:grid-cols-2 grid-rows-[50px_minmax(300px,_1fr)_30px]">
//                    <Header
//                        agents={appState.agents}
//                        selectedAgent={appState.selectedAgent}
//                        setSelectedAgent={(newName) =>
//                            setAppState((appState: AppState) => {
//                                return {...appState, selectedAgent: newName}
//                            })
//                        }
//                    />
//                    <Route path="/">
//                        <div className="overflow-auto grid grid-rows-[1fr_60px]">
//                            <ThoughtBox
//                                selectedAgent={appState.agents[appState.selectedAgent]}
//                                selectedAgentThoughts={appState.agents[appState.selectedAgent].thoughts}
//                                selectedThought={selectedThought}
//                                setSelectedThoughtUUID={setSelectedThoughtUUID}
//                                selectedThoughtUUID={selectedThoughtUUID}
//                                updateSelectedThought={updateSelectedThought}
//                            />
//                            <div className="border mt-1 flex">
//                                <textarea
//                                    className="bg-black m-1 flex-1 resize-none"
//                                    value={newThoughtStr}
//                                    onChange={(e) =>
//                                        setNewThoughtStr(e.target.value)
//                                    }
//                                    onKeyUp={(e) =>
//                                        e.key === "Enter" && !e.shiftKey
//                                            ? addNewThought()
//                                            : null
//                                    }
//                                />
//                            </div>
//                            <div>
//                                <button
//                                    className="flex-none bg-green-900 px-3"
//                                    onClick={addNewThought}
//                                >
//                                    Think it
//                                </button>
//                                <button
//                                    className="flex-none bg-blue-900 px-3"
//                                    onClick={getNextThought}
//                                >
//                                    Auto Generate Thought
//                                </button>
//                                <Link
//                                    className="pl-2 cursor-pointer text-sm underline"
//                                    to="/thought_builder"
//                                >
//                                    Thought Builder
//                                </Link>
//                            </div>
//                        </div>
//                        <div className="overflow-auto flex">
//                            <ThoughtDetail
//                                selectedAgent={selectedAgent}
//                                selectedThought={selectedThought}
//                                updateSelectedThought={updateSelectedThought}
//                                deleteSelectedThought={deleteSelectedThought}
//                            />
//                        </div>
//                    </Route>
//                    <Route path="/thought_builder">
//                        <ThoughtBuilder
//                            addNewThought={addNewThought}
//                            selectedAgentThoughts={selectedAgentThoughts}
//                        />
//                    </Route>
//                    <Footer session={session} />
//                </div>
//    );
}

export default App
