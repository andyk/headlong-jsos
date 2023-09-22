import { useState, useEffect } from 'react';
import supabase from "./lib/supabase";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const currentUrl = window.location.href;

    const handleLogin = async (event: React.ChangeEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true)
    }

    useEffect(() => {
        async function doAuth() {
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: { emailRedirectTo: currentUrl},
            })
            if (error){
                alert(error.message);
            } else {
                alert('Check your email for the login link!');
                setLoading(false);
            }
        }
        if (loading) {
            doAuth();
        }
    }, [loading, email, currentUrl])

    return (
        <form className="flex form-widget" onSubmit={handleLogin}>
            <p className="description pr-2">Register and/or Sign-in via magic link with your email:</p>
            <input
                className="inputField bg-black"
                type="email"
                placeholder="Your email"
                value={email}
                required={true}
                onChange={(e) => setEmail(e.target.value )}
            />
            <div>
              <button className={'button'} disabled={loading}>
                  {loading ? <span>Loading</span> : <span>Send magic link</span>}
              </button>
            </div>
        </form>
    );
}
