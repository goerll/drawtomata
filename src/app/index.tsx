import "../index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { initThreeApp, getCamera, getScene, getEventHandlers, getControls, markSceneDirty } from "../rendering/engine/initThreeJS";
import { StateManager } from "../rendering/visualizers/StateManager";
import { TransitionManager } from "../rendering/visualizers/TransitionManager";
import { SelectionBox } from "../rendering/visualizers/SelectionBox";
import { InteractionManager } from "../rendering/engine/InteractionManager";
import { ConfigButton } from "../components/ConfigButton";
import { GitHubButton } from "../components/GitHubButton";
import { HelpButton } from "../components/HelpButton";
import { Toolbar } from "../components/Toolbar";
import { ZoomControl } from "../components/ZoomControl";
import { TransitionModal } from "../components/TransitionModal";
import { AutomatonDefinitionSidebar } from "../components/AutomatonDefinitionSidebar";
import { SimulationStatus } from "../components/SimulationPanel";
import { Automaton } from "../core/automaton/Automaton";
import { AutomatonDefinition } from "../types/automaton";
import { CameraProvider } from "../contexts/CameraContext";
import { AppStateProvider, useAppState } from "../contexts/AppStateContext";

function AppContent() {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [camera, setCamera] = React.useState<any>(null);
    const [controls, setControls] = React.useState<any>(null);
    const { state } = useAppState();
    const stateManagerRef = React.useRef<StateManager | null>(null);
    const transitionManagerRef = React.useRef<TransitionManager | null>(null);
    const interactionManagerRef = React.useRef<InteractionManager | null>(null);

    // Modal state for transition creation
    const [transitionModal, setTransitionModal] = React.useState<{
        isOpen: boolean;
        fromId: string | null;
        toId: string | null;
        transitionId?: string;
        initialSymbols?: string[];
    }>({ isOpen: false, fromId: null, toId: null });

    // Automaton definition state
    const [automatonDefinition, setAutomatonDefinition] = React.useState<AutomatonDefinition>({
        states: [],
        alphabet: [],
        transitions: [],
        startState: null,
        acceptStates: []
    });

    // Selection state
    const [selectedStateId, setSelectedStateId] = React.useState<string | null>(null);

    // Simulation state
    const automatonRef = React.useRef<Automaton | null>(null);
    const [simulationStatus, setSimulationStatus] = React.useState<SimulationStatus>({
        isRunning: false,
        currentPosition: 0,
        inputString: '',
        frontierStates: [],
        isComplete: false,
        isAccepted: null
    });
    const simulationIntervalRef = React.useRef<number | null>(null);

    // Helper to update definition from managers
    const updateDefinition = React.useCallback(() => {
        if (!stateManagerRef.current || !transitionManagerRef.current) return;

        const states = stateManagerRef.current.getAllStates();
        const transitions = transitionManagerRef.current.getAllTransitions();

        const stateIds = states.map(s => s.id);
        const startState = states.find(s => s.isStart)?.id || null;
        const acceptStates = states.filter(s => s.isAccepting).map(s => s.id);

        // Extract unique symbols for alphabet
        const alphabetSet = new Set<string>();
        const transitionDefs: { from: string; to: string; symbol: string }[] = [];

        transitions.forEach(t => {
            t.symbols.forEach(symbol => {
                if (symbol !== 'ε') {
                    alphabetSet.add(symbol);
                }
                transitionDefs.push({
                    from: t.fromStateId,
                    to: t.toStateId,
                    symbol
                });
            });
        });

        setAutomatonDefinition({
            states: stateIds,
            alphabet: Array.from(alphabetSet),
            transitions: transitionDefs,
            startState,
            acceptStates
        });

        // Recreate Automaton instance when definition changes
        if (stateIds.length > 0 && startState) {
            const automaton = new Automaton(stateIds, Array.from(alphabetSet), startState, acceptStates);
            transitionDefs.forEach(t => {
                automaton.addTransition(t.from, t.symbol, [t.to]);
            });
            automatonRef.current = automaton;
        } else {
            automatonRef.current = null;
        }
    }, []);

    // Simulation control handlers
    const handleSimulationStart = React.useCallback((input: string) => {
        if (!automatonRef.current || !stateManagerRef.current) return;

        automatonRef.current.startSimulation(input);
        const frontierStates = automatonRef.current.getCurrentFrontierStates();

        stateManagerRef.current.highlightFrontierStates(frontierStates);
        markSceneDirty(); // Ensure visual update

        setSimulationStatus({
            isRunning: false,
            currentPosition: 0,
            inputString: input,
            frontierStates,
            isComplete: input.length === 0,
            isAccepted: input.length === 0 && frontierStates.some(id => {
                const state = stateManagerRef.current?.getState(id);
                return state?.isAccepting || false;
            })
        });
    }, []);

    const handleSimulationStep = React.useCallback(() => {
        if (!automatonRef.current || !stateManagerRef.current) return;

        const hasMore = automatonRef.current.stepSimulation();
        const simState = automatonRef.current.simulationState;

        if (simState) {
            const frontierStates = automatonRef.current.getCurrentFrontierStates();
            stateManagerRef.current.highlightFrontierStates(frontierStates);
            markSceneDirty(); // Ensure visual update

            setSimulationStatus({
                isRunning: false,
                currentPosition: simState.currentPosition,
                inputString: simState.input,
                frontierStates,
                isComplete: simState.isComplete,
                isAccepted: simState.isComplete ? simState.isAccepted : null
            });
        }

        return hasMore;
    }, []);

    const handleSimulationReset = React.useCallback(() => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }

        if (automatonRef.current) {
            automatonRef.current.resetSimulation();
        }

        if (stateManagerRef.current) {
            stateManagerRef.current.clearFrontierHighlight();
            markSceneDirty(); // Ensure visual update
        }

        setSimulationStatus({
            isRunning: false,
            currentPosition: 0,
            inputString: '',
            frontierStates: [],
            isComplete: false,
            isAccepted: null
        });
    }, []);

    const handleSimulationTogglePlay = React.useCallback(() => {
        if (simulationStatus.isRunning) {
            // Pause
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
                simulationIntervalRef.current = null;
            }
            setSimulationStatus(prev => ({ ...prev, isRunning: false }));
        } else {
            // Play
            setSimulationStatus(prev => ({ ...prev, isRunning: true }));
            simulationIntervalRef.current = window.setInterval(() => {
                const hasMore = handleSimulationStep();
                if (!hasMore) {
                    if (simulationIntervalRef.current) {
                        clearInterval(simulationIntervalRef.current);
                        simulationIntervalRef.current = null;
                    }
                    setSimulationStatus(prev => ({ ...prev, isRunning: false }));
                }
            }, 500); // 500ms between steps
        }
    }, [simulationStatus.isRunning, handleSimulationStep]);

    React.useEffect(() => {
        if (!canvasRef.current) return;

        // Ensure fonts are loaded before initializing the app
        const loadFonts = async () => {
            try {
                // Load both fonts using the Font Loading API
                await Promise.all([
                    document.fonts.load('bold 64px Satoshi'),
                    document.fonts.load('bold 64px "Computer Modern"'),
                ]);
            } catch (error) {
                console.warn('Font loading failed, using fallback fonts:', error);
            }
        };

        // Initialize Three.js
        initThreeApp(canvasRef.current);
        const cam = getCamera();
        const scene = getScene();
        const eventHandlers = getEventHandlers();
        const orbitControls = getControls();

        setCamera(cam);
        setControls(orbitControls);

        if (scene && eventHandlers) {
            // Wait for fonts to load before initializing StateManager
            loadFonts().then(() => {
                // Initialize StateManager
                const stateManager = new StateManager(scene.getThreeScene());
                stateManagerRef.current = stateManager;

                // Immediately sync font from app state
                stateManager.setFont(state.selectedFont);

                // Initialize TransitionManager
                const transitionManager = new TransitionManager(scene.getThreeScene(), stateManager);
                transitionManagerRef.current = transitionManager;

                // Immediately sync font from app state
                transitionManager.setFont(state.selectedFont);

                // Initialize SelectionBox
                const selectionBox = new SelectionBox(scene.getThreeScene());

                // Initialize InteractionManager with TransitionManager
                const interactionManager = new InteractionManager(stateManager, selectionBox, transitionManager);
                interactionManagerRef.current = interactionManager;

                // Register transition callback to open modal
                interactionManager.onAddTransition((fromId: string, toId: string) => {
                    setTransitionModal({ isOpen: true, fromId, toId });
                });

                // Register transition edit callback
                interactionManager.onEditTransition((id: string, symbols: string[]) => {
                    const transition = transitionManager.getTransition(id);
                    if (transition) {
                        setTransitionModal({
                            isOpen: true,
                            fromId: transition.fromStateId,
                            toId: transition.toStateId,
                            transitionId: id,
                            initialSymbols: symbols
                        });
                    }
                });

                // Register automaton update callback
                interactionManager.onAutomatonUpdate(() => {
                    updateDefinition();
                });

                // Register selection change callback
                interactionManager.onSelectionChange((id: string | null) => {
                    setSelectedStateId(id);
                });

                // Register all event handlers
                eventHandlers.onCanvasClick(interactionManager.getClickHandler());
                eventHandlers.onMouseDown(interactionManager.getMouseDownHandler());
                eventHandlers.onMouseMove(interactionManager.getMouseMoveHandler());
                eventHandlers.onMouseUp(interactionManager.getMouseUpHandler());

                // Register keyboard handler for deleting selected states
                eventHandlers.onKeyDown((event: KeyboardEvent) => {
                    // Check if Delete or Backspace was pressed
                    if (event.key === 'Delete' || event.key === 'Backspace' || event.key === 'd') {
                        // Don't trigger if user is typing in an input field
                        const target = event.target as HTMLElement;
                        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                            return;
                        }

                        event.preventDefault();

                        // Get all selected states
                        const selectedStates = stateManager.getSelectedStates();

                        if (selectedStates.length > 0) {
                            // Delete each selected state
                            selectedStates.forEach(state => {
                                // Remove all transitions connected to this state
                                const allTransitions = transitionManager.getAllTransitions();
                                allTransitions.forEach(transition => {
                                    if (transition.fromStateId === state.id || transition.toStateId === state.id) {
                                        transitionManager.removeTransition(transition.id);
                                    }
                                });

                                // Remove the state itself
                                stateManager.removeState(state.id);
                            });

                            // Clear selection
                            setSelectedStateId(null);

                            // Update automaton definition
                            updateDefinition();
                        }
                    }
                });
            });
        }
    }, []);

    // Update interaction mode when app state changes
    React.useEffect(() => {
        if (interactionManagerRef.current) {
            interactionManagerRef.current.setMode(state.currentMode);
        }
    }, [state.currentMode]);

    // Update font when app state changes
    React.useEffect(() => {
        if (stateManagerRef.current) {
            stateManagerRef.current.setFont(state.selectedFont);
        }
        if (transitionManagerRef.current) {
            transitionManagerRef.current.setFont(state.selectedFont);
        }
    }, [state.selectedFont]);

    // Update grid snapping when app state changes
    React.useEffect(() => {
        if (interactionManagerRef.current) {
            interactionManagerRef.current.setGridSnapping(state.gridSnapping);
        }
    }, [state.gridSnapping]);

    // Handlers for transition modal
    const handleTransitionSubmit = (symbols: string[]) => {
        if (transitionManagerRef.current && transitionModal.fromId && transitionModal.toId) {
            if (transitionModal.transitionId) {
                // Update existing transition
                transitionManagerRef.current.updateTransition(transitionModal.transitionId, symbols);
                console.log(`Updated transition: ${transitionModal.transitionId} with symbols: ${symbols.join(',')}`);
            } else {
                // Create new transition
                transitionManagerRef.current.addTransition(
                    transitionModal.fromId,
                    transitionModal.toId,
                    symbols
                );
                console.log(`Created transition: ${transitionModal.fromId} -> ${transitionModal.toId} with symbols: ${symbols.join(',')}`);
            }
            // Trigger update after transition change
            if (interactionManagerRef.current) {
                interactionManagerRef.current.triggerAutomatonUpdate();
            }
            markSceneDirty(); // Ensure visual update
        }
        setTransitionModal({ isOpen: false, fromId: null, toId: null });
    };

    const handleTransitionCancel = () => {
        setTransitionModal({ isOpen: false, fromId: null, toId: null });
    };

    const handleToggleInitial = (id: string) => {
        if (interactionManagerRef.current) {
            interactionManagerRef.current.toggleStateInitial(id);
        }
    };

    const handleToggleAccepting = React.useCallback((id: string) => {
        if (interactionManagerRef.current) {
            interactionManagerRef.current.toggleStateAccepting(id);
        }
    }, []);

    const handleDeleteState = React.useCallback((id: string) => {
        if (!stateManagerRef.current || !transitionManagerRef.current) return;

        // Remove all transitions connected to this state
        const allTransitions = transitionManagerRef.current.getAllTransitions();
        allTransitions.forEach(transition => {
            if (transition.fromStateId === id || transition.toStateId === id) {
                transitionManagerRef.current!.removeTransition(transition.id);
            }
        });

        // Remove the state itself
        stateManagerRef.current.removeState(id);

        // Clear selection
        setSelectedStateId(null);

        // Update automaton definition
        updateDefinition();
        markSceneDirty(); // Ensure visual update
    }, [updateDefinition]);

    return (
        <CameraProvider camera={camera} controls={controls}>
            <div className="relative w-screen h-screen overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block"
                />

                {/* UI overlay: toolbar center */}
                <Toolbar />

                {/* UI overlay: zoom control bottom-left */}
                <ZoomControl />

                {/* UI overlay: config button top-right */}
                <ConfigButton />

                {/* UI overlay: help button bottom-right (left of github) */}
                <HelpButton />

                {/* UI overlay: github button bottom-right */}
                <GitHubButton />

                {/* Automaton Definition Sidebar */}
                <AutomatonDefinitionSidebar
                    definition={automatonDefinition}
                    selectedStateId={selectedStateId}
                    onToggleInitial={handleToggleInitial}
                    onToggleAccepting={handleToggleAccepting}
                    onDeleteState={handleDeleteState}
                    simulationStatus={simulationStatus}
                    onSimulationStart={handleSimulationStart}
                    onSimulationStep={handleSimulationStep}
                    onSimulationReset={handleSimulationReset}
                    onSimulationTogglePlay={handleSimulationTogglePlay}
                />

                {/* Transition modal */}
                <TransitionModal
                    isOpen={transitionModal.isOpen}
                    fromStateId={transitionModal.fromId}
                    toStateId={transitionModal.toId}
                    initialSymbols={transitionModal.initialSymbols}
                    onSubmit={handleTransitionSubmit}
                    onCancel={handleTransitionCancel}
                />
            </div>
        </CameraProvider>
    );
}

function App() {
    return (
        <AppStateProvider>
            <AppContent />
        </AppStateProvider>
    );
}

const container = document.getElementById("app-root");

if (!container) {
    throw new Error("No #app-root element found");
}

const root = createRoot(container);
root.render(
    <App />
);
