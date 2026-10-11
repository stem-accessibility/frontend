import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./styles/AuthPage.css";

export default function AuthCallback() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("Checking link...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If user arrives here from reset email, they should have a session
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("This reset link is invalid or expired. Please request a new one.");
      } else {
        setStatus("");
      }
    })();
  }, []);

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus("Password updated. Redirecting...");
      setTimeout(() => nav("/dashboard"), 700);
    } catch (err: any) {
      setStatus(err?.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Set a new password</h1>

        {status && <div className="auth-status">{status}</div>}

        {!status && (
          <form className="auth-form" onSubmit={onSetPassword}>
            <label className="auth-label">
              New password
              <input
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </label>

            <button className="auth-btn auth-btn--primary" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
