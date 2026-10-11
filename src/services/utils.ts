// utils.ts
import type { FlowchartData, ReactFlowResult, NodeData, EdgeData } from '../types/types';

//import type { Node, Edge, MarkerType } from '@xyflow/react';
import type { ShapeNode } from '../components/react-flow/shape/types';
import type { EditableEdge } from '../components/react-flow/editable-edge';
import { Algorithm } from '../components/react-flow/editable-edge/constants';
import type { ShapeType } from '../components/react-flow/shape/types';


type RawNode = {
  id: string;
  label: string;
  shape: string;
  coordinates: [[number, number], [number, number]];
};


function normalizeEdgeStyle(type?: string): 'solid' | 'dashed' {
  const t = (type ?? 'solid').toLowerCase();
  if (t === 'dashed' || t === 'dashed_edge') return 'dashed';
  return 'solid'; // solid, solid_edge, anything else
}

function normalizeArrowDirection(edge: EdgeData): 'start' | 'end' | 'both' | 'none' {
  const arrowheads = edge.arrowheads;

  if (!arrowheads) {
    // If undefined (missing), choose your default policy.
    // I recommend defaulting to 'end' OR 'none' depending on your semantics.
    // If "missing" means "unspecified", default to 'end'.
    return 'end';
  }

  if (arrowheads.length === 0) return 'none'; // IMPORTANT: empty means none

  const hasStart = arrowheads.includes('start');
  const hasEnd = arrowheads.includes('end');

  if (hasStart && hasEnd) return 'both';
  if (hasStart) return 'start';
  if (hasEnd) return 'end';
  return 'none';
}


export function transformEditorFlowchartData(flowchartData: FlowchartData): {
  nodes: ShapeNode[];
  edges: EditableEdge[];
} {
  const nodes: ShapeNode[] = flowchartData.nodes.map((node) => {
    const [[x1, y1], [x2, y2]] = node.coordinates;
    const width = x2 - x1;
    const height = y2 - y1;
    const centerX = x1 + width / 2;
    const centerY = y1 + height / 2;

    return {
      id: node.id,
      type: 'shape',
      position: { x: centerX, y: centerY },
      style: { width, height },
      data: {
        label: node.label ?? '',
        type: node.shape as ShapeType,
        color: '#ccc',
      },
    };
  });

  const edges: EditableEdge[] = flowchartData.edges.map((edge) => {
    const style = normalizeEdgeStyle(edge.type);
    const arrowDirection = normalizeArrowDirection(edge);

    return {
      id: edge.id ?? `${edge.source}->${edge.destination}`,
      type: 'editable-edge',
      source: edge.source,
      target: edge.destination,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      data: {
        algorithm: Algorithm.Linear,
        // IMPORTANT: if you ever want curved edges to persist, store points in EdgeData and load them here
        points: (edge.points ?? []) as any,
        label: edge.label ?? '',
        style,
        arrowDirection,
      },
    };
  });

  return { nodes, edges };
}


export function convertEdgeDataToEditableEdge(edge: EdgeData): EditableEdge {
  const arrowheads = edge.arrowheads ?? ['end'];
  let arrowDirection: 'start' | 'end' | 'both' | 'none' = 'none';

  if (arrowheads.includes('start') && arrowheads.includes('end')) {
    arrowDirection = 'both';
  } else if (arrowheads.includes('start')) {
    arrowDirection = 'start';
  } else if (arrowheads.includes('end')) {
    arrowDirection = 'end';
  }

  return {
    id: edge.id ?? `${edge.source}-${edge.destination}`,
    source: edge.source,
    target: edge.destination,
    type: 'editable-edge',
    data: {
      points: [],
      label: edge.label ?? '',
      style: edge.type === 'dashed' ? 'dashed' : 'solid',
      arrowDirection,
    },
  };
}

export function transformFlowchartData(flowchartData: {
  nodes: RawNode[];
  edges: EdgeData[];
}): {
  nodes: ShapeNode[];
  edges: EditableEdge[];
} {
  const { nodes: inputNodes, edges: inputEdges } = flowchartData;

  const nodes: ShapeNode[] = inputNodes.map((node) => {
    const [[x1, y1], [x2, y2]] = node.coordinates;
    const width = x2 - x1;
    const height = y2 - y1;
    const centerX = x1 + width / 2;
    const centerY = y1 + height / 2;

    return {
      id: node.id,
      type: 'shape',
      position: { x: centerX, y: centerY },
      style: { width, height },
      data: {
        label: node.label,
        type: node.shape as ShapeType,
        color: '#ccc',
      },
    };
  });

  function resolveArrowDirection(
    arrowheads?: string[],
    markerEnd?: { type?: string }
  ): 'start' | 'end' | 'both' | 'none' {
    if (!arrowheads || arrowheads.length === 0) return markerEnd?.type ? 'end' : 'end';
    const hasStart = arrowheads.includes('start');
    const hasEnd = arrowheads.includes('end');

    if (hasStart && hasEnd) return 'both';
    if (hasStart) return 'start';
    if (hasEnd) return 'end';

    return markerEnd?.type ? 'end' : 'none'; // fallback
  }

  const edges: EditableEdge[] = inputEdges.map((edge) => {
  const arrowDirection =
    resolveArrowDirection(edge.arrowheads, edge.markerEnd) || 'end';

  const style =
    edge.type === 'dashed' || edge.type === 'dashed_edge' ? 'dashed' : 'solid';

  return {
    id: edge.id ?? `${edge.source}->${edge.destination}`,
    type: 'editable-edge',
    source: edge.source,
    target: edge.destination,
    sourceHandle: 'bottom',
    targetHandle: 'top',
    data: {
      source: edge.source,
      destination: edge.destination,
      algorithm: Algorithm.Linear,
      points: [],           // if you add this later
      label: edge.label ?? '',
      style,
      arrowDirection: arrowDirection === 'none' ? 'end' : arrowDirection,
    },
  };
});


  return { nodes, edges };
}


