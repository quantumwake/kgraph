import React, { useState } from 'react';
import BasicGraph from '../BasicGraph';
import CustomNodes from '../CustomNodes';
import CustomEdges from '../CustomEdges';
import DragAndDrop from '../DragAndDrop';
import ViewportControls from '../ViewportControls';
import InteractiveCallbacks from '../InteractiveCallbacks';
import CanvasOptions from '../CanvasOptions';
import LargeGraph from '../LargeGraph';
import MiniMapOptions from '../MiniMapOptions';

const examples = [
    { id: 'basic', label: 'Basic Graph', component: BasicGraph },
    { id: 'custom-nodes', label: 'Custom Nodes', component: CustomNodes },
    { id: 'custom-edges', label: 'Custom Edges', component: CustomEdges },
    { id: 'drag-drop', label: 'Drag & Drop', component: DragAndDrop },
    { id: 'viewport', label: 'Viewport Controls', component: ViewportControls },
    { id: 'callbacks', label: 'Interactive Callbacks', component: InteractiveCallbacks },
    { id: 'options', label: 'Canvas Options', component: CanvasOptions },
    { id: 'large', label: 'Large Graph', component: LargeGraph },
    { id: 'minimap', label: 'MiniMap & Background', component: MiniMapOptions },
] as const;

function NavButton({ ex, active, onClick }: { ex: typeof examples[number]; active: boolean; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    const isHighlight = active || hovered;

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                fontSize: 13,
                background: active ? '#1e1b4b' : (hovered ? '#1a1a1f' : 'transparent'),
                color: active ? '#c4b5fd' : (hovered ? '#d4d4d8' : '#a1a1aa'),
                border: 'none',
                cursor: 'pointer',
                borderLeft: active ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'all 0.15s ease',
            }}
        >
            {ex.label}
        </button>
    );
}

export default function App() {
    const [active, setActive] = useState(examples[0].id);
    const ActiveComponent = examples.find(e => e.id === active)!.component;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            <nav style={{
                width: 220,
                minWidth: 220,
                background: '#111113',
                borderRight: '1px solid #27272a',
                padding: '16px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                overflow: 'auto',
            }}>
                <div style={{
                    padding: '0 16px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#a78bfa',
                    letterSpacing: '0.02em',
                }}>
                    @quantumwake/kgraph
                </div>
                <div style={{
                    padding: '0 16px 8px',
                    fontSize: 11,
                    color: '#52525b',
                    borderBottom: '1px solid #1e1e22',
                    marginBottom: 4,
                }}>
                    Examples
                </div>
                {examples.map(ex => (
                    <NavButton
                        key={ex.id}
                        ex={ex}
                        active={active === ex.id}
                        onClick={() => setActive(ex.id)}
                    />
                ))}
            </nav>

            <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <ActiveComponent key={active} />
            </main>
        </div>
    );
}
