import { useCallback, useEffect, useMemo, useState } from 'react';
import { KGraphNode, NodeChange } from './types';

/**
 * positions — the host computes a layout; the viewer drags things where
 * they like; the two meet here. Overrides are the positions the viewer
 * chose, kept per storage key (per tenant, per board…) in localStorage —
 * a per-viewer convenience, never shared state.
 *
 * Children follow their parent: `applyPositions` shifts a node with no
 * override of its own by the delta its nearest overridden ancestor was
 * moved, so dragging a member carries its credentials along and the next
 * re-layout keeps them attached.
 */
export type Positions = Record<string, { x: number; y: number }>;

export type ParentOf = (id: string) => string | undefined;

const PREFIX = 'kgraph:positions:';

export function loadPositions(key: string): Positions {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? (JSON.parse(raw) as Positions) : {};
    } catch {
        return {};
    }
}

export function savePositions(key: string, positions: Positions): void {
    try {
        if (Object.keys(positions).length === 0) localStorage.removeItem(PREFIX + key);
        else localStorage.setItem(PREFIX + key, JSON.stringify(positions));
    } catch {
        /* storage unavailable: positions live for the render only */
    }
}

/**
 * applyPositions — layout positions overridden by the viewer's, children
 * shifted with their overridden ancestors.
 */
export function applyPositions(nodes: KGraphNode[], overrides: Positions, parentOf?: ParentOf): KGraphNode[] {
    if (Object.keys(overrides).length === 0) return nodes;

    const layout = new Map(nodes.map((n) => [n.id, n.position]));
    const deltaOf = (id: string): { x: number; y: number } | null => {
        let cur: string | undefined = id;
        for (let depth = 0; cur && depth < 16; depth++) {
            const o = overrides[cur];
            const l = layout.get(cur);
            if (o && l) return { x: o.x - l.x, y: o.y - l.y };
            cur = parentOf?.(cur);
        }
        return null;
    };

    return nodes.map((n) => {
        const own = overrides[n.id];
        if (own) return { ...n, position: own };

        const parent = parentOf?.(n.id);
        const d = parent ? deltaOf(parent) : null;
        if (!d || (d.x === 0 && d.y === 0)) return n;

        return { ...n, position: { x: n.position.x + d.x, y: n.position.y + d.y } };
    });
}

export interface PersistedPositions {
    /** The viewer's overrides (node id → position). */
    overrides: Positions;
    /** Wire to the canvas: records drags, ignores everything else. */
    onNodesChange: (changes: NodeChange[]) => void;
    /** Forget every override — back to the computed layout. */
    reset: () => void;
    /** Whether anything has been moved. */
    dirty: boolean;
    /** The layout with the overrides applied. */
    apply: (nodes: KGraphNode[]) => KGraphNode[];
}

/**
 * usePersistedPositions — overrides for one storage key (null disables
 * persistence and keeps them for the session).
 */
export function usePersistedPositions(key: string | null, parentOf?: ParentOf): PersistedPositions {
    const [overrides, setOverrides] = useState<Positions>(() => (key ? loadPositions(key) : {}));

    useEffect(() => {
        setOverrides(key ? loadPositions(key) : {});
    }, [key]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        const moves = changes.filter((c) => c.type === 'position' && c.position);
        if (moves.length === 0) return;

        setOverrides((prev) => {
            const next = { ...prev };
            for (const c of moves) {
                if (c.type === 'position' && c.position) next[c.id] = c.position;
            }
            if (key) savePositions(key, next);
            return next;
        });
    }, [key]);

    const reset = useCallback(() => {
        setOverrides({});
        if (key) savePositions(key, {});
    }, [key]);

    const apply = useCallback((nodes: KGraphNode[]) => applyPositions(nodes, overrides, parentOf), [overrides, parentOf]);

    return useMemo(() => ({
        overrides, onNodesChange, reset, dirty: Object.keys(overrides).length > 0, apply,
    }), [overrides, onNodesChange, reset, apply]);
}
