import React, { useCallback, useState } from 'react';
import { HandleProps, HandlePosition } from './types';
import { useHandleContext } from './NodeRenderer';

// Map position to CSS placement
function getPositionStyle(position: HandlePosition): React.CSSProperties {
    const base: React.CSSProperties = {
        position: 'absolute',
        zIndex: 20,
    };

    switch (position) {
        case 'top':
            return { ...base, top: 0, left: '50%', transform: 'translate(-50%, -50%)' };
        case 'bottom':
            return { ...base, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' };
        case 'left':
            return { ...base, left: 0, top: '50%', transform: 'translate(-50%, -50%)' };
        case 'right':
            return { ...base, right: 0, top: '50%', transform: 'translate(50%, -50%)' };
    }
}

interface KGraphHandleProps extends HandleProps {
    nodeId?: string;
    onConnectionStart?: (nodeId: string, handleId: string, type: 'source' | 'target', e: React.MouseEvent) => void;
}

const Handle: React.FC<KGraphHandleProps> = ({
    id,
    type,
    position,
    style,
    className = '',
    nodeId: nodeIdProp,
    onConnectionStart: onConnectionStartProp,
}) => {
    const [hovered, setHovered] = useState(false);

    // Get nodeId and onConnectionStart from HandleContext if not provided as props
    const handleCtx = useHandleContext();
    const nodeId = nodeIdProp ?? handleCtx.nodeId;
    const onConnectionStart = onConnectionStartProp ?? handleCtx.onConnectionStart;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (type === 'source' && nodeId && onConnectionStart) {
            e.stopPropagation();
            e.preventDefault();
            onConnectionStart(nodeId, id, type, e);
        }
    }, [type, nodeId, id, onConnectionStart]);

    const posStyle = getPositionStyle(position);

    // Default colors — source handles are slightly brighter to signal "drag from here"
    const defaultBg = type === 'source' ? '#8b5cf6' : '#6d28d9';
    const hoverBg = type === 'source' ? '#a78bfa' : '#8b5cf6';
    const borderColor = type === 'source' ? '#a78bfa' : '#7c3aed';

    return (
        <div
            className={`kgraph-handle kgraph-handle-${type} kgraph-handle-${position} ${className}`}
            style={{
                width: hovered ? 12 : 8,
                height: hovered ? 12 : 8,
                borderRadius: '50%',
                background: style?.background as string || (hovered ? hoverBg : defaultBg),
                border: `2px solid ${style?.borderColor as string || borderColor}`,
                cursor: type === 'source' ? 'crosshair' : 'default',
                transition: 'width 0.15s, height 0.15s, background 0.15s, box-shadow 0.15s',
                boxShadow: hovered ? `0 0 6px ${borderColor}88` : 'none',
                ...posStyle,
                ...style,
            }}
            data-handleid={id}
            data-handletype={type}
            data-handleposition={position}
            data-nodeid={nodeId}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        />
    );
};

export default Handle;