// utils.ts

// --- REPLACE the old function with this new one ---

export const extractRawFlowchartData = (
  nodes: ShapeNode[],  // Use the specific ShapeNode type
  edges: EditableEdge[] // Use the specific EditableEdge type
): FlowchartData => {
  const rawNodes: NodeData[] = nodes.map((node) => {
    // Correctly recalculate coordinates from the node's position and dimensions,
    // which are updated by React Flow when you move or resize nodes.
    const width = (node.style?.width as number) || 0;
    const height = (node.style?.height as number) || 0;
    const x1 = node.position.x - width / 2;
    const y1 = node.position.y - height / 2;
    const x2 = node.position.x + width / 2;
    const y2 = node.position.y + height / 2;

    return {
      id: node.id,
      label: node.data.label,
      shape: node.data.type, // The 'type' in ShapeNode data is the 'shape'
      coordinates: [[x1, y1], [x2, y2]],
    };
  });

  const rawEdges: EdgeData[] = edges.map((edge) => {
    // Convert the 'arrowDirection' back into the 'arrowheads' array
    const arrowheads: string[] = [];
    if (edge.data?.arrowDirection === 'start' || edge.data?.arrowDirection === 'both') {
      arrowheads.push('start');
    }
    if (edge.data?.arrowDirection === 'end' || edge.data?.arrowDirection === 'both') {
      arrowheads.push('end');
    }

    return {
      id: edge.id,
      source: edge.source,
      destination: edge.target, // In React Flow edges use 'target'
      label: edge.data?.label || '',
      type: edge.data?.style === 'dashed' ? 'dashed' : 'solid',
      arrowheads: arrowheads,
    };
  });

  return {
    nodes: rawNodes,
    edges: rawEdges,
  };
};

export const transform = (
  flowchartData: FlowchartData
): ReactFlowResult => {
  const { nodes = [], edges = [] } = flowchartData;

  const nodeMap: { [id: string]: { center: [number, number] } } = {};
  nodes.forEach((node) => {
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    if (
      Array.isArray(node.coordinates) &&
      node.coordinates.length === 2 &&
      Array.isArray(node.coordinates[0]) &&
      Array.isArray(node.coordinates[1])
    ) {
      [[x1, y1], [x2, y2]] = node.coordinates;
    }
    nodeMap[node.id] = {
      center: [(x1 + x2) / 2, (y1 + y2) / 2],
    };
  });

  const transformedNodes = nodes.map((node) => {
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    if (
      Array.isArray(node.coordinates) &&
      node.coordinates.length === 2 &&
      Array.isArray(node.coordinates[0]) &&
      Array.isArray(node.coordinates[1])
    ) {
      [[x1, y1], [x2, y2]] = node.coordinates;
    }
    const x = (x1 + x2) / 2;
    const y = (y1 + y2) / 2;

    return {
      id: node.id,
      position: { x, y },
      type: node.shape || 'rectangle',
      data: {
        id: node.id,
        label: node.label || '',
        shape: node.shape || 'rectangle',
        coordinates: node.coordinates,
      },
    };
  });

  const getHandleDirection = (sourceCenter: [number, number], targetCenter: [number, number]) => {
    if (!sourceCenter || !targetCenter) {
      console.warn('Missing center coordinates for edge calculation.');
      return { sourceHandleSide: 'right', targetHandleSide: 'left' };
    }

    const [sx, sy] = sourceCenter;
    const [tx, ty] = targetCenter;
    const dx = tx - sx;
    const dy = ty - sy;

    let sourceHandleSide: string;
    let targetHandleSide: string;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        sourceHandleSide = 'right';
        targetHandleSide = 'left';
      } else {
        sourceHandleSide = 'left';
        targetHandleSide = 'right';
      }
    } else {
      if (dy > 0) {
        sourceHandleSide = 'bottom';
        targetHandleSide = 'top';
      } else {
        sourceHandleSide = 'top';
        targetHandleSide = 'bottom';
      }
    }

    return { sourceHandleSide, targetHandleSide };
  };

  const transformedEdges = edges.map((edge) => {
    const arrowheads = edge.arrowheads || [];
    let markerStart: any, markerEnd: any;

    if (arrowheads.length === 1) {
      markerEnd = { type: 'arrowclosed' };
    } else if (arrowheads.length >= 2) {
      markerStart = { type: 'arrowclosed' };
      markerEnd = { type: 'arrowclosed' };
    }

    const sourceCenter = nodeMap[edge.source]?.center;
    const targetCenter = nodeMap[edge.destination]?.center;

    let sourceHandle, targetHandle;
    if (sourceCenter && targetCenter) {
      const { sourceHandleSide, targetHandleSide } = getHandleDirection(sourceCenter, targetCenter);
      sourceHandle = `${edge.source}.${sourceHandleSide}`;
      targetHandle = `${edge.destination}.${targetHandleSide}`;
    }

    return {
      id: edge.id || `\${edge.source}-\${edge.destination}`,
      source: edge.source,
      target: edge.destination,
      sourceHandle,
      targetHandle,
      label: edge.label || '',
      data: {
        id: edge.id,
        source: edge.source,
        destination: edge.destination,
        label: edge.label || '',
        arrowheads: edge.arrowheads,
        type: edge.type,
      },
      type: 'smoothstep',
      markerStart,
      markerEnd,
      style: {
        strokeWidth: 2,
        strokeDasharray: edge.type === 'dashed_edge' ? '5,5' : '0',
      },
      labelStyle: {
        fontSize: 12,
        fontWeight: 500,
        fill: '#1a1a1a',
        fontFamily: 'Segoe UI, sans-serif',
      },
      labelBgStyle: {
        fill: '#ffffff',
        stroke: '#d3dce6',
        strokeWidth: 1,
      },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 0,
    };
  });

  return {
    nodes: transformedNodes,
    edges: transformedEdges,
  };
};






