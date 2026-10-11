import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./styles/AuthPage.css";

type Mode = "login" | "signup" | "reset";
type StatusType = "info" | "success" | "error";

function getTitle(mode: Mode) {
  switch (mode) {
    case "login":
      return "Log in";
    case "signup":
      return "Create account";
    case "reset":
      return "Reset password";
  }
}

export default function AuthPage() {
  const nav = useNavigate();
  const location = useLocation();

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    // Only allow internal redirects
    if (next && next.startsWith("/")) return next;
    return "/dashboard";
  }, [location.search]);

  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [role, _setRole] = useState("");
  const [useCase, _setUseCase] = useState("");

  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<StatusType>("info");

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const title = useMemo(() => getTitle(mode), [mode]);

  // If already authed, bounce to intended destination
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) nav(nextUrl, { replace: true });
    })();
  }, [nav, nextUrl]);

  // When mode changes, clear status and move focus predictably
  useEffect(() => {
    setStatus("");
    setStatusType("info");

    // Avoid confusing stale values across modes
    if (mode === "reset") {
      setPassword("");
    }

    // Focus first relevant field
    requestAnimationFrame(() => {
      emailRef.current?.focus();
    });
  }, [mode]);

  function setInfo(message: string) {
    setStatusType("info");
    setStatus(message);
  }

  function setSuccess(message: string) {
    setStatusType("success");
    setStatus(message);
  }

  function setError(message: string) {
    setStatusType("error");
    setStatus(message);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setStatus("");
    setStatusType("info");
    setBusy(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        setPassword("");
        nav(nextUrl, { replace: true });
        return;
      }

      if (mode === "signup") {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user?.id;
  const session = data.session;

  // If email confirmation is enabled, there may be no active session yet.
  if (!userId || !session) {
    setInfo("Check your email to confirm your account, then log in.");
    return;
  }

  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    full_name: fullName,
    role,
    use_case: useCase,
  });

  if (profileErr) {
    setError(`Account created, but onboarding save failed: ${profileErr.message}`);
    return;
  }

  setSuccess("Account created. You can log in now.");
  setMode("login");
  return;
}

      if (mode === "reset") {
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;

        setSuccess("Password reset email sent. Check your inbox.");
        return;
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "Authentication failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";
  const isReset = mode === "reset";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{title}</h1>
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            aria-controls="auth-panel"
            className={mode === "login" ? "auth-tab auth-tab--active" : "auth-tab"}
            onClick={() => setMode("login")}
            disabled={busy}
          >
            Log in
          </button>
           
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            aria-controls="auth-panel"
            className={mode === "signup" ? "auth-tab auth-tab--active" : "auth-tab"}
            onClick={() => setMode("signup")}
            disabled={busy}
          >
            Sign up
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "reset"}
            aria-controls="auth-panel"
            className={mode === "reset" ? "auth-tab auth-tab--active" : "auth-tab"}
            onClick={() => setMode("reset")}
            disabled={busy}
          >
            Forgot
          </button>
        </div>

        <div id="auth-panel" role="tabpanel" aria-label={title}>
          <form className="auth-form" onSubmit={onSubmit} aria-busy={busy}>
            <label className="auth-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              ref={emailRef}
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />

           {isSignup && (
              <>
                <label className="auth-label" htmlFor="auth-fullname">
                  Full name
                </label>
                <input
                  id="auth-fullname"
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  autoComplete="name"
                  required
                />

               
                
              </>
            )}

            {!isReset && (
              <>
                <label className="auth-label" htmlFor="auth-password">
                  Password
                </label>
                <input
                  id="auth-password"
                  ref={passwordRef}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                />
              </>
            )}

            <button className="auth-btn auth-btn--primary" type="submit" disabled={busy}>
              {busy ? "Working..." : title}
            </button>

           {/* {mode === "login" && (
              <button
                className="auth-btn auth-btn--ghost"
                type="button"
                onClick={() => setMode("reset")}
                disabled={busy}
              >
                I forgot my password
              </button>
            )} */}

            {status && (
              <div
                className={`auth-status auth-status--${statusType}`}
                role={statusType === "error" ? "alert" : "status"}
                aria-live={statusType === "error" ? "assertive" : "polite"}
              >
                {status}
              </div>
            )}
          </form>

         <div className="auth-footnote">
            STEM-Accessibility is a research project. Questions or feedback? Email{" "}
            <a href="mailto:stem-accessibility@uw.edu">stem-accessibility@uw.edu</a>, browse the{" "}
            <a href="https://github.com/stem-accessibility/frontend" target="_blank" rel="noopener noreferrer">source code</a>,
            or{" "}
            <a href="https://github.com/stem-accessibility/frontend/issues/new" target="_blank" rel="noopener noreferrer">submit an issue</a>.
          </div> 
        </div>
      </div>
    </div>
  );
}
