import { HandlePosition } from './types';
import { getBezierPath, getControlWithCurvature } from './bezier';

/**
 * routing — an edge path that goes AROUND nodes instead of through them.
 *
 * A bezier is drawn first; if it crosses an obstacle the router tries
 * orthogonal detours (a vertical or horizontal channel between the two
 * ends, then a loop around the obstacles' extent) and returns the first
 * clear one, with rounded corners. When nothing is clear, the bezier comes
 * back flagged `clear: false` so the host can dim it and hide its label
 * until hovered (LabeledEdge does exactly that).
 */
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RouteOptions {
    sourceX: number;
    sourceY: number;
    sourcePosition?: HandlePosition;
    targetX: number;
    targetY: number;
    targetPosition?: HandlePosition;
    /** Node rects the edge must not cross (leave out its own two ends). */
    obstacles?: Rect[];
    /** Clearance kept from every obstacle (default 6). */
    margin?: number;
    /** Corner radius of the detours (default 8). */
    radius?: number;
}

export interface Route {
    path: string;
    labelX: number;
    labelY: number;
    /** False when even the fallback crosses an obstacle. */
    clear: boolean;
}

type Pt = [number, number];

const STEP = 8;

function inside(x: number, y: number, r: Rect, m: number): boolean {
    return x >= r.x - m && x <= r.x + r.width + m && y >= r.y - m && y <= r.y + r.height + m;
}

function hits(x: number, y: number, obstacles: Rect[], m: number): boolean {
    for (const r of obstacles) {
        if (inside(x, y, r, m)) return true;
    }
    return false;
}

function segmentClear(a: Pt, b: Pt, obstacles: Rect[], m: number): boolean {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const n = Math.max(1, Math.ceil(len / STEP));
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        if (hits(a[0] + dx * t, a[1] + dy * t, obstacles, m)) return false;
    }
    return true;
}

// The end segments touch their own nodes; they are exempt from the test
// (the caller leaves source and target out of `obstacles` anyway).
function polylineClear(pts: Pt[], obstacles: Rect[], m: number): boolean {
    for (let i = 0; i < pts.length - 1; i++) {
        if (!segmentClear(pts[i], pts[i + 1], obstacles, m)) return false;
    }
    return true;
}

function bezierClear(o: RouteOptions, obstacles: Rect[], m: number): boolean {
    const [c1x, c1y] = getControlWithCurvature(o.sourcePosition || 'bottom', o.sourceX, o.sourceY, o.targetX, o.targetY, 0.25);
    const [c2x, c2y] = getControlWithCurvature(o.targetPosition || 'top', o.targetX, o.targetY, o.sourceX, o.sourceY, 0.25);
    const n = 40;
    for (let i = 2; i < n - 1; i++) {
        const t = i / n;
        const mt = 1 - t;
        const x = mt * mt * mt * o.sourceX + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * o.targetX;
        const y = mt * mt * mt * o.sourceY + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * o.targetY;
        if (hits(x, y, obstacles, m)) return false;
    }
    return true;
}

// Drop consecutive duplicate points so corners are real corners.
function dedupe(pts: Pt[]): Pt[] {
    const out: Pt[] = [];
    for (const p of pts) {
        const last = out[out.length - 1];
        if (!last || Math.abs(last[0] - p[0]) > 0.5 || Math.abs(last[1] - p[1]) > 0.5) out.push(p);
    }
    return out;
}

// A polyline as an SVG path with rounded corners.
function roundedPath(pts: Pt[], radius: number): string {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
        const [px, py] = pts[i - 1];
        const [cx, cy] = pts[i];
        const [nx, ny] = pts[i + 1];
        const inLen = Math.hypot(cx - px, cy - py);
        const outLen = Math.hypot(nx - cx, ny - cy);
        const r = Math.min(radius, inLen / 2, outLen / 2);
        const ax = cx - ((cx - px) / inLen) * r;
        const ay = cy - ((cy - py) / inLen) * r;
        const bx = cx + ((nx - cx) / outLen) * r;
        const by = cy + ((ny - cy) / outLen) * r;
        d += ` L${ax},${ay} Q${cx},${cy} ${bx},${by}`;
    }
    const last = pts[pts.length - 1];
    d += ` L${last[0]},${last[1]}`;
    return d;
}

