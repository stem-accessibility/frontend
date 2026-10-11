import React from 'react';
import './styles/AuthoringMode.css'
type currentMode = 'accessibility' | 'mermaid' | 'image' | 'ai';

interface Props {
  currentMode: currentMode;
  onModeChange: (mode: currentMode) => void;
}

const currentModeSwitcher: React.FC<Props> = ({ currentMode, onModeChange }) => {

  return (
    <div className="authoring-mode-switcher">
  <button
    className={currentMode === 'accessibility' ? 'active' : ''}
    onClick={() => onModeChange('accessibility')}
  >
    Edit Accessibility
  </button>
  <button
    className={currentMode === 'mermaid' ? 'active' : ''}
    onClick={() => onModeChange('mermaid')}
  >
    Mermaid
  </button>
  <button
    className={currentMode === 'image' ? 'active' : ''}
    onClick={() => onModeChange('image')}
  >
    Image Upload
  </button>
  <button
    className={currentMode === 'ai' ? 'active' : ''}
    onClick={() => onModeChange('ai')}
  >
    AI Assist
  </button>
</div>

  );
};

export default currentModeSwitcher;
