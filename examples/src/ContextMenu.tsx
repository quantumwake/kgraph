import React, { useEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
    label: string;
    action: () => void;
    danger?: boolean;
    icon?: string;
    separator?: boolean;
}

export interface ContextMenuState {
    x: number;
    y: number;
    items: ContextMenuItem[];
    title?: string;
}

interface ContextMenuProps {
    menu: ContextMenuState | null;
    onClose: () => void;
}

function MenuItem({ item, onClose }: { item: ContextMenuItem; onClose: () => void }) {
    const [hovered, setHovered] = useState(false);

    if (item.separator) {
        return <div style={{ height: 1, background: '#27272a', margin: '4px 8px' }} />;
    }

    return (
        <button
            onClick={() => { item.action(); onClose(); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                textAlign: 'left',
                padding: '7px 12px',
                fontSize: 13,
                color: item.danger
                    ? (hovered ? '#fca5a5' : '#f87171')
                    : (hovered ? '#f4f4f5' : '#d4d4d8'),
                background: hovered
                    ? (item.danger ? '#371520' : '#27272a')
                    : 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 4,
                margin: '0 4px',
                transition: 'background 0.12s, color 0.12s',
                lineHeight: 1.4,
            }}
        >
            {item.icon && <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>}
            {item.label}
        </button>
    );
}

const ContextMenu: React.FC<ContextMenuProps> = ({ menu, onClose }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menu) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('mousedown', handleClick);
        window.addEventListener('keydown', handleKey);
        return () => {
            window.removeEventListener('mousedown', handleClick);
            window.removeEventListener('keydown', handleKey);
        };
    }, [menu, onClose]);

    if (!menu) return null;

    // Keep menu within viewport
    const x = Math.min(menu.x, window.innerWidth - 200);
    const y = Math.min(menu.y, window.innerHeight - (menu.items.length * 34 + 40));

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                left: x,
                top: y,
                zIndex: 100,
                background: '#18181b',
                border: '1px solid #303033',
                borderRadius: 8,
                padding: '4px 0',
                minWidth: 180,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
                backdropFilter: 'blur(8px)',
                animation: 'kgraph-ctx-fadein 0.1s ease-out',
            }}
        >
            {menu.title && (
                <div style={{
                    padding: '6px 16px 4px',
                    fontSize: 11,
                    color: '#52525b',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    borderBottom: '1px solid #27272a',
                    marginBottom: 4,
                }}>
                    {menu.title}
                </div>
            )}
            {menu.items.map((item, i) => (
                <MenuItem key={i} item={item} onClose={onClose} />
            ))}
            <style>{`
                @keyframes kgraph-ctx-fadein {
                    from { opacity: 0; transform: scale(0.95) translateY(-4px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ContextMenu;
