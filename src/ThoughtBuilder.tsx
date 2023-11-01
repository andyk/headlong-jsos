import React, { FC, useContext, useEffect, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

import supabase from "./lib/supabase";
import { SessionContext } from "./SessionContext";
import { Session } from "@supabase/supabase-js";
import { AppState } from "./App";
import { useVarContext } from "@andykon/jsos/src";


export function SupabaseBackedEditor({
    className,
    onUpdate,
    onInput = null,
    tableName,
    idColName,
    contentColName,
    id,
    session,
    ...props
}: {
    className: string;
    onUpdate: () => void;
    onInput: (() => void) | null;
    tableName: string;
    idColName: string;
    contentColName: string;
    id: string;
    session: Session | null;
}) {
    /* We provide onUpdate instead of having user use onChange or onInput
       since those won't get called by the initial setValue() call. */
    const [value, setValue] = useState("");
    useEffect(() => {
        supabase
            .from(tableName)
            .select(contentColName)
            .eq(idColName, id)
            .then((response) => {
                if (response.data && response.data.length > 0) {
                    setValue(response.data[0].body);
                    onUpdate(response.data[0].body);
                }
            })
            .catch((error) => {
                console.error(
                    `error fetching col('${contentColName}') from row with col('${idColName}') = '${id}'.`,
                    error
                );
            });
    }, [tableName, idColName, contentColName, id, setValue]);

    const updateDatabase = (newValue) => {
        supabase
            .from(tableName)
            .update({ [contentColName]: newValue })
            .eq(idColName, id)
            .then((response) => {})
            .catch((error) => {
                console.error(
                    `error updating col('${contentColName}'), row with col('${idColName}') = '${id}'.`,
                    error
                );
            });
    };

    const handleOnInput = (e) => {
        setValue(e.target.value);
        updateDatabase(e.target.value);
        if (onUpdate) onUpdate(e.target.value);
        if (onInput) onInput(e);
    };

    return (
        <textarea
            value={value}
            onInput={handleOnInput}
            className={className ? className : null}
            {...(session ? null : { disabled: true })}
            {...props}
        />
    );
}

export function PromptsWidget(
    { session, className, onUpdate, ...props }
    : {
        session: Session | null;
        className: string;
        onUpdate: () => void;
    }
    ) {
    const [templateNames, setTemplateNames] = useState([]);
    const [activeTemplateName, setActiveTemplateName] = useState(null);
    useEffect(() => {
        supabase
            .from("prompt_templates")
            .select("name")
            .then((response) => {
                if (response.data && response.data.length > 0) {
                    setTemplateNames(response.data.map((row) => row.name));
                }
            });
    }, [session, setTemplateNames]);

    return (
        <div className={"flex flex-col " + (className || "")} {...props}>
            <select
                className="bg-[#121212] block w-fit border border-white p-1"
                onChange={(e) => {
                    setActiveTemplateName(e.target.value);
                    console.log("set active template id: ", e.target.value);
                }}
            >
                {templateNames.map((name) => (
                    <option key={name} value={name}>
                        {name}
                    </option>
                ))}
            </select>
            <SupabaseBackedEditor
                tableName="prompt_templates"
                idColName="name"
                contentColName="body"
                id={activeTemplateName}
                session={session}
                className="bg-[#121212] overflow-auto flex-auto whitespace-pre-wrap"
                onUpdate={onUpdate}
                {...props}
            />
        </div>
    );
}

export const ThoughtBuilder: FC = () => {
    const [appState, setAppState] = useVarContext() as [
        AppState,
        (updateFn: (old: AppState) => AppState) => void
    ];
    const session = useContext(SessionContext);
    const [codeError] = useState<string | null>(null);
    const [activeEditorTab, setActiveEditorTab] = useState(0);

    const generateThought = () => {
        if (!session) return;
        fetch("/api/generate_thought", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ promptText: appState.resolvedPrompt() }),
        })
            .then((response) => response.json())
            .then((data) => {
                setNewThoughtStr(data.completion);
            });
    };

    const handleThinkItClick = () => {
        addNewThought();
    };

    const editorTabSelected = (index, lastIndex, event) => {
        setActiveEditorTab(index);
    };

    return (
        <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-4">
            <div className="overflow-auto flex flex-col">
                <Tabs
                    className="overflow-auto flex-auto flex flex-col"
                    onSelect={editorTabSelected}
                >
                    <TabList className="pt-1 mb-3 ml-1">
                        <Tab
                            className={
                                "cursor-pointer inline" +
                                (activeEditorTab === 0
                                    ? " border-b-white border-b-2"
                                    : "")
                            }
                        >
                            Edit
                        </Tab>
                        <Tab
                            className={
                                "cursor-pointer inline ml-3" +
                                (activeEditorTab === 1
                                    ? " border-b-white border-b-2"
                                    : "")
                            }
                        >
                            Preview
                        </Tab>
                    </TabList>
                    <TabPanel
                        selectedClassName="!flex w-full h-full overflow-auto"
                        className="hidden"
                    >
                        <SupabaseBackedEditor
                            onUpdate={(newVal) => setPromptText(newVal)}
                            tableName="prompt_templates"
                            idColName="name"
                            contentColName="body"
                            id="new_thought"
                            session={session}
                            className="bg-[#121212] overflow-auto flex-auto whitespace-pre-wrap"
                        />
                    </TabPanel>
                    <TabPanel
                        selectedClassName="!block flex-1 overflow-auto whitespace-pre-wrap"
                        className="hidden"
                    >
                        {resolvedPrompt}
                    </TabPanel>
                </Tabs>
                <div className="flex-none">
                    <textarea
                        className="bg-[#121212] w-full md:col-span-1 h-50 border"
                        value={newThoughtStr}
                        onChange={(e) => setNewThoughtStr(e.target.value)}
                    />
                    <button
                        onClick={generateThought}
                        {...(session
                            ? {
                                  className:
                                      "w-full px-3 bg-blue-900 text-white",
                              }
                            : {
                                  disabled: true,
                                  className:
                                      "w-full px-3 bg-gray-400 text-white cursor-not-allowed",
                              })}
                    >
                        {session ? (
                            <>Generate Thought</>
                        ) : (
                            <>Only Andy can generate thoughts</>
                        )}
                    </button>
                    <button
                        className="w-full px-3 bg-green-900 text-white"
                        onClick={(e) => handleThinkItClick()}
                    >
                        Think it
                    </button>
                </div>
            </div>
            <div className="flex flex-col overflow-auto">
                <div className="flex-none">
                    Prompts are Javascript functions that take a list of other
                    prompts as input and return a string as output. 
                </div>
                <PromptsWidget
                    className="mt-3 flex-auto overflow-auto"
                    session={session}
                    onUpdate={(newVal) => resolvePrompt()}
                />
                {codeError ? (
                    <div className="bg-red-900 p-3">{codeError}</div>
                ) : null}
            </div>
        </div>
    );
};
