import React, { useState } from 'react';
import MarkdownSummaryEditor from '../components/MarkdownSummaryEditor';
import QRCodeGenerator from '../components/access-reps/QRCode';
import HtmlSnippet from '../components/longdesc/HtmlSnippet';

import './styles/LD.css';

const API_BASE_URL =
  import.meta.env.VITE_API_URL;

  interface LongDescPayload {
  alt_text: string;
  long_markdown: string;
  image_data_url?: string | null;
  title: string;
}

type ImageType = 'diagram' | 'data_viz';

const LD: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null); // 🔹 NEW
  const [title, setTitle] = useState<string>('');

  const [imageType, setImageType] = useState<ImageType>('diagram'); // 🔹 NEW

  const [altText, setAltText] = useState<string>('');
  const [longDescription, setLongDescription] = useState<string>('');

  const [isGeneratingDesc, setIsGeneratingDesc] = useState<boolean>(false);
  const [isSavingLink, setIsSavingLink] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permalinkId, setPermalinkId] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setPermalinkId(null); // reset old link when new image is uploaded
    setError(null);

    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      // Also create a data URL to store permanently
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageDataUrl(result); // e.g. "data:image/png;base64,...."
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setImageDataUrl(null);
    }
  };

  const handleGenerateFromImage = async () => {
    try {
      setError(null);
      setPermalinkId(null);
      if (!imageFile) {
        setError('Please upload an image first.');
        return;
      }

      setIsGeneratingDesc(true);

      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('image_type', imageType); // 🔹 send user-chosen type

      const response = await fetch(`${API_BASE_URL}/describe-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Describe-image error:', data);
        setError(
          data.error || 'Failed to generate description from image. Please try again.'
        );
        return;
      }

      setAltText(data.alt_text || '');
      setLongDescription(data.long_markdown || '');
    } catch (err: any) {
      console.error(err);
      setError('Unexpected error while generating description.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      setError(null);
      setIsSavingLink(true);
      setPermalinkId(null);

      if (!altText.trim() || !longDescription.trim()) {
        setError(
          'Please provide both alt text and a long description before generating a link.'
        );
        return;
      }

      const payload: LongDescPayload = {
      alt_text: altText,
      long_markdown: longDescription,
      title: title
    };

    if (imageDataUrl) {
      payload.image_data_url = imageDataUrl; // ✅ now allowed
    }

      const response = await fetch(`${API_BASE_URL}/longdesc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Longdesc error:', data);
        setError(data.error || 'Failed to save long description.');
        return;
      }

      setPermalinkId(data.id);
    } catch (err: any) {
      console.error(err);
      setError('Unexpected error while saving long description.');
    } finally {
      setIsSavingLink(false);
    }
  };

  const frontendLongDescUrl = permalinkId
    ? `/ld/${permalinkId}`
    : null;

  // This is the URL that others will use in HTML & QR
  const publicLongDescUrl = permalinkId
    ? (window.location.origin + (frontendLongDescUrl || `/ld/${permalinkId}`))
    : null;


  return (
    <div className="ld-container">
      <h1 className="ld-title">Long Description Builder</h1>

      {/* IMAGE TYPE TOGGLE */}
      <div className="ld-section ld-image-type-toggle">
        <p className="ld-type-label">Image Type</p>
        <div className="ld-type-buttons">
          <button
            type="button"
            onClick={() => setImageType('diagram')}
            className={
              'ld-type-button' + (imageType === 'diagram' ? ' active' : '')
            }
            aria-pressed={imageType === 'diagram'}
          >
            Diagram (Flowchart, Process, Tree)
          </button>
          <button
            type="button"
            onClick={() => setImageType('data_viz')}
            className={
              'ld-type-button' + (imageType === 'data_viz' ? ' active' : '')
            }
            aria-pressed={imageType === 'data_viz'}
          >
            Data Visualization (Chart/Graph)
          </button>
        </div>
      </div>

      {/* IMAGE UPLOAD */}
      <div className="ld-section">
        <label className="ld-label">
          Upload Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="ld-file-input"
        />
      </div>

      {/* PREVIEW */}
      {imagePreview && (
        <div className="ld-section ld-image-preview">
          <img src={imagePreview} alt="Uploaded preview" />
        </div>
      )}

      {/* BUTTON: GENERATE FROM IMAGE (LLM) */}
      <div className="ld-section">
        <button
          type="button"
          onClick={handleGenerateFromImage}
          disabled={!imageFile || isGeneratingDesc}
          className={
            'ld-secondary-button' +
            (!imageFile || isGeneratingDesc ? ' disabled' : '')
          }
        >
          {isGeneratingDesc ? 'Generating from Image…' : 'Generate from Image (LLM)'}
        </button>
      </div>

      {/* Mandatory title INPUT */}
      <div className="ld-section">
        <label className="ld-label">
          Title
        </label>
        <input
          type="text"
          onChange={(e) => setTitle(e.target.value)}
          placeholder="You must insert a title to generate link"
          className="ld-input"
        />
      </div>

      {/* ALT TEXT INPUT */}
      <div className="ld-section">
        <label className="ld-label">
          Short Description (Alt Text)
        </label>
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Short alt text describing the image"
          className="ld-input"
        />
      </div>

      {/* MARKDOWN LONG DESCRIPTION */}
      <div className="ld-section">
        <label className="ld-label">
          Long Description (Markdown)
        </label>
        <MarkdownSummaryEditor
          summary={longDescription}
          onChange={setLongDescription}
        />
      </div>

      {/* ERROR MESSAGE */}
      {error && <p className="ld-error">{error}</p>}

      {/* GENERATE LINK BUTTON */}
      <button
        type="button"
        onClick={handleGenerateLink}
        disabled={!title || isSavingLink}
        className="ld-primary-button"
      >
        {isSavingLink ? 'Saving Link…' : 'Generate Link'}
      </button>

      {/* SHOW PERMALINKS */}
      {permalinkId && (
        <div className="ld-permalink-section">
          <h2 className="ld-permalink-title">Your Long Description Is Available Here:</h2>

          {frontendLongDescUrl && (
            <div className="ld-permalink-block">
              
              <a href={frontendLongDescUrl}>
                {window.location.origin + frontendLongDescUrl}
              </a>
            </div>
          )}

          {/* QR + HTML SNIPPET only if we have a public URL */}
          {publicLongDescUrl && (
            <>
              <QRCodeGenerator permalink={publicLongDescUrl} />

              <HtmlSnippet
                
                altText={altText}
                title={title}
                longdescUrl={publicLongDescUrl}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LD;