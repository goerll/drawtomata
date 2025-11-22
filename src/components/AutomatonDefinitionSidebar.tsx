import React from 'react';
import { AutomatonDefinition } from '../types/automaton';

interface AutomatonDefinitionSidebarProps {
    definition: AutomatonDefinition;
    selectedStateId: string | null;
    onToggleInitial: (id: string) => void;
    onToggleAccepting: (id: string) => void;
}

export const AutomatonDefinitionSidebar: React.FC<AutomatonDefinitionSidebarProps> = ({
    definition,
    selectedStateId,
    onToggleInitial,
    onToggleAccepting
}) => {
    const { states, alphabet, transitions, startState, acceptStates } = definition;

    // Helper to format set notation {a, b, c}
    const formatSet = (items: string[]) => {
        if (items.length === 0) return "{ }";
        return `{${items.join(', ')}}`;
    };

    // Group transitions by fromState and symbol for the table
    // Map<fromState, Map<symbol, toStates[]>>
    const transitionMap = new Map<string, Map<string, string[]>>();

    transitions.forEach(t => {
        if (!transitionMap.has(t.from)) {
            transitionMap.set(t.from, new Map());
        }
        const fromMap = transitionMap.get(t.from)!;
        if (!fromMap.has(t.symbol)) {
            fromMap.set(t.symbol, []);
        }
        fromMap.get(t.symbol)!.push(t.to);
    });

    // Sort states for consistent display
    const sortedStates = [...states].sort();
    const sortedAlphabet = [...alphabet].sort();

    const isInitial = selectedStateId ? startState === selectedStateId : false;
    const isAccepting = selectedStateId ? acceptStates.includes(selectedStateId) : false;

    return (
        <div className="absolute left-4 top-24 bottom-24 w-64 bg-[#10100E] bg-opacity-60 backdrop-blur-xl border border-[#30302B] border-opacity-50 rounded-lg p-4 overflow-y-auto text-[#FFFFE3] font-mono text-sm shadow-lg z-10 flex flex-col gap-6">

            {/* State Properties Panel */}
            <div className={`pb-4 ${!selectedStateId ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="text-[#888888] text-xs mb-3 uppercase tracking-wider">
                    State Properties {selectedStateId ? `(${selectedStateId})` : ''}
                </div>
                <div className="flex flex-col gap-3">
                    {/* Initial State Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Initial State</span>
                        <button
                            onClick={() => selectedStateId && onToggleInitial(selectedStateId)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-[#30302B] focus:ring-offset-2 focus:ring-offset-[#10100E] ${isInitial ? 'bg-[#FFFFE3]' : 'bg-[#30302B]'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white border-2 border-[#30302B] transition-transform ${isInitial ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Accepting State Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Accepting State</span>
                        <button
                            onClick={() => selectedStateId && onToggleAccepting(selectedStateId)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-[#30302B] focus:ring-offset-2 focus:ring-offset-[#10100E] ${isAccepting ? 'bg-[#FFFFE3]' : 'bg-[#30302B]'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white border-2 border-[#30302B] transition-transform ${isAccepting ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* States (Q) */}
            <div>
                <div className="text-[#888888] text-xs mb-1 uppercase tracking-wider">States (Q)</div>
                <div className="break-words">
                    {formatSet(sortedStates)}
                </div>
            </div>

            {/* Alphabet (Sigma) */}
            <div>
                <div className="text-[#888888] text-xs mb-1 uppercase tracking-wider">Alphabet (Σ)</div>
                <div className="break-words">
                    {formatSet(sortedAlphabet)}
                </div>
            </div>

            {/* Start State (q0) */}
            <div>
                <div className="text-[#888888] text-xs mb-1 uppercase tracking-wider">Start State (q₀)</div>
                <div>
                    {startState || "-"}
                </div>
            </div>

            {/* Accepting States (F) */}
            <div>
                <div className="text-[#888888] text-xs mb-1 uppercase tracking-wider">Accepting States (F)</div>
                <div className="break-words">
                    {formatSet(acceptStates)}
                </div>
            </div>

            {/* Transitions (δ) */}
            <div className="flex-grow">
                <div className="text-[#888888] text-xs mb-2 uppercase tracking-wider">Transitions (δ)</div>
                {transitions.length === 0 ? (
                    <div className="text-[#444444] italic">No transitions defined</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#30302B] text-[#888888]">
                                <th className="py-1 font-normal">δ</th>
                                <th className="py-1 font-normal">Input</th>
                                <th className="py-1 font-normal">Next</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStates.map(state => {
                                const stateTransitions = transitionMap.get(state);
                                if (!stateTransitions) return null;

                                return Array.from(stateTransitions.entries()).sort().map(([symbol, nextStates]) => (
                                    <tr key={`${state} -${symbol} `} className="border-b border-[#30302B] border-opacity-30 last:border-0">
                                        <td className="py-1 text-[#FFFFE3]">{state}</td>
                                        <td className="py-1 text-[#FFFFE3]">{symbol}</td>
                                        <td className="py-1 text-[#FFFFE3]">{formatSet(nextStates)}</td>
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
