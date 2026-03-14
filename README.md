# @quantumwake/kgraph

A lightweight, zero-dependency React graph canvas. Build node-based editors, pipelines, and diagrams with a familiar API — no Zustand, no d3, no CSS imports required.

If you've used ReactFlow, you'll feel right at home. If you haven't, you'll be up and running in 5 minutes.

## Why KGraph?

| | ReactFlow | KGraph |
|---|---|---|
| Runtime deps | Zustand + d3-selection + d3-zoom + d3-drag | **None** |
| CSS import | Required | **Not needed** |
| Bundle size | ~150KB+ | **~42KB** |
| Source | 100+ files, monorepo | **12 files, ~2K LOC** |
| Mental model | Zustand store + d3 transforms | **React context + useState** |
| API surface | 19 hooks, 60+ types | **2 hooks, 15 types** |

## Install

```bash
npm install @quantumwake/kgraph
# or
yarn add @quantumwake/kgraph
# or
pnpm add @quantumwake/kgraph
```

Requires React 17+. That's it — no CSS files to import, no provider wrappers to add.

## Quick Start

```tsx
import { useState } from 'react';
import {
  KGraphCanvas,
  applyNodeChanges,
  applyEdgeChanges,
} from '@quantumwake/kgraph';
import type { KGraphNode, KGraphEdge, KGraphConnection } from '@quantumwake/kgraph';

function MyGraph() {
  const [nodes, setNodes] = useState<KGraphNode[]>([
    { id: '1', type: 'default', position: { x: 0, y: 0 }, data: { label: 'Hello' } },
    { id: '2', type: 'default', position: { x: 200, y: 120 }, data: { label: 'World' } },
  ]);
  const [edges, setEdges] = useState<KGraphEdge[]>([
    { id: 'e1', source: '1', target: '2' },
  ]);

  return (
    <div style={{ width: '100%', height: 600 }}>
      <KGraphCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={c => setNodes(applyNodeChanges(c, nodes))}
        onEdgesChange={c => setEdges(applyEdgeChanges(c, edges))}
        onConnect={(conn: KGraphConnection) =>
          setEdges(prev => [...prev, { id: `e-${Date.now()}`, ...conn }])
        }
        fitView
      />
    </div>
  );
}
```

That gives you pan, zoom, drag, snap-to-grid, selection, keyboard delete, a minimap, directed arrows, and a dot grid background — all out of the box.

## Features

- **Zero dependencies** — peer dep on React, nothing else
- **ReactFlow-compatible API** — `applyNodeChanges`, `applyEdgeChanges`, `getBezierPath`
- **Custom nodes & edges** — bring your own React components
- **Connection drawing** — drag from source handle to target handle
- **Interactive handles** — visible dots with hover effects, crosshair cursor on sources
- **Directed arrows** — SVG markers on all edges by default
- **MiniMap** — click-to-navigate overview
- **Dot grid background** — configurable gap
- **Edge labels** — zoom-invariant HTML overlays
- **Viewport controls** — `useKGraph()` hook for `fitView`, `zoomIn`, `zoomOut`, `zoomTo`
- **Drag & drop** — `onDrop` callback with canvas-space coordinates
- **Multi-select** — Shift/Cmd+click
- **Keyboard shortcuts** — Delete/Backspace to remove selected elements
- **Snap-to-grid** — configurable grid size
- **Fully typed** — TypeScript declarations included

## Custom Nodes

```tsx
import { Handle } from '@quantumwake/kgraph';
import type { NodeComponentProps } from '@quantumwake/kgraph';

const MyNode: React.FC<NodeComponentProps> = ({ data, selected }) => (
  <div style={{
    padding: 16, borderRadius: 8,
    border: `2px solid ${selected ? '#60a5fa' : '#333'}`,
    background: '#1a1a2e', color: '#fff',
  }}>
    <Handle id="target-1" type="target" position="top" />
    <h3>{data.title}</h3>
    <p>{data.description}</p>
    <Handle id="source-4" type="source" position="bottom" />
  </div>
);

// Register it:
<KGraphCanvas nodeTypes={{ myNode: MyNode }} ... />
```

**Handle IDs** map to positions: `*-1` = top, `*-2` = left, `*-3` = right, `*-4` = bottom.

Handles are visible by default (purple dots that grow on hover). Pass `style={{ background: '#22c55e', borderColor: '#4ade80' }}` to customize colors.

## Custom Edges

```tsx
import { getBezierPath } from '@quantumwake/kgraph';
import type { EdgeComponentProps } from '@quantumwake/kgraph';

const DashedEdge: React.FC<EdgeComponentProps> = (props) => {
  const [path] = getBezierPath(props);
  return (
    <g>
      <path d={path} fill="none" stroke="transparent" strokeWidth={20} />
      <path d={path} fill="none" stroke="#7c3aed" strokeWidth={2}
        strokeDasharray="8 4"
        markerEnd="url(#kgraph-arrow)" />
    </g>
  );
};

<KGraphCanvas edgeTypes={{ dashed: DashedEdge }} ... />
```

