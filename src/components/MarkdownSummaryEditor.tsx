import React from "react";
import MDEditor from "@uiw/react-md-editor";

type Props = {
  summary: string;
  onChange: (updated: string) => void;
  height?: number; // optional override
};

const MarkdownSummaryEditor: React.FC<Props> = ({ summary, onChange,  }) => {
  return (
    <div data-color-mode="light" className="md-editor-wrap">
      <MDEditor
        value={summary}
        onChange={(val) => onChange(val || "")}
                     // ✅ makes the editor actually tall
        preview="live"               // optional: "edit" | "preview" | "live"
        className="md-editor"        // ✅ gives you a stable hook for CSS
      />
    </div>
  );
};

export default MarkdownSummaryEditor;