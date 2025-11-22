import type { ComputationNode } from "./ComputationNode";
import type { ComputationTree } from "./ComputationTree";

export interface SimulationState {
    input: string;
    currentPosition: number;
    frontier: ComputationNode[];
    root: ComputationNode;
    isComplete: boolean;
    isAccepted: boolean;
}

export class Automaton {
    // Automaton definiton
    states: string[];
    alphabet: string[];
    transitions: Map<string, Map<string, string[]>>;
    startState: string;
    acceptStates: string[];

    // Computation tree for current and previous state history
    computationTree: ComputationTree | null;
    nodeCount: number;

    // Simulation state for step-by-step execution
    simulationState: SimulationState | null;

    constructor(
        states: string[],
        alphabet: string[],
        startState: string,
        acceptStates: string[],
    ) {
        this.states = states;
        this.alphabet = alphabet;
        this.startState = startState;
        this.acceptStates = acceptStates;
        this.transitions = new Map();
        this.computationTree = null;
        this.nodeCount = 0;
        this.simulationState = null;
    }

    addTransition(
        fromState: string,
        input: string,
        toStates: string[]
    ): void {
        if (!this.transitions.has(fromState)) {
            this.transitions.set(fromState, new Map());
        }

        const fromStateMap = this.transitions.get(fromState)!;

        if (!fromStateMap.has(input)) {
            fromStateMap.set(input, []);
        }

        fromStateMap.get(input)!.push(...toStates);
    }

    private createNode(
        state: string,
        step: number,
        fromSymbol: string | null,
        parent: ComputationNode | null,
    ): ComputationNode {
        const node: ComputationNode = {
            id: this.nodeCount++,
            state: state,
            step: step,
            fromSymbol: fromSymbol,
            parent: parent,
            children: [],
            dead: false,
            accepting: this.acceptStates.includes(state),
        };

        if (parent) {
            parent.children.push(node);
        }

        return node;
    }

    private applyEpsilonClosure(
        node: ComputationNode,
        visited: Set<string> = new Set()
    ): ComputationNode[] {
        // Mark this state as visited to prevent infinite loops on epsilon cycles
        visited.add(node.state);

        // Get all epsilon transitions from current state
        const epsilonTargets = this.transitions.get(node.state)?.get("ε") ?? [];

        // Base case: no epsilon trasitions, this node is a leaf
        if (epsilonTargets.length === 0) {
            return [node];
        }

        const leaves: ComputationNode[] = []

        // For each state reachable via epsilon trasition
        for (const targetState of epsilonTargets) {
            // Skip if already visited to prevent cycles like q1 -ε-> q2 -ε-> q1
            if (visited.has(targetState)) {
                continue;
            }

            // Create child node with epsilon edge (same step, no input consumed)
            const childNode = this.createNode(
                targetState,
                node.step,
                "ε",
                node
            );

            // Recursively expand epsilon closure from this child
            const childLeaves = this.applyEpsilonClosure(childNode, visited);
            leaves.push(...childLeaves);
        }

        // Return current node and all epsilon-reachable nodes
        return [node, ...leaves];
    }

    private processChar(
        char: string,
        frontier: ComputationNode[]
    ): ComputationNode[] {
        const newFrontier: ComputationNode[] = [];

        // Process each active computation branch
        for (const node of frontier) {
            // Find all states reachable from current state via this character
            const targets = this.transitions.get(node.state)?.get(char) ?? [];

            // No valid transitions: branch dies
            if (targets.length === 0) {
                node.dead = true;
                continue;
            }

            // For each reachable state, create a branch
            for (const targetState of targets) {
                // Create a child node (step increments since input was consumed)
                const childNode = this.createNode(
                    targetState,
                    node.step + 1,
                    char,
                    node
                );

                // Apply epsilon closure to include all epsilon-reachable states
                const epsilonNodes = this.applyEpsilonClosure(childNode);
                newFrontier.push(...epsilonNodes);
            }
        }

        return newFrontier;
    }

