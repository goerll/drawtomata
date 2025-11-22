import * as THREE from 'three';
import { VisualTransition, TRANSITION_CONFIG } from '../../types/Transition';
import { STATE_CONFIG } from '../../types/rendering';
import { FontType } from '../../contexts/AppStateContext';
import type { StateManager } from './StateManager';

/**
 * Manages the visual representation of automaton transitions
 */
export class TransitionManager {
    private transitions: Map<string, VisualTransition>;
    private scene: THREE.Scene;
    private stateManager: StateManager;
    private transitionCounter: number;
    private currentFont: FontType;

    constructor(scene: THREE.Scene, stateManager: StateManager) {
        this.transitions = new Map();
        this.scene = scene;
        this.stateManager = stateManager;
        this.transitionCounter = 0;
        this.currentFont = FontType.COMPUTER_MODERN;
    }

    /**
     * Creates a new transition between two states
     */
    public addTransition(fromStateId: string, toStateId: string, symbols: string[]): VisualTransition {
        const id = `t${this.transitionCounter++}`;

        // Get state positions
        const fromState = this.stateManager.getState(fromStateId);
        const toState = this.stateManager.getState(toStateId);

        if (!fromState || !toState) {
            throw new Error(`Cannot create transition: state not found`);
        }

        // Create visual representation
        const isSelfLoop = fromStateId === toStateId;
        const visual = isSelfLoop
            ? this.createSelfLoopVisual(fromState.position, symbols)
            : this.createCurvedTransitionVisual(fromState.position, toState.position, symbols);

        const transition: VisualTransition = {
            id,
            fromStateId,
            toStateId,
            symbols,
            ...visual,
        };

        this.transitions.set(id, transition);
        this.scene.add(visual.curve);
        this.scene.add(visual.arrowHead);
        this.scene.add(visual.label);

        return transition;
    }

    /**
     * Removes a transition by ID
     */
    public removeTransition(id: string): void {
        const transition = this.transitions.get(id);
        if (transition) {
            this.scene.remove(transition.curve);
            this.scene.remove(transition.arrowHead);
            this.scene.remove(transition.label);
            this.transitions.delete(id);
        }
    }

    /**
     * Updates a transition's symbols
     */
    public updateTransition(id: string, symbols: string[]): void {
        const transition = this.transitions.get(id);
        if (!transition) return;

        transition.symbols = symbols;

        // Recreate label with new symbols
        this.scene.remove(transition.label);
        const labelText = symbols.join(',');
        const newLabel = this.createTextLabel(labelText);
        newLabel.position.copy(transition.label.position);
        transition.label = newLabel;
        this.scene.add(newLabel);
    }

    /**
     * Gets a transition by ID
     */
    public getTransition(id: string): VisualTransition | undefined {
        return this.transitions.get(id);
    }

    /**
     * Gets all transitions
     */
    public getAllTransitions(): VisualTransition[] {
        return Array.from(this.transitions.values());
    }

    /**
     * Gets a transition by source and target state IDs
     */
    public getTransitionByStates(fromId: string, toId: string): VisualTransition | undefined {
        for (const transition of this.transitions.values()) {
            if (transition.fromStateId === fromId && transition.toStateId === toId) {
                return transition;
            }
        }
        return undefined;
    }

    /**
     * Gets the transition at the given position (if any)
     * Uses a distance threshold to detect clicks near the curve
     */
    public getTransitionAtPosition(position: THREE.Vector2, threshold: number = 0.05): VisualTransition | undefined {
        const clickPoint = new THREE.Vector3(position.x, position.y, 0);

        for (const transition of this.transitions.values()) {
            if (!transition.path) continue;

            // Check distance to the curve path
            // We approximate by checking distance to segments
            const points = transition.path.getPoints(TRANSITION_CONFIG.curveSegments);

            for (let i = 0; i < points.length - 1; i++) {
                const start = points[i];
                const end = points[i + 1];

                // Calculate distance from point to line segment
                const line = new THREE.Line3(start, end);
                const closestPoint = new THREE.Vector3();
                line.closestPointToPoint(clickPoint, true, closestPoint);

                const distance = clickPoint.distanceTo(closestPoint);

                if (distance < threshold) {
                    return transition;
                }
            }
        }

        return undefined;
    }

