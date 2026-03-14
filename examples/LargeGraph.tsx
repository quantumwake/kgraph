/**
 * Large Graph Example
 *
 * Procedurally generated grid for performance testing, with drag & drop and context menus.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
    KGraphCanvas,
    Handle,
    applyNodeChanges,
    applyEdgeChanges,
} from '@quantumwake/kgraph';
import type { KGraphNode, KGraphEdge, KGraphConnection, NodeComponentProps } from '@quantumwake/kgraph';
import NodePalette from './src/NodePalette';
import ContextMenu, { ContextMenuState } from './src/ContextMenu';

const CompactNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
    <div style={{
        padding: '6px 12px', borderRadius: 4,
        border: `1px solid ${selected ? '#60a5fa' : '#334155'}`,
        background: '#1e293b', color: '#cbd5e1', fontSize: 11, position: 'relative', minWidth: 80, textAlign: 'center',
    }}>
        <Handle id="target-1" type="target" position="top" />
        {data.label}
        <Handle id="source-4" type="source" position="bottom" />
    </div>
);

function generateGraph(rows: number, cols: number) {
    const nodes: KGraphNode[] = [];
    const edges: KGraphEdge[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const id = `n-${r}-${c}`;
            nodes.push({ id, type: 'compact', position: { x: c * 160, y: r * 100 }, data: { label: `${r},${c}` } });
            if (r > 0) edges.push({ id: `e-${r}-${c}-up`, source: `n-${r - 1}-${c}`, target: id });
            if (c > 0 && r % 2 === 0) edges.push({ id: `e-${r}-${c}-left`, source: `n-${r}-${c - 1}`, target: id });
        }
    }
    return { nodes, edges };
}

const palette = [{ type: 'compact', label: 'Node', color: '#60a5fa' }];

export default function LargeGraph() {
    const { nodes: init, edges: initEdges } = useMemo(() => generateGraph(10, 8), []);
    const [nodes, setNodes] = useState(init);
    const [edges, setEdges] = useState(initEdges);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'compact', position, data: { label: 'new' } }]);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%' }} onContextMenu={e => {
            const wrapper = (e.target as HTMLElement).closest('.kgraph-node-wrapper');
            e.preventDefault();
            if (wrapper) {
                const nodeId = wrapper.querySelector('[data-nodeid]')?.getAttribute('data-nodeid');
                const node = nodes.find(n => n.id === nodeId);
                if (node) setMenu({ x: e.clientX, y: e.clientY, title: `Node ${node.data.label}`, items: [
                    { label: 'Edit', icon: '✏️', action: () => { const name = prompt('Label:', node.data.label); if (name) setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: name } } : n)); }},
                    { label: '', action: () => {}, separator: true },
                    { label: 'Delete', icon: '🗑', danger: true, action: () => { setNodes(prev => prev.filter(n => n.id !== node.id)); setEdges(prev => prev.filter(ed => ed.source !== node.id && ed.target !== node.id)); }},
                ]});
            } else {
                setMenu({ x: e.clientX, y: e.clientY, title: 'Add Node', items: [
                    { label: 'Node', action: () => setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'compact', position: { x: e.clientX - 200, y: e.clientY - 50 }, data: { label: 'new' } }]) },
                ]});
            }
        }}>
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#0f172aee', border: '1px solid #1e293b', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: '#94a3b8', backdropFilter: 'blur(8px)' }}>
                {nodes.length} nodes, {edges.length} edges
            </div>
            <KGraphCanvas
                nodes={nodes} edges={edges}
                onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
                onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
                onConnect={(conn: KGraphConnection) => setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }])}
                nodeTypes={{ compact: CompactNode }}
                onDrop={onDrop}
                fitView
                snapToGrid={false}
            >
                <NodePalette items={palette} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
