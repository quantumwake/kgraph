import { useCallback, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { KGraphCanvas } from '../index';
import type { KGraphNode, KGraphEdge } from '../types';
import { StudioNode, NODE_WIDTH, NODE_HEIGHT, NODE_COLLAPSED } from './nodes';
import { CleanEdge } from './edges';

export interface StudioGraphProps {
    /** Pre-mapped kgraph nodes; node.data should carry StudioNodeData fields. */
    nodes: KGraphNode[];
    /** Pre-mapped kgraph edges. */
    edges: KGraphEdge[];
    /** Fired when a node is clicked. */
    onNodeClick?: (node: KGraphNode) => void;
    /** Allow per-node collapse (default true). */
    collapsible?: boolean;
    className?: string;
    style?: CSSProperties;
}

/**
 * StudioGraph — a read-only kgraph canvas with the Alethic ISM studio look:
 * every node renders as StudioNode, every edge as CleanEdge, non-interactive
 * (no drag/connect), fit-to-view. Manages per-node collapse: collapsed nodes
 * shrink to an icon and their kgraph dimensions/edge anchors shrink with them.
 */
export function StudioGraph({ nodes, edges, onNodeClick, collapsible = true, className, style }: StudioGraphProps) {
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

    const toggleCollapse = useCallback((id: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const renderNodes = useMemo<KGraphNode[]>(
        () =>
            nodes.map((n) => {
                const isCollapsed = collapsed.has(n.id);
                return {
                    ...n,
                    width: isCollapsed ? NODE_COLLAPSED : NODE_WIDTH,
                    height: isCollapsed ? NODE_COLLAPSED : NODE_HEIGHT,
                    data: {
                        ...n.data,
                        collapsed: isCollapsed,
                        onToggleCollapse: collapsible ? () => toggleCollapse(n.id) : undefined,
                    },
                };
            }),
        [nodes, collapsed, collapsible, toggleCollapse],
    );

    const nodeTypes = useMemo(() => {
        const m: Record<string, typeof StudioNode> = { state: StudioNode, processor: StudioNode };
        renderNodes.forEach((n) => {
            m[n.type] = StudioNode;
        });
        return m;
    }, [renderNodes]);

    const edgeTypes = useMemo(() => {
        const m: Record<string, typeof CleanEdge> = { default: CleanEdge };
        edges.forEach((e) => {
            if (e.type) m[e.type] = CleanEdge;
        });
        return m;
    }, [edges]);

    return (
        <KGraphCanvas
            nodes={renderNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            fitView
            showMiniMap={false}
            showBackground
            className={className}
            style={{ width: '100%', height: '100%', background: '#0e0e10', ...style }}
            onNodeClick={onNodeClick ? (_evt, node) => onNodeClick(node) : undefined}
        />
    );
}
