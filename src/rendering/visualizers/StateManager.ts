import * as THREE from 'three';
import { VisualState, STATE_CONFIG } from '../../types/rendering';
import { FontType } from '../../contexts/AppStateContext';

/**
 * Manages the visual representation of automaton states
 */
export class StateManager {
    private states: Map<string, VisualState>;
    private scene: THREE.Scene;
    private stateCounter: number;
    private currentFont: FontType;

    constructor(scene: THREE.Scene) {
        this.states = new Map();
        this.scene = scene;
        this.stateCounter = 0;
        this.currentFont = FontType.COMPUTER_MODERN;
    }

    /**
     * Creates a new state at the specified position
     */
    public addState(position: THREE.Vector2, isStart: boolean = false, isAccepting: boolean = false): VisualState {
        const id = `q${this.stateCounter++}`;

        // Create visual group for this state
        const stateGroup = this.createStateVisual(id, isStart, isAccepting);
        stateGroup.position.set(position.x, position.y, 0);

        const visualState: VisualState = {
            id,
            position: position.clone(),
            mesh: stateGroup,
            isStart,
            isAccepting,
            isSelected: false,
        };

        this.states.set(id, visualState);
        this.scene.add(stateGroup);

        return visualState;
    }

    /**
     * Removes a state by ID
     */
    public removeState(id: string): void {
        const state = this.states.get(id);
        if (state) {
            this.scene.remove(state.mesh);
            this.states.delete(id);
        }
    }

    /**
     * Gets a state by ID
     */
    public getState(id: string): VisualState | undefined {
        return this.states.get(id);
    }

    /**
     * Gets all states
     */
    public getAllStates(): VisualState[] {
        return Array.from(this.states.values());
    }

    /**
     * Checks if a position overlaps with any state
     */
    public getStateAtPosition(position: THREE.Vector2): VisualState | null {
        for (const state of this.states.values()) {
            const distance = position.distanceTo(state.position);
            if (distance <= STATE_CONFIG.radius) {
                return state;
            }
        }
        return null;
    }

    /**
     * Gets all states within a rectangular box
     */
    public getStatesInBox(min: THREE.Vector2, max: THREE.Vector2): VisualState[] {
        const statesInBox: VisualState[] = [];

        for (const state of this.states.values()) {
            // Check if state circle intersects with box
            const closestX = Math.max(min.x, Math.min(state.position.x, max.x));
            const closestY = Math.max(min.y, Math.min(state.position.y, max.y));

            const distanceX = state.position.x - closestX;
            const distanceY = state.position.y - closestY;
            const distanceSquared = distanceX * distanceX + distanceY * distanceY;

            if (distanceSquared <= STATE_CONFIG.radius * STATE_CONFIG.radius) {
                statesInBox.push(state);
            }
        }

        return statesInBox;
    }

    /**
     * Selects a state by ID
     */
    public selectState(id: string): void {
        this.updateState(id, { isSelected: true });
    }

    /**
     * Deselects a state by ID
     */
    public deselectState(id: string): void {
        this.updateState(id, { isSelected: false });
    }

    /**
     * Deselects all states
     */
    public deselectAll(): void {
        this.states.forEach(state => {
            if (state.isSelected) {
                this.deselectState(state.id);
            }
        });
    }

    /**
     * Gets all currently selected states
     */
    public getSelectedStates(): VisualState[] {
        return Array.from(this.states.values()).filter(state => state.isSelected);
    }

    /**
     * Moves a state to a new position
     */
    public moveState(id: string, newPosition: THREE.Vector2): void {
        const state = this.states.get(id);
        if (!state) return;

        state.position.copy(newPosition);
        state.mesh.position.set(newPosition.x, newPosition.y, 0);
    }

    /**
     * Updates a state's appearance
     */
    public updateState(id: string, updates: Partial<Pick<VisualState, 'isStart' | 'isAccepting' | 'isSelected'>>): void {
        const state = this.states.get(id);
        if (!state) return;

        if (updates.isStart !== undefined) state.isStart = updates.isStart;
        if (updates.isAccepting !== undefined) state.isAccepting = updates.isAccepting;
        if (updates.isSelected !== undefined) state.isSelected = updates.isSelected;

        // Recreate visual to reflect changes
        this.scene.remove(state.mesh);
        state.mesh = this.createStateVisual(id, state.isStart, state.isAccepting, state.isSelected);
        state.mesh.position.set(state.position.x, state.position.y, 0);
        this.scene.add(state.mesh);
    }

