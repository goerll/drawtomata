import React from "react";
import { Minus, Plus } from "lucide-react";
import { useCamera } from "../contexts/CameraContext";

export const ZoomControl: React.FC = () => {
  const { currentZoom, zoomIn, zoomOut } = useCamera();
  const zoomPercentage = Math.round(currentZoom * 100);

  return (
    <div className="absolute bottom-4 left-4 bg-[#10100E] rounded-lg border border-[#30302B] border-opacity-20 z-10 flex items-center gap-1">
      <button
        className="p-2 rounded-l-lg bg-transparent hover:bg-[#FFFFE3] hover:bg-opacity-10 transition-all cursor-pointer text-[#FFFFE3]"
        onClick={zoomOut}
        title="Zoom Out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="px-3 py-1 text-[#FFFFE3] text-sm font-mono select-none">
        {zoomPercentage}%
      </div>
      <button
        className="p-2 rounded-r-lg bg-transparent hover:bg-[#FFFFE3] hover:bg-opacity-10 transition-all cursor-pointer text-[#FFFFE3]"
        onClick={zoomIn}
        title="Zoom In"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};