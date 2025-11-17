export const RENDER_CONFIG = {
    antialias: true,
    backgroundColor: 0x000000,
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