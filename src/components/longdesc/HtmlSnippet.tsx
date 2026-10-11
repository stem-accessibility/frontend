// src/components/HtmlSnippet.tsx
// src/components/HtmlSnippet.tsx
import React, { useState } from 'react';
import './styles/longdesc.css';
type HtmlSnippetProps = {
  altText: string;
  title?: string;
  longdescUrl: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const HtmlSnippet: React.FC<HtmlSnippetProps> = ({
  altText,
  title,
  longdescUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const safeAlt = escapeHtml(altText || '');
  const safeTitle = title ? escapeHtml(title) : '';

  // 🔹 Always use a clean placeholder here
  const imgSrcPlaceholder = 'YOUR_IMAGE_URL_HERE';

  const snippet = `<figure>
  <img
    src="${imgSrcPlaceholder}"
    alt="${safeAlt}"${title ? `\n    title="${safeTitle}"` : ''}
  >
  ${title ? `<figcaption>${safeTitle}</figcaption>\n  ` : ''}<a href="${longdescUrl}">Long description</a>
</figure>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy HTML snippet:', err);
    }
  };

  return (
  <div className="ld-snippet-container">
    <div className="ld-snippet-header">
      <span>HTML Snippet for Developers</span>

      <button
        type="button"
        onClick={handleCopy}
        className="ld-copy-btn"
      >
        {copied ? 'Copied!' : 'Copy HTML'}
      </button>
    </div>

    <textarea
      readOnly
      value={snippet}
      className="ld-snippet-code"
    />
  </div>
);

 
};

export default HtmlSnippet;
