import React from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

export interface SimulationStatus {
    isRunning: boolean;
    currentPosition: number;
    inputString: string;
    frontierStates: string[];
    isComplete: boolean;
    isAccepted: boolean | null;
}

interface SimulationPanelProps {
    status: SimulationStatus;
    onStart: (input: string) => void;
    onStep: () => void;
    onReset: () => void;
    onTogglePlay: () => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = React.memo(({
    status,
    onStart,
    onStep,
    onReset,
    onTogglePlay
}) => {
    const [inputValue, setInputValue] = React.useState('');
    const hasSimulation = status.inputString.length > 0;

    const handleStart = () => {
        if (inputValue.trim()) {
            onStart(inputValue);
        }
    };

    const renderStringVisualization = () => {
        if (!hasSimulation) return null;

        return (
            <div className="flex items-center gap-1 flex-wrap font-mono text-base">
                {status.inputString.split('').map((char, index) => (
                    <span
                        key={index}
                        className={`px-2 py-1 rounded ${index < status.currentPosition
                            ? 'bg-[#30302B] text-[#888888]' // Processed
                            : index === status.currentPosition
                                ? 'bg-[#FFFFE3] border border-[#FFFFE3] text-[#1F1D19]' // Current
                                : 'bg-transparent text-[#FFFFE3]' // Unprocessed
                            }`}
                    >
                        {char === ' ' ? '␣' : char}
                    </span>
                ))}
                {status.isComplete && (
                    <span className="ml-2 text-sm">
                        {status.isAccepted ? '  ✓ Accepted' : ' ✗ Rejected'}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="text-[#888888] text-xs uppercase tracking-wider">
                Simulation
            </div>

            {/* Input Field */}
            <div className="flex flex-col gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    placeholder="Enter test string..."
                    disabled={hasSimulation}
                    className="w-full px-3 py-2 bg-[#1E1F18] border border-[#30302B] rounded-lg text-[#FFFFE3] font-mono text-sm placeholder-[#888888] focus:outline-none focus:ring-1 focus:ring-[#30302B] disabled:opacity-50"
                />
                {!hasSimulation && (
                    <button
                        onClick={handleStart}
                        disabled={!inputValue.trim()}
                        className="w-full px-4 py-2 bg-[#FFFFE3] border border-[#FFFFE3] rounded-lg text-[#1F1D19] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Start
                    </button>
                )}
            </div>

            {/* String Visualization */}
            <div className={`p-3 bg-[#1E1F18] border border-[#30302B] rounded-lg ${!hasSimulation ? 'opacity-50' : ''}`}>
                {hasSimulation ? renderStringVisualization() : (
                    <div className="text-[#888888] text-sm italic"></div>
                )}
            </div>

            {/* Status Info */}
            <div className={`grid grid-cols-2 gap-2 text-sm ${!hasSimulation ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                    <div className="text-[#888888] text-xs">Step</div>
                    <div className="text-[#FFFFE3] font-mono">
                        {status.currentPosition} / {status.inputString.length || 0}
                    </div>
                </div>
                <div>
                    <div className="text-[#888888] text-xs">Active States</div>
                    <div className="text-[#FFFFE3] font-mono">
                        {status.frontierStates.length > 0
                            ? `{${status.frontierStates.join(', ')}}`
                            : '{ }'}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className={`flex gap-2 ${!hasSimulation ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                    onClick={onTogglePlay}
                    disabled={status.isComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#FFFFE3] border border-[#FFFFE3] rounded-lg text-[#1F1D19] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status.isRunning ? (
                        <>
                            <Pause className="h-4 w-4" />
                            <span>Pause</span>
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4" />
                            <span>Play</span>
                        </>
                    )}
                </button>
                <button
                    onClick={onStep}
                    disabled={status.isComplete || status.isRunning}
                    className="px-4 py-2 bg-transparent hover:bg-[#30302B] border border-[#30302B] rounded-lg text-[#FFFFE3] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Step Forward"
                >
                    <SkipForward className="h-4 w-4" />
                </button>
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-transparent hover:bg-[#30302B] border border-[#30302B] rounded-lg text-[#FFFFE3] transition-all"
                    title="Reset"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
});
