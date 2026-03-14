import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { KGraphContextValue, KGraphViewport, HandleInfo, KGraphNode, KGraphEdge } from './types';

const KGraphContext = createContext<KGraphContextValue | null>(null);

export function useKGraphContext(): KGraphContextValue {
    const ctx = useContext(KGraphContext);
    if (!ctx) {
        throw new Error('useKGraphContext must be used within a KGraphProvider');
    }
    return ctx;
}

interface KGraphProviderProps {
    children: React.ReactNode;
    nodes: KGraphNode[];
    edges: KGraphEdge[];
    initialViewport?: KGraphViewport;
    minZoom?: number;
    maxZoom?: number;
}

export const KGraphProvider: React.FC<KGraphProviderProps> = ({
    children,
    nodes,
    edges,
    initialViewport = { x: 0, y: 0, zoom: 1 },
    minZoom = 0.1,
    maxZoom = 4,
}) => {
    const [viewport, setViewport] = useState<KGraphViewport>(initialViewport);
    const containerRef = useRef<HTMLDivElement>(null);
    const handlesRef = useRef<Map<string, HandleInfo>>(new Map());

    const screenToCanvasPosition = useCallback((screenX: number, screenY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: screenX, y: screenY };
        const x = (screenX - rect.left - viewport.x) / viewport.zoom;
        const y = (screenY - rect.top - viewport.y) / viewport.zoom;
        return { x, y };
    }, [viewport]);

    const canvasToScreenPosition = useCallback((canvasX: number, canvasY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: canvasX, y: canvasY };
        const x = canvasX * viewport.zoom + viewport.x + rect.left;
        const y = canvasY * viewport.zoom + viewport.y + rect.top;
        return { x, y };
    }, [viewport]);

    const fitView = useCallback((options?: { padding?: number }) => {
        if (nodes.length === 0) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const padding = options?.padding ?? 0.2;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const node of nodes) {
            const w = node.width || 200;
            const h = node.height || 100;
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + w);
            maxY = Math.max(maxY, node.position.y + h);
        }

        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;

        if (graphWidth <= 0 || graphHeight <= 0) return;

        const availW = rect.width * (1 - padding * 2);
        const availH = rect.height * (1 - padding * 2);
        const zoom = Math.min(
            Math.max(availW / graphWidth, minZoom),
            Math.max(availH / graphHeight, minZoom),
            maxZoom,
        );
        const clampedZoom = Math.min(Math.max(zoom, minZoom), maxZoom);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        setViewport({
            x: rect.width / 2 - centerX * clampedZoom,
            y: rect.height / 2 - centerY * clampedZoom,
            zoom: clampedZoom,
        });
    }, [nodes, minZoom, maxZoom]);

    const zoomIn = useCallback(() => {
        setViewport(v => {
            const rect = containerRef.current?.getBoundingClientRect();
            const newZoom = Math.min(v.zoom * 1.2, maxZoom);
            if (!rect) return { ...v, zoom: newZoom };
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            return {
                x: cx - (cx - v.x) * (newZoom / v.zoom),
                y: cy - (cy - v.y) * (newZoom / v.zoom),
                zoom: newZoom,
            };
        });
    }, [maxZoom]);

    const zoomOut = useCallback(() => {
        setViewport(v => {
            const rect = containerRef.current?.getBoundingClientRect();
            const newZoom = Math.max(v.zoom / 1.2, minZoom);
            if (!rect) return { ...v, zoom: newZoom };
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            return {
                x: cx - (cx - v.x) * (newZoom / v.zoom),
                y: cy - (cy - v.y) * (newZoom / v.zoom),
                zoom: newZoom,
            };
        });
    }, [minZoom]);

    const zoomTo = useCallback((level: number) => {
        setViewport(v => {
            const rect = containerRef.current?.getBoundingClientRect();
            const newZoom = Math.min(Math.max(level, minZoom), maxZoom);
            if (!rect) return { ...v, zoom: newZoom };
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            return {
                x: cx - (cx - v.x) * (newZoom / v.zoom),
                y: cy - (cy - v.y) * (newZoom / v.zoom),
                zoom: newZoom,
            };
        });
    }, [minZoom, maxZoom]);

    const registerHandle = useCallback((info: HandleInfo) => {
        handlesRef.current.set(`${info.nodeId}:${info.handleId}`, info);
    }, []);

    const unregisterHandle = useCallback((nodeId: string, handleId: string) => {
        handlesRef.current.delete(`${nodeId}:${handleId}`);
    }, []);

    const getHandlePosition = useCallback((nodeId: string, handleId: string) => {
        return handlesRef.current.get(`${nodeId}:${handleId}`);
    }, []);

    const getAllHandles = useCallback(() => {
        return handlesRef.current;
    }, []);

    const value = useMemo<KGraphContextValue>(() => ({
        viewport,
        setViewport,
        screenToCanvasPosition,
        canvasToScreenPosition,
        fitView,
        zoomIn,
        zoomOut,
        zoomTo,
        registerHandle,
        unregisterHandle,
        getHandlePosition,
        getAllHandles,
        containerRef,
        nodes,
        edges,
    }), [viewport, screenToCanvasPosition, canvasToScreenPosition, fitView, zoomIn, zoomOut, zoomTo, registerHandle, unregisterHandle, getHandlePosition, getAllHandles, nodes, edges]);

    return (
        <KGraphContext.Provider value={value}>
            {children}
        </KGraphContext.Provider>
    );
};

export default KGraphProvider;
