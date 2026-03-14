import { useKGraphContext } from './KGraphProvider';

/**
 * Public hook for accessing KGraph viewport controls.
 * Drop-in replacement for ReactFlow's useReactFlow().
 */
export function useKGraph() {
    const ctx = useKGraphContext();

    return {
        screenToCanvasPosition: ctx.screenToCanvasPosition,
        fitView: ctx.fitView,
        zoomIn: ctx.zoomIn,
        zoomOut: ctx.zoomOut,
        zoomTo: ctx.zoomTo,
        getViewport: () => ctx.viewport,
        setViewport: ctx.setViewport,
        getNodes: () => ctx.nodes,
        getEdges: () => ctx.edges,
    };
}

export default useKGraph;
