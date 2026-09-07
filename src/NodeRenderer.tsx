import React, { useCallback, useRef, useEffect } from 'react';
import { KGraphNode, NodeComponentProps, NodeChange, HandlePosition } from './types';
import { useKGraphContext } from './KGraphProvider';

interface NodeWrapperProps {
    node: KGraphNode;
    nodeComponent: React.ComponentType<NodeComponentProps>;
    onNodesChange?: (changes: NodeChange[]) => void;
    snapToGrid: boolean;
    snapGrid: [number, number];
    draggable: boolean;
    selectable: boolean;
    onNodeClick?: (event: React.MouseEvent, node: KGraphNode) => void;
    onConnectionStart?: (nodeId: string, handleId: string, type: 'source' | 'target', e: React.MouseEvent) => void;
    zoom: number;
}

const NodeWrapper: React.FC<NodeWrapperProps> = ({
    node,
    nodeComponent: NodeComponent,
    onNodesChange,
    snapToGrid,
    snapGrid,
    draggable,
    selectable,
    onNodeClick,
    onConnectionStart,
    zoom,
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
        startX: number;
        startY: number;
        startNodeX: number;
        startNodeY: number;
        isDragging: boolean;
        lastPosition: { x: number; y: number };
    } | null>(null);

    // Use refs for values accessed inside drag event handlers to avoid stale closures
    const onNodesChangeRef = useRef(onNodesChange);
    onNodesChangeRef.current = onNodesChange;
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;
    const snapRef = useRef({ snapToGrid, snapGrid });
    snapRef.current = { snapToGrid, snapGrid };

    const { registerHandle, unregisterHandle } = useKGraphContext();

    // Measure and register handle positions
    const updateHandlePositions = useCallback(() => {
        if (!wrapperRef.current) return;

        const handles = wrapperRef.current.querySelectorAll('[data-handleid]');
        handles.forEach((el) => {
            const handleId = el.getAttribute('data-handleid');
            const handleType = el.getAttribute('data-handletype') as 'source' | 'target';
            const handlePosition = el.getAttribute('data-handleposition') as HandlePosition;
            if (!handleId || !handleType || !handlePosition) return;

            const nodeW = wrapperRef.current!.offsetWidth;
            const nodeH = wrapperRef.current!.offsetHeight;

            let hx = node.position.x;
            let hy = node.position.y;

            // Where the handle actually sits (a host may place it off the
            // node's midline, e.g. on a group's header); the rects are in
            // screen space, so divide the viewport zoom back out.
            const hr = (el as HTMLElement).getBoundingClientRect();
            const wr = wrapperRef.current!.getBoundingClientRect();
            const z = zoomRef.current || 1;
            if (hr.width > 0 && wr.width > 0) {
                registerHandle({
                    nodeId: node.id,
                    handleId,
                    type: handleType,
                    position: handlePosition,
                    x: hx + (hr.left + hr.width / 2 - wr.left) / z,
                    y: hy + (hr.top + hr.height / 2 - wr.top) / z,
                });
                return;
            }

            switch (handlePosition) {
                case 'top':
                    hx += nodeW / 2;
                    break;
                case 'bottom':
                    hx += nodeW / 2;
                    hy += nodeH;
                    break;
                case 'left':
                    hy += nodeH / 2;
                    break;
                case 'right':
                    hx += nodeW;
                    hy += nodeH / 2;
                    break;
            }

            registerHandle({
                nodeId: node.id,
                handleId,
                type: handleType,
                position: handlePosition,
                x: hx,
                y: hy,
            });
        });
    }, [node.id, node.position.x, node.position.y, registerHandle]);

    // Observe size changes
    useEffect(() => {
        if (!wrapperRef.current) return;

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0 && (width !== node.width || height !== node.height)) {
                    onNodesChangeRef.current?.([{
                        type: 'dimensions',
                        id: node.id,
                        dimensions: { width, height },
                    }]);
                }
            }
            updateHandlePositions();
        });

        ro.observe(wrapperRef.current);
        return () => ro.disconnect();
    }, [node.id, node.width, node.height, updateHandlePositions]);

    // Update handles when position changes
    useEffect(() => {
        updateHandlePositions();
    }, [updateHandlePositions]);

    // Cleanup handles on unmount
    useEffect(() => {
        return () => {
            if (!wrapperRef.current) return;
            const handles = wrapperRef.current.querySelectorAll('[data-handleid]');
            handles.forEach((el) => {
                const handleId = el.getAttribute('data-handleid');
                if (handleId) unregisterHandle(node.id, handleId);
            });
        };
    }, [node.id, unregisterHandle]);

    // Drag handling — uses refs to avoid stale closures in window event listeners
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Don't start drag from handles
        const target = e.target as HTMLElement;
        if (target.closest('[data-handleid]')) return;

        // Don't interfere with interactions inside dialogs (e.g. HeadlessUI)
        if (target.closest('[role="dialog"]')) return;

        if (selectable) {
            onNodeClick?.(e, node);
        }

        if (!draggable) return;

        e.stopPropagation();
        e.preventDefault();

        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startNodeX: node.position.x,
            startNodeY: node.position.y,
            isDragging: false,
            lastPosition: { x: node.position.x, y: node.position.y },
        };

        const nodeId = node.id;

        const handleMouseMove = (ev: MouseEvent) => {
            if (!dragRef.current) return;

            const currentZoom = zoomRef.current;
            const dx = (ev.clientX - dragRef.current.startX) / currentZoom;
            const dy = (ev.clientY - dragRef.current.startY) / currentZoom;

            // Threshold to distinguish click from drag
            if (!dragRef.current.isDragging && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
                dragRef.current.isDragging = true;
            }

            if (!dragRef.current.isDragging) return;

            let newX = dragRef.current.startNodeX + dx;
            let newY = dragRef.current.startNodeY + dy;

            const { snapToGrid: snap, snapGrid: grid } = snapRef.current;
            if (snap) {
                newX = Math.round(newX / grid[0]) * grid[0];
                newY = Math.round(newY / grid[1]) * grid[1];
            }

            // Track the last position so mouseup can include it
            dragRef.current.lastPosition = { x: newX, y: newY };

            onNodesChangeRef.current?.([{
                type: 'position',
                id: nodeId,
                position: { x: newX, y: newY },
                dragging: true,
            }]);
        };

        const handleMouseUp = () => {
            if (dragRef.current?.isDragging) {
                // Always include the final position to avoid stale closure issues
                onNodesChangeRef.current?.([{
                    type: 'position',
                    id: nodeId,
                    position: dragRef.current.lastPosition,
                    dragging: false,
                }]);
            }
            dragRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [node.id, node.position.x, node.position.y, draggable, selectable, onNodeClick]);

    return (
        <div
            ref={wrapperRef}
            className="kgraph-node-wrapper"
            style={{
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
                cursor: draggable ? 'grab' : 'default',
                userSelect: 'none',
            }}
            onMouseDown={handleMouseDown}
        >
            <HandleContext.Provider value={{ nodeId: node.id, onConnectionStart }}>
                <NodeComponent
                    id={node.id}
                    data={node.data}
                    selected={node.selected || false}
                    type={node.type}
                />
            </HandleContext.Provider>
        </div>
    );
};

