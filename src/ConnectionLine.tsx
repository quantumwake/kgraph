import React from 'react';
import { getBezierPath } from './bezier';
import { HandlePosition } from './types';

interface ConnectionLineProps {
    sourceX: number;
    sourceY: number;
    sourcePosition: HandlePosition;
    targetX: number;
    targetY: number;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
}) => {
    // Pick a reasonable target position based on relative location
    let targetPosition: HandlePosition = 'top';
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    if (Math.abs(dx) > Math.abs(dy)) {
        targetPosition = dx > 0 ? 'left' : 'right';
    } else {
        targetPosition = dy > 0 ? 'top' : 'bottom';
    }

    const [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <g className="kgraph-connection-line">
            <path
                d={path}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="6 3"
                opacity={0.8}
            />
            <circle
                cx={targetX}
                cy={targetY}
                r={6}
                fill="#8b5cf6"
                opacity={0.6}
            />
        </g>
    );
};

export default ConnectionLine;
