import { FC, useState, useEffect, ChangeEvent } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { List as ImmutableList, OrderedMap, Map as ImmutableMap } from "immutable";
import { Route } from "wouter";
import "./App-compiled.css";
import openai from "./lib/openai";
import { Session } from "@supabase/supabase-js";
import { SessionContext } from "./SessionContext";
import { useVarContext, JsosContextProvider } from "@andykon/jsos/src";
import Auth from "./Auth";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ThoughtBox from "./ThoughtBox";
//import { ThoughtBuilder } from "./ThoughtBuilder";
import supabase from "./lib/supabase";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

type ThoughtContext = { [key: string]: string };
type Thought = {
    timestamp: Date;
    body: string;
    context: ThoughtContext;
    open_ai_embedding: number[];
};
type ThoughtChangeHistory = Thought[]; // newest first
type AgentName = string;
type ThoughtList = ImmutableList<[Thought, ThoughtChangeHistory]>;
type Agent = {
    name: string;
    thoughts: ThoughtList;
    thoughtGeneratorName?: TemplateName;
}; // default thoughtGeneratorName is 'main'
type AgentMap = OrderedMap<AgentName, Agent>;

// A Template is a Javascript function that returns a string.
// When a template is evaluated, it has `appState` in scope so it can reference any part of it,
// including this agent's thought history, other agents, other templates, etc.

type TemplateName = string;
type Template = string; // The string should be javascript that returns a string type.
type TemplateMap = ImmutableMap<TemplateName, Template>; // Map from `fn.name` => `fn`

// An agent has arbitrary many Templates and a special "entry" template
// which we call call its "thoughtGenerator", so agent keeps a property with
// the name of it's thoughtGenerator template: `agent.thoughtGeneartorName`.
export class AppState {
    _selectedAgentName: string | null; // Name of selected agent
    _selectedThoughtIndex: number | null; // index into appState.agents[appState.selectedAgent].thoughts
    agents: AgentMap;
    templates: TemplateMap;

    constructor(
        selectedAgentName?: string | null,
        selectedThoughtIndex?: number | null,
        agents?: AgentMap | null,
        templates?: TemplateMap | null
    ) {
        this._selectedAgentName = selectedAgentName ?? null;
        this._selectedThoughtIndex = selectedThoughtIndex ?? null;
        this.agents = agents ?? OrderedMap();
        this.templates = templates ?? ImmutableMap();
    }

