# Comparison

How does KGraph stack up against other React graph and canvas libraries?

---

## At a Glance

| | KGraph | ReactFlow | React Diagrams | Reaflow | X6/XFlow |
|---|---|---|---|---|---|
| **Bundle** | ~42KB | ~150KB+ | ~200KB+ | ~120KB+ | ~300KB+ |
| **Runtime deps** | None | Zustand, d3 (x3) | lodash, dagre | elkjs, framer-motion | antv/x6 core |
| **CSS required** | No | Yes | Yes | Yes | Yes |
| **Custom nodes** | Yes | Yes | Yes | Yes | Yes |
| **Custom edges** | Yes | Yes | Limited | Yes | Yes |
| **Auto-layout** | — | Via plugin | Dagre built-in | Elkjs built-in | Built-in |
| **TypeScript** | Yes | Yes | Yes | Yes | Yes |
| **License** | MIT | MIT | MIT | Apache-2.0 | MIT |

---

## vs ReactFlow

The most popular React graph library. KGraph provides a similar API with a radically simpler implementation.

| Category | Feature | ReactFlow | KGraph |
|---|---|:---:|:---:|
| **Core** | Controlled mode | Yes | Yes |
| | Uncontrolled mode | Yes | — |
| | Internal store | Zustand | React state |
| **Nodes** | Custom components | Yes | Yes |
| | Built-in types | 4 | 1 |
| | Node resizing | Yes | — |
| | Sub-flows / nesting | Yes | — |
| | Hidden nodes | Yes | Yes |
| | Auto dimensions | Yes | Yes |
| | Per-node overrides | Yes | — |
| **Edges** | Custom components | Yes | Yes |
| | Built-in types | 4 | 1 |
| | Edge labels | Yes | Yes |
| | Animated edges | Built-in flag | Manual SVG |
| | Arrow markers | Configurable | Auto by default |
| | Reconnectable | Yes | — |
| **Handles** | Connection validation | Yes | — |
| | Click-to-connect | Yes | — |
| | Visible by default | No (CSS) | Yes |
| **Interaction** | Pan | Configurable | Left-button |
| | Zoom | Scroll + pinch + dblclick | Scroll + pinch |
| | Snap to grid | Yes | Yes |
| | Box selection | Yes | — |
| | Multi-select | Yes | Yes |
| | Keyboard a11y | Full | Delete only |
| | Drag & drop | Yes | Yes |
| **Viewport** | Fit view | Yes | Yes |
| | Zoom controls | Yes | Yes |
| | Screen/canvas convert | Yes | Yes |
| **Hooks** | Total | 19 | 2 |
| **Visual** | Background variants | 3 | 1 |
| | MiniMap | Pannable | Click-to-nav |
| | Controls panel | Built-in | — |
| | Theming | CSS variables | Inline styles |
| **Events** | Node/Edge/Pane events | 24 | 3 |
| **TypeScript** | Generics | Yes | — |
| | Exported types | 60+ | 15 |
| **Performance** | Virtualization | Yes | — |

**Choose ReactFlow when:** you need the full feature set — sub-flows, box selection, keyboard accessibility, edge reconnection, CSS theming, or the broader ecosystem.

**Choose KGraph when:** you want a zero-dep canvas that's fast to adopt, trivial to understand, and tiny to ship. You're building custom node-based UIs where you control all the styling.

---

## vs React Diagrams (projectstorm)

A model-driven diagramming library with an OOP architecture.

| | React Diagrams | KGraph |
|---|---|---|
| Architecture | Model-based (OOP) | Props-based (React) |
| Custom nodes | Factory pattern | `nodeTypes` prop |
| Layout | Dagre integration | — |
| Bundle | ~200KB+ | ~42KB |
| Deps | lodash, dagre, pathfinding | None |
| API style | Imperative (model methods) | Declarative (React props) |

**Choose React Diagrams when:** you want a model-driven approach with built-in auto-layout and are comfortable with class-based OOP patterns.

---

## vs Reaflow

A React graph library focused on automatic layout via elkjs.

| | Reaflow | KGraph |
|---|---|---|
| Auto-layout | Built-in (elkjs) | — |
| Custom nodes | Yes | Yes |
| Animation | Built-in (framer-motion) | Manual |
| Bundle | ~120KB+ | ~42KB |
| Deps | elkjs, framer-motion, etc. | None |
| Manual positioning | Limited | Full control |

**Choose Reaflow when:** you need automatic graph layout and don't want to position nodes yourself.

---

## vs X6/XFlow (AntV)

A full-featured graph engine from Ant Group with a React wrapper.

| | X6/XFlow | KGraph |
|---|---|---|
| Architecture | Canvas engine + React wrapper | Pure React |
| Rendering | SVG/Canvas (X6 core) | HTML + SVG |
| Built-in shapes | 20+ | 1 |
| Auto-layout | Multiple algorithms | — |
| Bundle | ~300KB+ | ~42KB |
| Deps | @antv/x6 core | None |

**Choose X6/XFlow when:** you need a full diagramming toolkit with extensive built-in shapes, layout algorithms, and enterprise features.

---

## Migrating from ReactFlow

KGraph's API is designed for straightforward migration:

```
<ReactFlow>                    →  <KGraphCanvas>
<ReactFlowProvider>            →  (not needed — built in)
useReactFlow()                 →  useKGraph()
applyNodeChanges()             →  applyNodeChanges()      (same)
applyEdgeChanges()             →  applyEdgeChanges()      (same)
getBezierPath()                →  getBezierPath()          (same)
Node<T>                        →  KGraphNode
Edge<T>                        →  KGraphEdge
Connection                     →  KGraphConnection
import 'reactflow/style.css'   →  (delete this line)
```

Most apps can migrate by updating imports and renaming the canvas component.
