import React from 'react';

interface EdgeLabelProps {
    x: number;
    y: number;
    zoom: number;
    children: React.ReactNode;
}

/**
 * EdgeLabel renders children as an HTML overlay at the given canvas coordinates.
 * Replaces ReactFlow's EdgeLabelRenderer.
 * The content is scaled inversely to the zoom level so it stays a consistent screen size.
 */
const EdgeLabel: React.FC<EdgeLabelProps> = ({ x, y, zoom, children }) => {
    return (
        <div
            className="kgraph-edge-label"
            style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                transformOrigin: 'center center',
                pointerEvents: 'all',
                zIndex: 10,
            }}
        >
            {children}
        </div>
    );
};

export default EdgeLabel;
