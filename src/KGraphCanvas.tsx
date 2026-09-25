import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
    KGraphCanvasProps,
    KGraphViewport,
    NodeChange,
    EdgeChange,
    HandlePosition,
    KGraphNode,
    KGraphEdge,
} from './types';
import { KGraphProvider, useKGraphContext } from './KGraphProvider';
import NodeRenderer from './NodeRenderer';
import EdgeRenderer from './EdgeRenderer';
import ConnectionLine from './ConnectionLine';
import DotGrid from './DotGrid';
import MiniMap from './MiniMap';

// ============================================================================
// Inner Canvas (requires KGraphProvider context)
// ============================================================================

interface InnerCanvasProps extends KGraphCanvasProps {}

const InnerCanvas: React.FC<InnerCanvasProps> = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    onDrop,
    onDragOver,
    nodeTypes = {},
    edgeTypes = {},
    snapToGrid = true,
    snapGrid = [16, 16],
    panOnDrag = true,
    zoomOnScroll = true,
    nodesDraggable = true,
    nodesConnectable = true,
    elementsSelectable = true,
    fitView: fitViewOnMount = false,
    showMiniMap = true,
    miniMap,
    showBackground = true,
    backgroundGap = 32,
    dotColor,
    minZoom = 0.1,
    maxZoom = 4,
    className = '',
    style = {},
    children,
}) => {
    const ctx = useKGraphContext();
    const { viewport, setViewport, containerRef, screenToCanvasPosition } = ctx;

    const panRef = useRef<{
        startX: number;
        startY: number;
        startVX: number;
        startVY: number;
        isPanning: boolean;
    } | null>(null);

    const [connectionDrag, setConnectionDrag] = useState<{
        sourceNodeId: string;
        sourceHandleId: string;
        sourcePosition: HandlePosition;
        sourceX: number;
        sourceY: number;
        mouseX: number;
        mouseY: number;
    } | null>(null);

    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Refs for stable access in pane-click closures (avoids stale nodes/edges)
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;
    const edgesRef = useRef(edges);
    edgesRef.current = edges;
    const onNodesChangeRef = useRef(onNodesChange);
    onNodesChangeRef.current = onNodesChange;
    const onEdgesChangeRef = useRef(onEdgesChange);
    onEdgesChangeRef.current = onEdgesChange;

    // Deselect all nodes and edges (uses refs so it's closure-safe)
    const deselectAll = useCallback(() => {
        const nodeDeselects: NodeChange[] = nodesRef.current
            .filter(n => n.selected)
            .map(n => ({ type: 'select' as const, id: n.id, selected: false }));
        const edgeDeselects: EdgeChange[] = edgesRef.current
            .filter(e => e.selected)
            .map(e => ({ type: 'select' as const, id: e.id, selected: false }));
        if (nodeDeselects.length) onNodesChangeRef.current?.(nodeDeselects);
        if (edgeDeselects.length) onEdgesChangeRef.current?.(edgeDeselects);
    }, []);

    // Track container size
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [containerRef]);

    // Fit view on mount
    useEffect(() => {
        if (fitViewOnMount && nodes.length > 0) {
            // Small delay to allow handle registration
            const t = setTimeout(() => ctx.fitView({ padding: 0.2 }), 100);
            return () => clearTimeout(t);
        }
    }, [fitViewOnMount, nodes.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

    // ==================== Pan ====================
    const handlePaneMouseDown = useCallback((e: React.MouseEvent) => {
        // Only start pan from the canvas itself (not nodes/edges)
        if ((e.target as HTMLElement).closest('.kgraph-node-wrapper')) return;
        if ((e.target as HTMLElement).closest('.kgraph-edge-label')) return;

        if (!panOnDrag) {
            // Still handle pane click for deselection
            deselectAll();
            onPaneClick?.(e);
            return;
        }

        // Left button only
        if (e.button !== 0) return;

        panRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startVX: viewport.x,
            startVY: viewport.y,
            isPanning: false,
        };

        const handleMouseMove = (ev: MouseEvent) => {
            const pan = panRef.current;
            if (!pan) return;
            const dx = ev.clientX - pan.startX;
            const dy = ev.clientY - pan.startY;

            if (!pan.isPanning && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                pan.isPanning = true;
            }

            if (!pan.isPanning) return;

            setViewport(v => ({
                ...v,
                x: pan.startVX + dx,
                y: pan.startVY + dy,
            }));
        };

        const handleMouseUp = (ev: MouseEvent) => {
            if (panRef.current && !panRef.current.isPanning) {
                // It was a click, not a drag — deselect all nodes/edges
                deselectAll();
                onPaneClick?.(ev as unknown as React.MouseEvent);
            }
            panRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [panOnDrag, viewport, setViewport, onPaneClick]);

    // ==================== Zoom (wheel + trackpad pinch) ====================
    // Use a native event listener so we can preventDefault on non-passive wheel events.
    // Trackpad pinch-to-zoom fires wheel events with ctrlKey=true and smaller deltaY.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            if (!zoomOnScroll) return;
            e.preventDefault();

            const rect = el.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            setViewport(v => {
                // ctrlKey = trackpad pinch gesture — use larger multiplier
                const sensitivity = e.ctrlKey ? 0.01 : 0.001;
                const zoomDelta = -e.deltaY * sensitivity;
                const newZoom = Math.min(Math.max(v.zoom * (1 + zoomDelta), minZoom), maxZoom);

                // Zoom toward mouse/finger position
                return {
                    x: mouseX - (mouseX - v.x) * (newZoom / v.zoom),
                    y: mouseY - (mouseY - v.y) * (newZoom / v.zoom),
                    zoom: newZoom,
                };
            });
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [zoomOnScroll, setViewport, containerRef, minZoom, maxZoom]);

    // ==================== Connection Drawing ====================
    const handleConnectionStart = useCallback((nodeId: string, handleId: string, type: 'source' | 'target', e: React.MouseEvent) => {
        if (!nodesConnectable) return;

        const handle = ctx.getHandlePosition(nodeId, handleId);
        if (!handle) return;

        setConnectionDrag({
            sourceNodeId: nodeId,
            sourceHandleId: handleId,
            sourcePosition: handle.position,
            sourceX: handle.x,
            sourceY: handle.y,
            mouseX: handle.x,
            mouseY: handle.y,
        });

        const handleMouseMove = (ev: MouseEvent) => {
            const pos = screenToCanvasPosition(ev.clientX, ev.clientY);
            setConnectionDrag(prev => prev ? { ...prev, mouseX: pos.x, mouseY: pos.y } : null);
        };

        const handleMouseUp = (ev: MouseEvent) => {
            // Check if mouse is over a handle
            const target = document.elementFromPoint(ev.clientX, ev.clientY);
            const handleEl = target?.closest?.('[data-handleid]');

            if (handleEl) {
                const targetNodeId = handleEl.getAttribute('data-nodeid');
                let targetHandleId = handleEl.getAttribute('data-handleid');
                const targetHandleType = handleEl.getAttribute('data-handletype');

                // If we landed on a source handle (invisible, stacked on top),
                // use the corresponding target handle ID instead
                if (targetHandleType === 'source' && targetHandleId) {
                    targetHandleId = targetHandleId.replace('source-', 'target-');
                }

                if (targetNodeId && targetHandleId && targetNodeId !== nodeId) {
                    onConnect?.({
                        source: nodeId,
                        target: targetNodeId,
                        sourceHandle: handleId,
                        targetHandle: targetHandleId,
                    });
                }
            }

            setConnectionDrag(null);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [nodesConnectable, ctx, screenToCanvasPosition, onConnect]);

    // ==================== Drag & Drop ====================
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(e);
    }, [onDragOver]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const position = screenToCanvasPosition(e.clientX, e.clientY);
        onDrop?.(e, position);
    }, [screenToCanvasPosition, onDrop]);

    // ==================== Node Click ====================
    const handleNodeClick = useCallback((e: React.MouseEvent, node: KGraphNode) => {
        if (!elementsSelectable) return;

        const isMultiSelect = e.shiftKey || e.metaKey;

        const nodeChanges: NodeChange[] = [];
        if (isMultiSelect) {
            // Toggle clicked node's selection without affecting others
            nodeChanges.push({ type: 'select', id: node.id, selected: !node.selected });
        } else {
            // Select clicked node, deselect all others
            for (const n of nodes) {
                if (n.id === node.id && !n.selected) {
                    nodeChanges.push({ type: 'select', id: n.id, selected: true });
                } else if (n.id !== node.id && n.selected) {
                    nodeChanges.push({ type: 'select', id: n.id, selected: false });
                }
            }
        }
        if (nodeChanges.length) onNodesChange?.(nodeChanges);

        // Deselect all edges (unless multi-select)
        if (!isMultiSelect) {
            const edgeDeselects: EdgeChange[] = edges
                .filter(ed => ed.selected)
                .map(ed => ({ type: 'select' as const, id: ed.id, selected: false }));
            if (edgeDeselects.length) onEdgesChange?.(edgeDeselects);
        }

        onNodeClick?.(e, node);
    }, [elementsSelectable, nodes, edges, onNodesChange, onEdgesChange, onNodeClick]);

    // ==================== Edge Click ====================
    const handleEdgeClick = useCallback((e: React.MouseEvent, edge: KGraphEdge) => {
        if (!elementsSelectable) return;
        e.stopPropagation();

        // Select clicked edge, deselect all others
        const edgeChanges: EdgeChange[] = [];
        for (const ed of edges) {
            if (ed.id === edge.id && !ed.selected) {
                edgeChanges.push({ type: 'select', id: ed.id, selected: true });
            } else if (ed.id !== edge.id && ed.selected) {
                edgeChanges.push({ type: 'select', id: ed.id, selected: false });
            }
        }
        if (edgeChanges.length) onEdgesChange?.(edgeChanges);

        // Deselect all nodes
        const nodeDeselects: NodeChange[] = nodes
            .filter(n => n.selected)
            .map(n => ({ type: 'select' as const, id: n.id, selected: false }));
        if (nodeDeselects.length) onNodesChange?.(nodeDeselects);

        onEdgeClick?.(e, edge);
    }, [elementsSelectable, nodes, edges, onNodesChange, onEdgesChange, onEdgeClick]);

    // ==================== Keyboard ====================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const target = e.target as HTMLElement;

                // Skip if focus is in any interactive element or inside a dialog
                if (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT' ||
                    target.isContentEditable ||
                    target.closest('[role="dialog"]') ||
                    target.closest('[role="combobox"]') ||
                    target.closest('[role="listbox"]')
                ) return;

                const selectedNodes = nodes.filter(n => n.selected);
                const selectedEdges = edges.filter(ed => ed.selected);

                if (selectedNodes.length) {
                    onNodesChange?.(selectedNodes.map(n => ({ type: 'remove' as const, id: n.id })));
                }
                if (selectedEdges.length) {
                    onEdgesChange?.(selectedEdges.map(ed => ({ type: 'remove' as const, id: ed.id })));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, edges, onNodesChange, onEdgesChange]);

    const transformStr = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;

    return (
        <div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            className={`kgraph-canvas ${className}`}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#0e0e10',
                ...style,
            }}
            onMouseDown={handlePaneMouseDown}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Background layer */}
            {showBackground && (
                <DotGrid viewport={viewport} gap={backgroundGap} color={dotColor} />
            )}

            {/* SVG layer for edges */}
            <svg
                className="kgraph-svg-layer"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    overflow: 'visible',
                }}
            >
                <defs>
                    <marker id="kgraph-arrow" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 12 6 L 0 11 z" fill="#8b5cf6" />
                    </marker>
                    <marker id="kgraph-arrow-selected" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 12 6 L 0 11 z" fill="#a78bfa" />
                    </marker>
                </defs>
                <g
                    transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
                    style={{ pointerEvents: 'all' }}
                >
                    <EdgeRenderer
                        edges={edges}
                        edgeTypes={edgeTypes}
                        onEdgeClick={handleEdgeClick}
                    />

                    {/* Connection line while drawing */}
                    {connectionDrag && (
                        <ConnectionLine
                            sourceX={connectionDrag.sourceX}
                            sourceY={connectionDrag.sourceY}
                            sourcePosition={connectionDrag.sourcePosition}
                            targetX={connectionDrag.mouseX}
                            targetY={connectionDrag.mouseY}
                        />
                    )}
                </g>
            </svg>

            {/* HTML layer for nodes */}
            <div
                className="kgraph-node-layer"
                style={{
                    position: 'absolute',
                    inset: 0,
                    transformOrigin: '0 0',
                    transform: transformStr,
                    pointerEvents: 'none',
                }}
            >
                <div style={{ pointerEvents: 'all' }}>
                    <NodeRenderer
                        nodes={nodes}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        snapToGrid={snapToGrid}
                        snapGrid={snapGrid}
                        draggable={nodesDraggable}
                        selectable={elementsSelectable}
                        onNodeClick={handleNodeClick}
                        onConnectionStart={handleConnectionStart}
                        zoom={viewport.zoom}
                    />
                </div>
            </div>

            {/* Edge label overlay layer (HTML, inside viewport transform) */}
            <div
                className="kgraph-edge-label-layer"
                style={{
                    position: 'absolute',
                    inset: 0,
                    transformOrigin: '0 0',
                    transform: transformStr,
                    pointerEvents: 'none',
                    zIndex: 10,
                }}
            >
                {/* Edge labels are rendered by custom edge components via EdgeLabel */}
            </div>

            {/* MiniMap */}
            {showMiniMap && containerSize.width > 0 && (
                <MiniMap
                    nodes={nodes}
                    viewport={viewport}
                    onViewportChange={setViewport}
                    containerWidth={containerSize.width}
                    containerHeight={containerSize.height}
                    {...miniMap}
                />
            )}

            {/* Toolbar / overlays via children */}
            {children}
        </div>
    );
};

// ============================================================================
// KGraphCanvas - Public component with provider
// ============================================================================

const KGraphCanvas: React.FC<KGraphCanvasProps> = (props) => {
    return (
        <KGraphProvider
            nodes={props.nodes}
            edges={props.edges}
            minZoom={props.minZoom}
            maxZoom={props.maxZoom}
        >
            <InnerCanvas {...props} />
        </KGraphProvider>
    );
};

export default KGraphCanvas;
