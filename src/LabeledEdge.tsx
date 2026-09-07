import React, { useState } from 'react';
import type { EdgeComponentProps } from './types';
import { getBezierPath } from './bezier';

/**
 * LabeledEdge — a styled, optionally labelled bezier edge driven by `edge.data`,
 * so a host can express a whole relation vocabulary (colour · width · dash ·
 * label) as data instead of one edge component per relation.
 *
 * Labels are the crowding problem on a dense canvas: `labelMode` decides when
 * the pill is drawn — always, only while hovered or selected, only while
 * selected, or never. `dim` fades an edge that is outside the current focus.
 */
export type LabelMode = 'always' | 'hover' | 'selected' | 'never';

export interface LabeledEdgeData {
    /** Stroke colour (default kgraph violet). */
    stroke?: string;
    /** Stroke colour while selected (default near-white). */
    selectedStroke?: string;
    width?: number;
    /** SVG dash pattern, e.g. "5 4". */
    dash?: string;
    label?: string;
    labelMode?: LabelMode;
    /** Fade the edge out of focus. */
    dim?: boolean;
    /** Host-side selection (ORed with the canvas's own). */
    selected?: boolean;
    /** Extra class on the visible path (e.g. a flow animation). */
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

const DEFAULT_STROKE = '#8b5cf6';
const DEFAULT_SELECTED = '#f5f5f7';
const LABEL_BG = '#161618';

export const LabeledEdge: React.FC<EdgeComponentProps> = ({
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data,
}) => {
    const [hover, setHover] = useState(false);
    const d = (data || {}) as LabeledEdgeData;
    const [path, lx, ly] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const isSelected = !!(selected || d.selected);
    const stroke = isSelected ? (d.selectedStroke || DEFAULT_SELECTED) : (d.stroke || DEFAULT_STROKE);
    const width = (d.width ?? 1.4) + (isSelected ? 1 : 0);
    const mode: LabelMode = d.labelMode || 'always';
    const showLabel = !!d.label && (
        mode === 'always'
        || (mode === 'hover' && (hover || isSelected))
        || (mode === 'selected' && isSelected)
    );
    const opacity = d.dim && !hover && !isSelected ? 0.3 : 1;
    const clickable = !!d.onClick;
    const labelW = d.label ? d.label.length * 6.4 + 16 : 0;

    return (
        <g
            onClick={d.onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ cursor: clickable ? 'pointer' : 'default', opacity, transition: 'opacity 150ms' }}
        >
            <defs>
                <marker id={`kgraph-le-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
                </marker>
            </defs>
            {/* a wide invisible stroke makes a thin edge hoverable and clickable */}
            <path d={path} fill="none" stroke="transparent" strokeWidth={14} />
            <path
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                strokeDasharray={d.dash}
                markerEnd={`url(#kgraph-le-${id})`}
                className={d.className}
            />
            {showLabel && (
                <g transform={`translate(${lx}, ${ly})`}>
                    <rect x={-labelW / 2} y={-8} width={labelW} height={16} rx={2} fill={LABEL_BG} stroke={stroke} strokeWidth={0.8} />
                    <text textAnchor="middle" dominantBaseline="middle" fontSize={9} fontFamily="ui-monospace, monospace" fill={stroke}>{d.label}</text>
                </g>
            )}
        </g>
    );
};

export default LabeledEdge;
