import { KGraphNode, KGraphEdge, NodeChange, EdgeChange } from './types';

/**
 * Apply an array of node changes immutably.
 * Drop-in replacement for ReactFlow's applyNodeChanges.
 */
export function applyNodeChanges(changes: NodeChange[], nodes: KGraphNode[]): KGraphNode[] {
    let result = nodes;

    for (const change of changes) {
        switch (change.type) {
            case 'position':
                result = result.map(n =>
                    n.id === change.id
                        ? {
                            ...n,
                            position: change.position ?? n.position,
                            dragging: change.dragging,
                        }
                        : n
                );
                break;

            case 'select':
                result = result.map(n =>
                    n.id === change.id
                        ? { ...n, selected: change.selected }
                        : n
                );
                break;

            case 'remove':
                result = result.filter(n => n.id !== change.id);
                break;

            case 'add':
                result = [...result, change.item];
                break;

            case 'dimensions':
                result = result.map(n =>
                    n.id === change.id
                        ? {
                            ...n,
                            width: change.dimensions.width,
                            height: change.dimensions.height,
                        }
                        : n
                );
                break;
        }
    }

    return result;
}

/**
 * Apply an array of edge changes immutably.
 * Drop-in replacement for ReactFlow's applyEdgeChanges.
 */
export function applyEdgeChanges(changes: EdgeChange[], edges: KGraphEdge[]): KGraphEdge[] {
    let result = edges;

    for (const change of changes) {
        switch (change.type) {
            case 'select':
                result = result.map(e =>
                    e.id === change.id
                        ? { ...e, selected: change.selected }
                        : e
                );
                break;

            case 'remove':
                result = result.filter(e => e.id !== change.id);
                break;

            case 'add':
                result = [...result, change.item];
                break;
        }
    }

    return result;
}
