import React from "react";
import { X, Mouse, Hand, Keyboard, Circle, ArrowRight, MousePointer } from "lucide-react";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div
                    className="bg-[#1F1D19] rounded-lg border border-[#30302B] max-w-2xl max-h-[80vh] shadow-2xl pointer-events-auto flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={handleKeyDown}
                >
                    {/* Header - Fixed */}
                    <div className="bg-[#1F1D19] flex items-center justify-between p-6 pb-4 border-b border-[#30302B] shrink-0">
                        <h2 className="text-[#FFFFE3] text-2xl font-semibold">Help & Controls</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-[#30302B] text-[#FFFFE3] transition-colors"
                            title="Close (Esc)"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="overflow-y-auto p-6 pt-4 space-y-6 text-[#FFFFE3]">
                        {/* Camera Controls */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Mouse className="h-5 w-5" />
                                Camera Controls
                            </h3>
                            <ul className="space-y-2 text-sm ml-7">
                                <li><strong>Pan:</strong> Right-click + drag or middle-click + drag</li>
                                <li><strong>Zoom:</strong> Mouse wheel up/down</li>
                                <li><strong>Reset:</strong> Press <kbd className="px-2 py-0.5 bg-[#30302B] rounded text-xs font-mono">Space</kbd> or click zoom percentage</li>
                            </ul>
                        </section>

                        {/* Touchpad */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Hand className="h-5 w-5" />
                                Touchpad Gestures
                            </h3>
                            <ul className="space-y-2 text-sm ml-7">
                                <li><strong>Pan:</strong> Two-finger drag</li>
                                <li><strong>Zoom:</strong> Pinch in/out or scroll</li>
                            </ul>
                        </section>

                        {/* Tools */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <MousePointer className="h-5 w-5" />
                                Tool Modes
                            </h3>
                            <ul className="space-y-2 text-sm ml-7">
                                <li className="flex items-center gap-2">
                                    <MousePointer className="h-4 w-4" />
                                    <strong>Select:</strong> Click states to select, drag to move, box-select by dragging on empty space
                                </li>
                                <li className="flex items-center gap-2">
                                    <Circle className="h-4 w-4" />
                                    <strong>Add State:</strong> Click anywhere on canvas to create a new state
                                </li>
                                <li className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4" />
                                    <strong>Connect States:</strong> Click first state, then click second state to create transition
                                </li>
                            </ul>
                        </section>

                        {/* Keyboard Shortcuts */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Keyboard className="h-5 w-5" />
                                Keyboard Shortcuts
                            </h3>
                            <ul className="space-y-2 text-sm ml-7">
                                <li>
                                    <kbd className="px-2 py-0.5 bg-[#30302B] rounded text-xs font-mono">Delete</kbd> or{" "}
                                    <kbd className="px-2 py-0.5 bg-[#30302B] rounded text-xs font-mono">Backspace</kbd> or{" "}
                                    <kbd className="px-2 py-0.5 bg-[#30302B] rounded text-xs font-mono">D</kbd> - Delete selected states
                                </li>
                                <li>
                                    <kbd className="px-2 py-0.5 bg-[#30302B] rounded text-xs font-mono">Space</kbd> - Reset camera view
                                </li>
                                <li>
                                    <kbd className="px-2 py-0.5 bg-[#30302B] rounded text-xs font-mono">Esc</kbd> - Close modals/panels
                                </li>
                            </ul>
                        </section>

                        {/* State Management */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3">State Management</h3>
                            <ul className="space-y-2 text-sm ml-7">
                                <li><strong>Initial State:</strong> Toggle in the sidebar or create first state</li>
                                <li><strong>Accept State:</strong> Toggle in the sidebar (double circle)</li>
                                <li><strong>Edit Transition:</strong> Click on a transition arrow to edit symbols</li>
                                <li><strong>Self-Loop:</strong> Click same state twice in Connect mode</li>
                            </ul>
                        </section>

                        {/* Transitions */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3">Transition Symbols</h3>
                            <ul className="space-y-2 text-sm ml-7">
                                <li><strong>Multiple symbols:</strong> Separate with commas (e.g., <code className="px-1 bg-[#30302B] rounded">a,b,0</code>)</li>
                                <li><strong>Epsilon transition:</strong> Type <code className="px-1 bg-[#30302B] rounded">epsilon</code> or <code className="px-1 bg-[#30302B] rounded">empty</code></li>
                            </ul>
                        </section>

                        {/* Tips */}
                        <section className="border-t border-[#30302B] pt-4">
                            <h3 className="text-lg font-semibold mb-3">💡 Tips</h3>
                            <ul className="space-y-2 text-sm ml-7 opacity-80">
                                <li>Grid snapping can be toggled in the config button</li>
                                <li>The sidebar shows the formal automaton definition in real-time</li>
                                <li>Use the simulation panel to test your automaton with input strings</li>
                                <li>Font can be changed between Satoshi and Computer Modern in settings</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
};
