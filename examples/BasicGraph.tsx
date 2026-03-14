/**
 * Basic Graph Example
 *
 * Simplest KGraph usage: nodes, edges, drag & drop, and context menus.
 */
import React, { useState, useCallback } from 'react';
import {
    KGraphCanvas,
    Handle,
    applyNodeChanges,
    applyEdgeChanges,
} from '@quantumwake/kgraph';
import type { KGraphNode, KGraphEdge, KGraphConnection, NodeComponentProps } from '@quantumwake/kgraph';
import NodePalette from './src/NodePalette';
import ContextMenu, { ContextMenuState } from './src/ContextMenu';

const BasicNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
    <div style={{
        padding: '10px 20px', borderRadius: 6,
        border: `2px solid ${selected ? '#a78bfa' : '#4c1d95'}`,
        background: '#1e1b4b', color: '#e2e8f0', fontSize: 14,
        position: 'relative', minWidth: 120,
    }}>
        <Handle id="target-1" type="target" position="top" />
        {data.label}
        <Handle id="source-4" type="source" position="bottom" />
    </div>
);

const palette = [
    { type: 'basic', label: 'Start', color: '#22c55e' },
    { type: 'basic', label: 'Process', color: '#3b82f6' },
    { type: 'basic', label: 'End', color: '#ef4444' },
];

const initialNodes: KGraphNode[] = [
    { id: '1', type: 'basic', position: { x: 100, y: 50 }, data: { label: 'Start' } },
    { id: '2', type: 'basic', position: { x: 100, y: 200 }, data: { label: 'Process' } },
    { id: '3', type: 'basic', position: { x: 100, y: 350 }, data: { label: 'End' } },
];

const initialEdges: KGraphEdge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
];

export default function BasicGraph() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        const item = JSON.parse(raw);
        setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'basic', position, data: { label: item.label } }]);
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
                setMenu({ x: e.clientX, y: e.clientY, title: 'Add Node', items: palette.map(p => ({
                    label: p.label, action: () => setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'basic', position: { x: e.clientX - 200, y: e.clientY - 50 }, data: { label: p.label } }]),
                })) });
            }
        }}>
            <KGraphCanvas
                nodes={nodes} edges={edges}
                onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
                onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
                onConnect={(conn: KGraphConnection) => setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }])}
                nodeTypes={{ basic: BasicNode }}
                onDrop={onDrop}
                fitView
            >
                <NodePalette items={palette} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
