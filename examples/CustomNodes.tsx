/**
 * Custom Nodes Example
 *
 * Multiple node types with different colors, handles, and data-driven content.
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

const InputNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
    <div style={{
        padding: '12px 20px', borderRadius: 8,
        border: `2px solid ${selected ? '#22c55e' : '#166534'}`,
        background: '#14532d', color: '#fff', minWidth: 150, position: 'relative',
    }}>
        <div style={{ fontSize: 10, color: '#4ade80', marginBottom: 4 }}>INPUT</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{data.label}</div>
        <Handle id="source-4" type="source" position="bottom" style={{ background: '#22c55e', borderColor: '#4ade80' }} />
    </div>
);

const ProcessorNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
    <div style={{
        padding: '12px 20px', borderRadius: 8,
        border: `2px solid ${selected ? '#3b82f6' : '#1e40af'}`,
        background: '#1e3a5f', color: '#fff', minWidth: 180, position: 'relative',
    }}>
        <Handle id="target-1" type="target" position="top" style={{ background: '#3b82f6', borderColor: '#60a5fa' }} />
        <div style={{ fontSize: 10, color: '#60a5fa', marginBottom: 4 }}>PROCESSOR</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{data.label}</div>
        {data.description && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{data.description}</div>}
        <Handle id="source-4" type="source" position="bottom" style={{ background: '#3b82f6', borderColor: '#60a5fa' }} />
        <Handle id="source-3" type="source" position="right" style={{ background: '#3b82f6', borderColor: '#60a5fa' }} />
    </div>
);

const OutputNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
    <div style={{
        padding: '12px 20px', borderRadius: 8,
        border: `2px solid ${selected ? '#f97316' : '#9a3412'}`,
        background: '#431407', color: '#fff', minWidth: 150, position: 'relative',
    }}>
        <Handle id="target-1" type="target" position="top" style={{ background: '#f97316', borderColor: '#fb923c' }} />
        <Handle id="target-2" type="target" position="left" style={{ background: '#f97316', borderColor: '#fb923c' }} />
        <div style={{ fontSize: 10, color: '#fb923c', marginBottom: 4 }}>OUTPUT</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{data.label}</div>
    </div>
);

const nodeTypes = { input: InputNode, processor: ProcessorNode, output: OutputNode };

const palette = [
    { type: 'input', label: 'Input', color: '#22c55e' },
    { type: 'processor', label: 'Processor', color: '#3b82f6' },
    { type: 'output', label: 'Output', color: '#f97316' },
];

const initialNodes: KGraphNode[] = [
    { id: 'src-1', type: 'input', position: { x: 50, y: 50 }, data: { label: 'API Feed' } },
    { id: 'src-2', type: 'input', position: { x: 300, y: 50 }, data: { label: 'File Upload' } },
    { id: 'proc-1', type: 'processor', position: { x: 150, y: 200 }, data: { label: 'Transform', description: 'Normalize & validate' } },
    { id: 'out-1', type: 'output', position: { x: 150, y: 380 }, data: { label: 'Database' } },
    { id: 'out-2', type: 'output', position: { x: 400, y: 250 }, data: { label: 'Log Stream' } },
];

const initialEdges: KGraphEdge[] = [
    { id: 'e1', source: 'src-1', target: 'proc-1', sourceHandle: 'source-4', targetHandle: 'target-1' },
    { id: 'e2', source: 'src-2', target: 'proc-1', sourceHandle: 'source-4', targetHandle: 'target-1' },
    { id: 'e3', source: 'proc-1', target: 'out-1', sourceHandle: 'source-4', targetHandle: 'target-1' },
    { id: 'e4', source: 'proc-1', target: 'out-2', sourceHandle: 'source-3', targetHandle: 'target-2' },
];

export default function CustomNodes() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        const item = JSON.parse(raw);
        setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: item.type, position, data: { label: item.label } }]);
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
                    label: p.label, action: () => setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: p.type, position: { x: e.clientX - 200, y: e.clientY - 50 }, data: { label: p.label } }]),
                })) });
            }
        }}>
            <KGraphCanvas
                nodes={nodes} edges={edges}
                onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
                onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
                onConnect={(conn: KGraphConnection) => setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }])}
                nodeTypes={nodeTypes}
                onDrop={onDrop}
                fitView
            >
                <NodePalette items={palette} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
