export interface ComputationNode {
  id: number;
  state: string;
  step: number;
  fromSymbol: string | null;
  parent: ComputationNode | null;
  children: ComputationNode[];
  dead: boolean;
  accepting: boolean;
}
