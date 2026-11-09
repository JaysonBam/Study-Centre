import { Box } from '@mui/material';

import type { FilamentGeometry } from '../model/filamentGeometry';

export function FilamentBackdrop({ geometry }: { geometry: FilamentGeometry | null }) {
  if (!geometry) return null;

  return (
    <Box className="filament-backdrop" aria-hidden="true">
      <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none">
        <defs>
          <filter id="filament-text-feather" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="52" />
          </filter>
          <mask
            id="filament-text-mask"
            x="0"
            y="0"
            width={geometry.width}
            height={geometry.height}
            maskUnits="userSpaceOnUse"
          >
            <rect width={geometry.width} height={geometry.height} fill="white" />
            {geometry.fades.map((fade, index) => (
              <rect
                key={index}
                x={fade.x}
                y={fade.y}
                width={fade.width}
                height={fade.height}
                rx="40"
                fill="#666"
                filter="url(#filament-text-feather)"
              />
            ))}
          </mask>
        </defs>
        <g mask="url(#filament-text-mask)">
          <path className="filament-shadow" d={geometry.path} />
          <path className="filament-core" d={geometry.path} />
        </g>
      </svg>
    </Box>
  );
}