// Context for passing nodeId to Handle components nested inside node components
interface HandleContextValue {
    nodeId: string;
    onConnectionStart?: (nodeId: string, handleId: string, type: 'source' | 'target', e: React.MouseEvent) => void;
}

const HandleContext = React.createContext<HandleContextValue>({ nodeId: '' });
export const useHandleContext = () => React.useContext(HandleContext);

// ============================================================================
// NodeRenderer - renders all visible nodes
// ============================================================================

interface NodeRendererProps {
    nodes: KGraphNode[];
    nodeTypes: Record<string, React.ComponentType<NodeComponentProps>>;
    defaultNodeType?: React.ComponentType<NodeComponentProps>;
    onNodesChange?: (changes: NodeChange[]) => void;
    snapToGrid: boolean;
    snapGrid: [number, number];
    draggable: boolean;
    selectable: boolean;
    onNodeClick?: (event: React.MouseEvent, node: KGraphNode) => void;
    onConnectionStart?: (nodeId: string, handleId: string, type: 'source' | 'target', e: React.MouseEvent) => void;
    zoom: number;
}

const NodeRenderer: React.FC<NodeRendererProps> = ({
    nodes,
    nodeTypes,
    defaultNodeType,
    onNodesChange,
    snapToGrid,
    snapGrid,
    draggable,
    selectable,
    onNodeClick,
    onConnectionStart,
    zoom,
}) => {
    const DefaultNode: React.ComponentType<NodeComponentProps> = defaultNodeType || (({ data }) => (
        <div style={{
            padding: '10px 20px',
            border: '2px solid #8b5cf6',
            borderRadius: 4,
            background: '#1a1a2e',
            color: '#fff',
            fontSize: 14,
        }}>
            {data.label || 'Node'}
        </div>
    ));

    return (
        <>
            {nodes.filter(n => !n.hidden).map(node => {
                const Component = nodeTypes[node.type] || DefaultNode;
                return (
                    <NodeWrapper
                        key={node.id}
                        node={node}
                        nodeComponent={Component}
                        onNodesChange={onNodesChange}
                        snapToGrid={snapToGrid}
                        snapGrid={snapGrid}
                        draggable={draggable}
                        selectable={selectable}
                        onNodeClick={onNodeClick}
                        onConnectionStart={onConnectionStart}
                        zoom={zoom}
                    />
                );
            })}
        </>
    );
};

export default NodeRenderer;
