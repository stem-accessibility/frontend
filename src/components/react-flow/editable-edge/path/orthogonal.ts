import { Position, type XYPosition } from '@xyflow/react';
import type { ControlPointData } from '../ControlPoint';

import { isControlPoint } from './utils';

export type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type Sides = {
  fromSide: Position;
  toSide: Position;
};

type GridPoint = {
  x: number;
  y: number;
};

const DEFAULT_GRID_SIZE = 20;
const DEFAULT_PORT_OFFSET = 24;
const DEFAULT_BOUNDS_PADDING = 80;

function pointKey(p: GridPoint) {
  return `${p.x},${p.y}`;
}

function manhattan(a: GridPoint, b: GridPoint) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function snapToGrid(value: number, gridSize: number) {
  return Math.round(value / gridSize) * gridSize;
}

function toGridPoint(p: XYPosition, gridSize: number): GridPoint {
  return {
    x: snapToGrid(p.x, gridSize),
    y: snapToGrid(p.y, gridSize),
  };
}

function fromGridPoint(p: GridPoint): XYPosition {
  return { x: p.x, y: p.y };
}

function offsetFromSide(
  point: XYPosition,
  side: Position,
  margin = DEFAULT_PORT_OFFSET
): XYPosition {
  switch (side) {
    case Position.Left:
      return { x: point.x - margin, y: point.y };
    case Position.Right:
      return { x: point.x + margin, y: point.y };
    case Position.Top:
      return { x: point.x, y: point.y - margin };
    case Position.Bottom:
      return { x: point.x, y: point.y + margin };
    default:
      return point;
  }
}

function isPointInRect(p: XYPosition, rect: Rect) {
  return (
    p.x >= rect.left &&
    p.x <= rect.right &&
    p.y >= rect.top &&
    p.y <= rect.bottom
  );
}

function segmentIntersectsRect(a: XYPosition, b: XYPosition, rect: Rect) {
  // orthogonal segments only
  if (a.x === b.x) {
    const x = a.x;
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y, b.y);

    return x >= rect.left && x <= rect.right && bottom >= rect.top && top <= rect.bottom;
  }

  if (a.y === b.y) {
    const y = a.y;
    const left = Math.min(a.x, b.x);
    const right = Math.max(a.x, b.x);

    return y >= rect.top && y <= rect.bottom && right >= rect.left && left <= rect.right;
  }

  return false;
}

function isBlockedPoint(
  p: GridPoint,
  obstacles: Rect[],
  start: GridPoint,
  end: GridPoint
) {
  if ((p.x === start.x && p.y === start.y) || (p.x === end.x && p.y === end.y)) {
    return false;
  }

  return obstacles.some((rect) => isPointInRect(p, rect));
}

function isBlockedSegment(
  a: GridPoint,
  b: GridPoint,
  obstacles: Rect[],
  start: GridPoint,
  end: GridPoint
) {
  if (
    ((a.x === start.x && a.y === start.y) || (a.x === end.x && a.y === end.y)) &&
    ((b.x === start.x && b.y === start.y) || (b.x === end.x && b.y === end.y))
  ) {
    return false;
  }

  return obstacles.some((rect) => segmentIntersectsRect(a, b, rect));
}

function getBounds(
  start: GridPoint,
  end: GridPoint,
  obstacles: Rect[],
  padding = DEFAULT_BOUNDS_PADDING
) {
  let minX = Math.min(start.x, end.x) - padding;
  let maxX = Math.max(start.x, end.x) + padding;
  let minY = Math.min(start.y, end.y) - padding;
  let maxY = Math.max(start.y, end.y) + padding;

  for (const rect of obstacles) {
    minX = Math.min(minX, rect.left - padding);
    maxX = Math.max(maxX, rect.right + padding);
    minY = Math.min(minY, rect.top - padding);
    maxY = Math.max(maxY, rect.bottom + padding);
  }

  return { minX, maxX, minY, maxY };
}

function reconstructPath(
  cameFrom: Map<string, string>,
  current: GridPoint
): GridPoint[] {
  const path: GridPoint[] = [current];
  let currentKey = pointKey(current);

  while (cameFrom.has(currentKey)) {
    const prevKey = cameFrom.get(currentKey)!;
    const [x, y] = prevKey.split(',').map(Number);
    const prev = { x, y };
    path.push(prev);
    currentKey = prevKey;
  }

  return path.reverse();
}

function simplifyOrthogonalPoints(points: XYPosition[]): XYPosition[] {
  if (points.length <= 2) return points;

  const simplified: XYPosition[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    const sameVertical = prev.x === curr.x && curr.x === next.x;
    const sameHorizontal = prev.y === curr.y && curr.y === next.y;

    if (!sameVertical && !sameHorizontal) {
      simplified.push(curr);
    }
  }

  simplified.push(points[points.length - 1]);
  return simplified;
}

