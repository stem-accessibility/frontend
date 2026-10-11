import { useState, useRef, useEffect } from 'react';
import { memo } from 'react';
import {
  NodeResizer,
  type NodeProps,
  Handle,
  Position,
  useKeyPress,
  useReactFlow,
} from '@xyflow/react';

import Shape from '../shape';
import ShapeNodeToolbar from '../toolbar';
import { type ShapeNode } from '../shape/types';
import { logResearchEvent } from '../../../lib/logResearchEvent';

const handlePositions = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

function ShapeNodeEditor({
  id,
  selected,
  data,
  width,
  height,
}: NodeProps<ShapeNode>) {
  const { type = 'rectangle', label } = data;

  const fillColor = '#F9FAFB';
  const strokeColor = '#111827';
  const textColor = '#111827';

  const [nodeLabel, setNodeLabel] = useState(label ?? '');
  const [editing, setEditing] = useState(false);

  const { updateNodeData, setNodes, setEdges } = useReactFlow();
  const labelRef = useRef<HTMLDivElement>(null);
  const shiftKeyPressed = useKeyPress('Shift');

  useEffect(() => {
    setNodeLabel(label ?? '');
  }, [label]);

  const handleDoubleClick = () => {
    setEditing(true);

    setTimeout(() => {
      labelRef.current?.focus();

      const range = document.createRange();
      const sel = window.getSelection();

      if (labelRef.current?.firstChild && sel) {
        range.selectNodeContents(labelRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 0);
  };
 const handleDeleteNode = () => {
  (document.activeElement as HTMLElement)?.blur();

  logResearchEvent({
    event_type: 'Node_Deleted',
    editor_mode: 'visual',
    success: true,
    event_data: {
      source_page: 'ShapeNodeEditor',
      node_id: id,
      shape: type,
      label: nodeLabel,
    },
  });

  setNodes((nodes) => nodes.filter((node) => node.id !== id));
  setEdges((edges) =>
    edges.filter((edge) => edge.source !== id && edge.target !== id)
  );
};
  const handleLabelBlur = () => {
  if (!labelRef.current) return;

  const oldLabel = label ?? '';
  const newLabel = labelRef.current.textContent ?? '';

  setNodeLabel(newLabel);
  updateNodeData(id, { label: newLabel });
  setEditing(false);

  if (oldLabel !== newLabel) {
    logResearchEvent({
      event_type: 'Node_Label_Edited',
      editor_mode: 'visual',
      success: true,
      event_data: {
        source_page: 'ShapeNodeEditor',
        node_id: id,
        old_label: oldLabel,
        new_label: newLabel,
      },
    });
  }
};
  return (
    <>
      <ShapeNodeToolbar
       onShapeChange={(newShape) => {
  if (newShape !== type) {
    logResearchEvent({
      event_type: 'Node_Shape_Changed',
      editor_mode: 'visual',
      success: true,
      event_data: {
        source_page: 'ShapeNodeEditor',
        node_id: id,
        old_shape: type,
        new_shape: newShape,
        label: nodeLabel,
      },
    });
  }

  updateNodeData(id, { type: newShape });
}}
        activeShape={type}
        onDelete={handleDeleteNode}
      />

      <NodeResizer
        color={strokeColor}
        keepAspectRatio={shiftKeyPressed}
        isVisible={selected}
      />

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
              onDoubleClick={handleDoubleClick}
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
                ref={labelRef}
                contentEditable={editing}
                tabIndex={0}
                suppressContentEditableWarning
                onBlur={handleLabelBlur}
                style={{
                  outline: 'none',
                  width: '100%',
                  pointerEvents: 'auto',
                  overflowWrap: 'break-word',
                  userSelect: 'text',
                }}
              >
                {nodeLabel}
              </div>
            </div>
          </foreignObject>
        </g>
      </svg>

      {handlePositions.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
        />
      ))}
    </>
  );
}

export default memo(ShapeNodeEditor);