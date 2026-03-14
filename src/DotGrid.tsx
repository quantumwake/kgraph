import React from 'react';
import { KGraphViewport } from './types';

interface DotGridProps {
    viewport: KGraphViewport;
    gap?: number;
    color?: string;
    size?: number;
}

const DotGrid: React.FC<DotGridProps> = ({
    viewport,
    gap = 32,
    color = 'rgba(255, 255, 255, 0.15)',
    size = 1.5,
}) => {
    const scaledGap = gap * viewport.zoom;
    const scaledSize = size * viewport.zoom;
    const patternId = 'kgraph-dot-pattern';

    // Offset pattern to follow viewport
    const offsetX = viewport.x % scaledGap;
    const offsetY = viewport.y % scaledGap;

    return (
        <svg
            className="kgraph-background"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
        >
            <defs>
                <pattern
                    id={patternId}
                    x={offsetX}
                    y={offsetY}
                    width={scaledGap}
                    height={scaledGap}
                    patternUnits="userSpaceOnUse"
                >
                    <circle
                        cx={scaledSize}
                        cy={scaledSize}
                        r={scaledSize}
                        fill={color}
                    />
                </pattern>
            </defs>
            <rect
                width="100%"
                height="100%"
                fill={`url(#${patternId})`}
            />
        </svg>
    );
};

export default DotGrid;