// The label sits on the longest interior segment (the channel), or the
// middle of the line when there is none.
function labelOn(pts: Pt[]): Pt {
    let best: Pt = [(pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2];
    let bestLen = -1;
    for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        if (len > bestLen) {
            bestLen = len;
            best = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
        }
    }
    return best;
}

const horizontal = (p?: HandlePosition) => p === 'left' || p === 'right';

// The candidate polylines, cheapest first: a straight channel between the
// ends, then the same channel swept across the gap, then a loop around
// the obstacles' extent on either side.
function candidates(o: RouteOptions, obstacles: Rect[]): Pt[][] {
    const S: Pt = [o.sourceX, o.sourceY];
    const T: Pt = [o.targetX, o.targetY];
    const out: Pt[][] = [];
    const lo = Math.min(S[0], T[0]);
    const hi = Math.max(S[0], T[0]);
    const top = Math.min(S[1], T[1]);
    const bottom = Math.max(S[1], T[1]);

    if (horizontal(o.sourcePosition)) {
        const mid = (S[0] + T[0]) / 2;
        const xs = [mid];
        for (let x = lo + 16; x <= hi - 16; x += 16) xs.push(x);
        for (const x of xs) out.push([S, [x, S[1]], [x, T[1]], T]);
    } else {
        const mid = (S[1] + T[1]) / 2;
        const ys = [mid];
        for (let y = top + 16; y <= bottom - 16; y += 16) ys.push(y);
        for (const y of ys) out.push([S, [S[0], y], [T[0], y], T]);
    }

    // A loop around everything in the way: below, then above (or right,
    // then left for vertical handles).
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of obstacles) {
        minX = Math.min(minX, r.x);
        minY = Math.min(minY, r.y);
        maxX = Math.max(maxX, r.x + r.width);
        maxY = Math.max(maxY, r.y + r.height);
    }
    if (obstacles.length === 0) return out;

    const lead = 24;
    if (horizontal(o.sourcePosition)) {
        const sx = o.sourcePosition === 'left' ? S[0] - lead : S[0] + lead;
        const tx = o.targetPosition === 'right' ? T[0] + lead : T[0] - lead;
        out.push([S, [sx, S[1]], [sx, maxY + lead], [tx, maxY + lead], [tx, T[1]], T]);
        out.push([S, [sx, S[1]], [sx, minY - lead], [tx, minY - lead], [tx, T[1]], T]);
    } else {
        const sy = o.sourcePosition === 'top' ? S[1] - lead : S[1] + lead;
        const ty = o.targetPosition === 'bottom' ? T[1] + lead : T[1] - lead;
        out.push([S, [S[0], sy], [maxX + lead, sy], [maxX + lead, ty], [T[0], ty], T]);
        out.push([S, [S[0], sy], [minX - lead, sy], [minX - lead, ty], [T[0], ty], T]);
    }
    return out;
}

/**
 * routeEdge — the path for one edge given the nodes it must not cross.
 * With no obstacles it is the plain bezier.
 */
export function routeEdge(o: RouteOptions): Route {
    const obstacles = o.obstacles || [];
    const m = o.margin ?? 6;
    const [path, labelX, labelY] = getBezierPath({
        sourceX: o.sourceX, sourceY: o.sourceY, sourcePosition: o.sourcePosition,
        targetX: o.targetX, targetY: o.targetY, targetPosition: o.targetPosition,
    });
    if (obstacles.length === 0 || bezierClear(o, obstacles, m)) return { path, labelX, labelY, clear: true };

    for (const pts of candidates(o, obstacles)) {
        const line = dedupe(pts);
        if (!polylineClear(line, obstacles, m)) continue;

        const [lx, ly] = labelOn(line);
        return { path: roundedPath(line, o.radius ?? 8), labelX: lx, labelY: ly, clear: true };
    }

    return { path, labelX, labelY, clear: false };
}

/** nodeRects — the obstacle list for a set of nodes (ids to skip aside). */
export function nodeRects(
    nodes: Array<{ id: string; position: { x: number; y: number }; width?: number; height?: number; hidden?: boolean }>,
    skip: string[] = [],
): Rect[] {
    const out: Rect[] = [];
    for (const n of nodes) {
        if (n.hidden || skip.includes(n.id)) continue;
        out.push({ x: n.position.x, y: n.position.y, width: n.width || 200, height: n.height || 100 });
    }
    return out;
}
