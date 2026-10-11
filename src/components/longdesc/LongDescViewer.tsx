import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';

const API_BASE_URL =
  import.meta.env.VITE_API_URL;

 
interface LongDescData {
  id: string;
  alt_text: string;
  long_markdown: string;
  image_data_url?: string; // 🔹 now returned by backend
  title?: string;
}

const LongDescViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<LongDescData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLongDesc = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/longdesc/${slug}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to load long description.');
          setLoading(false);
          return;
        }

        setData(json);
      } catch (err: any) {
        console.error(err);
        setError('Unexpected error loading long description.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchLongDesc();
    } else {
      setError('Missing permalink ID.');
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
        <p>Loading long description…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
        <h1>Long Description</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
        <h1>No Data Found</h1>
       
      </div>
    );
  }

  const imageUrl = data.image_data_url || '';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <h1 style={{ textAlign:'center', padding: 20 }}>{data.title}</h1>
      {/* IMAGE WITH EMBEDDED ALT TEXT */}
      {imageUrl && (
        <div style={{ marginBottom: 24 }}>
          <img
            src={imageUrl}
            alt={data.alt_text}
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid #ddd',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* LONG TEXTUAL DESCRIPTION ONLY */}
      <section>
        <div data-color-mode="light">
          <MDEditor.Markdown source={data.long_markdown} />
        </div>
      </section>
    </div>
  );
};

export default LongDescViewer;
