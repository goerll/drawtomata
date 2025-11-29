import React from "react";
import { Settings } from "lucide-react";
import { ConfigPanel } from "./ConfigPanel";

export const ConfigButton: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <>
      <button
        className={`absolute top-4 right-4 p-2 rounded-lg transition-all cursor-pointer shadow-lg z-10 ${isPanelOpen
          ? "bg-[#FFFFE3] text-[#1F1D19] border border-[#FFFFE3]"
          : "bg-[#1F1D19] bg-opacity-60 backdrop-blur-xl border border-[#30302B] border-opacity-50 text-[#FFFFE3] hover:bg-[#30302B] hover:bg-opacity-100"
          }`}
        onClick={togglePanel}
      >
        <Settings className="h-5 w-5 " />
      </button >

      <ConfigPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
};
