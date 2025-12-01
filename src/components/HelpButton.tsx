import React from "react";
import { HelpCircle } from "lucide-react";
import { HelpModal } from "./HelpModal";

export const HelpButton: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    return (
        <>
            <button
                className="absolute bottom-4 right-16 p-2 rounded-lg bg-[#1F1D19] bg-opacity-60 backdrop-blur-xl border border-[#30302B] border-opacity-50 text-[#FFFFE3] hover:bg-[#30302B] hover:bg-opacity-100 transition-all cursor-pointer shadow-lg z-10"
                onClick={() => setIsModalOpen(true)}
                title="Help"
            >
                <HelpCircle className="h-5 w-5" />
            </button>

            <HelpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};
