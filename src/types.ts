import React from 'react';

// ============================================================================
// Core Data Types
// ============================================================================

export interface KGraphNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    selected?: boolean;
    dragging?: boolean;
    hidden?: boolean;
    width?: number;
    height?: number;
    group?: string;
}

export interface KGraphEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
    data?: Record<string, any>;
    selected?: boolean;
    animated?: boolean;
}

export interface KGraphConnection {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

// ============================================================================
// Handle Types
// ============================================================================

export type HandlePosition = 'top' | 'right' | 'bottom' | 'left';
export type HandleType = 'source' | 'target';

export interface HandleInfo {
    nodeId: string;
    handleId: string;
    type: HandleType;
    position: HandlePosition;
    x: number;
    y: number;
}

// ============================================================================
// Change Types (mirrors ReactFlow's change system for easy migration)
// ============================================================================

export type NodeChange =
    | { type: 'position'; id: string; position?: { x: number; y: number }; dragging: boolean }
    | { type: 'select'; id: string; selected: boolean }
    | { type: 'remove'; id: string }
    | { type: 'add'; item: KGraphNode }
    | { type: 'dimensions'; id: string; dimensions: { width: number; height: number } };

export type EdgeChange =
    | { type: 'select'; id: string; selected: boolean }
    | { type: 'remove'; id: string }
    | { type: 'add'; item: KGraphEdge };

// ============================================================================
// Viewport
// ============================================================================

export interface KGraphViewport {
    x: number;
    y: number;
    zoom: number;
}

// ============================================================================
// Component Props
// ============================================================================

export interface NodeComponentProps {
    id: string;
    data: Record<string, any>;
    selected: boolean;
    type: string;
}

export interface EdgeComponentProps {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: HandlePosition;
    targetPosition: HandlePosition;
    selected: boolean;
    data?: Record<string, any>;
    animated?: boolean;
    style?: React.CSSProperties;
}

export interface HandleProps {
    id: string;
    type: HandleType;
    position: HandlePosition;
    style?: React.CSSProperties;
    className?: string;
}

// ============================================================================
// Canvas Props
// ============================================================================

export interface KGraphCanvasProps {
    nodes: KGraphNode[];
    edges: KGraphEdge[];
    onNodesChange?: (changes: NodeChange[]) => void;
    onEdgesChange?: (changes: EdgeChange[]) => void;
    onConnect?: (connection: KGraphConnection) => void;
    onNodeClick?: (event: React.MouseEvent, node: KGraphNode) => void;
    onEdgeClick?: (event: React.MouseEvent, edge: KGraphEdge) => void;
    onPaneClick?: (event: React.MouseEvent) => void;
    onDrop?: (event: React.DragEvent, position: { x: number; y: number }) => void;
    onDragOver?: (event: React.DragEvent) => void;
    nodeTypes?: Record<string, React.ComponentType<NodeComponentProps>>;
    edgeTypes?: Record<string, React.ComponentType<EdgeComponentProps>>;
    snapToGrid?: boolean;
    snapGrid?: [number, number];
    panOnDrag?: boolean;
    zoomOnScroll?: boolean;
    nodesDraggable?: boolean;
    nodesConnectable?: boolean;
    elementsSelectable?: boolean;
    fitView?: boolean;
    showMiniMap?: boolean;
    showBackground?: boolean;
    backgroundGap?: number;
    minZoom?: number;
    maxZoom?: number;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

// ============================================================================
// Context
// ============================================================================

export interface KGraphContextValue {
    viewport: KGraphViewport;
    setViewport: React.Dispatch<React.SetStateAction<KGraphViewport>>;
    screenToCanvasPosition: (screenX: number, screenY: number) => { x: number; y: number };
    canvasToScreenPosition: (canvasX: number, canvasY: number) => { x: number; y: number };
    fitView: (options?: { padding?: number }) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    zoomTo: (level: number) => void;
    registerHandle: (info: HandleInfo) => void;
    unregisterHandle: (nodeId: string, handleId: string) => void;
    getHandlePosition: (nodeId: string, handleId: string) => HandleInfo | undefined;
    getAllHandles: () => Map<string, HandleInfo>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    nodes: KGraphNode[];
    edges: KGraphEdge[];
}
