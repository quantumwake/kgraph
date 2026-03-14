/**
 * Interactive Callbacks Example
 *
 * Event log panel showing all callbacks in real time, with drag & drop and context menus.
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

const ColorNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
    <div style={{
        padding: '10px 20px', borderRadius: 8,
        border: `2px solid ${selected ? data.color : data.color + '66'}`,
        background: data.color + '22', color: '#e2e8f0', fontSize: 14, position: 'relative',
    }}>
        <Handle id="target-1" type="target" position="top" style={{ background: data.color, borderColor: data.color }} />
        {data.label}
        <Handle id="source-4" type="source" position="bottom" style={{ background: data.color, borderColor: data.color }} />
        <Handle id="source-3" type="source" position="right" style={{ background: data.color, borderColor: data.color }} />
    </div>
);

function EventLog({ events }: { events: string[] }) {
    return (
        <div style={{
            position: 'absolute', bottom: 10, left: 10, zIndex: 50, width: 300, maxHeight: 220, overflow: 'auto',
            background: '#0f172aee', border: '1px solid #1e293b', borderRadius: 8, padding: 10, fontSize: 11, fontFamily: 'monospace',
            backdropFilter: 'blur(8px)',
        }}>
            <div style={{ color: '#64748b', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>Event Log</div>
            {events.length === 0 && <div style={{ color: '#475569' }}>Interact with the graph...</div>}
            {events.map((event, i) => <div key={i} style={{ color: '#94a3b8', padding: '2px 0', borderBottom: '1px solid #1e293b22' }}>{event}</div>)}
        </div>
    );
}

const palette = [
    { type: 'color', label: 'Blue', color: '#3b82f6' },
    { type: 'color', label: 'Green', color: '#22c55e' },
    { type: 'color', label: 'Orange', color: '#f59e0b' },
    { type: 'color', label: 'Red', color: '#ef4444' },
];

const initialNodes: KGraphNode[] = [
    { id: 'a', type: 'color', position: { x: 100, y: 50 }, data: { label: 'Alpha', color: '#3b82f6' } },
    { id: 'b', type: 'color', position: { x: 0, y: 200 }, data: { label: 'Beta', color: '#22c55e' } },
    { id: 'c', type: 'color', position: { x: 250, y: 200 }, data: { label: 'Gamma', color: '#f59e0b' } },
    { id: 'd', type: 'color', position: { x: 100, y: 380 }, data: { label: 'Delta', color: '#ef4444' } },
];

const initialEdges: KGraphEdge[] = [
    { id: 'e1', source: 'a', target: 'b' },
    { id: 'e2', source: 'a', target: 'c', sourceHandle: 'source-3' },
    { id: 'e3', source: 'b', target: 'd' },
];

export default function InteractiveCallbacks() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [events, setEvents] = useState<string[]>([]);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const log = useCallback((msg: string) => {
        setEvents(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()} ${msg}`]);
    }, []);

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        const item = JSON.parse(raw);
        const node = { id: `n-${Date.now()}`, type: 'color', position, data: { label: item.label, color: item.color } };
        setNodes(prev => [...prev, node]);
        log(`Dropped: ${item.label}`);
    }, [log]);

    return (
        <div style={{ width: '100%', height: '100%' }} onContextMenu={e => {
            const wrapper = (e.target as HTMLElement).closest('.kgraph-node-wrapper');
            e.preventDefault();
            if (wrapper) {
                const nodeId = wrapper.querySelector('[data-nodeid]')?.getAttribute('data-nodeid');
                const node = nodes.find(n => n.id === nodeId);
                if (node) setMenu({ x: e.clientX, y: e.clientY, title: node.data.label, items: [
                    { label: 'Edit Label', icon: '✏️', action: () => { const name = prompt('Label:', node.data.label); if (name) { setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: name } } : n)); log(`Renamed → ${name}`); }}},
                    { label: 'Duplicate', icon: '📋', action: () => { setNodes(prev => [...prev, { ...node, id: `n-${Date.now()}`, position: { x: node.position.x + 32, y: node.position.y + 32 }, selected: false }]); log(`Duplicated: ${node.data.label}`); }},
                    { label: '', action: () => {}, separator: true },
                    { label: 'Delete', icon: '🗑', danger: true, action: () => { log(`Deleted: ${node.data.label}`); setNodes(prev => prev.filter(n => n.id !== node.id)); setEdges(prev => prev.filter(ed => ed.source !== node.id && ed.target !== node.id)); }},
                ]});
            } else {
                setMenu({ x: e.clientX, y: e.clientY, title: 'Add Node', items: palette.map(p => ({
                    label: p.label, action: () => { const n = { id: `n-${Date.now()}`, type: 'color', position: { x: e.clientX - 200, y: e.clientY - 50 }, data: { label: p.label, color: p.color } }; setNodes(prev => [...prev, n]); log(`Added: ${p.label}`); },
                })) });
            }
        }}>
            <KGraphCanvas
                nodes={nodes} edges={edges}
                onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
                onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
                onNodeClick={(_, node) => log(`Node clicked: ${node.data.label}`)}
                onEdgeClick={(_, edge) => log(`Edge clicked: ${edge.id}`)}
                onPaneClick={() => log('Pane clicked')}
                onConnect={(conn: KGraphConnection) => { log(`Connected: ${conn.source} → ${conn.target}`); setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }]); }}
                nodeTypes={{ color: ColorNode }}
                onDrop={onDrop}
                fitView
            >
                <NodePalette items={palette} />
                <EventLog events={events} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
