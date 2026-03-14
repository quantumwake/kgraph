import React, { useState } from 'react';

export interface PaletteItem {
    type: string;
    label: string;
    color: string;
}

interface NodePaletteProps {
    items: PaletteItem[];
}

function PaletteEntry({ item, onDragStart }: { item: PaletteItem; onDragStart: (e: React.DragEvent) => void }) {
    const [hovered, setHovered] = useState(false);
    const [dragging, setDragging] = useState(false);

    return (
        <div
            draggable
            onDragStart={(e) => { setDragging(true); onDragStart(e); }}
            onDragEnd={() => setDragging(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '6px 12px',
                borderRadius: 5,
                border: `1px solid ${hovered ? item.color + '88' : item.color + '33'}`,
                background: hovered ? `${item.color}22` : `${item.color}0a`,
                color: hovered ? item.color : `${item.color}cc`,
                fontSize: 12,
                cursor: dragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                transition: 'all 0.15s ease',
                transform: hovered ? 'translateX(2px)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: item.color,
                opacity: hovered ? 1 : 0.5,
                transition: 'opacity 0.15s',
                flexShrink: 0,
            }} />
            {item.label}
        </div>
    );
}

const NodePalette: React.FC<NodePaletteProps> = ({ items }) => {
    const onDragStart = (e: React.DragEvent, item: PaletteItem) => {
        e.dataTransfer.setData('application/kgraph-node', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 50,
            background: '#111113ee',
            border: '1px solid #27272a',
            borderRadius: 8,
            padding: '10px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            backdropFilter: 'blur(8px)',
            minWidth: 130,
        }}>
            <div style={{
                fontSize: 10,
                color: '#52525b',
                marginBottom: 2,
                padding: '0 4px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
            }}>
                Drag to canvas
            </div>
            {items.map((item, i) => (
                <PaletteEntry
                    key={i}
                    item={item}
                    onDragStart={(e) => onDragStart(e, item)}
                />
            ))}
        </div>
    );
};

export default NodePalette;
