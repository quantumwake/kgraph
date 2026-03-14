import React from 'react';
import { KGraphEdge, EdgeComponentProps, HandlePosition } from './types';
import { getBezierPath } from './bezier';
import { useKGraphContext } from './KGraphProvider';

// ============================================================================
// Default Edge Component
// ============================================================================

const DefaultEdge: React.FC<EdgeComponentProps> = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
}) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <g>
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: 'pointer' }}
            />
            <path
                d={edgePath}
                fill="none"
                stroke={selected ? '#a78bfa' : '#8b5cf6'}
                strokeWidth={selected ? 2.5 : 1.5}
                markerEnd={selected ? 'url(#kgraph-arrow-selected)' : 'url(#kgraph-arrow)'}
                style={{ cursor: 'pointer' }}
            />
        </g>
    );
};

// ============================================================================
// EdgeRenderer
// ============================================================================

// Map handle IDs to positions (matches the convention from CustomStudio.jsx)
function handleIdToPosition(handleId?: string): HandlePosition {
    if (!handleId) return 'bottom';
    // target-1/source-1 = top, target-2/source-2 = left,
    // target-3/source-3 = right, target-4/source-4 = bottom
    const num = handleId.split('-')[1];
    switch (num) {
        case '1': return 'top';
        case '2': return 'left';
        case '3': return 'right';
        case '4': return 'bottom';
        default: return 'bottom';
    }
}

interface EdgeRendererProps {
    edges: KGraphEdge[];
    edgeTypes: Record<string, React.ComponentType<EdgeComponentProps>>;
    onEdgeClick?: (event: React.MouseEvent, edge: KGraphEdge) => void;
    selectedEdgeId?: string | null;
}

const EdgeRenderer: React.FC<EdgeRendererProps> = ({
    edges,
    edgeTypes,
    onEdgeClick,
    selectedEdgeId,
}) => {
    const { getHandlePosition, nodes } = useKGraphContext();

    return (
        <g className="kgraph-edges">
            {edges.map(edge => {
                // Look up handle positions
                const sourceHandle = getHandlePosition(edge.source, edge.sourceHandle || 'source-4');
                const targetHandle = getHandlePosition(edge.target, edge.targetHandle || 'target-1');

                // Fallback: use node positions if handles aren't registered yet
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);

                if (!sourceNode && !sourceHandle) return null;
                if (!targetNode && !targetHandle) return null;

                const sourceX = sourceHandle?.x ?? (sourceNode!.position.x + (sourceNode!.width || 200) / 2);
                const sourceY = sourceHandle?.y ?? (sourceNode!.position.y + (sourceNode!.height || 100));
                const targetX = targetHandle?.x ?? (targetNode!.position.x + (targetNode!.width || 200) / 2);
                const targetY = targetHandle?.y ?? targetNode!.position.y;

                const sourcePosition = sourceHandle?.position ?? handleIdToPosition(edge.sourceHandle);
                const targetPosition = targetHandle?.position ?? handleIdToPosition(edge.targetHandle);

                const isSelected = edge.selected || edge.id === selectedEdgeId;
                const EdgeComponent = edgeTypes[edge.type || 'default'] || edgeTypes['default'] || DefaultEdge;

                return (
                    <g
                        key={edge.id}
                        className="kgraph-edge"
                        onClick={(e) => onEdgeClick?.(e, edge)}
                    >
                        <EdgeComponent
                            id={edge.id}
                            sourceX={sourceX}
                            sourceY={sourceY}
                            targetX={targetX}
                            targetY={targetY}
                            sourcePosition={sourcePosition}
                            targetPosition={targetPosition}
                            selected={isSelected}
                            data={edge.data}
                            animated={edge.animated}
                        />
                    </g>
                );
            })}
        </g>
    );
};

export default EdgeRenderer;
