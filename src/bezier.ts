import { HandlePosition } from './types';

/**
 * Compute a cubic bezier path between two points with directional control points.
 * Drop-in replacement for ReactFlow's getBezierPath — uses the same control point
 * algorithm so curves look identical.
 *
 * Returns [pathString, labelX, labelY, offsetX, offsetY]
 */
export function getBezierPath({
    sourceX,
    sourceY,
    sourcePosition = 'bottom',
    targetX,
    targetY,
    targetPosition = 'top',
    curvature = 0.25,
}: {
    sourceX: number;
    sourceY: number;
    sourcePosition?: HandlePosition;
    targetX: number;
    targetY: number;
    targetPosition?: HandlePosition;
    curvature?: number;
}): [string, number, number, number, number] {
    const [sourceControlX, sourceControlY] = getControlWithCurvature(
        sourcePosition, sourceX, sourceY, targetX, targetY, curvature,
    );
    const [targetControlX, targetControlY] = getControlWithCurvature(
        targetPosition, targetX, targetY, sourceX, sourceY, curvature,
    );

    const path = `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;

    // Label center using cubic bezier at t=0.5 (matching ReactFlow's getBezierEdgeCenter)
    const labelX = sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125;
    const labelY = sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125;

    const offsetX = Math.abs(labelX - sourceX);
    const offsetY = Math.abs(labelY - sourceY);

    return [path, labelX, labelY, offsetX, offsetY];
}

/**
 * ReactFlow-compatible control offset:
 * - When target is in the natural direction from the handle: offset = 0.5 * distance
 * - When target is in the opposite direction: offset = curvature * 25 * sqrt(-distance)
 */
function calculateControlOffset(distance: number, curvature: number): number {
    if (distance >= 0) {
        return 0.5 * distance;
    }
    return curvature * 25 * Math.sqrt(-distance);
}

function getControlWithCurvature(
    pos: HandlePosition,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    c: number,
): [number, number] {
    switch (pos) {
        case 'left':
            return [x1 - calculateControlOffset(x1 - x2, c), y1];
        case 'right':
            return [x1 + calculateControlOffset(x2 - x1, c), y1];
        case 'top':
            return [x1, y1 - calculateControlOffset(y1 - y2, c)];
        case 'bottom':
            return [x1, y1 + calculateControlOffset(y2 - y1, c)];
        default:
            return [x1, y1 + calculateControlOffset(y2 - y1, c)];
    }
}
