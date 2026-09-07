import React from 'react';
import type { NodeComponentProps } from './types';
import Handle from './Handle';

/**
 * CollapsibleGroupNode — a labelled band with a header strip, or, when
 * collapsed, just the header as a chip. The host lays the group's members
 * INSIDE the band (see `layoutBands`) and hides them while it is
 * collapsed; this node only draws the frame and the toggle. Everything
 * visual is data-driven so a host can tint it per group.
 *
 *   data.label      "people"
 *   data.count      12                     → "12" beside the label
 *   data.subtitle   "owns 40 · granted 3"  → small text at the right
 *   data.open       true | false
 *   data.onToggle   () => void             → the chevron
 *   data.onClick    () => void             → the header
 *   data.tint       "#34d399"
 *   data.width / data.height               → the frame (open) or chip (closed)
 *   data.selected / data.dim
 *   data.handles    { in: 'target-2', out: 'source-3' }  (defaults)
 */
export interface GroupNodeData {
    label: string;
    count?: number;
    subtitle?: string;
    open?: boolean;
    onToggle?: () => void;
    onClick?: () => void;
    tint?: string;
    width?: number;
    height?: number;
    headerHeight?: number;
    selected?: boolean;
    dim?: boolean;
    handles?: { in?: string; out?: string };
}

const DEFAULT_TINT = '#8b5cf6';

export const CollapsibleGroupNode: React.FC<NodeComponentProps> = ({ data }) => {
    const d = data as GroupNodeData;
    const tint = d.tint || DEFAULT_TINT;
    const open = d.open !== false;
    const header = d.headerHeight ?? 28;
    const width = d.width ?? 240;
    const height = open ? (d.height ?? header) : header;
    const inId = d.handles?.in ?? 'target-2';
    const outId = d.handles?.out ?? 'source-3';

    return (
        <div
            className="kgraph-group"
            style={{
                width, height, position: 'relative', boxSizing: 'border-box',
                border: `1px ${open ? 'dashed' : 'solid'} ${d.selected ? '#f5f5f7' : tint + '66'}`,
                background: open ? tint + '0a' : `linear-gradient(to right, ${tint}22, #1a1a1d 55%)`,
                opacity: d.dim ? 0.4 : 1,
                transition: 'opacity 150ms, height 150ms',
            }}
        >
            <Handle id={inId} type="target" position="left" style={{ top: header / 2 }} />
            <div
                onClick={d.onClick}
                style={{
                    height: header, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px',
                    cursor: d.onClick ? 'pointer' : 'default',
                    fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: tint,
                    borderBottom: open ? `1px dashed ${tint}33` : 'none',
                }}
            >
                {d.onToggle && (
                    <button
                        title={open ? 'collapse' : 'expand'}
                        onClick={(e) => { e.stopPropagation(); d.onToggle?.(); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ background: 'none', border: 'none', color: tint, cursor: 'pointer', padding: 0, width: 12, fontSize: 10 }}
                    >
                        {open ? '▾' : '▸'}
                    </button>
                )}
                <span style={{ fontWeight: 600 }}>{d.label}</span>
                {d.count !== undefined && <span style={{ color: '#9ca3af' }}>{d.count}</span>}
                {d.subtitle && <span style={{ marginLeft: 'auto', color: '#9ca3af', textTransform: 'none', letterSpacing: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</span>}
            </div>
            <Handle id={outId} type="source" position="right" style={{ top: header / 2 }} />
        </div>
    );
};

export default CollapsibleGroupNode;