Arrow markers (`#kgraph-arrow` and `#kgraph-arrow-selected`) are defined automatically by KGraphCanvas.

## Hooks

### `useKGraph()`

Available inside any child of `<KGraphCanvas>`:

```ts
const {
  fitView,              // (options?) => void
  zoomIn,               // () => void
  zoomOut,              // () => void
  zoomTo,               // (level: number) => void
  getViewport,          // () => { x, y, zoom }
  setViewport,          // (viewport | updater) => void
  screenToCanvasPosition, // (clientX, clientY) => { x, y }
  getNodes,             // () => KGraphNode[]
  getEdges,             // () => KGraphEdge[]
} = useKGraph();
```

### `useKGraphContext()`

Full internal context — `containerRef`, handle registration, `canvasToScreenPosition`, etc. Use this for advanced integrations.

## Props Reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `nodes` | `KGraphNode[]` | required | Node array |
| `edges` | `KGraphEdge[]` | required | Edge array |
| `onNodesChange` | `(changes) => void` | — | Node change callback |
| `onEdgesChange` | `(changes) => void` | — | Edge change callback |
| `onConnect` | `(connection) => void` | — | New connection callback |
| `onNodeClick` | `(event, node) => void` | — | Node click handler |
| `onEdgeClick` | `(event, edge) => void` | — | Edge click handler |
| `onPaneClick` | `(event) => void` | — | Background click handler |
| `onDrop` | `(event, position) => void` | — | Drop with canvas coordinates |
| `nodeTypes` | `Record<string, Component>` | `{}` | Custom node components |
| `edgeTypes` | `Record<string, Component>` | `{}` | Custom edge components |
| `snapToGrid` | `boolean` | `true` | Snap node positions to grid |
| `snapGrid` | `[number, number]` | `[16, 16]` | Grid cell size in px |
| `panOnDrag` | `boolean` | `true` | Enable canvas panning |
| `zoomOnScroll` | `boolean` | `true` | Enable scroll/pinch zoom |
| `nodesDraggable` | `boolean` | `true` | Allow node dragging |
| `nodesConnectable` | `boolean` | `true` | Allow connection drawing |
| `elementsSelectable` | `boolean` | `true` | Allow click-to-select |
| `fitView` | `boolean` | `false` | Auto-fit viewport on mount |
| `showMiniMap` | `boolean` | `true` | Show minimap overlay |
| `showBackground` | `boolean` | `true` | Show dot grid |
| `backgroundGap` | `number` | `32` | Dot grid spacing |
| `minZoom` | `number` | `0.1` | Minimum zoom level |
| `maxZoom` | `number` | `4` | Maximum zoom level |

## Examples

9 interactive examples ship as a runnable Vite app:

```bash
cd examples && npm install && npm run dev
```

Open [localhost:5173](http://localhost:5173) — sidebar navigation across all demos:

| Example | What it shows |
|---|---|
| **Basic Graph** | Simplest usage — 3 nodes, 2 edges |
| **Custom Nodes** | Input/Processor/Output types with colored multi-handle |
| **Custom Edges** | Labeled, animated, and success edge styles |
| **Drag & Drop** | Palette panel, drag to create nodes |
| **Viewport Controls** | Programmatic zoom/fit toolbar via `useKGraph()` |
| **Interactive Callbacks** | Real-time event log for all interactions |
| **Canvas Options** | Runtime toggle of every canvas prop |
| **Large Graph** | 80-node grid for performance testing |
| **MiniMap & Background** | Category-colored pipeline with minimap |

All examples include drag & drop, right-click context menus, and connection drawing.

See [EXAMPLES.md](./EXAMPLES.md) for detailed docs on each one.

## Migrating from ReactFlow

KGraph's API is designed for easy migration:

- `<ReactFlow>` → `<KGraphCanvas>`
- `<ReactFlowProvider>` → not needed (provider is built in)
- `useReactFlow()` → `useKGraph()`
- `applyNodeChanges` / `applyEdgeChanges` → same function names, same behavior
- `getBezierPath` → same function name, same return signature
- `Node<T>` → `KGraphNode`, `Edge<T>` → `KGraphEdge`
- Remove your ReactFlow CSS import — KGraph uses inline styles

See [COMPARISON.md](./COMPARISON.md) for a full feature matrix against ReactFlow, React Diagrams, Reaflow, and X6.

## Contributing

```bash
git clone https://github.com/quantumwake/kgraph.git
cd kgraph
npm install
npm run build     # builds dist/
npm run dev       # watch mode
npm run lint      # type-check
```

## License

[MIT](./LICENSE)
