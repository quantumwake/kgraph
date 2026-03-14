/**
 * Canvas Options Example
 *
 * Runtime toggle of all canvas configuration options, with drag & drop and context menus.
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

interface Options {
    snapToGrid: boolean; showMiniMap: boolean; showBackground: boolean;
    panOnDrag: boolean; zoomOnScroll: boolean; nodesDraggable: boolean;
    nodesConnectable: boolean; elementsSelectable: boolean;
}

function OptionToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <label
            style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                color: hovered ? '#d4d4d8' : '#94a3b8',
                cursor: 'pointer', padding: '2px 0',
                transition: 'color 0.12s',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#7c3aed' }} />
            {label}
        </label>
    );
}

function OptionsPanel({ options, onChange }: { options: Options; onChange: (o: Options) => void }) {
    const toggle = (key: keyof Options) => onChange({ ...options, [key]: !options[key] });
    return (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 50, background: '#111113ee', border: '1px solid #27272a', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 10, color: '#52525b', marginBottom: 2, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Canvas Options</div>
            {(Object.keys(options) as (keyof Options)[]).map(key => (
                <OptionToggle key={key} label={key} checked={options[key]} onChange={() => toggle(key)} />
            ))}
        </div>
    );
}

const palette = [{ type: 'simple', label: 'Node', color: '#a78bfa' }];

const initialNodes: KGraphNode[] = [
    { id: '1', type: 'simple', position: { x: 50, y: 50 }, data: { label: 'Node A' } },
    { id: '2', type: 'simple', position: { x: 250, y: 50 }, data: { label: 'Node B' } },
    { id: '3', type: 'simple', position: { x: 150, y: 200 }, data: { label: 'Node C' } },
    { id: '4', type: 'simple', position: { x: 150, y: 350 }, data: { label: 'Node D' } },
];

const initialEdges: KGraphEdge[] = [
    { id: 'e1', source: '1', target: '3' },
    { id: 'e2', source: '2', target: '3' },
    { id: 'e3', source: '3', target: '4' },
];

export default function CanvasOptions() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);
    const [options, setOptions] = useState<Options>({
        snapToGrid: true, showMiniMap: true, showBackground: true,
        panOnDrag: true, zoomOnScroll: true, nodesDraggable: true,
        nodesConnectable: true, elementsSelectable: true,
    });

    const onDrop = useCallback((e: React.DragEvent, position: { x: number; y: number }) => {
        const raw = e.dataTransfer.getData('application/kgraph-node');
        if (!raw) return;
        setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'simple', position, data: { label: `Node ${String.fromCharCode(65 + prev.length)}` } }]);
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
                    { label: 'Node', action: () => setNodes(prev => [...prev, { id: `n-${Date.now()}`, type: 'simple', position: { x: e.clientX - 200, y: e.clientY - 50 }, data: { label: `Node ${String.fromCharCode(65 + prev.length)}` } }]) },
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
                {...options}
            >
                <NodePalette items={palette} />
                <OptionsPanel options={options} onChange={setOptions} />
            </KGraphCanvas>
            <ContextMenu menu={menu} onClose={() => setMenu(null)} />
        </div>
    );
}
