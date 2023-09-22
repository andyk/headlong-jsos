import { Context, createContext } from 'react';
import { Session } from "@supabase/gotrue-js/src/lib/types"

export const SessionContext: Context<Session | null> = createContext<Session | null>(null);