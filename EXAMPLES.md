# Examples

9 interactive demos covering every major feature. Each one is a standalone React component you can copy into your own project.

## Running Locally

```bash
cd examples
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173). A sidebar lets you switch between all 9 examples. Every example includes:

- Drag & drop palette for adding new nodes
- Right-click context menus (edit, duplicate, delete on nodes; add on canvas)
- Connection drawing between source and target handles
- Directed arrow markers on all edges

---

## 1. Basic Graph

**File:** [`BasicGraph.tsx`](./examples/BasicGraph.tsx)

The simplest possible KGraph setup — 3 nodes in a vertical chain with 2 edges. Good starting point for understanding the core API.

**Concepts:** `KGraphCanvas`, `applyNodeChanges`, `applyEdgeChanges`, `onConnect`, `fitView`

---

## 2. Custom Nodes

**File:** [`CustomNodes.tsx`](./examples/CustomNodes.tsx)

Three distinct node types — Input (green), Processor (blue), Output (orange) — each with different handle configurations and data-driven content.

**Concepts:** `NodeComponentProps`, `Handle` placement, handle ID convention (`*-1` top, `*-2` left, `*-3` right, `*-4` bottom), `nodeTypes` registry, multi-handle connections, colored handles via `style` prop

---

## 3. Custom Edges

**File:** [`CustomEdges.tsx`](./examples/CustomEdges.tsx)

Three custom edge styles: labeled (HTML overlay via `EdgeLabel`), animated (SVG `<animate>` dash), and success (solid green).

**Concepts:** `EdgeComponentProps`, `getBezierPath()`, `EdgeLabel` with zoom-invariant sizing, `useKGraph()` inside edge components, `edgeTypes` registry, `markerEnd` for arrows

---

## 4. Drag & Drop

**File:** [`DragAndDrop.tsx`](./examples/DragAndDrop.tsx)

A floating palette panel with four node types. Drag items onto the canvas to create nodes at the drop position. Starts with an empty canvas.

**Concepts:** `onDrop` handler with canvas-space coordinates, HTML5 `dataTransfer`, dynamic node creation, `<NodePalette>` as child overlay

---

## 5. Viewport Controls

**File:** [`ViewportControls.tsx`](./examples/ViewportControls.tsx)

A toolbar for programmatic viewport manipulation — zoom in/out, fit view, reset to 100%, and read current viewport state.

**Concepts:** `useKGraph()` hook (`zoomIn`, `zoomOut`, `zoomTo`, `fitView`, `getViewport`), toolbar as `<KGraphCanvas>` child

---

## 6. Interactive Callbacks

**File:** [`InteractiveCallbacks.tsx`](./examples/InteractiveCallbacks.tsx)

Real-time event log panel showing every interaction callback as it fires. Color-coded nodes with a right-side handle.

**Concepts:** `onNodeClick`, `onEdgeClick`, `onPaneClick`, `onConnect`, data-driven node colors

---

## 7. Canvas Options

**File:** [`CanvasOptions.tsx`](./examples/CanvasOptions.tsx)

A checkbox panel to toggle every canvas configuration prop at runtime. Great for understanding what each option does.

**Concepts:** `snapToGrid`, `showMiniMap`, `showBackground`, `panOnDrag`, `zoomOnScroll`, `nodesDraggable`, `nodesConnectable`, `elementsSelectable`, prop spreading (`{...options}`)

---

## 8. Large Graph

**File:** [`LargeGraph.tsx`](./examples/LargeGraph.tsx)

Procedurally generated 10x8 grid (80 nodes, 100+ edges) for performance testing. Compact node rendering with a live node/edge counter.

**Concepts:** Large datasets, `fitView` on dense graphs, `snapToGrid={false}`, minimap for navigation

---

## 9. MiniMap & Background

**File:** [`MiniMapOptions.tsx`](./examples/MiniMapOptions.tsx)

A data pipeline with sources, transforms, and sinks — each category colored differently. Demonstrates the minimap and background together.

**Concepts:** `showMiniMap`, `showBackground`, `backgroundGap`, category-based node styling, fan-in/fan-out topology

---

## Using Examples in Your Own Project

Each example file is self-contained. To use one:

1. Install the package: `npm install @quantumwake/kgraph`
2. Copy the `.tsx` file into your project (and `src/ContextMenu.tsx` + `src/NodePalette.tsx` if you want those)
3. Import and render:

```tsx
import BasicGraph from './BasicGraph';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <BasicGraph />
    </div>
  );
}
```

The canvas fills its parent container — make sure the parent has a defined height.
