import { type DragEvent, type DragEventHandler, useCallback,useEffect,useRef} from 'react';
import {
  ReactFlow,
  Background,
  ConnectionLineType,
  MarkerType,
  ConnectionMode,
  Panel,
  type EdgeTypes,
  type DefaultEdgeOptions,
  Controls,
  useReactFlow,
  MiniMap,
  type SnapGrid,
  type OnConnect,
  useNodesState,
  useEdgesState
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import type { FlowchartData } from '../types/types';
import  {ShapeNodeEditor} from './react-flow/shape-node';
import Sidebar from './react-flow/sidebar';
import MiniMapNode from './react-flow/minimap-node';
import { type ShapeNode, type ShapeType } from './react-flow/shape/types';
import { EditableEdgeComponent } from './react-flow/editable-edge';
import { ConnectionLine } from './react-flow/connection-line';
import { useAppStore } from './store';
import { type EditableEdge } from './react-flow/editable-edge';
import { DEFAULT_ALGORITHM } from './react-flow/editable-edge/constants';
import { extractRawFlowchartData,transformEditorFlowchartData } from '../services/utils.ts'
import { logResearchEvent } from '../lib/logResearchEvent';

const nodeTypes = {
  shape: ShapeNodeEditor,
  custom: ShapeNodeEditor,
};

const edgeTypes: EdgeTypes = {
  editable: EditableEdgeComponent,
  'editable-edge': EditableEdgeComponent,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'editable',
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2 },
};

const proOptions = { account: 'paid-pro', hideAttribution: true };
const snapGrid: SnapGrid = [10, 10];
const fitViewOptions = { padding: 0.4 };
type UnifiedFlowAppProps = {
    flowchartData: FlowchartData;
    onDiagramUpdate: (updatedData: FlowchartData) => void;
    flowchartId?: string | null;
    editorMode?: string;
  };
  

  export function UnifiedFlowApp({
    flowchartData,
    onDiagramUpdate,
    flowchartId,
    editorMode = 'visual'
  }: UnifiedFlowAppProps)  {

   


    const { nodes: defaultNodes, edges: defaultEdges } = transformEditorFlowchartData(flowchartData);
    

    const [nodes, setNodes, onNodesChange] = useNodesState<ShapeNode | any>([
      ...defaultNodes,
    ]);
    
    const [edges, setEdges, onEdgesChange] =
      useEdgesState<EditableEdge>([...defaultEdges]);
    




const updateTimer = useRef<number | null>(null);

useEffect(() => {
  

  if (updateTimer.current) window.clearTimeout(updateTimer.current);

  updateTimer.current = window.setTimeout(() => {
    const updatedData: FlowchartData = extractRawFlowchartData(nodes, edges);
    onDiagramUpdate(updatedData);
  }, 150);

  return () => {
    if (updateTimer.current) window.clearTimeout(updateTimer.current);
  };
}, [nodes, edges, onDiagramUpdate]);

      
      const { screenToFlowPosition } = useReactFlow<ShapeNode>();
    
      const onConnect: OnConnect = useCallback(
        (connection) => {
          const { connectionLinePath } = useAppStore.getState();
      
          const edge: EditableEdge = {
            ...connection,
            id: `${Date.now()}-${connection.source}-${connection.target}`,
            type: 'editable-edge',
            selected: true,
            data: {
              algorithm: DEFAULT_ALGORITHM,
              points: connectionLinePath.map((point) => ({
                ...point,
                id: window.crypto.randomUUID(),
                active: true,
              })),
            },
          };
          logResearchEvent({
            event_type: 'Edge_Added',
            editor_mode: editorMode,
            flowchart_id: flowchartId ?? undefined,
            success: true,
            event_data: {
              source_page: 'UnifiedFlowApp',
              edge_id: edge.id,
              source: connection.source,
              destination: connection.target,
              source_handle: connection.sourceHandle,
              target_handle: connection.targetHandle,
              label: '',
            },
          });
          setEdges((eds) => [...eds, edge]);
        },
        [setEdges]
      );
    
      const onDragOver = (evt: DragEvent<HTMLDivElement>) => {
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'move';
      };
      
      const onDrop: DragEventHandler = (evt: DragEvent<HTMLDivElement>) => {
        evt.preventDefault();
        const type = evt.dataTransfer.getData('application/reactflow') as ShapeType;
        const position = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
      
        const newNode: ShapeNode = {
          id: Date.now().toString(),
          type: 'shape',
          position,
          style: { width: 100, height: 100 },
          data: {
            label: '',
            type,
            color: '#F5F5F5',
          },
          selected: true,
        };
        logResearchEvent({
          event_type: 'Node_Added',
          editor_mode: editorMode,
          flowchart_id: flowchartId ?? undefined,
          success: true,
          event_data: {
            source_page: 'UnifiedFlowApp',
            node_id: newNode.id,
            shape: type,
            label: '',
            creation_method: 'drag_drop',
            position,
          },
        });

        setNodes((nodes) =>
          nodes.map((n) => ({ ...n, selected: false })).concat([newNode])
        );
      };


  const handleNodesChange = useCallback(
  (changes: any[]) => {
    changes.forEach((change) => {
      if (change.type === 'remove') {
        const deletedNode = nodes.find((node) => node.id === change.id);

        logResearchEvent({
          event_type: 'Node_Deleted',
          editor_mode: editorMode,
          flowchart_id: flowchartId ?? undefined,
          success: true,
          event_data: {
            source_page: 'UnifiedFlowApp',
            node_id: change.id,
            shape: deletedNode?.data?.type,
            label: deletedNode?.data?.label ?? '',
          },
        });
      }

      if (change.type === 'position' && change.dragging === false) {
        const movedNode = nodes.find((node) => node.id === change.id);

        logResearchEvent({
          event_type: 'Node_Moved',
          editor_mode: editorMode,
          flowchart_id: flowchartId ?? undefined,
          success: true,
          event_data: {
            source_page: 'UnifiedFlowApp',
            node_id: change.id,
            old_coordinates: movedNode?.position,
            new_coordinates: change.position,
          },
        });
      }
    });

    onNodesChange(changes);
  },
  [nodes, onNodesChange, editorMode, flowchartId]
);

const handleEdgesChange = useCallback(
  (changes: any[]) => {
    changes.forEach((change) => {
      if (change.type === 'remove') {
        const deletedEdge = edges.find((edge) => edge.id === change.id);

        logResearchEvent({
          event_type: 'Edge_Deleted',
          editor_mode: editorMode,
          flowchart_id: flowchartId ?? undefined,
          success: true,
          event_data: {
            source_page: 'UnifiedFlowApp',
            edge_id: change.id,
            source: deletedEdge?.source,
            destination: deletedEdge?.target,
            label: deletedEdge?.data?.label ?? '',
          },
        });
      }
    });

    onEdgesChange(changes);
  },
  [edges, onEdgesChange, editorMode, flowchartId]
);

    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionMode={ConnectionMode.Loose}
        connectionLineComponent={ConnectionLine}
        fitView
        fitViewOptions={fitViewOptions}
        snapGrid={snapGrid}
        proOptions={proOptions}
      >
        
        <Background />
        <Controls />
        <MiniMap zoomable draggable nodeComponent={MiniMapNode} />
        <Panel position="top-left">
          <Sidebar />
        </Panel>
      </ReactFlow>
    );
  }