    processString(input: string): boolean {
        // Create root node at starting state
        const root = this.createNode(this.startState, 0, null, null);

        // Get initial frontier: start state + all epsilon-reachable states
        let frontier = this.applyEpsilonClosure(root);

        // Process each input character sequentially
        for (const char of input) {
            frontier = this.processChar(char, frontier);

            // Early termination: all branches died
            if (frontier.length === 0) {
                break;
            }
        }

        this.computationTree = { root };

        // Accept if at least one final branch is in an accepting state
        return frontier.some(node => node.accepting);
    }

    printComputationTree(): void {
        if (!this.computationTree) {
            console.log("No computation tree available. Run processString first.");
            return;
        }

        console.log("\n========== COMPUTATION TREE ==========");

        // Collect all leaf nodes
        const leaves: ComputationNode[] = [];
        const collectLeaves = (node: ComputationNode) => {
            if (node.children.length === 0) {
                leaves.push(node);
            } else {
                node.children.forEach(collectLeaves);
            }
        };
        collectLeaves(this.computationTree.root);

        console.log(`\nTotal branches: ${leaves.length}\n`);

        // Print each branch
        leaves.forEach((leaf, index) => {
            const path: ComputationNode[] = [];
            let current: ComputationNode | null = leaf;

            // Trace back to root
            while (current !== null) {
                path.unshift(current);
                current = current.parent;
            }

            // Format: state1 --symbol--> state2 --symbol--> state3
            const parts: string[] = [];
            for (let i = 0; i < path.length; i++) {
                if (i === 0) {
                    parts.push(path[i]!.state);
                } else {
                    parts.push(`--${path[i]!.fromSymbol}--> ${path[i]!.state}`);
                }
            }
            const pathStr = parts.join(" ");

            const status = leaf.dead
                ? "DEAD"
                : leaf.accepting
                    ? "ACCEPTED"
                    : "REJECTED";

            console.log(`Branch ${index + 1} [${status}]: ${pathStr}`);
        });

        console.log("\n======================================\n");
    }

    printAutomaton(): void {

    }

    /**
     * Start a new simulation with the given input string
     */
    startSimulation(input: string): void {
        // Reset node counter for clean tree
        this.nodeCount = 0;

        // Create root node at starting state
        const root = this.createNode(this.startState, 0, null, null);

        // Get initial frontier: start state + all epsilon-reachable states
        const frontier = this.applyEpsilonClosure(root);

        this.simulationState = {
            input,
            currentPosition: 0,
            frontier,
            root,
            isComplete: input.length === 0,
            isAccepted: input.length === 0 && frontier.some(node => node.accepting)
        };

        this.computationTree = { root };
    }

    /**
     * Process the next character in the simulation
     * Returns true if there are more steps to process
     */
    stepSimulation(): boolean {
        if (!this.simulationState || this.simulationState.isComplete) {
            return false;
        }

        const { input, currentPosition, frontier } = this.simulationState;

        // Get next character
        const char = input[currentPosition];
        if (!char) {
            this.simulationState.isComplete = true;
            return false;
        }

        // Process character
        const newFrontier = this.processChar(char, frontier);

        // Update simulation state
        this.simulationState.currentPosition = currentPosition + 1;
        this.simulationState.frontier = newFrontier;
        this.simulationState.isComplete =
            currentPosition + 1 >= input.length || newFrontier.length === 0;
        this.simulationState.isAccepted =
            this.simulationState.isComplete && newFrontier.some(node => node.accepting);

        return !this.simulationState.isComplete;
    }

    /**
     * Reset the simulation
     */
    resetSimulation(): void {
        this.simulationState = null;
        this.computationTree = null;
    }

    /**
     * Get the current frontier state IDs for visualization
     */
    getCurrentFrontierStates(): string[] {
        if (!this.simulationState) {
            return [];
        }
        return this.simulationState.frontier.map(node => node.state);
    }

    /**
     * Run simulation to completion automatically
     */
    runSimulationToEnd(): void {
        while (this.stepSimulation()) {
            // Continue stepping until complete
        }
    }
}
