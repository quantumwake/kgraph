/**
 * MiniMap & Background Example
 *
 * Category-colored pipeline with minimap navigation, drag & drop, and context menus.
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

const colors: Record<string, string> = { source: '#22c55e', transform: '#3b82f6', sink: '#ef4444' };

const CategoryNode: React.FC<NodeComponentProps> = ({ data, selected }) => {
    const color = colors[data.category] || '#8b5cf6';
    return (
        <div style={{
            padding: '10px 18px', borderRadius: 6,
            border: `2px solid ${selected ? color : color + '66'}`,
            background: `${color}15`, color: '#e2e8f0', fontSize: 13, position: 'relative',
        }}>
            <Handle id="target-1" type="target" position="top" style={{ background: color, borderColor: color }} />
            <div style={{ fontSize: 10, color, marginBottom: 2 }}>{data.category}</div>
            {data.label}
            <Handle id="source-4" type="source" position="bottom" style={{ background: color, borderColor: color }} />
        </div>
    );
};

const palette = [
    { type: 'cat', label: 'Source', color: '#22c55e' },
    { type: 'cat', label: 'Transform', color: '#3b82f6' },
    { type: 'cat', label: 'Sink', color: '#ef4444' },
];
const catMap: Record<string, string> = { Source: 'source', Transform: 'transform', Sink: 'sink' };

const initialNodes: KGraphNode[] = [
    { id: 's1', type: 'cat', position: { x: 0, y: 0 }, data: { label: 'API', category: 'source' } },
    { id: 's2', type: 'cat', position: { x: 250, y: 0 }, data: { label: 'Files', category: 'source' } },
    { id: 't1', type: 'cat', position: { x: 50, y: 180 }, data: { label: 'Parse', category: 'transform' } },
    { id: 't2', type: 'cat', position: { x: 300, y: 180 }, data: { label: 'Enrich', category: 'transform' } },
    { id: 't3', type: 'cat', position: { x: 180, y: 340 }, data: { label: 'Merge', category: 'transform' } },
    { id: 'k1', type: 'cat', position: { x: 50, y: 500 }, data: { label: 'Database', category: 'sink' } },
    { id: 'k2', type: 'cat', position: { x: 320, y: 500 }, data: { label: 'Webhook', category: 'sink' } },
];

const initialEdges: KGraphEdge[] = [
    { id: 'e1', source: 's1', target: 't1' },
    { id: 'e2', source: 's2', target: 't2' },
    { id: 'e3', source: 't1', target: 't3' },
    { id: 'e4', source: 't2', target: 't3' },
    { id: 'e5', source: 't3', target: 'k1' },
    { id: 'e6', source: 't3', target: 'k2' },
];

export default function MiniMapOptions() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        const item = JSON.parse(raw);
        setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'cat', position, data: { label: item.label, category: catMap[item.label] || 'transform' } }]);
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
                    { label: 'Change Category', icon: '🏷️', action: () => {
                        const cat = prompt('Category (source/transform/sink):', node.data.category);
                        if (cat && ['source', 'transform', 'sink'].includes(cat)) setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, category: cat } } : n));
                    }},
                    { label: 'Duplicate', icon: '📋', action: () => setNodes(prev => [...prev, { ...node, id: `n-${Date.now()}`, position: { x: node.position.x + 32, y: node.position.y + 32 }, selected: false }]) },
                    { label: '', action: () => {}, separator: true },
                    { label: 'Delete', icon: '🗑', danger: true, action: () => { setNodes(prev => prev.filter(n => n.id !== node.id)); setEdges(prev => prev.filter(ed => ed.source !== node.id && ed.target !== node.id)); }},
                ]});
            } else {
                setMenu({ x: e.clientX, y: e.clientY, title: 'Add Node', items: palette.map(p => ({
                    label: p.label, action: () => setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'cat', position: { x: e.clientX - 200, y: e.clientY - 50 }, data: { label: p.label, category: catMap[p.label] || 'transform' } }]),
                })) });
            }
        }}>
            <KGraphCanvas
                nodes={nodes} edges={edges}
                onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
                onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
                onConnect={(conn: KGraphConnection) => setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }])}
                nodeTypes={{ cat: CategoryNode }}
                onDrop={onDrop}
                fitView
                showMiniMap
                showBackground
                backgroundGap={24}
            >
                <NodePalette items={palette} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
