import { useCallback, useRef, useState, useEffect } from 'react';
import {
  BaseEdge,
  type BuiltInNode,
  useReactFlow,
  useStore,
  type Edge,
  type EdgeProps,
  type XYPosition,
  EdgeLabelRenderer
} from '@xyflow/react';

import { EdgeToolbar } from '../edge-toolbar';

import { ControlPoint, type ControlPointData } from './ControlPoint';
import { getPath, getControlPoints } from './path';
import { Algorithm, COLORS } from './constants';
import { logResearchEvent } from '../../../lib/logResearchEvent';

const useIdsForInactiveControlPoints = (points: ControlPointData[]) => {
  const ids = useRef<string[]>([]);

  if (ids.current.length === points.length) {
    return points.map((point, i) =>
      point.id ? point : { ...point, id: ids.current[i] }
    );
  } else {
    ids.current = [];

    return points.map((point, i) => {
      if (!point.id) {
        const id = window.crypto.randomUUID();
        ids.current[i] = id;
        return { ...point, id: id };
      } else {
        ids.current[i] = point.id;
        return point;
      }
    });
  }
};

export type EditableEdge = Edge<{
  algorithm?: Algorithm;
  points: ControlPointData[];
  label?: string;
  style?: 'solid' | 'dashed';
  arrowDirection?: 'start' | 'end' | 'both' | 'none';
}>;


