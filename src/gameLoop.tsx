export interface GameState {
  engine: boolean;
}

export interface Action {
  type: String;
}

export const initialGameState: GameState = {
  engine: false
};

export function gameReducer(state: GameState, action: Action) {
  switch (action.type) {
    case "start_engine":
      return { ...state, engine: true };
    case "stop_engine":
      return { ...state, engine: false };
    default:
      throw new Error(`Invalid action: ${action}`);
  }
}
