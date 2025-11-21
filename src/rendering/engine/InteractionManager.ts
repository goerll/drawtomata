import * as THREE from 'three';
import { InteractionMode } from '../../types/automaton';
import type { StateManager } from '../visualizers/StateManager';
import type { SelectionBox } from '../visualizers/SelectionBox';
import type { ClickCallback, MouseCallback } from './EventHandlers';
import { GRID_CONFIG } from '../config/constants';

/**
 * Manages interactions based on the current mode
 */
export class InteractionManager {
    private stateManager: StateManager;
    private selectionBox: SelectionBox;
    private currentMode: InteractionMode;
    private onAddStateCallback?: (stateId: string) => void;
    private gridSnapping: boolean;

    // Drag state
    private isDragging: boolean;
    private dragStartPos: THREE.Vector2 | null;
    private dragMode: 'move' | 'box' | null;
    private draggedStates: Set<string>;
    private draggedStatesOriginalPositions: Map<string, THREE.Vector2>;
    private boxSelectionStart: THREE.Vector2 | null;

    constructor(stateManager: StateManager, selectionBox: SelectionBox) {
        this.stateManager = stateManager;
        this.selectionBox = selectionBox;
        this.currentMode = InteractionMode.SELECT;
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragMode = null;
        this.draggedStates = new Set();
        this.draggedStatesOriginalPositions = new Map();
        this.boxSelectionStart = null;
        this.gridSnapping = true;
    }

    /**
     * Snap a position to the nearest grid intersection
     */
    private snapToGrid(position: THREE.Vector2): THREE.Vector2 {
        if (!this.gridSnapping) {
            return position;
        }
        const snappedX = Math.round(position.x / GRID_CONFIG.spacing) * GRID_CONFIG.spacing;
        const snappedY = Math.round(position.y / GRID_CONFIG.spacing) * GRID_CONFIG.spacing;
        return new THREE.Vector2(snappedX, snappedY);
    }

    /**
     * Set the current interaction mode
     */
    public setMode(mode: InteractionMode): void {
        this.currentMode = mode;
        // Clear selection when leaving select mode
        if (mode !== InteractionMode.SELECT) {
            this.stateManager.deselectAll();
        }
    }

    /**
     * Set whether grid snapping is enabled
     */
    public setGridSnapping(enabled: boolean): void {
        this.gridSnapping = enabled;
    }

    /**
     * Register callback for state additions
     */
    public onAddState(callback: (stateId: string) => void): void {
        this.onAddStateCallback = callback;
    }

    /**
     * Handle canvas click - returns a callback suitable for EventHandlers
     */
    public getClickHandler(): ClickCallback {
        return (worldPosition: THREE.Vector2) => {
            this.handleClick(worldPosition);
        };
    }

    /**
     * Handle mouse down - returns a callback for EventHandlers
     */
    public getMouseDownHandler(): MouseCallback {
        return (worldPosition: THREE.Vector2, _event: MouseEvent) => {
            this.handleMouseDown(worldPosition);
        };
    }

    /**
     * Handle mouse move - returns a callback for EventHandlers
     */
    public getMouseMoveHandler(): MouseCallback {
        return (worldPosition: THREE.Vector2, _event: MouseEvent) => {
            this.handleMouseMove(worldPosition);
        };
    }

    /**
     * Handle mouse up - returns a callback for EventHandlers
     */
    public getMouseUpHandler(): MouseCallback {
        return (worldPosition: THREE.Vector2, _event: MouseEvent) => {
            this.handleMouseUp(worldPosition);
        };
    }

    /**
     * Handle click based on current mode
     */
    private handleClick(worldPosition: THREE.Vector2): void {
        switch (this.currentMode) {
            case InteractionMode.ADD_STATE:
                this.handleAddState(worldPosition);
                break;

            case InteractionMode.SELECT:
                //Click is handled via mouse down/up for drag support
                break;

            case InteractionMode.ADD_TRANSITION:
                // TODO: Implement transition adding
                console.log('Add transition mode - not implemented yet');
                break;
        }
    }

