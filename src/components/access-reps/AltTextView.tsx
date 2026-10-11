import React, { useState } from "react";

type Props = {
  shortAlt?: string | null;
  title?: string | null;
};

/** The short alt text on its own, ready to copy into a document or web page. */
const AltTextView: React.FC<Props> = ({ shortAlt, title }) => {
  const [copied, setCopied] = useState(false);
  const text = (shortAlt ?? "").trim();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby="alt-text-heading">
      <h2 id="alt-text-heading">Alt text</h2>
      {title ? <p>For: {title}</p> : null}
      {text ? (
        <>
          <p id="alt-text-value" style={{ maxWidth: "70ch" }}>
            {text}
          </p>
          <button type="button" className="btn" onClick={copy}>
            Copy alt text
          </button>
          <span role="status" style={{ marginLeft: 8 }}>
            {copied ? "Copied" : ""}
          </span>
          <p style={{ marginTop: 16, maxWidth: "70ch" }}>
            Use this as the image's alternative text. For the full explanation, choose
            Summary in the menu above.
          </p>
        </>
      ) : (
        <p>No alt text has been written for this diagram yet.</p>
      )}
    </section>
  );
};

export default AltTextView;
