import type { MouseEvent } from 'react';
import { Handle } from '../index';
import type { NodeComponentProps, HandleType, HandlePosition } from '../types';
import { Database, Cpu, Shuffle, FunctionSquare, Plug, Minus, Plus, type LucideIcon } from 'lucide-react';

// Footprint matches the Alethic ISM studio so published/exported layouts align.
export const NODE_WIDTH = 208;
export const NODE_HEIGHT = 120;
export const NODE_COLLAPSED = 44;

export type StudioNodeKind = 'state' | 'processor' | 'transform' | 'function' | 'connector';

// Display fields precomputed by the host and placed on node.data.
export interface StudioNodeData {
    kind?: StudioNodeKind;
    typeLabel?: string;
    title?: string;
    subtitle?: string;
    // Injected by StudioGraph for collapse support.
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    [key: string]: unknown;
}

// Dark studio palette (self-contained — no consumer Tailwind tokens needed).
const KIND: Record<StudioNodeKind, { accent: string; glow: string; icon: LucideIcon }> = {
    state: { accent: '#34d399', glow: 'rgba(16,185,129,0.18)', icon: Database }, // emerald
    processor: { accent: '#fbbf24', glow: 'rgba(245,158,11,0.18)', icon: Cpu }, // amber
    transform: { accent: '#a78bfa', glow: 'rgba(139,92,246,0.18)', icon: Shuffle }, // violet
    function: { accent: '#38bdf8', glow: 'rgba(14,165,233,0.18)', icon: FunctionSquare }, // sky
    connector: { accent: '#94a3b8', glow: 'rgba(100,116,139,0.18)', icon: Plug }, // slate
};

export function kindForNodeType(nodeType: string): StudioNodeKind {
    if (nodeType === 'state') return 'state';
    if (nodeType.includes('coalescer') || nodeType.includes('composite')) return 'transform';
    if (nodeType.startsWith('function')) return 'function';
    if (nodeType.startsWith('connector')) return 'connector';
    return 'processor';
}

const PROCESSOR_LABELS: Record<string, string> = {
    processor_openai: 'OpenAI',
    processor_visual_openai: 'Vision',
    processor_anthropic: 'Anthropic',
    processor_google_ai: 'Google AI',
    processor_llama: 'Llama',
    processor_mistral: 'Mistral',
    processor_python: 'Python',
    processor_provider: 'Provider',
    processor_state_coalescer: 'Coalescer',
    processor_state_composite: 'Composite',
    function_datasource_sql: 'SQL Source',
    connector_source: 'Source',
    connector_sink: 'Sink',
    trainer: 'Trainer',
    processor: 'Processor',
};

export function displayType(nodeType: string): string {
    if (PROCESSOR_LABELS[nodeType]) return PROCESSOR_LABELS[nodeType];
    const cleaned = nodeType.replace(/^processor_/, '').replace(/_/g, ' ');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const HANDLES: { id: string; type: HandleType; position: HandlePosition }[] = [
    { id: 'target-1', type: 'target', position: 'top' },
    { id: 'target-2', type: 'target', position: 'left' },
    { id: 'target-3', type: 'target', position: 'right' },
    { id: 'target-4', type: 'target', position: 'bottom' },
    { id: 'source-1', type: 'source', position: 'top' },
    { id: 'source-2', type: 'source', position: 'left' },
    { id: 'source-3', type: 'source', position: 'right' },
    { id: 'source-4', type: 'source', position: 'bottom' },
];
const hiddenHandle = { opacity: 0, width: 8, height: 8, pointerEvents: 'none' as const };

/**
 * StudioNode — read-only kgraph node card in the Alethic ISM studio aesthetic
 * (gradient tinted by type, neon accent header, glowing border when selected).
 * Display fields come from node.data (StudioNodeData).
 */
export function StudioNode({ data, selected }: NodeComponentProps) {
    const d = data as StudioNodeData;
    const kind: StudioNodeKind = d.kind && d.kind in KIND ? d.kind : 'processor';
    const cfg = KIND[kind];
    const Icon = cfg.icon;
    const title = d.title || d.typeLabel || kind;

    const shellStyle = {
        backgroundImage: `linear-gradient(135deg, ${cfg.glow} 0%, #1e1e22 55%, #161618 100%)`,
        border: `1.5px solid ${selected ? cfg.accent : '#33333a'}`,
        boxShadow: selected ? `0 0 0 1px ${cfg.accent}, 0 0 18px ${cfg.glow}` : '0 1px 3px rgba(0,0,0,0.4)',
    };

    const toggle = (e: MouseEvent) => {
        e.stopPropagation();
        d.onToggleCollapse?.();
    };

    if (d.collapsed) {
        return (
            <div className="group relative flex items-center justify-center rounded-lg" style={{ width: NODE_COLLAPSED, height: NODE_COLLAPSED, ...shellStyle }} title={`${d.typeLabel ?? ''} · ${title}`}>
                {HANDLES.map((h) => (
                    <Handle key={`${h.type}-${h.position}`} id={h.id} type={h.type} position={h.position} style={hiddenHandle} />
                ))}
                <Icon className="h-5 w-5" style={{ color: cfg.accent }} />
                <button
                    onClick={toggle}
                    title="Expand"
                    className="absolute right-0.5 top-0.5 hidden rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-slate-100 group-hover:block"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
        );
    }

    return (
        <div className="group relative overflow-hidden rounded-lg" style={{ width: NODE_WIDTH, height: NODE_HEIGHT, ...shellStyle }}>
            {HANDLES.map((h) => (
                <Handle key={`${h.type}-${h.position}`} id={h.id} type={h.type} position={h.position} style={hiddenHandle} />
            ))}

            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: cfg.accent }} />
                <span className="truncate text-[11px] font-semibold uppercase tracking-wide" style={{ color: cfg.accent }}>
                    {d.typeLabel}
                </span>
                {d.onToggleCollapse ? (
                    <button onClick={toggle} title="Collapse" className="ml-auto rounded p-0.5 text-slate-500 hover:bg-white/10 hover:text-slate-200">
                        <Minus className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>

            <div className="px-3 py-2">
                <div className="truncate text-sm font-medium" style={{ color: '#f1f5f9' }} title={title}>
                    {title}
                </div>
                {d.subtitle ? (
                    <div className="mt-0.5 truncate text-xs" style={{ color: '#94a3b8' }}>
                        {d.subtitle}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
