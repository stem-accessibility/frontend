import React from "react";
import MDEditor, { commands, type ICommand } from "@uiw/react-md-editor";
import "./MarkdownSummaryEditor.css";

type Props = {
  summary: string;
  onChange: (updated: string) => void;
  height?: number; // optional override
  /**
   * Id for the editing area. Pass it and point a visible <label htmlFor> at it; without it the
   * area is named "Markdown text" so it is never unlabelled.
   */
  textareaId?: string;
};

// The toolbar buttons are named by their own aria-label; the library also gives each icon
// role="img" with no text, which a screen reader would announce as an unnamed image.
function hideIcon(cmd: ICommand): ICommand {
  return {
    ...cmd,
    icon: React.isValidElement(cmd.icon)
      ? React.cloneElement(cmd.icon as React.ReactElement<Record<string, unknown>>, {
          "aria-hidden": true,
          focusable: false,
        })
      : cmd.icon,
    children: Array.isArray(cmd.children) ? cmd.children.map(hideIcon) : cmd.children,
  } as ICommand;
}

const TOOLBAR = commands.getCommands().map(hideIcon);
const EXTRA_TOOLBAR = commands.getExtraCommands().map(hideIcon);

const MarkdownSummaryEditor: React.FC<Props> = ({ summary, onChange, textareaId }) => {
  return (
    <div data-color-mode="light" className="md-editor-wrap">
      <MDEditor
        value={summary}
        onChange={(val) => onChange(val || "")}
        preview="live"               // optional: "edit" | "preview" | "live"
        className="md-editor"        // gives you a stable hook for CSS
        commands={TOOLBAR}
        extraCommands={EXTRA_TOOLBAR}
        textareaProps={textareaId ? { id: textareaId } : { "aria-label": "Markdown text" }}
      />
    </div>
  );
};

export default MarkdownSummaryEditor;
