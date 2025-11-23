import React, { createContext, useContext, useState } from 'react';
import { InteractionMode } from '../types/automaton';

export enum FontType {
    SATOSHI = 'Satoshi',
    COMPUTER_MODERN = 'Computer Modern',
}

interface AppState {
    currentMode: InteractionMode;
    selectedFont: FontType;
    gridSnapping: boolean;
}

interface AppStateContextType {
    state: AppState;
    setMode: (mode: InteractionMode) => void;
    setFont: (font: FontType) => void;
    setGridSnapping: (enabled: boolean) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        currentMode: InteractionMode.SELECT,
        selectedFont: FontType.SATOSHI,
        gridSnapping: true,
    });

    const setMode = (mode: InteractionMode) => {
        setState((prev) => ({ ...prev, currentMode: mode }));
    };

    const setFont = (font: FontType) => {
        setState((prev) => ({ ...prev, selectedFont: font }));
    };

    const setGridSnapping = (enabled: boolean) => {
        setState((prev) => ({ ...prev, gridSnapping: enabled }));
    };

    return (
        <AppStateContext.Provider value={{ state, setMode, setFont, setGridSnapping }}>
            {children}
        </AppStateContext.Provider>
    );
};

export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within a AppStateProvider');
    }
    return context;
};
