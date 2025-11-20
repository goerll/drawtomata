import React, { createContext, useContext, useState } from 'react';
import { InteractionMode } from '../types/automaton';

interface AppState {
    currentMode: InteractionMode;
}

interface AppStateContextType {
    state: AppState;
    setMode: (mode: InteractionMode) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        currentMode: InteractionMode.SELECT,
    });

    const setMode = (mode: InteractionMode) => {
        setState((prev) => ({ ...prev, currentMode: mode }));
    };

    return (
        <AppStateContext.Provider value={{ state, setMode }}>
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
