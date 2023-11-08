import { FC, useEffect } from "react";
import { List as ImmutableList } from "immutable";
import { useVarContext } from "@andykon/jsos/src";
import { AppState } from "./App";

export const Header: FC = () => {
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
                    style={{ fill: "#808080" }} />
                <rect
                    x="23"
                    y="8"
                    width="9"
                    height="34.5"
                    style={{ fill: "#808080" }} />
                <rect
                    x="36.5"
                    y="33.5"
                    width="11.5"
                    height="9"
                    style={{ fill: "#808080" }} />
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
                                setAppState((old: AppState) => old.setSelectedAgent(newAgentNameSelected)
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
                                    updated = updated.setSelectedAgent(userInput);
                                    updated.addThought("");
                                    return updated;
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
