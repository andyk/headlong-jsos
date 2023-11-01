import { FC, useCallback, useEffect, useState, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { AppState } from "./App";
import { useVarContext } from "@andykon/jsos/src";

const ThoughtBox: FC = () => {
    const [appState, setAppState] = useVarContext() as [
        AppState,
        (updateFn: (old: AppState) => AppState) => void
    ];
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedThoughtEditable, setSelectedThoughtEditable] = useState<boolean>(false);
    const [localThoughtString, setLocalThoughtString] = useState<string>("");

    useEffect(() => {
        const selectedThought = appState.selectedThought();
        setLocalThoughtString(
            selectedThought?.body ?? ""
        );
    }, [appState, setLocalThoughtString]);

    //const selectNextThought = useCallback(() => {
    //    const selectedAgent = appState.selectedAgent();
    //    const thoughtIndex = appState._selectedThoughtIndex;
    //    if (
    //        selectedAgent !== undefined &&
    //        appState.selectedThought() !== undefined &&
    //        thoughtIndex !== null &&
    //        thoughtIndex < selectedAgent.thoughts.length - 1
    //    ) {
    //        setAppState(old => 
    //            old.setSelectedThought(
    //                old._selectedThoughtIndex ?? 0 + 1
    //            )
    //        )
    //    }
    //}, [appState, setAppState]);

    //const selectPrevThought = useCallback(() => {
    //    console.log("in selectPrevThought")
    //    const selectedAgent = appState.selectedAgent();
    //    const thoughtIndex = appState._selectedThoughtIndex;
    //    if (
    //        selectedAgent !== undefined &&
    //        appState.selectedThought() !== undefined &&
    //        thoughtIndex !== null &&
    //        thoughtIndex > selectedAgent.thoughts.length - 1
    //    ) {
    //        setAppState(old => 
    //            old.setSelectedThought(
    //                old._selectedThoughtIndex ?? 1 - 1
    //            )
    //        );
    //    }
    //}, [appState, setAppState]);

    //useEffect(() => {
    //    /* Listen for keyboard shortcuts. */
    //    const handleKeyDown = (event) => {
    //        if (!selectedThoughtEditable) {
    //            if (event.key === "ArrowUp" || event.key === "k") {
    //                selectPrevThought();
    //            }
    //            if (event.key === "ArrowDown" || event.key === "j") {
    //                selectNextThought();
    //            }
    //            //if (event.key === "Enter" || event.key === "i") {
    //            //    setSelectedThoughtEditable(true);
    //            //}
    //        } else {
    //            //if (
    //            //    event.key === "Escape" ||
    //            //    (event.ctrlKey && event.key === "[")
    //            //) {
    //            //    console.log("setting selectedThoughtEditable to false");
    //            //    setSelectedThoughtEditable(false);
    //            //}
    //        }
    //    };

    //    window.addEventListener("keydown", handleKeyDown);

    //    // cleanup on unmount
    //    return () => {
    //        window.removeEventListener("keydown", handleKeyDown);
    //    };
    //}, [
    //    selectPrevThought,
    //    selectNextThought,
    //    selectedThoughtEditable,
    //    setSelectedThoughtEditable,
    //]); // empty dependency array to only run on mount and unmount

    useEffect(() => {
        if (selectedThoughtEditable) {
            const textarea = textareaRef.current;
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(
                    textarea.value.length,
                    textarea.value.length
                );
            }
        }
    }, [appState, selectedThoughtEditable]);

    useEffect(() => {
        /*
        let newThought = Thought.fromString(localThoughtString).update({uuid: selectedThoughtUUID});
        updateSelectedThought(newThought);
        */
    }, [localThoughtString]);

    const addNewThought = async (thoughtText: string) => {
        setAppState((old: AppState) => old.addThought(thoughtText));
        setSelectedThoughtEditable(true);
    };

    if (appState.selectedAgent()?.thoughts?.length) {
        // TODO: use selectedThoughtUUID to highlight the selected thought
        return (
            <>
                <ScrollToBottom className="overflow-auto whitespace-pre border border-gray-500">
                    {appState
                        .selectedAgent()
                        ?.thoughts.map(([thought], index) => {
                            const handleClick = () => {
                                setAppState((old: AppState) => {
                                    console.log(
                                        "setting selectedThoughtIndex to ",
                                        index
                                    );
                                    const newAppState =
                                        old.setSelectedThought(index);
                                    console.log(
                                        "got new app state: ",
                                        newAppState
                                    );
                                    return newAppState;
                                });
                                setSelectedThoughtEditable(true);
                            };
                            let className =
                                "m-2 cursor-pointer bg-zinc-800 rounded-sm flex h-[20px] w-full";
                            if (index === appState._selectedThoughtIndex) {
                                className +=
                                    " border border-blue-600 bg-blue-950";
                            }
                            return selectedThoughtEditable &&
                                index === appState._selectedThoughtIndex ? (
                                <textarea
                                    ref={textareaRef}
                                    key={index}
                                    className={className}
                                    value={localThoughtString ? localThoughtString : thought?.body}
                                    onChange={(e) => {
                                        setLocalThoughtString(e.target.value);
                                    }}
                                    onClick={handleClick}
                                    onFocus={() => {
                                        console.log("in onfocus");
                                        setLocalThoughtString(thought?.body ?? "")
                                        const textarea = textareaRef.current;
                                        if (textarea) {
                                            textarea.setSelectionRange(
                                                textarea.value.length,
                                                textarea.value.length
                                            );
                                        }
                                    }}
                                    onBlur={() => {
                                        console.log("in onblur");
                                        setAppState((old: AppState) => old.updateSelectedThought(localThoughtString) ?? old);
                                        setSelectedThoughtEditable(false);
                                    }}
                                />
                            ) : (
                                <div
                                    key={index}
                                    className={className}
                                    onClick={handleClick}
                                >
                                    {thought?.body}
                                </div>
                            );
                        })}
                </ScrollToBottom>
                <button
                    onClick={() => {
                        addNewThought("");
                    }}
                >
                    Add Thought
                </button>
            </>
        );
    }
    return <div></div>;
};

export default ThoughtBox;
