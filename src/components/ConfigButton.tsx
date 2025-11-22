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
        className={`absolute top-4 right-4 p-2 rounded-lg bg-[#10100E] hover:bg-[#30302B] transition-all cursor-pointer border border-[#30302B] border-opacity-20 z-10 text-[#FFFFE3] ${isPanelOpen ?
          "bg-[#FFFFE3] text-[#10100e]" : ""
          }`}
        onClick={togglePanel}
      >
        <Settings className="h-5 w-5 " />
      </button >

      <ConfigPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
};
