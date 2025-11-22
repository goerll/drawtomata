import * as THREE from 'three';
import { InteractionMode } from '../../types/automaton';
import type { StateManager } from '../visualizers/StateManager';
import type { TransitionManager } from '../visualizers/TransitionManager';
import type { SelectionBox } from '../visualizers/SelectionBox';
import type { ClickCallback, MouseCallback } from './EventHandlers';
import { GRID_CONFIG } from '../config/constants';

/**
 * Manages interactions based on the current mode
 */
export class InteractionManager {
    private stateManager: StateManager;
    private transitionManager: TransitionManager | null;
    private selectionBox: SelectionBox;
    private currentMode: InteractionMode;
    private onAddStateCallback?: (stateId: string) => void;
    private onAddTransitionCallback?: (fromId: string, toId: string) => void;
    private onEditTransitionCallback?: (id: string, symbols: string[]) => void;
    private onAutomatonUpdateCallback?: () => void;
    private onSelectionChangeCallback?: (selectedStateId: string | null) => void;
    private gridSnapping: boolean;

    // Transition mode state
    private pendingTransitionFrom: string | null;

    // Drag state
    private isDragging: boolean;
    private dragStartPos: THREE.Vector2 | null;
    private dragMode: 'move' | 'box' | null;
    private draggedStates: Set<string>;
    private draggedStatesOriginalPositions: Map<string, THREE.Vector2>;
    private boxSelectionStart: THREE.Vector2 | null;

    constructor(stateManager: StateManager, selectionBox: SelectionBox, transitionManager?: TransitionManager) {
        this.stateManager = stateManager;
        this.transitionManager = transitionManager || null;
        this.selectionBox = selectionBox;
        this.currentMode = InteractionMode.SELECT;
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragMode = null;
        this.draggedStates = new Set();
        this.draggedStatesOriginalPositions = new Map();
        this.boxSelectionStart = null;
        this.gridSnapping = true;
        this.pendingTransitionFrom = null;
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
            this.triggerSelectionChange(null);
        }
        // Clear pending transition when leaving transition mode
        if (mode !== InteractionMode.ADD_TRANSITION) {
            if (this.pendingTransitionFrom) {
                this.stateManager.deselectState(this.pendingTransitionFrom);
                this.pendingTransitionFrom = null;
            }
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
     * Register callback for transition additions
     */
    public onAddTransition(callback: (fromId: string, toId: string) => void): void {
        this.onAddTransitionCallback = callback;
    }

    /**
     * Register callback for transition editing
     */
    public onEditTransition(callback: (id: string, symbols: string[]) => void): void {
        this.onEditTransitionCallback = callback;
    }

    /**
     * Register callback for automaton updates
     */
    public onAutomatonUpdate(callback: () => void): void {
        this.onAutomatonUpdateCallback = callback;
    }

    /**
     * Register callback for selection changes
     */
    public onSelectionChange(callback: (selectedStateId: string | null) => void): void {
        this.onSelectionChangeCallback = callback;
    }

    /**
     * Trigger automaton update
     */
    public triggerAutomatonUpdate(): void {
        if (this.onAutomatonUpdateCallback) {
            this.onAutomatonUpdateCallback();
        }
    }

    /**
     * Trigger selection change
     */
    private triggerSelectionChange(selectedStateId: string | null): void {
        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback(selectedStateId);
        }
    }

    /**
     * Toggle initial state property
     */
    public toggleStateInitial(id: string): void {
        const state = this.stateManager.getState(id);
        if (state) {
            // If setting to true, unset any other start state first (DFA/NFA usually has one start state)
            if (!state.isStart) {
                this.stateManager.getAllStates().forEach(s => {
                    if (s.isStart) this.stateManager.updateState(s.id, { isStart: false });
                });
            }
            this.stateManager.updateState(id, { isStart: !state.isStart });
            this.triggerAutomatonUpdate();
        }
    }

    /**
     * Toggle accepting state property
     */
    public toggleStateAccepting(id: string): void {
        const state = this.stateManager.getState(id);
        if (state) {
            this.stateManager.updateState(id, { isAccepting: !state.isAccepting });
            this.triggerAutomatonUpdate();
        }
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
                this.handleAddTransition(worldPosition);
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
                this.triggerSelectionChange(clickedState.id);
            } else {
                // Already selected, just trigger update (might be part of multi-selection later)
                // If it's the only one selected, notify
                const selected = this.stateManager.getSelectedStates();
                if (selected.length === 1) {
                    this.triggerSelectionChange(selected[0].id);
                } else {
                    this.triggerSelectionChange(null); // Multiple selected
                }
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
            this.triggerSelectionChange(null);

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

                    // Update connected transitions
                    if (this.transitionManager) {
                        this.transitionManager.updateTransitionPositions(stateId);
                    }
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

            // If exactly one state is selected, trigger change
            if (statesInBox.length === 1) {
                this.triggerSelectionChange(statesInBox[0].id);
            } else {
                this.triggerSelectionChange(null);
            }

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

        this.triggerAutomatonUpdate();
    }

    /**
     * Handle adding a transition between two states
     */
    private handleAddTransition(worldPosition: THREE.Vector2): void {
        // Check if clicked on a transition first (prioritize editing)
        if (this.transitionManager) {
            const clickedTransition = this.transitionManager.getTransitionAtPosition(worldPosition);

            if (clickedTransition) {
                console.log(`Clicked transition: ${clickedTransition.id}`);
                if (this.onEditTransitionCallback) {
                    this.onEditTransitionCallback(clickedTransition.id, clickedTransition.symbols);
                }
                // Clear any pending state selection
                if (this.pendingTransitionFrom) {
                    this.stateManager.deselectState(this.pendingTransitionFrom);
                    this.pendingTransitionFrom = null;
                }
                return;
            }
        }

        const clickedState = this.stateManager.getStateAtPosition(worldPosition);

        if (!clickedState) {
            // Clicked on empty space
            return;
        }

        if (!this.pendingTransitionFrom) {
            // First click: select the source state
            this.pendingTransitionFrom = clickedState.id;
            this.stateManager.selectState(clickedState.id);
            console.log(`Selected source state: ${clickedState.id}`);
        } else {
            // Second click: create transition
            const fromId = this.pendingTransitionFrom;
            const toId = clickedState.id;

            // Check if transition already exists
            let existingTransition = null;
            if (this.transitionManager) {
                existingTransition = this.transitionManager.getTransitionByStates(fromId, toId);
            }

            if (existingTransition) {
                console.log(`Transition already exists: ${existingTransition.id}, editing instead`);
                if (this.onEditTransitionCallback) {
                    this.onEditTransitionCallback(existingTransition.id, existingTransition.symbols);
                }
            } else {
                console.log(`Creating transition: ${fromId} -> ${toId}`);
                // Notify callback if registered
                if (this.onAddTransitionCallback) {
                    this.onAddTransitionCallback(fromId, toId);
                }
            }

            // Clear pending state and visual highlight
            this.stateManager.deselectState(fromId);
            this.pendingTransitionFrom = null;
        }
    }
}
