import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AccessibleTable from './AccessibleTable';
import NavigableList from './NavigableList';
import AccessibleMarkdown from './AccessibleMarkdown';
import Tactile from './TactileRenderer';
import { apiFetch } from '../../lib/api';

import type {  PermalinkResponse } from '../../types/types'; // Update path if needed


const PermalinkContent: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // 👈 Specify route param type
  const [data, setData] = useState<PermalinkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const [selectedView, setSelectedView] = useState<'summary' | 'table' | 'navigable' | 'tactile'>('summary');

  // const API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
  if (!id) return;

  const run = async () => {
    try {
      setError(null);
      setImageDataUrl(null);

      const fc = await apiFetch<PermalinkResponse>(`/get/${id}`);
      setData(fc);

      if (fc.has_image) {
        const img = await apiFetch<{ image_data_url?: string }>(
          `/get/${id}/image`
        );
        setImageDataUrl(img?.image_data_url ?? null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load flowchart");
    }
  };

  run();
}, [id]);


  if (error) return <p>Error loading permalink content: {error}</p>;
  if (!data) return <p>Loading permalink content...</p>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <label htmlFor="view-select" style={{ fontWeight: 'bold' }}>Choose a representation:</label>
      <select
        id="view-select"
        value={selectedView}
        onChange={(e) => setSelectedView(e.target.value as typeof selectedView)}
        style={{ marginTop: '10px', padding: '5px' }}
      >

        <option value="summary">Summary</option>
        <option value="table">Table</option>
        <option value="navigable">Navigable List</option>
        <option value="tactile">Tactile</option>
      </select>

      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        {selectedView === 'summary' && (
          <div>
             <AccessibleMarkdown
            content={data.summary}
            imageDataUrl={imageDataUrl}
            imageAlt={data.short_alt ?? ""}
            flowchartData={data.json_data}
          />
          </div>
        )}


        {selectedView === 'table' && (
          <div>
            
            <AccessibleTable json={data.json_data} />
          </div>
        )}

        {selectedView === 'navigable' && (
          <div>
            <h2>Navigable List</h2>
            <NavigableList jsonData={data.json_data} />
          </div>
        )}

        {selectedView === 'tactile' && (
          <div>
            <h2>Tactile Representation</h2>
            <Tactile json={data.json_data} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PermalinkContent;
