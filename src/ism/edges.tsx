import { getBezierPath } from '../index';
import type { EdgeComponentProps } from '../types';

/**
 * CleanEdge — read-only kgraph edge for the dark studio (kgraph's default edge
 * is hardcoded purple). Dashed bezier that reads on a dark canvas, with an
 * arrowhead; brighter on hover/selection.
 */
export function CleanEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected }: EdgeComponentProps) {
    const [d] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const stroke = selected ? '#c4b5fd' : '#7c8499'; // violet-300 / slate
    return (
        <g>
            <defs>
                <marker id="kgraph-ism-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L6,3 L0,6 Z" fill={stroke} />
                </marker>
            </defs>
            <path d={d} fill="none" stroke="transparent" strokeWidth={18} />
            <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={selected ? 2 : 1.5}
                strokeDasharray="6 3"
                markerEnd="url(#kgraph-ism-arrow)"
            />
        </g>
    );
}
