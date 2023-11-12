import { FC, useEffect, createRef, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { AppState } from "./App";
import TextareaAutosize from 'react-textarea-autosize';
import { useVarContext } from "@andykon/jsos/src";

const ThoughtBox: FC = () => {
    const [appState, setAppState] = useVarContext() as [
        AppState,
        (updateFn: (old: AppState) => AppState) => void
    ];

    const textAreaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    // Whenever appState._selectedThoughtIndex changes, this effect will run and focus the textarea.
    useEffect(() => {
        const selectedTextArea = textAreaRefs.current[appState._selectedThoughtIndex ?? 0];
        if (selectedTextArea) {
            selectedTextArea.focus();
            // put cursor at end of text
            selectedTextArea.setSelectionRange(selectedTextArea.value.length, selectedTextArea.value.length);
        }
    }, [appState._selectedThoughtIndex]);

    if (appState.selectedAgent()?.thoughts?.size) {
        return (
            <>
                <ScrollToBottom className="overflow-auto whitespace-pre border border-gray-500">
                    {appState
                        .selectedAgent()
                        ?.thoughts.map(([thought], index) => {
                            let className =
                                "m-1 cursor-pointer bg-zinc-800 rounded-sm flex h-[25px] overflow-auto w-full";
                            if (index === appState._selectedThoughtIndex) {
                                className +=
                                    " border border-blue-600 bg-blue-950";
                            }
                            if (!textAreaRefs.current[index]) {
                                textAreaRefs.current[index] = createRef();
                            }
                            return (
                                <TextareaAutosize
                                    ref={(el) => textAreaRefs.current[index] = el}
                                    className={className}
                                    value={thought.body ?? ""}
                                    onChange={(e) => {
                                        console.log("in onChange")
                                        setAppState(old => old.updateSelectedThought(e.target.value));
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    onFocus={() => {
                                        if (appState._selectedThoughtIndex === index) {
                                            return;
                                        }
                                        setAppState(old => old.setSelectedThought(index));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            console.log('Enter key pressed');
                                            setAppState(old => {
                                                return old.addThought("");
                                            });
                                        }
                                        if (e.key === 'Backspace' && thought.body === "") {
                                            e.preventDefault()
                                            console.log('Backspace key pressed');
                                            setAppState(old => {
                                                return old.deleteThought();
                                            });
                                        }
                                    }}
                                />
                            );
                        })
                    }
                </ScrollToBottom>
            </>
        );
    }
};

export default ThoughtBox;
