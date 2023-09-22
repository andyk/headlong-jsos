import { FC, /*useCallback,*/ useEffect, useState, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { AppState } from "./App";
import { useVarContext } from "jsos-js";

const ThoughtBox: FC = () => {
    const [appState, setAppState] = useVarContext() as [
        AppState,
        (updateFn: (old: AppState) => AppState) => void
    ];
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedThoughtEditable] =
        useState<boolean>(false);
    const [localThoughtString, setLocalThoughtString] = useState<string>("");

    useEffect(() => {
        const selectedThought = appState.getSelectedThought();
        setLocalThoughtString(
            selectedThought?.label + ": " + selectedThought?.body
        );
    }, [appState, setLocalThoughtString]);

    //const selectNextThought = useCallback(() => {
    //    const selectedAgent = appState.getSelectedAgent();
    //    if (
    //        selectedAgent?.thoughts &&
    //        appState?.selectedThoughtIndex !== undefined &&
    //        appState?.selectedThoughtIndex !== null &&
    //        appState.selectedThoughtIndex < selectedAgent.thoughts.length - 1
    //    ) {
    //        setAppState((old: typeof appState) => {
    //            return {
    //                ...old,
    //                selectedThoughtIndex: old.selectedThoughtIndex ?? 0 + 1,
    //            };
    //        });
    //    }
    //}, [appState, setAppState]);

    //const selectPrevThought = useCallback(() => {
    //    const selectedAgent = appState.getSelectedAgent();
    //    if (
    //        selectedAgent?.thoughts &&
    //        appState?.selectedThoughtIndex !== undefined &&
    //        appState?.selectedThoughtIndex !== null &&
    //        appState.selectedThoughtIndex > selectedAgent.thoughts.length - 1
    //    ) {
    //        setAppState((old: typeof appState) => {
    //            return {
    //                ...old,
    //                selectedThoughtIndex: old.selectedThoughtIndex ?? 1 - 1,
    //            };
    //        });
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
    //            if (event.key === "Enter" || event.key === "i") {
    //                setSelectedThoughtEditable(true);
    //            }
    //        } else {
    //            if (
    //                event.key === "Escape" ||
    //                (event.ctrlKey && event.key === "[")
    //            ) {
    //                console.log("setting selectedThoughtEditable to false");
    //                setSelectedThoughtEditable(false);
    //            }
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
        console.log("updated local thought string: ", localThoughtString);
        /*
        let newThought = Thought.fromString(localThoughtString).update({uuid: selectedThoughtUUID});
        updateSelectedThought(newThought);
        */
    }, [localThoughtString]);

    const selectedAgentThoughts = appState.getSelectedAgent()?.thoughts;
    const selectedThoughtIndex = appState.selectedThoughtIndex;
    if (selectedAgentThoughts?.length) {
        // TODO: use selectedThoughtUUID to highlight the selected thought
        return (
            <ScrollToBottom className="overflow-auto whitespace-pre border border-gray-500">
                { selectedAgentThoughts.map(
                    ([thought], index) => {
                        const handleClick = () => {
                            setAppState((old: AppState) => {
                                return {
                                    ...old,
                                    selectedThoughtIndex: index
                                };
                            });
                        };
                        let className =
                            "m-2 cursor-pointer bg-zinc-800 rounded-sm flex h-[20px] w-full";
                        if (index === selectedThoughtIndex) {
                            className += " border border-blue-600 bg-blue-950";
                        }
                        return selectedThoughtEditable &&
                            index === selectedThoughtIndex ? (
                            <textarea
                                ref={textareaRef}
                                key={index}
                                className={className}
                                value={
                                    selectedThoughtEditable &&
                                    index === selectedThoughtIndex
                                        ? localThoughtString
                                        : thought?.label + ": " + thought?.body
                                }
                                onChange={(e) => {
                                    setLocalThoughtString(e.target.value);
                                }}
                                onClick={handleClick}
                                onFocus={() => {
                                    console.log("in onfocus");
                                    const textarea = textareaRef.current;
                                    if (textarea) {
                                        textarea.setSelectionRange(
                                            textarea.value.length,
                                            textarea.value.length
                                        );
                                    }
                                }}
                            />
                        ) : (
                            <div
                                key={index}
                                className={className}
                                onClick={handleClick}
                            >
                                {thought?.label + ": " + thought?.body}
                            </div>
                        );
                    }
                )}
            </ScrollToBottom>
        );
    }
    return <div></div>;
};

export default ThoughtBox;
