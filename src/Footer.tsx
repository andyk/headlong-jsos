import { Session } from "@supabase/supabase-js";
import Auth from "./Auth";

export const Footer = ({ session }: { session: Session | null; }) => {
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
