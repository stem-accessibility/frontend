import ReactMarkdown from "react-markdown";

type Props = {
  markdown: string;
};

export default function LongDescriptionPreview({ markdown }: Props) {
  const hasContent = markdown.trim().length > 0;

  return (
    <div
      className="long-description-preview"
      aria-label="Long description preview"
    >
      {hasContent ? (
        <ReactMarkdown>{markdown}</ReactMarkdown>
      ) : (
        <p className="long-description-preview__empty">
          Your final long description will appear here as you fill in the
          sections.
        </p>
      )}
    </div>
  );
}