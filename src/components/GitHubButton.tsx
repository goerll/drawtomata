import React from "react";
import { Github } from "lucide-react";

export const GitHubButton: React.FC = () => {
    const handleClick = () => {
        window.open("https://github.com/goerll/drawtomata", "_blank", "noopener,noreferrer");
    };

    return (
        <button
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-[#1F1D19] bg-opacity-60 backdrop-blur-xl border border-[#30302B] border-opacity-50 text-[#FFFFE3] hover:bg-[#30302B] hover:bg-opacity-100 transition-all cursor-pointer shadow-lg z-10"
            onClick={handleClick}
            title="View on GitHub"
        >
            <Github className="h-5 w-5" />
        </button>
    );
};
