/**
 * Drag & Drop Example
 *
 * Node palette with drag-to-canvas, context menus, and directed arrows.
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

const TaskNode: React.FC<NodeComponentProps> = ({ data, selected }) => {
    const colors: Record<string, string> = { source: '#22c55e', transform: '#3b82f6', filter: '#f59e0b', output: '#ef4444' };
    const color = colors[data.category] || '#8b5cf6';
    return (
        <div style={{
            padding: '10px 16px', borderRadius: 6,
            border: `2px solid ${selected ? color : color + '66'}`,
            background: `${color}15`, color: '#e2e8f0', fontSize: 13, minWidth: 140, position: 'relative',
        }}>
            <Handle id="target-1" type="target" position="top" style={{ background: color, borderColor: color }} />
            <div style={{ fontSize: 10, color, marginBottom: 2 }}>{data.category?.toUpperCase()}</div>
            <div>{data.label}</div>
            <Handle id="source-4" type="source" position="bottom" style={{ background: color, borderColor: color }} />
        </div>
    );
};

const palette = [
    { type: 'task', label: 'Data Source', color: '#22c55e' },
    { type: 'task', label: 'Transform', color: '#3b82f6' },
    { type: 'task', label: 'Filter', color: '#f59e0b' },
    { type: 'task', label: 'Output', color: '#ef4444' },
];

const categoryMap: Record<string, string> = { 'Data Source': 'source', 'Transform': 'transform', 'Filter': 'filter', 'Output': 'output' };

export default function DragAndDrop() {
    const [nodes, setNodes] = useState<KGraphNode[]>([]);
    const [edges, setEdges] = useState<KGraphEdge[]>([]);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        const item = JSON.parse(raw);
        setNodes(prev => [...prev, {
            id: `n-${Date.now()}`, type: 'task', position,
            data: { label: item.label, category: categoryMap[item.label] || 'source' },
        }]);
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
                    label: p.label, action: () => setNodes(prev => [...prev, {
                        id: `n-${Date.now()}`, type: 'task',
                        position: { x: e.clientX - 200, y: e.clientY - 50 },
                        data: { label: p.label, category: categoryMap[p.label] || 'source' },
                    }]),
                })) });
            }
        }}>
            <KGraphCanvas
                nodes={nodes} edges={edges}
                onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
                onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
                onConnect={(conn: KGraphConnection) => setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }])}
                nodeTypes={{ task: TaskNode }}
                onDrop={onDrop}
                showMiniMap={false}
            >
                <NodePalette items={palette} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