    copy(options: {
        selectedAgentName?: string | null;
        selectedThoughtIndex?: number | null;
        agents?: AgentMap | null;
        templates?: TemplateMap | null;
    }) {
        // https://stackoverflow.com/questions/64638771/how-can-i-create-a-new-instance-of-a-class-using-this-from-within-method
        // till we support closing over global state, functions need to close over only state attached to `this`.
        return new (this.constructor as new (
            selectedAgentName?: string | null,
            selectedThoughtIndex?: number | null,
            agents?: AgentMap | null,
            templates?: TemplateMap | null
        ) => this)(
            options.selectedAgentName ?? this._selectedAgentName,
            options.selectedThoughtIndex ?? this._selectedThoughtIndex,
            options.agents ?? this.agents,
            options.templates ?? this.templates
        );
    }
    selectedAgent(): Agent | undefined {
        if (this._selectedAgentName === null) {
            return;
        }
        return this.agents.get(this._selectedAgentName);
    }
    selectedThought(): Thought | undefined {
        if (this._selectedAgentName === null) {
            return;
        }
        return this.agents.getIn([
            this._selectedAgentName,
            "thoughts",
            this._selectedThoughtIndex,
        ]) as Thought;
    }
    selectedGenerator(): Template | undefined {
        const selectedAgent = this.selectedAgent();
        if (
            selectedAgent === undefined ||
            selectedAgent.thoughtGeneratorName === undefined
        ) {
            return;
        }
        const retVal = this.templates.get(selectedAgent.thoughtGeneratorName);
        return retVal;
    }
    setSelectedAgent(selectedAgentName: string): AppState {
        return this.copy({ selectedAgentName });
    }
    setSelectedThought(selectedThoughtIndex: number): AppState {
        return this.copy({ selectedThoughtIndex });
    }
    addAgent(agent: Agent, setAsSelected: boolean = true): AppState {
        const ag = {
            name: agent.name,
            thoughts: agent.thoughts,
            thoughtGeneratorName: agent.thoughtGeneratorName ?? "main",
        };
        const agents = this.agents.set(agent.name, ag);
        if (agents.size === 1) {
            return this.copy({ selectedAgentName: agent.name, agents: agents });
        } else if (setAsSelected) {
            return this.copy({ agents, selectedAgentName: agent.name })
        } else {
            return this.copy({ agents });
        }
    }
    // Insert at Index, shifting others forward. If index is not provided, insert after currently selected (if any) or at end.
    addThought(thought: string, index?: number): AppState {
        let targetIndex: number | undefined;
        if (index !== undefined) {
            targetIndex = index;
        } else if (this._selectedThoughtIndex) {
            targetIndex = this._selectedThoughtIndex + 1;
        }
        const agents = this.agents.updateIn(
            [this._selectedAgentName, "thoughts"],
            (thoughts) => {
                const castedThoughts = (thoughts as ThoughtList) ?? ImmutableList();
                const withInserted = castedThoughts.insert(
                    targetIndex ?? castedThoughts.size,
                    [
                        {
                            timestamp: new Date(),
                            body: thought,
                            context: {},
                            open_ai_embedding: [],
                        },
                        [],
                    ],
                );
                return withInserted;
            }
        );
        return this.copy({ agents, selectedThoughtIndex: index ?? targetIndex ?? 1});
    }
    // if no index provided, delete currently selected thought (if set) or last thought
    deleteThought(index?: number): AppState {
        const agents = this.agents.updateIn(
            [this._selectedAgentName, "thoughts"],
            (thoughts) => {
                const castedThoughts = thoughts as ThoughtList;
                const targetIndex = index ?? this._selectedThoughtIndex ?? castedThoughts.size - 1;
                console.log("deleting thought at index: ", targetIndex)
                return castedThoughts.delete(targetIndex);
            }
        );
        return this.copy({ agents, selectedThoughtIndex: (this._selectedThoughtIndex ?? 1) - 1});
    }
    setTemplate(name: string, template: string): AppState {
        const templates = this.templates.set(name, template);
        return this.copy({ templates })
    }
    updateSelectedThought(newThoughtStr: string): AppState {
        if (this._selectedThoughtIndex === null) {
            throw new Error("selectedThoughtIndex is null");
        }
        const agents = this.agents.updateIn(
            [
                this._selectedAgentName,
                "thoughts",
                this._selectedThoughtIndex,
                0,
            ],
            (thought) => {
                const castedThought = thought as Thought;
                return {
                    ...castedThought,
                    body: newThoughtStr,
                };
            }
        );
        return this.copy({ agents });
    }
    updateSelectedGenerator(newGeneratorString: string): AppState {
        const selectedAgent = this.selectedAgent();
        if (
            selectedAgent === undefined ||
            selectedAgent.thoughtGeneratorName === undefined
        ) {
            return this;
        }
        const templates = this.templates.set(
            selectedAgent.thoughtGeneratorName,
            newGeneratorString
        );
        return this.copy({ templates });
    }
}
const defaultAppStateInst = new AppState()
    .addAgent({ name: "zany zoo zepplin", thoughts: ImmutableList() })
    .addThought("it's dinner time")
    .addThought("i'm very hungry")
    .addThought("i should get dinner soon")
    .addThought("what should i get for dinner?")
    .addThought("i had sushi yesterday and my wife had pizza for lunch2")
    .addThought("ok so vietnamese it is")
    .addThought("i'll order pho and spring rolls")
    .addThought("i hope it arrives soon, i'm starving")
    .addThought("i'll go set the table while i wait for the food to arrive")
    .addThought("i can't wait to eat, it smells so good")
    .setTemplate("main", `let x = appState.selectedAgent().thoughts.map(([thought, history]) => ({role: "assistant", content: thought.body}))
// grab relevant memories from farther back in our thought history using semantic search
// inject summary thoughts that are "sketches" of windows of (related) thoughts
// support actions like web search and file editing
// gpt4(({messages: x})).then((res) => res.choices[0].message.content)`)
    .addAgent({ name: "bilbo bossy baggins", thoughts: ImmutableList() })
    .setSelectedAgent("bilbo bossy baggins")
    .addThought("i'm going to try to build an LLM agent that can do well at SWE-bench")

const Header: FC = () => {
    const [appState, setAppState] = useVarContext() as [
        AppState,
        (updateFn: (old: AppState) => AppState) => void
    ];
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
                <>
                <select
                    id="agent-selector"
                    className="bg-[#121212] border border-gray-600 px-2 m-2"
                    value={selectedAgent.name}
                    onChange={(event) => {
                        const newAgentNameSelected = event.target.value;
                        if (newAgentNameSelected) {
                            setAppState((old: AppState) =>
                                old.setSelectedAgent(newAgentNameSelected)
                            );
                        }
                    }}
                >
                    {[...appState.agents.keys()].map((agentName) => (
                        <option key={agentName} value={agentName}>
                            {agentName}
                        </option>
                    ))}
                </select>
                <button
                    className={"bg-slate-800 text-sm p-1 m-1"} 
                    onClick={() => {
                        const userInput = prompt("New Agent name", "");
                        if (userInput) {
                            setAppState((old: AppState) => {
                                let updated = old.addAgent({
                                    name: userInput,
                                    thoughts: ImmutableList(),
                                });
                                updated = updated.setSelectedAgent(userInput)
                                updated.addThought("")
                                return updated
                            });
                        }
                    }}
                >
                    New Agent
                </button>
                </>
            ) : null}
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

