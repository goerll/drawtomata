export const RENDER_CONFIG = {
    ANTIALIAS: true,
    backgroundColor: 0x10100E,
} as const;

export const CAMERA_CONFIG = {
    viewSize: 4,         // Doubled from 2 to zoom out by 2x (half as zoomed in)
    near: -10,
    far: 10,
    position: { z: 1 },
} as const;

export const CIRCLE_CONFIG = {
    radius: 0.5,
    segments: 32,        // Reduced from 64 for 50% fewer triangles (imperceptible difference)
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
    color: 0x6c6c67,    // Grid line color (matches sidebar border)
    opacity: 1,         // Grid line opacity
    lineWidth: 2,       // Grid line thickness in pixels (using Line2 for proper width support)
} as const;

export const PERFORMANCE_CONFIG = {
    // Render loop optimization
    enableConditionalRendering: true,    // Only render when scene changes (huge CPU savings when idle)

    // Geometry detail (lower = better performance, minimal visual impact)
    curveSegments: 20,                   // Transition curve segments (reduced from 50)

    // Material pooling
    enableMaterialPooling: true,         // Reuse materials across objects
    enableGeometryPooling: true,         // Reuse geometries across objects
} as const;