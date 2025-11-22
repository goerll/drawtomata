import "../index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { initThreeApp, getCamera, getScene, getEventHandlers } from "../rendering/engine/initThreeJS";
import { StateManager } from "../rendering/visualizers/StateManager";
import { SelectionBox } from "../rendering/visualizers/SelectionBox";
import { InteractionManager } from "../rendering/engine/InteractionManager";
import { ConfigButton } from "../components/ConfigButton";
import { Toolbar } from "../components/Toolbar";
import { ZoomControl } from "../components/ZoomControl";
import { CameraProvider } from "../contexts/CameraContext";
import { AppStateProvider, useAppState } from "../contexts/AppStateContext";

function AppContent() {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [camera, setCamera] = React.useState<any>(null);
    const { state } = useAppState();
    const stateManagerRef = React.useRef<StateManager | null>(null);
    const interactionManagerRef = React.useRef<InteractionManager | null>(null);

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

                // Initialize SelectionBox
                const selectionBox = new SelectionBox(scene.getThreeScene());

                // Initialize InteractionManager
                const interactionManager = new InteractionManager(stateManager, selectionBox);
                interactionManagerRef.current = interactionManager;

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
    }, [state.selectedFont]);

    // Update grid snapping when app state changes
    React.useEffect(() => {
        if (interactionManagerRef.current) {
            interactionManagerRef.current.setGridSnapping(state.gridSnapping);
        }
    }, [state.gridSnapping]);

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