function safeNodeLabel(node: any): string {
  return (node?.data?.label ?? node?.label ?? node?.id ?? "").toString().trim();
}

function safeEdgeLabel(edge: any): string {
  return (edge?.data?.label ?? edge?.label ?? "").toString().trim();
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeLabel(label: string): string {
  return label.replace(/"/g, '\\"');
}

export function jsonToMermaid(flowchartData: FlowchartData): string {
  const nodes = flowchartData?.nodes ?? [];
  const edges = flowchartData?.edges ?? [];

  const lines: string[] = ["flowchart TD"];

  const nodeIdMap = new Map<string, string>();

  nodes.forEach((node: any, index: number) => {
    const rawId = node?.id ? String(node.id) : `node_${index}`;
    const mermaidId = sanitizeId(rawId);
    nodeIdMap.set(rawId, mermaidId);

    const label = safeNodeLabel(node) || mermaidId;
    const shape = node?.data?.type ?? node?.shape ?? "rectangle";

    let nodeSyntax = `${mermaidId}["${escapeLabel(label)}"]`;

    switch (shape) {
      case "diamond":
        nodeSyntax = `${mermaidId}{"${escapeLabel(label)}"}`;
        break;
      case "circle":
      case "ellipse":
        nodeSyntax = `${mermaidId}(("${escapeLabel(label)}"))`;
        break;
      case "round-rectangle":
        nodeSyntax = `${mermaidId}("${escapeLabel(label)}")`;
        break;
      case "hexagon":
        nodeSyntax = `${mermaidId}{{"${escapeLabel(label)}"}}`;
        break;
      case "parallelogram":
        nodeSyntax = `${mermaidId}[/"${escapeLabel(label)}"/]`;
        break;
      case "cylinder":
        nodeSyntax = `${mermaidId}[("${escapeLabel(label)}")]`;
        break;
      case "rectangle":
      default:
        nodeSyntax = `${mermaidId}["${escapeLabel(label)}"]`;
        break;
    }

    lines.push(`  ${nodeSyntax}`);
  });

  edges.forEach((edge: any, _index: number) => {
    const sourceRaw = edge?.source ?? edge?.sourceNode ?? edge?.from;
    const targetRaw = edge?.target ?? edge?.destination ?? edge?.targetNode ?? edge?.to;

    if (!sourceRaw || !targetRaw) return;

    const source = nodeIdMap.get(String(sourceRaw)) ?? sanitizeId(String(sourceRaw));
    const target = nodeIdMap.get(String(targetRaw)) ?? sanitizeId(String(targetRaw));

    const label = safeEdgeLabel(edge);

    if (label) {
      lines.push(`  ${source} -->|${escapeLabel(label)}| ${target}`);
    } else {
      lines.push(`  ${source} --> ${target}`);
    }
  });

  if (nodes.length === 0 && edges.length === 0) {
    return "flowchart TD";
  }

  return lines.join("\n");
}