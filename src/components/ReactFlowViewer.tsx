import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  
  type EdgeTypes,
  type DefaultEdgeOptions,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import type { FlowchartData } from '../types/types';
import {ShapeNodeViewer} from './react-flow/shape-node';
import MiniMapNode from './react-flow/minimap-node';
import { EditableEdgeComponent } from './react-flow/editable-edge';
import { transformEditorFlowchartData } from '../services/utils';

const nodeTypes = {
  shape: ShapeNodeViewer,
  custom: ShapeNodeViewer,
};

const edgeTypes: EdgeTypes = {
  editable: EditableEdgeComponent,
  'editable-edge': EditableEdgeComponent,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'editable',
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2 },
};

const fitViewOptions = { padding: 0.4 };
const proOptions = { account: 'paid-pro', hideAttribution: true };

type FlowchartViewerProps = {
  flowchartData: FlowchartData;
  height?: number | string;
  /** The overview map covers part of small previews; callers can turn it off. */
  showMiniMap?: boolean;
};

export function FlowchartViewer({
  flowchartData,
  height = 420,
  showMiniMap = true,
}: FlowchartViewerProps) {
  const { nodes, edges } = useMemo(
    () => transformEditorFlowchartData(flowchartData),
    [flowchartData]
  );

  return (
    <div
      style={{
        width: '100%',
        height,
        border: '1px solid black',
        borderRadius: 8,
        overflow: 'hidden',
      }}
      aria-label="Digital STEM image viewer"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={fitViewOptions}
        proOptions={proOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        edgesFocusable={true}
        nodesFocusable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
      >
        <Background />
        <Controls />
        {showMiniMap && <MiniMap zoomable draggable nodeComponent={MiniMapNode} />}
      </ReactFlow>
    </div>
  );
}