    /**
     * Creates the Three.js visual representation of a state
     */
    private createStateVisual(id: string, isStart: boolean, isAccepting: boolean, isSelected: boolean = false): THREE.Group {
        const group = new THREE.Group();

        // Determine which config to use based on state type (priority: selected > start > accepting > normal)
        let config;
        if (isSelected) {
            config = STATE_CONFIG.selected;
        } else if (isStart) {
            config = STATE_CONFIG.start;
        } else if (isAccepting) {
            config = STATE_CONFIG.accepting;
        } else {
            config = STATE_CONFIG.normal;
        }

        // Create filled circle
        const circleGeometry = new THREE.CircleGeometry(STATE_CONFIG.radius, STATE_CONFIG.segments);
        const circleMaterial = new THREE.MeshBasicMaterial({ color: config.fillColor });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        group.add(circle);

        // Create circle outline
        const outlineGeometry = new THREE.RingGeometry(
            STATE_CONFIG.radius - config.strokeWidth / 2,
            STATE_CONFIG.radius + config.strokeWidth / 2,
            STATE_CONFIG.segments
        );
        const outlineMaterial = new THREE.MeshBasicMaterial({ color: config.strokeColor });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        group.add(outline);

        // If accepting state, add inner circle
        if (isAccepting) {
            const innerRadius = STATE_CONFIG.radius * 0.85;
            const innerOutlineGeometry = new THREE.RingGeometry(
                innerRadius - config.strokeWidth / 2,
                innerRadius + config.strokeWidth / 2,
                STATE_CONFIG.segments
            );
            const innerOutline = new THREE.Mesh(innerOutlineGeometry, outlineMaterial);
            group.add(innerOutline);
        }

        // If start state, add arrow indicator pointing from the left
        if (isStart) {
            const arrowLength = 0.1; // One grid square
            const arrowHeadSize = 0.04;
            const lineThickness = 0.010; // Thickness of arrow lines

            // Material for arrow meshes
            const arrowMaterial = new THREE.MeshBasicMaterial({
                color: config.strokeColor,
            });

            // Helper function to create a rectangular mesh between two points
            const createLineMesh = (start: THREE.Vector3, end: THREE.Vector3, thickness: number): THREE.Mesh => {
                const length = start.distanceTo(end);
                const angle = Math.atan2(end.y - start.y, end.x - start.x);

                // Create a rectangle geometry
                const geometry = new THREE.PlaneGeometry(length, thickness);
                const mesh = new THREE.Mesh(geometry, arrowMaterial);

                // Position at midpoint
                mesh.position.set(
                    (start.x + end.x) / 2,
                    (start.y + end.y) / 2,
                    0
                );

                // Rotate to align with the line direction
                mesh.rotation.z = angle;

                return mesh;
            };

            // Arrow shaft (horizontal line from left)
            const shaftStart = new THREE.Vector3(-STATE_CONFIG.radius - arrowLength, 0, 0);
            const shaftEnd = new THREE.Vector3(-STATE_CONFIG.radius, 0, 0);

            const shaft = createLineMesh(shaftStart, shaftEnd, lineThickness);
            group.add(shaft);

            // Rounded cap at shaft start
            const shaftStartCap = new THREE.Mesh(
                new THREE.CircleGeometry(lineThickness / 2, 16),
                arrowMaterial
            );
            shaftStartCap.position.set(shaftStart.x, shaftStart.y, 0);
            group.add(shaftStartCap);

            // Arrow head - open V shape (two lines forming angle)
            const tipPoint = new THREE.Vector3(-STATE_CONFIG.radius, 0, 0);
            const upperPoint = new THREE.Vector3(-STATE_CONFIG.radius - arrowHeadSize, arrowHeadSize * 0.6, 0);
            const lowerPoint = new THREE.Vector3(-STATE_CONFIG.radius - arrowHeadSize, -arrowHeadSize * 0.6, 0);

            // Upper arm of V
            const upperArm = createLineMesh(tipPoint, upperPoint, lineThickness);
            group.add(upperArm);

            // Lower arm of V
            const lowerArm = createLineMesh(tipPoint, lowerPoint, lineThickness);
            group.add(lowerArm);

            // Rounded cap at tip (shared by both arms)
            const tipCap = new THREE.Mesh(
                new THREE.CircleGeometry(lineThickness / 2, 16),
                arrowMaterial
            );
            tipCap.position.set(tipPoint.x, tipPoint.y, 0);
            group.add(tipCap);

            // Rounded cap at upper arm end
            const upperCap = new THREE.Mesh(
                new THREE.CircleGeometry(lineThickness / 2, 16),
                arrowMaterial
            );
            upperCap.position.set(upperPoint.x, upperPoint.y, 0);
            group.add(upperCap);

            // Rounded cap at lower arm end
            const lowerCap = new THREE.Mesh(
                new THREE.CircleGeometry(lineThickness / 2, 16),
                arrowMaterial
            );
            lowerCap.position.set(lowerPoint.x, lowerPoint.y, 0);
            group.add(lowerCap);
        }

        // Add text label for state ID
        const label = this.createTextLabel(id, config.strokeColor);
        label.position.set(0, 0, 0.01); // Slightly in front to avoid z-fighting
        group.add(label);

        return group;
    }

    /**
     * Sets the font for all state labels
     */
    public setFont(font: FontType): void {
        this.currentFont = font;

        // Regenerate all state visuals to apply new font
        this.states.forEach(state => {
            this.updateState(state.id, {});
        });
    }

    /**
     * Creates a text label sprite using canvas texture
     */
    private createTextLabel(text: string, color: number): THREE.Sprite {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;

        // Set canvas size (higher resolution for better quality)
        const fontSize = 64;
        canvas.width = 256;
        canvas.height = 128;

        // Map FontType to CSS font family - enum values are the actual font names
        const fontFamily = `${this.currentFont}, ${this.currentFont === FontType.SATOSHI ? 'sans-serif' : 'serif'}`;

        // Configure text rendering
        context.font = `bold ${fontSize}px ${fontFamily}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Convert color from hex to CSS color
        const colorStr = '#' + color.toString(16).padStart(6, '0');
        context.fillStyle = colorStr;

        // Draw text
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create sprite material with the texture
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });

        // Create sprite
        const sprite = new THREE.Sprite(material);

        // Scale sprite to appropriate size (adjust based on state radius)
        const scale = STATE_CONFIG.radius * 1.2;
        sprite.scale.set(scale * 2, scale, 1);

        return sprite;
    }

    /**
     * Clears all states
     */
    public clear(): void {
        this.states.forEach(state => {
            this.scene.remove(state.mesh);
        });
        this.states.clear();
        this.stateCounter = 0;
    }
}
