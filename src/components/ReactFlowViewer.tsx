import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ControlButton,
  MiniMap,
  MarkerType,
  useReactFlow,

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

/**
 * Zoom and fit buttons for a decorative viewer: the same buttons for mouse and touch users, kept
 * out of the Tab order because the viewer is hidden from assistive technology. React Flow's
 * built-in buttons cannot take a tabIndex. The "interactive" lock is left out: nothing in this
 * read-only viewer can be dragged, connected or selected, so it had nothing to lock.
 * The icons are React Flow's own control icons (@xyflow/react, MIT), so the buttons look the same.
 */
function DecorativeControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <Controls showZoom={false} showFitView={false} showInteractive={false}>
      <ControlButton tabIndex={-1} title="Zoom In" onClick={() => zoomIn()}>
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" />
        </svg>
      </ControlButton>
      <ControlButton tabIndex={-1} title="Zoom Out" onClick={() => zoomOut()}>
        <svg viewBox="0 0 32 5" aria-hidden="true">
          <path d="M0 0h32v4.2H0z" />
        </svg>
      </ControlButton>
      <ControlButton tabIndex={-1} title="Fit View" onClick={() => fitView(fitViewOptions)}>
        <svg viewBox="0 0 32 30" aria-hidden="true">
          <path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" />
        </svg>
      </ControlButton>
    </Controls>
  );
}

type FlowchartViewerProps = {
  flowchartData: FlowchartData;
  height?: number | string;
  /** The overview map covers part of small previews; callers can turn it off. */
  showMiniMap?: boolean;
  /**
   * Set when the viewer sits inside aria-hidden (a visual copy of content that is described in
   * text). Nodes and edges then stay out of the Tab order: otherwise keyboard users land on
   * stops that screen readers cannot see or name (axe: aria-hidden-focus). Mouse and touch
   * panning and zooming still work.
   */
  decorative?: boolean;
};

export function FlowchartViewer({
  flowchartData,
  height = 420,
  showMiniMap = true,
  decorative = false,
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
        edgesFocusable={!decorative}
        nodesFocusable={!decorative}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
      >
        <Background />
        {decorative ? <DecorativeControls /> : <Controls />}
        {showMiniMap && <MiniMap zoomable draggable nodeComponent={MiniMapNode} />}
      </ReactFlow>
    </div>
  );
}