function buildSvgPath(points: XYPosition[]) {
  if (points.length < 1) return '';

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  return path;
}

function fallbackOrthogonalPath(start: XYPosition, end: XYPosition): XYPosition[] {
  const midX = Math.round((start.x + end.x) / 2);
  return [
    start,
    { x: midX, y: start.y },
    { x: midX, y: end.y },
    end,
  ];
}

function routeOrthogonal(
  source: XYPosition,
  target: XYPosition,
  sides: Sides,
  obstacles: Rect[],
  gridSize = DEFAULT_GRID_SIZE
): XYPosition[] {
  const startExit = offsetFromSide(source, sides.fromSide);
  const endEntry = offsetFromSide(target, sides.toSide);

  const start = toGridPoint(startExit, gridSize);
  const end = toGridPoint(endEntry, gridSize);

  const { minX, maxX, minY, maxY } = getBounds(start, end, obstacles);

  const openSet = new Set<string>([pointKey(start)]);
  const cameFrom = new Map<string, string>();

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(pointKey(start), 0);
  fScore.set(pointKey(start), manhattan(start, end));

  const directionFrom = new Map<string, string>();

  const directions = [
    { dx: gridSize, dy: 0, dir: 'R' },
    { dx: -gridSize, dy: 0, dir: 'L' },
    { dx: 0, dy: gridSize, dir: 'D' },
    { dx: 0, dy: -gridSize, dir: 'U' },
  ];

  while (openSet.size > 0) {
    let currentKey = '';
    let currentScore = Infinity;

    for (const key of openSet) {
      const score = fScore.get(key) ?? Infinity;
      if (score < currentScore) {
        currentScore = score;
        currentKey = key;
      }
    }

    const [cx, cy] = currentKey.split(',').map(Number);
    const current = { x: cx, y: cy };

    if (current.x === end.x && current.y === end.y) {
      const gridPath = reconstructPath(cameFrom, current);
      const path = [
        source,
        startExit,
        ...gridPath.map(fromGridPoint),
        endEntry,
        target,
      ];

      return simplifyOrthogonalPoints(path);
    }

    openSet.delete(currentKey);

    for (const { dx, dy, dir } of directions) {
      const neighbor = { x: current.x + dx, y: current.y + dy };

      if (
        neighbor.x < minX ||
        neighbor.x > maxX ||
        neighbor.y < minY ||
        neighbor.y > maxY
      ) {
        continue;
      }

      if (isBlockedPoint(neighbor, obstacles, start, end)) {
        continue;
      }

      if (isBlockedSegment(current, neighbor, obstacles, start, end)) {
        continue;
      }

      const neighborKey = pointKey(neighbor);
      const currentG = gScore.get(currentKey) ?? Infinity;

      const prevDir = directionFrom.get(currentKey);
      const turnPenalty = prevDir && prevDir !== dir ? 10 : 0;

      const tentativeG = currentG + gridSize + turnPenalty;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentKey);
        directionFrom.set(neighborKey, dir);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + manhattan(neighbor, end));
        openSet.add(neighborKey);
      }
    }
  }

  return simplifyOrthogonalPoints([
    source,
    ...fallbackOrthogonalPath(startExit, endEntry),
    target,
  ]);
}

export function getOrthogonalPath(
  points: XYPosition[],
  sides: Sides = { fromSide: Position.Left, toSide: Position.Right },
  obstacles: Rect[] = []
) {
  if (points.length < 2) return '';
  if (points.length !== 2) {
    // for now, orthogonal routing expects source and target only
    return buildSvgPath(points);
  }

  const [source, target] = points;
  const routed = routeOrthogonal(source, target, sides, obstacles);
  return buildSvgPath(routed);
}

export function getOrthogonalControlPoints(
  points: (ControlPointData | XYPosition)[],
  sides: Sides = { fromSide: Position.Left, toSide: Position.Right },
  obstacles: Rect[] = []
) {
  if (points.length < 2) return [];

  const rawPoints = points.map((p) => ({ x: p.x, y: p.y }));

  if (rawPoints.length !== 2) {
    const controlPoints: ControlPointData[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (isControlPoint(p1)) {
        controlPoints.push(p1);
      }

      controlPoints.push({
        prev: 'id' in p1 ? p1.id : undefined,
        id: `orth-${window.crypto.randomUUID()}`,
        active: false,
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      });
    }

    return controlPoints;
  }

  const routed = routeOrthogonal(rawPoints[0], rawPoints[1], sides, obstacles);

  const controlPoints: ControlPointData[] = [];

  for (let i = 0; i < routed.length - 1; i++) {
    const p1 = routed[i];
    const p2 = routed[i + 1];

    controlPoints.push({
      id: `orth-${window.crypto.randomUUID()}`,
      active: false,
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    });
  }

  return controlPoints;
}