    /**
     * Updates visual positions of all transitions connected to the given state
     */
    public updateTransitionPositions(stateId: string): void {
        this.transitions.forEach(transition => {
            if (transition.fromStateId === stateId || transition.toStateId === stateId) {
                const fromState = this.stateManager.getState(transition.fromStateId);
                const toState = this.stateManager.getState(transition.toStateId);

                if (fromState && toState) {
                    // Remove old visuals
                    this.scene.remove(transition.curve);
                    this.scene.remove(transition.arrowHead);
                    this.scene.remove(transition.label);

                    // Create new visuals
                    const isSelfLoop = transition.fromStateId === transition.toStateId;
                    const visual = isSelfLoop
                        ? this.createSelfLoopVisual(fromState.position, transition.symbols)
                        : this.createCurvedTransitionVisual(fromState.position, toState.position, transition.symbols);

                    // Update transition object
                    transition.curve = visual.curve;
                    transition.path = visual.path;
                    transition.arrowHead = visual.arrowHead;
                    transition.label = visual.label;

                    // Add new visuals
                    this.scene.add(transition.curve);
                    this.scene.add(transition.arrowHead);
                    this.scene.add(transition.label);
                }
            }
        });
    }

    /**
     * Helper to create a rectangular mesh line with rounded caps
     */
    private createLineMesh(start: THREE.Vector3, end: THREE.Vector3, thickness: number, color: number): THREE.Mesh {
        const length = start.distanceTo(end);
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const material = new THREE.MeshBasicMaterial({ color });

        // Create a rectangle geometry
        const geometry = new THREE.PlaneGeometry(length, thickness);
        const mesh = new THREE.Mesh(geometry, material);

        // Position at midpoint
        mesh.position.set(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
            0
        );

        // Rotate to align with the line direction
        mesh.rotation.z = angle;

        return mesh;
    }

    /**
     * Creates a curved transition between two different states
     */
    private createCurvedTransitionVisual(
        fromPos: THREE.Vector2,
        toPos: THREE.Vector2,
        symbols: string[]
    ): { curve: THREE.Group; path: THREE.Curve<THREE.Vector3>; arrowHead: THREE.Group; label: THREE.Sprite } {
        const group = new THREE.Group();

        // Calculate curve points
        const start = new THREE.Vector3(fromPos.x, fromPos.y, 0);
        const end = new THREE.Vector3(toPos.x, toPos.y, 0);

        // Calculate control point for quadratic Bézier curve
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const direction = new THREE.Vector3().subVectors(end, start);
        const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
        const controlPoint = mid.clone().add(perpendicular.multiplyScalar(TRANSITION_CONFIG.curveControlOffset));

        // Adjust start and end points to be on the edge of state circles
        const startDir = new THREE.Vector3().subVectors(controlPoint, start).normalize();
        const endDir = new THREE.Vector3().subVectors(end, controlPoint).normalize();
        start.add(startDir.multiplyScalar(STATE_CONFIG.radius));
        end.sub(endDir.multiplyScalar(STATE_CONFIG.radius));

        // Create curve using quadratic Bézier
        const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
        const points = curve.getPoints(TRANSITION_CONFIG.curveSegments);

        // Create thick line segments for the curve
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const segment = this.createLineMesh(p1, p2, TRANSITION_CONFIG.curveWidth, TRANSITION_CONFIG.curveColor);
            group.add(segment);

            // Add rounded cap at joints to smooth it out
            if (i < points.length - 2) {
                const cap = new THREE.Mesh(
                    new THREE.CircleGeometry(TRANSITION_CONFIG.curveWidth / 2, 8),
                    new THREE.MeshBasicMaterial({ color: TRANSITION_CONFIG.curveColor })
                );
                cap.position.copy(p2);
                group.add(cap);
            }
        }

