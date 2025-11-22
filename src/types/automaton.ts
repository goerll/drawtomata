export enum InteractionMode {
    SELECT = 'SELECT',
    ADD_STATE = 'ADD_STATE',
    ADD_TRANSITION = 'ADD_TRANSITION',
}

export interface AutomatonDefinition {
    states: string[];
    alphabet: string[];
    transitions: { from: string; to: string; symbol: string }[];
    startState: string | null;
    acceptStates: string[];
}
