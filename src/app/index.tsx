import "../index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { initThreeApp, getCamera } from "../rendering/engine/initThreeJS";
import { ConfigButton } from "../components/ConfigButton";
import { Toolbar } from "../components/Toolbar";
import { ZoomControl } from "../components/ZoomControl";
import { CameraProvider } from "../contexts/CameraContext";
import { AppStateProvider } from "../contexts/AppStateContext";

function App() {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [camera, setCamera] = React.useState<any>(null);

    React.useEffect(() => {
        if (!canvasRef.current) return;
        initThreeApp(canvasRef.current);
        setCamera(getCamera());
    }, []);

    return (
        <AppStateProvider>
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
                    <ConfigButton
                        onClick={() => {
                            console.log("Config clicked");
                        }}
                    />

                </div>
            </CameraProvider>
        </AppStateProvider>
    );
}

const container = document.getElementById("app-root");

if (!container) {
    throw new Error("No #app-root element found");
}

const root = createRoot(container);
root.render(<App />);
