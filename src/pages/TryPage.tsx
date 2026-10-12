import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import DiagramEditorPage from "./DiagramEditorPage";

/**
 * Try it: the same editor, with no account. The image is public and tied to this browser. People who
 * are signed in are sent to Create instead, so they never edit a guest copy by mistake.
 */
export default function TryPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p className="page-loading">Loading…</p>;

  if (user) {
    return (
      <div className="try-page" style={{ maxWidth: 720, margin: "24px auto", padding: "0 16px" }}>
        <h1>You are signed in</h1>
        <p>
          Try it is for people without an account. <Link to="/create">Create a STEM image</Link> from your
          account instead, where you choose who can see it.
        </p>
      </div>
    );
  }

  return (
    <>
      <aside
        className="try-banner"
        aria-label="About trying it out"
        style={{
          maxWidth: 1200,
          margin: "12px auto 0",
          padding: "10px 14px",
          border: "1px solid var(--border, rgba(0,0,0,0.2))",
          borderRadius: 8,
        }}
      >
        <strong>Try it, no account needed.</strong> Your STEM image is public and kept with this browser
        (a cookie holds a random token, nothing else), and you can make one. <Link to="/login">Create an account</Link> to keep it, make more, and choose
        who can see them. No AI is used here.
      </aside>
      <DiagramEditorPage guest />
    </>
  );
}
