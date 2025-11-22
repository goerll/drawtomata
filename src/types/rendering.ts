import * as THREE from 'three';

/**
 * Visual representation of an automaton state
 */
export interface VisualState {
    id: string;                    // Unique identifier (e.g., "q0", "q1")
    position: THREE.Vector2;       // Position in world coordinates
    mesh: THREE.Group;             // Three.js group containing circle and label
    isStart: boolean;              // Whether this is the start state
    isAccepting: boolean;          // Whether this is an accepting state
    isSelected: boolean;           // Whether this state is currently selected
    isFrontier: boolean;           // Whether this state is in the simulation frontier
}

/**
 * Visual state appearance configuration
 */
export const STATE_CONFIG = {
    radius: 0.2,                   // State circle radius
    segments: 64,                  // Circle segments for smoothness (higher = rounder)

    // Normal state appearance
    normal: {
        fillColor: 0x1E1F18,       // Cream fill
        strokeColor: 0x35362E,     // Cream stroke
        strokeWidth: 0.01,
    },

    // Start state appearance
    start: {
        fillColor: 0x1E1F18,       // Gold fill
        strokeColor: 0x35362E,     // Gold stroke (customizable separately)
        strokeWidth: 0.01,
    },

    // Accepting state appearance
    accepting: {
        fillColor: 0x1E1F18,       // Light green fill
        strokeColor: 0x35362E,     // Cream stroke
        strokeWidth: 0.01,
    },

    // Selected state appearance
    selected: {
        fillColor: 0x1E1F18,       // Blue fill
        strokeColor: 0xFDFFE0,     // Cream stroke
        strokeWidth: 0.01,
    },

    // Frontier state appearance (during simulation)
    frontier: {
        fillColor: 0x1E1F18,       // Keep base fill
        strokeColor: 0xA6E22E,     // Bright green stroke
        strokeWidth: 0.015,        // Slightly thicker
    },
} as const;
