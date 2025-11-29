import React, { useState, useEffect, useRef } from "react";

interface TransitionModalProps {
    isOpen: boolean;
    fromStateId: string | null;
    toStateId: string | null;
    initialSymbols?: string[];
    onSubmit: (symbols: string[]) => void;
    onCancel: () => void;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({
    isOpen,
    fromStateId,
    toStateId,
    initialSymbols,
    onSubmit,
    onCancel,
}) => {
    const [symbolsInput, setSymbolsInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Reset/Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSymbolsInput(initialSymbols ? initialSymbols.join(',') : "");
            setError(null);
        } else {
            setSymbolsInput("");
            setError(null);
        }
    }, [isOpen, initialSymbols]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!symbolsInput.trim()) {
            setError("Please enter at least one symbol");
            return;
        }

        // Parse comma-separated symbols
        const symbols = symbolsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => {
                // Convert "epsilon" or "empty" to epsilon symbol
                if (s.toLowerCase() === 'epsilon' || s.toLowerCase() === 'empty') {
                    return 'ε';
                }
                return s;
            });

        if (symbols.length === 0) {
            setError("Please enter valid symbols");
            return;
        }

        onSubmit(symbols);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (!isOpen || !fromStateId || !toStateId) return null;

    const isSelfLoop = fromStateId === toStateId;
    const isEditing = !!initialSymbols;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div
                    className="bg-[#1F1D19] rounded-lg border border-[#30302B] p-6 min-w-[400px] shadow-2xl pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-[#FFFFE3] text-xl font-semibold mb-4">
                        {isEditing
                            ? `Edit Transition`
                            : (isSelfLoop ? `Create Self-Loop on ${fromStateId}` : `Create Transition`)
                        }
                    </h2>

                    {!isSelfLoop && (
                        <div className="mb-4 text-[#FFFFE3] text-sm opacity-70">
                            <span className="font-mono">{fromStateId}</span>
                            {" → "}
                            <span className="font-mono">{toStateId}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-[#FFFFE3] text-sm font-medium mb-2">
                                Transition Symbols
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={symbolsInput}
                                onChange={(e) => {
                                    setSymbolsInput(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g., a,b,0 or epsilon"
                                className="w-full px-3 py-2 bg-[#1E1F18] border border-[#30302B] rounded text-[#FFFFE3] placeholder-[#30302B] focus:outline-none focus:border-[#FFFFE3]"
                            />
                            <p className="mt-1 text-xs text-[#30302B]">
                                Comma-separated. Use "epsilon" or "empty" for ε
                            </p>
                            {error && (
                                <p className="mt-2 text-xs text-red-400">{error}</p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 rounded bg-transparent border border-[#30302B] text-[#FFFFE3] hover:bg-[#30302B] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-[#FFFFE3] text-[#1F1D19] hover:bg-opacity-90 transition-colors font-medium"
                            >
                                {isEditing ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
