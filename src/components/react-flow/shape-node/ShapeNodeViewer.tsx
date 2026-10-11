import { memo, Fragment } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';

import Shape from '../shape';
import { type ShapeNode } from '../shape/types';

const handlePositions = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

function ShapeNodeViewer({
  data,
  width,
  height,
}: NodeProps<ShapeNode>) {
  const { type = 'rectangle', label } = data;

  const fillColor = '#F9FAFB';
  const strokeColor = '#111827';
  const handleColor = '#111827';
  const textColor = '#111827';

  return (
    <>
      <svg width={width} height={height} className="shape-svg">
        <g>
          <Shape
            type={type}
            renderSVG={false}
            width={width}
            height={height}
            fill={fillColor}
            strokeWidth={2}
            stroke={strokeColor}
            fillOpacity={0.8}
          />

          <foreignObject x={0} y={0} width={width} height={height}>
            <div
              style={{
                pointerEvents: 'auto',
                userSelect: 'text',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontSize: 14,
                padding: 4,
                wordBreak: 'break-word',
                color: textColor,
              }}
            >
              <div
                style={{
                  outline: 'none',
                  width: '100%',
                  overflowWrap: 'break-word',
                  userSelect: 'text',
                }}
              >
                {label}
              </div>
            </div>
          </foreignObject>
        </g>
      </svg>

      {handlePositions.map((position) => (
        <Fragment key={position}>
          <Handle
            id={position}
            type="target"
            position={position}
            style={{ backgroundColor: handleColor, opacity: 0 }}
            isConnectable={false}
          />
          <Handle
            id={position}
            type="source"
            position={position}
            style={{ backgroundColor: handleColor, opacity: 0 }}
            isConnectable={false}
          />
        </Fragment>
      ))}
    </>
  );
}

export default memo(ShapeNodeViewer);