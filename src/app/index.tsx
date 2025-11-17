import React from "react";
import { createRoot } from "react-dom/client";
import { initThreeApp } from "./initThreeJS";

function App() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    initThreeApp(canvasRef.current);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Three.js canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* UI overlay: config button top-right */}
      <button
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          padding: "8px 12px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: "#1f2933",
          color: "white",
          cursor: "pointer",
        }}
        onClick={() => {
          console.log("Config clicked");
        }}
      >
        Config
      </button>
    </div>
  );
}

const container = document.getElementById("app-root");
if (!container) {
  throw new Error("No #app-root element found");
}
const root = createRoot(container);
root.render(<App />);
