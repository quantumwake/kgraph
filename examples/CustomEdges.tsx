/**
 * Custom Edges Example
 *
 * Labeled, animated, and success edge styles with arrow markers.
 */
import React, { useState, useCallback } from 'react';
import {
    KGraphCanvas,
    Handle,
    EdgeLabel,
    getBezierPath,
    useKGraph,
    applyNodeChanges,
    applyEdgeChanges,
} from '@quantumwake/kgraph';
import type { KGraphNode, KGraphEdge, KGraphConnection, NodeComponentProps, EdgeComponentProps } from '@quantumwake/kgraph';
import NodePalette from './src/NodePalette';
import ContextMenu, { ContextMenuState } from './src/ContextMenu';

const LabeledEdge: React.FC<EdgeComponentProps> = ({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected,
}) => {
    const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const { getViewport } = useKGraph();
    return (
        <g>
            <path d={path} fill="none" stroke="transparent" strokeWidth={20} />
            <path d={path} fill="none" stroke={selected ? '#60a5fa' : '#475569'} strokeWidth={selected ? 2.5 : 1.5} markerEnd={selected ? 'url(#kgraph-arrow-selected)' : 'url(#kgraph-arrow)'} />
            <foreignObject x={0} y={0} width={1} height={1} overflow="visible">
                <EdgeLabel x={labelX} y={labelY} zoom={getViewport().zoom}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>transforms</div>
                </EdgeLabel>
            </foreignObject>
        </g>
    );
};

const AnimatedEdge: React.FC<EdgeComponentProps> = ({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected,
}) => {
    const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    return (
        <g>
            <path d={path} fill="none" stroke="transparent" strokeWidth={20} />
            <path d={path} fill="none" stroke={selected ? '#a78bfa' : '#7c3aed'} strokeWidth={2} strokeDasharray="8 4" markerEnd={selected ? 'url(#kgraph-arrow-selected)' : 'url(#kgraph-arrow)'}>
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
            </path>
        </g>
    );
};

const SuccessEdge: React.FC<EdgeComponentProps> = ({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected,
}) => {
    const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    return (
        <g>
            <path d={path} fill="none" stroke="transparent" strokeWidth={20} />
            <path d={path} fill="none" stroke={selected ? '#4ade80' : '#22c55e'} strokeWidth={selected ? 3 : 2} markerEnd={selected ? 'url(#kgraph-arrow-selected)' : 'url(#kgraph-arrow)'} />
        </g>
    );
};

const edgeTypes = { labeled: LabeledEdge, animated: AnimatedEdge, success: SuccessEdge };

const SimpleNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
    <div style={{
        padding: '10px 20px', borderRadius: 6,
        border: `2px solid ${selected ? '#60a5fa' : '#334155'}`,
        background: '#1e293b', color: '#e2e8f0', fontSize: 14, position: 'relative',
    }}>
        <Handle id="target-1" type="target" position="top" />
        {data.label}
        <Handle id="source-4" type="source" position="bottom" />
    </div>
);

const palette = [{ type: 'simple', label: 'Node', color: '#60a5fa' }];

const initialNodes: KGraphNode[] = [
    { id: 'a', type: 'simple', position: { x: 100, y: 50 }, data: { label: 'Source' } },
    { id: 'b', type: 'simple', position: { x: 0, y: 200 }, data: { label: 'Transform' } },
    { id: 'c', type: 'simple', position: { x: 200, y: 200 }, data: { label: 'Validate' } },
    { id: 'd', type: 'simple', position: { x: 100, y: 380 }, data: { label: 'Output' } },
];

const initialEdges: KGraphEdge[] = [
    { id: 'e-ab', source: 'a', target: 'b', type: 'labeled' },
    { id: 'e-ac', source: 'a', target: 'c', type: 'animated' },
    { id: 'e-bd', source: 'b', target: 'd', type: 'success' },
    { id: 'e-cd', source: 'c', target: 'd', type: 'success' },
];

export default function CustomEdges() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'simple', position, data: { label: 'New Node' } }]);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%' }} onContextMenu={e => {
            const wrapper = (e.target as HTMLElement).closest('.kgraph-node-wrapper');
            e.preventDefault();
            if (wrapper) {
                const nodeId = wrapper.querySelector('[data-nodeid]')?.getAttribute('data-nodeid');
                const node = nodes.find(n => n.id === nodeId);
                if (node) setMenu({ x: e.clientX, y: e.clientY, title: node.data.label, items: [
                    { label: 'Edit Label', icon: '✏️', action: () => { const name = prompt('Label:', node.data.label); if (name) setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: name } } : n)); }},
                    { label: 'Duplicate', icon: '📋', action: () => setNodes(prev => [...prev, { ...node, id: `n-${Date.now()}`, position: { x: node.position.x + 32, y: node.position.y + 32 }, selected: false }]) },
                    { label: '', action: () => {}, separator: true },
                    { label: 'Delete', icon: '🗑', danger: true, action: () => { setNodes(prev => prev.filter(n => n.id !== node.id)); setEdges(prev => prev.filter(ed => ed.source !== node.id && ed.target !== node.id)); }},
                ]});
            } else {
                setMenu({ x: e.clientX, y: e.clientY, title: 'Add Node', items: [
                    { label: 'Node', action: () => setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'simple', position: { x: e.clientX - 200, y: e.clientY - 50 }, data: { label: 'New Node' } }]) },
                ]});
            }
        }}>
            <KGraphCanvas
                nodes={nodes} edges={edges}
                onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
                onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
                onConnect={(conn: KGraphConnection) => setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }])}
                nodeTypes={{ simple: SimpleNode }}
                edgeTypes={edgeTypes}
                onDrop={onDrop}
                fitView
            >
                <NodePalette items={palette} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
