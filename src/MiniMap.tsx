import React, { useRef, useCallback, useMemo } from 'react';
import { KGraphNode, KGraphViewport } from './types';

interface MiniMapProps {
    nodes: KGraphNode[];
    viewport: KGraphViewport;
    width?: number;
    height?: number;
    nodeColor?: string | ((node: KGraphNode) => string);
    maskColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    onViewportChange?: (viewport: KGraphViewport) => void;
    containerWidth: number;
    containerHeight: number;
}

const MiniMap: React.FC<MiniMapProps> = ({
    nodes,
    viewport,
    width = 200,
    height = 150,
    nodeColor = '#60a5fa',
    maskColor = 'rgba(14, 14, 16, 0.9)',
    backgroundColor = '#161618',
    borderColor = '#333338',
    onViewportChange,
    containerWidth,
    containerHeight,
}) => {
    const miniMapRef = useRef<SVGSVGElement>(null);

    // Compute graph bounds
    const bounds = useMemo(() => {
        if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const node of nodes) {
            const w = node.width || 200;
            const h = node.height || 100;
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + w);
            maxY = Math.max(maxY, node.position.y + h);
        }

        // Add padding
        const padX = (maxX - minX) * 0.2;
        const padY = (maxY - minY) * 0.2;
        return {
            minX: minX - padX,
            minY: minY - padY,
            maxX: maxX + padX,
            maxY: maxY + padY,
        };
    }, [nodes]);

    const graphW = bounds.maxX - bounds.minX;
    const graphH = bounds.maxY - bounds.minY;
    const scale = Math.min(width / graphW, height / graphH);

    // Viewport rectangle in minimap space
    const viewRect = useMemo(() => {
        const vx = (-viewport.x / viewport.zoom - bounds.minX) * scale;
        const vy = (-viewport.y / viewport.zoom - bounds.minY) * scale;
        const vw = (containerWidth / viewport.zoom) * scale;
        const vh = (containerHeight / viewport.zoom) * scale;
        return { x: vx, y: vy, width: vw, height: vh };
    }, [viewport, bounds, scale, containerWidth, containerHeight]);

    const getColor = useCallback((node: KGraphNode) => {
        if (typeof nodeColor === 'function') return nodeColor(node);
        return nodeColor;
    }, [nodeColor]);

    // Click on minimap to pan
    const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!miniMapRef.current || !onViewportChange) return;
        const rect = miniMapRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convert minimap click to canvas coordinates
        const canvasX = clickX / scale + bounds.minX;
        const canvasY = clickY / scale + bounds.minY;

        // Center viewport on clicked point
        onViewportChange({
            x: -(canvasX * viewport.zoom - containerWidth / 2),
            y: -(canvasY * viewport.zoom - containerHeight / 2),
            zoom: viewport.zoom,
        });
    }, [bounds, scale, viewport.zoom, containerWidth, containerHeight, onViewportChange]);

    return (
        <div
            className="kgraph-minimap"
            style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                zIndex: 20,
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${borderColor}`,
            }}
        >
            <svg
                ref={miniMapRef}
                width={width}
                height={height}
                style={{ backgroundColor, display: 'block', cursor: 'pointer' }}
                onClick={handleClick}
            >
                {/* Nodes */}
                {nodes.filter(n => !n.hidden).map(node => {
                    const nx = (node.position.x - bounds.minX) * scale;
                    const ny = (node.position.y - bounds.minY) * scale;
                    const nw = (node.width || 200) * scale;
                    const nh = (node.height || 100) * scale;
                    return (
                        <rect
                            key={node.id}
                            x={nx}
                            y={ny}
                            width={Math.max(nw, 4)}
                            height={Math.max(nh, 3)}
                            fill={getColor(node)}
                            rx={1}
                        />
                    );
                })}

                {/* Mask everything outside viewport */}
                <rect
                    x={0} y={0}
                    width={width} height={viewRect.y}
                    fill={maskColor}
                />
                <rect
                    x={0} y={viewRect.y + viewRect.height}
                    width={width} height={height - viewRect.y - viewRect.height}
                    fill={maskColor}
                />
                <rect
                    x={0} y={viewRect.y}
                    width={viewRect.x} height={viewRect.height}
                    fill={maskColor}
                />
                <rect
                    x={viewRect.x + viewRect.width} y={viewRect.y}
                    width={width - viewRect.x - viewRect.width} height={viewRect.height}
                    fill={maskColor}
                />

                {/* Viewport indicator */}
                <rect
                    x={viewRect.x}
                    y={viewRect.y}
                    width={viewRect.width}
                    height={viewRect.height}
                    fill="none"
                    stroke="rgba(96, 165, 250, 0.5)"
                    strokeWidth={1.5}
                />
            </svg>
        </div>
    );
};

export default MiniMap;
