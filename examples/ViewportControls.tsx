/**
 * Viewport Controls Example
 *
 * Programmatic viewport manipulation via useKGraph() hook.
 */
import React, { useState, useCallback } from 'react';
import {
    KGraphCanvas,
    Handle,
    useKGraph,
    applyNodeChanges,
    applyEdgeChanges,
} from '@quantumwake/kgraph';
import type { KGraphNode, KGraphEdge, KGraphConnection, NodeComponentProps } from '@quantumwake/kgraph';
import NodePalette from './src/NodePalette';
import ContextMenu, { ContextMenuState } from './src/ContextMenu';

const SimpleNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
    <div style={{
        padding: '10px 20px', borderRadius: 6,
        border: `2px solid ${selected ? '#a78bfa' : '#4c1d95'}`,
        background: '#1e1b4b', color: '#e2e8f0', fontSize: 14, position: 'relative',
    }}>
        <Handle id="target-1" type="target" position="top" />
        {data.label}
        <Handle id="source-4" type="source" position="bottom" />
    </div>
);

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            style={{
                padding: '6px 12px', borderRadius: 4,
                border: `1px solid ${hovered ? '#475569' : '#334155'}`,
                background: hovered ? '#334155' : '#1e293b',
                color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
                transition: 'all 0.12s',
            }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {label}
        </button>
    );
}

function Toolbar() {
    const { fitView, zoomIn, zoomOut, zoomTo, getViewport } = useKGraph();
    const [info, setInfo] = useState('');
    return (
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: 6, background: '#0f172aee', border: '1px solid #1e293b', borderRadius: 8, padding: 8, alignItems: 'center', backdropFilter: 'blur(8px)' }}>
            <ToolbarButton label="Zoom +" onClick={() => zoomIn()} />
            <ToolbarButton label="Zoom -" onClick={() => zoomOut()} />
            <ToolbarButton label="100%" onClick={() => zoomTo(1)} />
            <ToolbarButton label="Fit" onClick={() => fitView({ padding: 0.15 })} />
            <ToolbarButton label="Get Viewport" onClick={() => { const v = getViewport(); setInfo(`x=${v.x.toFixed(0)} y=${v.y.toFixed(0)} zoom=${v.zoom.toFixed(2)}`); }} />
            {info && <span style={{ fontSize: 11, color: '#94a3b8' }}>{info}</span>}
        </div>
    );
}

const palette = [{ type: 'simple', label: 'Node', color: '#a78bfa' }];

const initialNodes: KGraphNode[] = Array.from({ length: 12 }, (_, i) => ({
    id: `n${i}`, type: 'simple',
    position: { x: (i % 4) * 200 + 50, y: Math.floor(i / 4) * 160 + 50 },
    data: { label: `Node ${i + 1}` },
}));

const initialEdges: KGraphEdge[] = Array.from({ length: 8 }, (_, i) => ({
    id: `e${i}`, source: `n${i}`, target: `n${i + 4}`,
}));

export default function ViewportControls() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'simple', position, data: { label: `Node ${prev.length + 1}` } }]);
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
                    { label: 'Node', action: () => setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'simple', position: { x: e.clientX - 200, y: e.clientY - 50 }, data: { label: `Node ${prev.length + 1}` } }]) },
                ]});
            }
        }}>
            <KGraphCanvas
                nodes={nodes} edges={edges}
                onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
                onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
                onConnect={(conn: KGraphConnection) => setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }])}
                nodeTypes={{ simple: SimpleNode }}
                onDrop={onDrop}
                fitView
            >
                <Toolbar />
                <NodePalette items={palette} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
