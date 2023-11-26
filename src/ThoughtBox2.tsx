import { FC, useEffect, createRef, useRef, useCallback } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { AppState } from "./App";
import { useVarContext } from "@andykon/jsos/src";

const ThoughtBox2: FC = () => {
    const [appState, setAppState] = useVarContext() as [
        AppState,
        (updateFn: (old: AppState) => AppState) => void
    ];


    return (
        <textarea
            value={appState.selectedAgent()?.thoughtString}
            onChange={(e) => setAppState(old => old.updateSelectedThoughtString(e.target.value))}
        />
    );
};

export default ThoughtBox2;
