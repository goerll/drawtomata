import * as THREE from 'three';

/**
 * Logical transition in the automaton
 */
export interface Transition {
    id: string;                    // Unique identifier for this transition
    fromStateId: string;           // Source state
    toStateId: string;             // Target state
    symbols: string[];             // Transition symbols (can include 'ε')
}

/**
 * Visual representation of a transition
 */
export interface VisualTransition extends Transition {
    curve: THREE.Group;            // The curved path (Group of meshes for thickness)
    path: THREE.Curve<THREE.Vector3>; // The mathematical curve object (for hit testing)
    arrowHead: THREE.Group;        // Arrow head at the end
    label: THREE.Sprite;           // Text label for symbols
}

/**
 * Transition visual appearance configuration
 */
export const TRANSITION_CONFIG = {
    // Curve appearance
    curveColor: 0x35362E,          // Cream color for transition curves
    curveWidth: 0.01,              // Match start state arrow thickness
    curveSegments: 20,             // Number of segments for smooth curve (optimized for performance)

    // Arrow head
    arrowHeadSize: 0.04,           // Match start state arrow head size
    arrowHeadColor: 0x35362E,

    // Self-loop configuration
    selfLoopHeight: 0.2,           // Height of the loop peak above the state
    selfLoopWidth: 0.5,            // Width factor (relative to radius)

    // Curve control point (for curves between different states)
    curveControlOffset: 0.15,      // How far the curve bends (perpendicular to line)

    // Label styling
    labelColor: 0xFFFFE3,          // Cream color for labels
    labelFontSize: 48,
    labelOffset: 0.5,              // Position along curve (0 = start, 1 = end, 0.5 = middle)
} as const;
