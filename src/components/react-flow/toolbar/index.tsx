import { NodeToolbar } from '@xyflow/react';

import Shape from '../shape';
import { type ShapeType } from '../shape/types';
{/* 
const colors = [
  '#CF4C2C',
  '#EA9C41',
  '#EBC347',
  '#438D57',
  '#3F8AE2',
  '#803DEC',
];*/}
const shapes: ShapeType[] = [
  'circle',
  'round-rectangle',
  'rectangle',
  'hexagon',
  'diamond',
  'cylinder',
  'parallelogram',
  'ellipse'
];


type ShapeNodeToolbarProps = {
  //activeColor: string;
  activeShape: ShapeType;
 // onColorChange?: (color: string) => void;
  onShapeChange?: (shape: ShapeType) => void;
   onDelete?: () => void;
};

function ShapeNodeToolbar({
  //activeColor,
  activeShape,
  // onColorChange = () => false,
  onShapeChange = () => false,
  onDelete = () => false,
}: ShapeNodeToolbarProps) {
  
  return (
    <NodeToolbar className="nodrag" offset={32}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Color Swatches Row 
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {colors.map((color) => (
            <button
              key={color}
              title={color}
              onClick={() => onColorChange(color)}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: color,
                border: color === activeColor ? '2px solid black' : '1px solid #ccc',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>*/}

        {/* Shape Selection Row */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {shapes.map((shape) => (
            <button
              key={shape}
              type='button'
              onClick={() => onShapeChange(shape)}
              title={shape}
              style={{
                padding: 4,
                border: shape === activeShape ? '2px solid black' : '1px solid #ccc',
                backgroundColor: '#fff',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              <Shape
                type={shape}
                width={20}
                height={20}
                fill="transparent"
                stroke="#000"
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
    (document.activeElement as HTMLElement | null)?.blur();
    onDelete();
  }}
          title="Delete node"
          style={{
            height: 28,
            background: '#fff',
            color: '#b00020',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Delete node
        </button>
      </div>
    </NodeToolbar>
  );
}

export default ShapeNodeToolbar;
