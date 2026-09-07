/**
 * layout — a banded auto-layout: items grouped by a key, each group a
 * labelled BAND stacked down one column, so kinds never interleave
 * (people above services above agents; hosts above containers; …). A
 * collapsed band keeps only its header. The host turns the result into
 * nodes; nothing here knows what an item is.
 */
export interface BandItem {
    id: string;
    height: number;
}

export interface BandSpec {
    key: string;
    label?: string;
    items: BandItem[];
    collapsed?: boolean;
}

export interface BandLayoutOptions {
    bands: BandSpec[];
    /** Left edge of the column (default 0). */
    x?: number;
    /** Top of the first band (default 0). */
    y?: number;
    /** Width of the band and of every item in it. */
    width: number;
    /** Vertical gap between items (default 12). */
    gap?: number;
    /** Vertical gap between bands (default 32). */
    bandGap?: number;
    /** Height of the band header strip (default 28). */
    headerHeight?: number;
    /** Inset of items from the band's left/right/bottom edge (default 10). */
    inset?: number;
}

export interface PlacedBand {
    key: string;
    label?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    collapsed: boolean;
    count: number;
}

export interface BandLayout {
    positions: Record<string, { x: number; y: number }>;
    bands: PlacedBand[];
    /** Total height of the column. */
    height: number;
    /** Width of the column (the bands). */
    width: number;
}

export function layoutBands(o: BandLayoutOptions): BandLayout {
    const x = o.x ?? 0;
    const gap = o.gap ?? 12;
    const bandGap = o.bandGap ?? 32;
    const header = o.headerHeight ?? 28;
    const inset = o.inset ?? 10;
    const positions: Record<string, { x: number; y: number }> = {};
    const bands: PlacedBand[] = [];
    let y = o.y ?? 0;

    for (const band of o.bands) {
        if (band.items.length === 0) continue;

        const top = y;
        let cy = top + header;
        if (!band.collapsed) {
            cy += inset;
            for (const item of band.items) {
                positions[item.id] = { x: x + inset, y: cy };
                cy += item.height + gap;
            }
            cy = cy - gap + inset;
        }

        const height = Math.max(header, cy - top);
        bands.push({ key: band.key, label: band.label, x, y: top, width: o.width + (band.collapsed ? 0 : 2 * inset), height, collapsed: !!band.collapsed, count: band.items.length });
        y = top + height + bandGap;
    }

    const height = bands.length ? y - bandGap - (o.y ?? 0) : 0;
    return { positions, bands, height, width: o.width + 2 * inset };
}
