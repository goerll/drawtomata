import "../index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { initThreeApp, getCamera, getScene, getEventHandlers } from "../rendering/engine/initThreeJS";
import { StateManager } from "../rendering/visualizers/StateManager";
import { TransitionManager } from "../rendering/visualizers/TransitionManager";
import { SelectionBox } from "../rendering/visualizers/SelectionBox";
import { InteractionManager } from "../rendering/engine/InteractionManager";
import { ConfigButton } from "../components/ConfigButton";
import { Toolbar } from "../components/Toolbar";
import { ZoomControl } from "../components/ZoomControl";
import { TransitionModal } from "../components/TransitionModal";
import { AutomatonDefinitionSidebar } from "../components/AutomatonDefinitionSidebar";
import { AutomatonDefinition } from "../types/automaton";
import { CameraProvider } from "../contexts/CameraContext";
import { AppStateProvider, useAppState } from "../contexts/AppStateContext";

function AppContent() {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [camera, setCamera] = React.useState<any>(null);
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
    }, []);

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

        setCamera(cam);

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

    const handleToggleAccepting = (id: string) => {
        if (interactionManagerRef.current) {
            interactionManagerRef.current.toggleStateAccepting(id);
        }
    };

    return (
        <CameraProvider camera={camera}>
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

                {/* Automaton Definition Sidebar */}
                <AutomatonDefinitionSidebar
                    definition={automatonDefinition}
                    selectedStateId={selectedStateId}
                    onToggleInitial={handleToggleInitial}
                    onToggleAccepting={handleToggleAccepting}
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