export function EditableEdgeComponent({
  id,
  selected,
  source,
  sourceX,
  sourceY,
  sourcePosition,
  target,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  markerStart,
  style,
  data = { points: [], label: '', style: 'solid' },

  ...delegated
}: EdgeProps<EditableEdge>) {
  const sourceOrigin: XYPosition = { x: sourceX, y: sourceY };
  const targetOrigin: XYPosition = { x: targetX, y: targetY };
  const color = COLORS[data.algorithm ?? Algorithm.Linear];
  const {
    sourceHandleId,
    targetHandleId,
    pathOptions,
    selectable,
    deletable,
    ...cleanDelegated
  } = delegated;
  
  const { setEdges } = useReactFlow<BuiltInNode, EditableEdge>();
  const shouldShowPoints = useStore((store) => {
    const sourceNode = store.nodeLookup.get(source)!;
    const targetNode = store.nodeLookup.get(target)!;

    return selected || sourceNode.selected || targetNode.selected;
  });

  
  
  const setControlPoints = useCallback(
    (update: (points: ControlPointData[]) => ControlPointData[]) => {
      setEdges((edges) =>
        edges.map((e) => {
          if (e.id !== id) return e;
          if (!isEditableEdge(e)) return e;

          const points = e.data?.points ?? [];
          const data = { ...e.data, points: update(points) };

          return { ...e, data };
        })
      );
    },
    [id, setEdges]
  );


  const obstacleRects = useStore((store) => {
  const padding = 20;

  return Array.from(store.nodeLookup.values())
    .filter((node) => node.id !== source && node.id !== target)
    .map((node) => {
      const x = node.internals.positionAbsolute.x;
      const y = node.internals.positionAbsolute.y;
      const w = node.measured?.width ?? 0;
      const h = node.measured?.height ?? 0;

      return {
        left: x - padding,
        top: y - padding,
        right: x + w + padding,
        bottom: y + h + padding,
      };
    });
});
  const pathPoints = [sourceOrigin, ...data.points, targetOrigin];
  const controlPoints = getControlPoints(pathPoints, data.algorithm, {
  fromSide: sourcePosition,
  toSide: targetPosition,
}, obstacleRects);

const path = getPath(pathPoints, data.algorithm, {
  fromSide: sourcePosition,
  toSide: targetPosition,
}, obstacleRects);

 



  const controlPointsWithIds = useIdsForInactiveControlPoints(controlPoints);
  const [_isEditingLabel, setIsEditingLabel] = useState(false);

  // getting midpoint to make label + toolbar always on the path
  const pathRef = useRef<SVGPathElement>(null);
  const [labelPos, setLabelPos] = useState<XYPosition>({ x: 0, y: 0 });
const sourceInternalNode = useStore((store) => store.nodeLookup.get(source));
const targetInternalNode = useStore((store) => store.nodeLookup.get(target));

const sourceNodeX = sourceInternalNode?.internals.positionAbsolute.x ?? sourceX;
const sourceNodeY = sourceInternalNode?.internals.positionAbsolute.y ?? sourceY;
const sourceNodeW = sourceInternalNode?.measured?.width ?? 180;

const targetNodeX = targetInternalNode?.internals.positionAbsolute.x ?? targetX;
const targetNodeY = targetInternalNode?.internals.positionAbsolute.y ?? targetY;
const targetNodeW = targetInternalNode?.measured?.width ?? 180;

const topNodeY = Math.min(sourceNodeY, targetNodeY);
const toolbarX = (sourceNodeX + sourceNodeW / 2 + targetNodeX + targetNodeW / 2) / 2;
const TOOLBAR_GAP = -40;
const toolbarY = topNodeY - TOOLBAR_GAP;
  
  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      const point = pathRef.current.getPointAtLength(length / 2);
      setLabelPos({ x: point.x, y: point.y });
    }
  }, [path]); // run every time the path changes



  return (
  <>
    <defs>
      <marker
        id="react-flow__arrowclosed"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
        markerUnits="strokeWidth"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
      </marker>
    </defs>

    <path
      ref={pathRef}
      d={path}
      style={{ display: 'none' }}
      aria-hidden="true"
    />

    <BaseEdge
        id={id}
        path={path}
        {...cleanDelegated}
        interactionWidth={32}
        markerStart={
          data.arrowDirection === 'start' || data.arrowDirection === 'both'
            ? 'url(#react-flow__arrowclosed)'
            : undefined
        }
        markerEnd={
          data.arrowDirection === 'end' || data.arrowDirection === 'both'
            ? 'url(#react-flow__arrowclosed)'
            : undefined
        }
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: color,
          strokeDasharray: data.style === 'dashed' ? '5,5' : '0',
          cursor: 'pointer',
        }}
      />

    <EdgeLabelRenderer>
      <>
        {(selected || data.label) && (
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
              pointerEvents: 'all',
              zIndex: 20,
            }}
          >
            <div
              contentEditable={_isEditingLabel}
              suppressContentEditableWarning
              style={{
                fontSize: '12px',
                color: '#000',
                background: 'white',
                padding: '2px 4px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                textAlign: 'center',
                cursor: _isEditingLabel ? 'text' : 'pointer',
                userSelect: _isEditingLabel ? 'text' : 'none',
                minWidth: '40px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingLabel(true);
              }}
              onBlur={(e) => {
          const oldLabel = data.label ?? '';
          const newLabel = e.currentTarget.textContent || '';

          setEdges((edges) =>
            edges.map((edge) =>
              edge.id === id && isEditableEdge(edge)
                ? ({
                    ...edge,
                    data: { ...edge.data, label: newLabel },
                  } as EditableEdge)
                : edge
            )
          );

          setIsEditingLabel(false);

          if (oldLabel !== newLabel) {
            logResearchEvent({
              event_type: 'Edge_Label_Edited',
              editor_mode: 'visual',
              success: true,
              event_data: {
                source_page: 'EditableEdgeComponent',
                edge_id: id,
                source,
                destination: target,
                old_label: oldLabel,
                new_label: newLabel,
              },
            });
          }
        }}
            >
              {data.label ?? 'Click to add label'}
            </div>
          </div>
        )}

        {selected && (
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${toolbarX}px, ${toolbarY}px)`,
              pointerEvents: 'all',
              zIndex: 30,
            }}
          >
            <EdgeToolbar
              
              currentStyle={data.style || 'solid'}
              arrowDirection={data.arrowDirection || 'end'}
              onStyleChange={(newStyle) => {

                const oldStyle = data.style || 'solid';

                if (oldStyle !== newStyle) {
                  logResearchEvent({
                    event_type: 'Edge_Style_Changed',
                    editor_mode: 'visual',
                    success: true,
                    event_data: {
                      source_page: 'EditableEdgeComponent',
                      edge_id: id,
                      source,
                      destination: target,
                      old_style: oldStyle,
                      new_style: newStyle,
                    },
                  });
                }
                setEdges((edges) =>
                  edges.map((edge) =>
                    edge.id === id && isEditableEdge(edge)
                      ? ({
                          ...edge,
                          data: { ...edge.data, style: newStyle },
                        } as EditableEdge)
                      : edge
                  )
                );
              }}
              onArrowChange={(newDirection) => {
                const oldDirection = data.arrowDirection || 'end';

                if (oldDirection !== newDirection) {
                  logResearchEvent({
                    event_type: 'Edge_Style_Changed',
                    editor_mode: 'visual',
                    success: true,
                    event_data: {
                      source_page: 'EditableEdgeComponent',
                      edge_id: id,
                      source,
                      destination: target,
                      style_property: 'arrowDirection',
                      old_arrow_direction: oldDirection,
                      new_arrow_direction: newDirection,
                    },
                  });
                }
                setEdges((edges) =>
                  edges.map((edge) =>
                    edge.id === id && isEditableEdge(edge)
                      ? ({
                          ...edge,
                          data: { ...edge.data, arrowDirection: newDirection },
                        } as EditableEdge)
                      : edge
                  )
                );
              }}
             onDelete={() => {
              (document.activeElement as HTMLElement | null)?.blur();

              logResearchEvent({
                event_type: 'Edge_Deleted',
                editor_mode: 'visual',
                success: true,
                event_data: {
                  source_page: 'EditableEdgeComponent',
                  edge_id: id,
                  source,
                  destination: target,
                  label: data.label ?? '',
                  style: data.style ?? 'solid',
                  arrow_direction: data.arrowDirection ?? 'end',
                },
              });

              setEdges((edges) => edges.filter((edge) => edge.id !== id));
            }}
            />
          </div>
        )}
      </>
    </EdgeLabelRenderer>

    {shouldShowPoints &&
      controlPointsWithIds.map((point, index) => (
        <ControlPoint
          key={point.id}
          index={index}
          setControlPoints={setControlPoints}
          color={color}
          {...point}
        />
      ))}
  </>
);
}

const isEditableEdge = (edge: Edge): edge is EditableEdge =>
  edge.type === "editable-edge";
