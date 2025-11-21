export const RENDER_CONFIG = {
    ANTIALIAS: true,
    backgroundColor: 0x10100E,
} as const;

export const CAMERA_CONFIG = {
    viewSize: 2,
    near: -10,
    far: 10,
    position: { z: 1 },
} as const;

export const CIRCLE_CONFIG = {
    radius: 0.5,
    segments: 64,
    color: 0xffffff,
} as const;

export const ZOOM_CONFIG = {
    min: 0.2,
    max: 5,
    factor: 1.1,
    initial: 1,
} as const;

export const PAN_CONFIG = {
    speed: 0.005,
} as const;

export const GRID_CONFIG = {
    size: 100,           // Number of grid lines in each direction
    spacing: 0.2,       // Distance between grid lines (circle diameter = 0.4, fits in 2x2 squares)
    color: 0x30302B,    // Grid line color (subtle gray)
    opacity: 0.3,       // Grid line opacity
} as const;