type ChatMessage = { role: "function" | "system" | "user" | "assistant", content: string } 
const gpt4 = async (options: {messages: ChatMessage[], max_tokens?: number, temperature?: number}) => {
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: options.messages,
        max_tokens: options.max_tokens ?? 50,
        temperature: options.temperature ?? 0.5,
    });
    return completion;
};

function TemplateSelector() {
    const [appState, setAppState] = useVarContext() as [
        AppState,
        (updateFn: (old: AppState) => AppState) => void
    ];
    return (
        <select id="template-selector">
            {[...appState.templates.keys()].map((templateName) => (
                <option key={templateName} value={templateName}>
                    {templateName}
                </option>
            ))}
        </select>
    );
}

function TemplateEditor() {
    const [appState, setAppState] = useVarContext() as [
        AppState,
        (updateFn: (old: AppState) => AppState) => void
    ];
    const [activeEditorTab, setActiveEditorTab] = useState(0);
    const editorTabSelected = (index, lastIndex, event) => {
        setActiveEditorTab(index);
    };
    const [evalRes, setEvalRes] = useState({ error: null, res: null });
    const evalSelectedGenerator = async () => {
        const template = appState.selectedGenerator();
        if (template) {
            console.log("evaluating template: ", template);
            try {
                const res = eval(template);
                if (res instanceof Promise) {
                    const promiseRes = await res;
                    console.log("returning awaited res ", promiseRes);
                    setEvalRes({ error: null, res: promiseRes });
                    return;
                } else {
                    console.log("returning res ", res);
                    setEvalRes({ error: null, res });
                    return;
                }
                return;
            } catch (e) {
                setEvalRes({ res: null, error: e.message });
                return;
            }
        }
    };
    useEffect(() => {
        evalSelectedGenerator();
    }, [appState]);

    //useEffect(() => {
    //    console.log("evalRes updated: ", evalRes)
    //}, [evalRes])

    return (
        <div className="overflow-auto pt-3 flex flex-col">
            <div className="!flex w-full h-half overflow-auto">
                <textarea
                    className="overflow-auto w-full p-2 bg-zinc-800"
                    value={appState.selectedGenerator()?.toString() || ""}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                        const newVal = e.target.value;
                        console.log(
                            "calling old.updateSelectedGenerator(" +
                                newVal +
                                ")"
                        );
                        setAppState((old) => {
                            console.log("in setAppState, updating to: ");
                            return old.updateSelectedGenerator(newVal);
                        });
                    }}
                />
            </div>
            <div className="mt-3 !block h-half flex-1 overflow-auto whitespace-pre-wrap">
                {typeof evalRes.res === "string" ? evalRes.res : "Object found, stringifying it: " + JSON.stringify((evalRes?.res || ""))}
            </div>
            {evalRes.error ? (
                <div className="bg-red-900 p-3">{evalRes.error}</div>
            ) : null}
            <div className="inline-flex">
                <button
                    className="w-32 bg-green-900 mt-2"
                    onClick={() => {
                        setAppState(old =>
                            old.addThought(
                                typeof evalRes.res === "string" ? evalRes.res : "Object found, stringifying it: " + JSON.stringify((evalRes?.res || ""))
                            )
                        )
                    }}
                >
                    Accept
                </button>
                <button
                    className="w-32 bg-blue-900 mt-2 ml-2"
                    onClick={() => {
                        evalSelectedGenerator()
                    }}
                >
                    Regenerate
                </button>
            </div>
        </div>
    );
}

function App() {
    const [session] = useState<Session | null>(null);
    //const [newThoughtStr, setNewThoughtStr] = useState<string>("");

    //let is_andy = false;
    //if (
    //    session &&
    //    session.user &&
    //    session.user.email &&
    //    session.user.email === "andykonwinski@gmail.com"
    //) {
    //    is_andy = true;
    //}
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <SessionContext.Provider value={session}>
                <JsosContextProvider
                    name="headlong"
                    namespace="headlong-vite-v2"
                    defaultVal={defaultAppStateInst}
                    supabaseClient={supabase}
                    overwriteExisting={false}
                >
                    <div className="container 2 md:h-screen md:grid md:gap-3 md:grid-cols-2 grid-rows-[50px_minmax(300px,_1fr)_30px]">
                        <Header />
                        <Route path="/">
                            <div className="overflow-auto grid grid-rows-[1fr]">
                                <ThoughtBox />
                            </div>
                            <div className="overflow-auto flex">
                                <div className="container grid grid-rows-[30px_1fr_30px] overflow-auto w-full">
                                    <TemplateSelector />
                                    <TemplateEditor />
                                </div>
                            </div>
                        </Route>
                        <Footer session={session} />
                        { null /*<JsosUI supabaseClient={supabase}/> */}
                    </div>
                </JsosContextProvider>
            </SessionContext.Provider>
        </ThemeProvider>
    );
}

export default App;
