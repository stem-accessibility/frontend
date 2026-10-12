// src/components/MermaidEditor.tsx
import React, { useState } from 'react';

const MermaidEditor: React.FC = () => {
  const [code, setCode] = useState<string>('graph TD;\nA-->B;\nB-->C;');

  return (
    <div>
      <h3>Mermaid STEM Image Editor</h3>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        style={{ width: '100%' }}
      />
      <pre>{code}</pre>
    </div>
  );
};

export default MermaidEditor;