        // Create arrow head at the end
        const arrowHead = this.createArrowHead(points[points.length - 2]!, points[points.length - 1]!);

        // Create label at midpoint
        const labelText = symbols.join(',');
        const label = this.createTextLabel(labelText);
        const labelPos = curve.getPoint(TRANSITION_CONFIG.labelOffset);
        label.position.copy(labelPos);

        return { curve: group, path: curve, arrowHead, label };
    }

    /**
     * Creates a self-loop transition
     */
    private createSelfLoopVisual(
        pos: THREE.Vector2,
        symbols: string[]
    ): { curve: THREE.Group; path: THREE.Curve<THREE.Vector3>; arrowHead: THREE.Group; label: THREE.Sprite } {
        const group = new THREE.Group();
        const center = new THREE.Vector3(pos.x, pos.y, 0);

        // Define start and end points on the state circle (top-left and top-right)
        // standard angle 0 is right, 90 is up. 
        // Start at 135 degrees (top-left), End at 45 degrees (top-right)
        const startAngle = 2 * Math.PI / 3; // 135 degrees
        const endAngle = Math.PI / 3;       // 45 degrees

        const start = new THREE.Vector3(
            center.x + STATE_CONFIG.radius * Math.cos(startAngle),
            center.y + STATE_CONFIG.radius * Math.sin(startAngle),
            0
        );

        const end = new THREE.Vector3(
            center.x + STATE_CONFIG.radius * Math.cos(endAngle),
            center.y + STATE_CONFIG.radius * Math.sin(endAngle),
            0
        );

        // Control points to create an arch
        // We want the peak to be selfLoopHeight above the state top
        const peakHeight = STATE_CONFIG.radius + TRANSITION_CONFIG.selfLoopHeight;

        const cp1 = new THREE.Vector3(
            start.x - 0.05, // Slightly outward
            center.y + peakHeight,
            0
        );

        const cp2 = new THREE.Vector3(
            end.x + 0.05,   // Slightly outward
            center.y + peakHeight,
            0
        );

        // Create cubic Bezier curve
        const curve = new THREE.CubicBezierCurve3(start, cp1, cp2, end);
        const points = curve.getPoints(TRANSITION_CONFIG.curveSegments);

        // Create thick line segments for the curve
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const segment = this.createLineMesh(p1, p2, TRANSITION_CONFIG.curveWidth, TRANSITION_CONFIG.curveColor);
            group.add(segment);

            // Add rounded cap at joints
            if (i < points.length - 2) {
                const cap = new THREE.Mesh(
                    new THREE.CircleGeometry(TRANSITION_CONFIG.curveWidth / 2, 8),
                    new THREE.MeshBasicMaterial({ color: TRANSITION_CONFIG.curveColor })
                );
                cap.position.copy(p2);
                group.add(cap);
            }
        }

        // Create arrow head at the end
        // Use the last two points to determine direction
        const arrowHead = this.createArrowHead(points[points.length - 2]!, points[points.length - 1]!);

        // Create label above the loop peak
        const labelText = symbols.join(',');
        const label = this.createTextLabel(labelText);
        // Position label at the peak of the curve (approx t=0.5)
        const peakPoint = curve.getPoint(0.5);
        label.position.set(peakPoint.x, peakPoint.y + 0.05, 0.01);

        return { curve: group, path: curve, arrowHead, label };
    }

    /**
     * Creates an arrow head pointing from prevPoint to point using rounded style
     */
    private createArrowHead(prevPoint: THREE.Vector3, point: THREE.Vector3): THREE.Group {
        const group = new THREE.Group();
        const direction = new THREE.Vector3().subVectors(point, prevPoint).normalize();
        const angle = Math.atan2(direction.y, direction.x);

        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: TRANSITION_CONFIG.arrowHeadColor,
        });

        const headSize = TRANSITION_CONFIG.arrowHeadSize;
        const thickness = TRANSITION_CONFIG.curveWidth;

        // Helper function to create a rectangular mesh between two points
        const createLineMesh = (start: THREE.Vector3, end: THREE.Vector3): THREE.Mesh => {
            const length = start.distanceTo(end);
            const lineAngle = Math.atan2(end.y - start.y, end.x - start.x);
            const geometry = new THREE.PlaneGeometry(length, thickness);
            const mesh = new THREE.Mesh(geometry, arrowMaterial);
            mesh.position.set((start.x + end.x) / 2, (start.y + end.y) / 2, 0.01);
            mesh.rotation.z = lineAngle;
            return mesh;
        };

        // Arrow tip at 'point'
        const tipPoint = point.clone();
        const upperPoint = new THREE.Vector3(
            point.x - headSize * Math.cos(angle - Math.PI / 6),
            point.y - headSize * Math.sin(angle - Math.PI / 6),
            0
        );
        const lowerPoint = new THREE.Vector3(
            point.x - headSize * Math.cos(angle + Math.PI / 6),
            point.y - headSize * Math.sin(angle + Math.PI / 6),
            0
        );

        // Upper arm of V
        const upperArm = createLineMesh(tipPoint, upperPoint);
        group.add(upperArm);

        // Lower arm of V
        const lowerArm = createLineMesh(tipPoint, lowerPoint);
        group.add(lowerArm);

        // Rounded cap at tip (shared by both arms)
        const tipCap = new THREE.Mesh(
            new THREE.CircleGeometry(thickness / 2, 16),
            arrowMaterial
        );
        tipCap.position.set(tipPoint.x, tipPoint.y, 0.01);
        group.add(tipCap);

        // Rounded cap at upper arm end
        const upperCap = new THREE.Mesh(
            new THREE.CircleGeometry(thickness / 2, 16),
            arrowMaterial
        );
        upperCap.position.set(upperPoint.x, upperPoint.y, 0.01);
        group.add(upperCap);

        // Rounded cap at lower arm end
        const lowerCap = new THREE.Mesh(
            new THREE.CircleGeometry(thickness / 2, 16),
            arrowMaterial
        );
        lowerCap.position.set(lowerPoint.x, lowerPoint.y, 0.01);
        group.add(lowerCap);

        return group;
    }

    /**
     * Creates a text label sprite using canvas texture
     */
    private createTextLabel(text: string): THREE.Sprite {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;

        const fontSize = TRANSITION_CONFIG.labelFontSize;
        canvas.width = 512;
        canvas.height = 128;

        // Map FontType to CSS font family - enum values are the actual font names
        const fontFamily = `${this.currentFont}, ${this.currentFont === FontType.SATOSHI ? 'sans-serif' : 'serif'}`;

        // Configure text rendering
        context.font = `bold ${fontSize}px ${fontFamily}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        const colorStr = '#' + TRANSITION_CONFIG.labelColor.toString(16).padStart(6, '0');
        context.fillStyle = colorStr;

        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });

        const sprite = new THREE.Sprite(material);
        const scale = 0.2;
        sprite.scale.set(scale * 4, scale, 1);

        return sprite;
    }

    /**
     * Clears all transitions
     */
    public clear(): void {
        this.transitions.forEach(transition => {
            this.scene.remove(transition.curve);
            this.scene.remove(transition.arrowHead);
            this.scene.remove(transition.label);
        });
        this.transitions.clear();
        this.transitionCounter = 0;
    }

    /**
     * Sets the font for all transition labels
     */
    public setFont(font: FontType): void {
        this.currentFont = font;

        // Regenerate all transition labels with the new font
        this.transitions.forEach(transition => {
            const labelText = transition.symbols.join(',');

            // Remove old label
            this.scene.remove(transition.label);

            // Create new label with updated font
            const newLabel = this.createTextLabel(labelText);
            newLabel.position.copy(transition.label.position);
            transition.label = newLabel;

            // Add new label to scene
            this.scene.add(newLabel);
        });
    }
}