    /**
     * Handle mouse down in SELECT mode
     */
    private handleMouseDown(worldPosition: THREE.Vector2): void {
        if (this.currentMode !== InteractionMode.SELECT) return;

        const clickedState = this.stateManager.getStateAtPosition(worldPosition);

        if (clickedState) {
            // Clicked on a state
            if (!clickedState.isSelected) {
                // Deselect all and select this one
                this.stateManager.deselectAll();
                this.stateManager.selectState(clickedState.id);
            }

            // Start drag mode for moving states
            this.isDragging = true;
            this.dragStartPos = worldPosition.clone();
            this.dragMode = 'move';
            this.draggedStates.clear();
            this.draggedStatesOriginalPositions.clear();

            // Add all selected states to drag set and store their original positions
            this.stateManager.getSelectedStates().forEach(state => {
                this.draggedStates.add(state.id);
                this.draggedStatesOriginalPositions.set(state.id, state.position.clone());
            });
        } else {
            // Clicked on empty space - deselect all and start box selection
            this.stateManager.deselectAll();
            this.isDragging = true;
            this.dragStartPos = worldPosition.clone();
            this.dragMode = 'box';
            this.boxSelectionStart = worldPosition.clone();
            this.selectionBox.start(worldPosition);
        }
    }

    /**
     * Handle mouse move
     */
    private handleMouseMove(worldPosition: THREE.Vector2): void {
        if (!this.isDragging || !this.dragStartPos) return;

        if (this.dragMode === 'move') {
            // Move selected states based on total displacement from drag start
            const delta = new THREE.Vector2().subVectors(worldPosition, this.dragStartPos);

            this.draggedStates.forEach(stateId => {
                const originalPos = this.draggedStatesOriginalPositions.get(stateId);
                if (originalPos) {
                    const newPos = new THREE.Vector2().addVectors(originalPos, delta);
                    const snappedPos = this.snapToGrid(newPos);
                    this.stateManager.moveState(stateId, snappedPos);
                }
            });
        } else if (this.dragMode === 'box' && this.boxSelectionStart) {
            // Update selection box
            this.selectionBox.update(this.boxSelectionStart, worldPosition);
        }
    }

    /**
     * Handle mouse up
     */
    private handleMouseUp(worldPosition: THREE.Vector2): void {
        if (!this.isDragging) return;

        if (this.dragMode === 'box' && this.boxSelectionStart) {
            // Complete box selection
            const min = new THREE.Vector2(
                Math.min(this.boxSelectionStart.x, worldPosition.x),
                Math.min(this.boxSelectionStart.y, worldPosition.y)
            );
            const max = new THREE.Vector2(
                Math.max(this.boxSelectionStart.x, worldPosition.x),
                Math.max(this.boxSelectionStart.y, worldPosition.y)
            );

            // Select all states in box
            const statesInBox = this.stateManager.getStatesInBox(min, max);
            statesInBox.forEach(state => {
                this.stateManager.selectState(state.id);
            });

            this.selectionBox.clear();
        }

        // Reset drag state
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragMode = null;
        this.draggedStates.clear();
        this.draggedStatesOriginalPositions.clear();
        this.boxSelectionStart = null;
    }

    /**
     * Handle adding a new state
     */
    private handleAddState(worldPosition: THREE.Vector2): void {
        const snappedPosition = this.snapToGrid(worldPosition);
        const isFirstState = this.stateManager.getAllStates().length === 0;
        const newState = this.stateManager.addState(snappedPosition, isFirstState, false);

        console.log(`Added state ${newState.id} at (${worldPosition.x.toFixed(2)}, ${worldPosition.y.toFixed(2)})`);

        // Notify callback if registered
        if (this.onAddStateCallback) {
            this.onAddStateCallback(newState.id);
        }
    }
}
