import React from "react";
import { useAppState, FontType } from "../contexts/AppStateContext";

interface ConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ isOpen, onClose }) => {
    const { state, setFont, setGridSnapping } = useAppState();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop to close panel when clicking outside */}
            <div
                className="fixed inset-0 z-10"
                onClick={onClose}
            />

            {/* Config panel */}
            <div className="absolute top-16 right-4 bg-[#1F1D19] rounded-lg border border-[#30302B] border-opacity-20 z-20 p-4 min-w-[240px] shadow-xl">
                <h3 className="text-[#FFFFE3] font-semibold mb-3 text-sm">Settings</h3>

                <div className="space-y-3">
                    {/* Font selector section */}
                    <div>
                        <label className="text-[#FFFFE3] text-xs font-medium mb-2 block opacity-70">
                            Label Font
                        </label>
                        <div className="space-y-2">
                            {/* Satoshi option */}
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="font"
                                    value={FontType.SATOSHI}
                                    checked={state.selectedFont === FontType.SATOSHI}
                                    onChange={() => setFont(FontType.SATOSHI)}
                                    className="w-4 h-4 accent-[#FFFFE3] cursor-pointer"
                                />
                                <span className="text-[#FFFFE3] text-sm group-hover:opacity-100 opacity-80 transition-opacity">
                                    Satoshi
                                </span>
                            </label>

                            {/* Computer Modern option */}
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="font"
                                    value={FontType.COMPUTER_MODERN}
                                    checked={state.selectedFont === FontType.COMPUTER_MODERN}
                                    onChange={() => setFont(FontType.COMPUTER_MODERN)}
                                    className="w-4 h-4 accent-[#FFFFE3] cursor-pointer"
                                />
                                <span className="text-[#FFFFE3] text-sm group-hover:opacity-100 opacity-80 transition-opacity">
                                    Computer Modern
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Grid snapping toggle */}
                    <div className="pt-3 border-t border-[#30302B] border-opacity-20">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={state.gridSnapping}
                                onChange={(e) => setGridSnapping(e.target.checked)}
                                className="w-4 h-4 accent-[#FFFFE3] cursor-pointer"
                            />
                            <span className="text-[#FFFFE3] text-sm group-hover:opacity-100 opacity-80 transition-opacity">
                                Grid Snapping
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </>
    );
};
