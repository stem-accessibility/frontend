import React from 'react';

type ArrowDirection = 'start' | 'end' | 'both' | 'none';

type EdgeToolbarProps = {
  currentStyle?: 'solid' | 'dashed';
  arrowDirection?: ArrowDirection;
  onStyleChange: (style: 'solid' | 'dashed') => void;
  onArrowChange: (direction: ArrowDirection) => void;
  onDelete: () => void;
};

export const EdgeToolbar: React.FC<EdgeToolbarProps> = ({
  currentStyle,
  arrowDirection = 'end',
  onStyleChange,
  onArrowChange,
  onDelete,
}) => {
  const isActive = (dir: ArrowDirection) => arrowDirection === dir;

  const baseBtnStyle = (active: boolean) => ({
    width: '28px',
    height: '24px',
    background: 'white',
    color: 'black',
    border: active ? '2px solid #007bff' : '1px solid #ccc',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  });

  const deleteBtnStyle = {
    width: '100%',
    height: '28px',
    background: '#fff',
    color: '#b00020',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '6px',
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        alignItems: 'center',
        minWidth: '140px',
      }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onStyleChange('solid')}
          style={baseBtnStyle(currentStyle === 'solid')}
          title="Solid line"
        >
          <div style={{ width: '18px', borderBottom: '3px solid black' }} />
        </button>

        <button
          type="button"
          onClick={() => onStyleChange('dashed')}
          style={baseBtnStyle(currentStyle === 'dashed')}
          title="Dashed line"
        >
          <div style={{ width: '18px', borderBottom: '3px dashed black' }} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onArrowChange('start')}
          style={baseBtnStyle(isActive('start'))}
          title="Arrow at Start"
        >
          ←
        </button>

        <button
          type="button"
          onClick={() => onArrowChange('end')}
          style={baseBtnStyle(isActive('end'))}
          title="Arrow at End"
        >
          →
        </button>

        <button
          type="button"
          onClick={() => onArrowChange('both')}
          style={baseBtnStyle(isActive('both'))}
          title="Arrows on Both Ends"
        >
          ↔
        </button>

        <button
          type="button"
          onClick={() => onArrowChange('none')}
          style={baseBtnStyle(isActive('none'))}
          title="No Arrows"
        >
          ⬚
        </button>
      </div>

      <button
        type="button"
        onClick={onDelete}
        style={deleteBtnStyle}
        title="Delete edge"
      >
        Delete edge
      </button>
    </div>
  );
};