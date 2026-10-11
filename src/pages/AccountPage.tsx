import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./styles/AccountPage.css";

export default function AccountPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    nav("/login");
  }

  return (
    <div className="account-page">
      <div className="account-card">
        <h1>Account</h1>

        <div className="account-row">
          <div className="account-label">Signed in as</div>
          <div className="account-value">{email || "Unknown email"}</div>
        </div>

        <div className="account-actions">
          <button className="account-btn" onClick={() => nav("/dashboard")}>
            Back to dashboard
          </button>
          <button className="account-btn account-btn--danger" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
