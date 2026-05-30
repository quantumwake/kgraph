// Alethic ISM studio addon — opt-in read-only node/edge renderers + canvas.
// Import via "@quantumwake/kgraph/ism". Requires the lucide-react peer dep.
export { StudioNode, NODE_WIDTH, NODE_HEIGHT, NODE_COLLAPSED, kindForNodeType, displayType } from './nodes';
export type { StudioNodeKind, StudioNodeData } from './nodes';
export { CleanEdge } from './edges';
export { StudioGraph } from './StudioGraph';
export type { StudioGraphProps } from './StudioGraph';
