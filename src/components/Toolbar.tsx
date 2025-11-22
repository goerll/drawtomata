import React from "react";
import { MousePointer, Circle, ArrowRight } from "lucide-react";
import { useAppState } from "../contexts/AppStateContext";
import { InteractionMode } from "../types/automaton";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, title, isActive, onClick }) => {
  return (
    <button
      className={`p-3 rounded-md transition-all cursor-pointer border ${isActive
        ? 'bg-[#FFFFE3] border-[#FFFFE3]'
        : 'bg-transparent border-[#30302B] hover:bg-[#30302B]'
        }`}
      onClick={onClick}
      title={title}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: `h-6 w-6 ${isActive ? 'text-[#10100E]' : 'text-[#FFFFE3]'}`
      })}
    </button>
  );
};

export const Toolbar: React.FC = () => {
  const { state, setMode } = useAppState();
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      {/* Background dock */}
      <div className="px-3 py-3 rounded-[12px] bg-[#10100E] bg-opacity-60 backdrop-blur-xl border border-[#30302B] border-opacity-50 flex gap-3 shadow-lg">
        <ToolbarButton
          icon={<MousePointer />}
          title="Select"
          isActive={state.currentMode === InteractionMode.SELECT}
          onClick={() => setMode(InteractionMode.SELECT)}
        />
        <ToolbarButton
          icon={<Circle />}
          title="Add State"
          isActive={state.currentMode === InteractionMode.ADD_STATE}
          onClick={() => setMode(InteractionMode.ADD_STATE)}
        />
        <ToolbarButton
          icon={<ArrowRight />}
          title="Connect States"
          isActive={state.currentMode === InteractionMode.ADD_TRANSITION}
          onClick={() => setMode(InteractionMode.ADD_TRANSITION)}
        />
      </div>
    </div>
  );
};
