declare module 'chess.js' {
  export interface Move {
    from: string;
    to: string;
    piece: string;
    color: 'w' | 'b';
    san?: string;
    flags?: string;
    promotion?: string;
  }

  export interface GameState {
    fen: string;
    moves: Move[];
    isGameOver: boolean;
    result?: string;
  }

  export class Chess {
    constructor(fen?: string);
    
    fen(): string;
    move(move: string | Move): Move | null;
    moves(options?: { verbose?: boolean }): string[] | Move[];
    history(options?: { verbose?: boolean }): string[] | Move[];
    isGameOver(): boolean;
    isCheckmate(): boolean;
    isDraw(): boolean;
    isStalemate(): boolean;
    isCheck(): boolean;
    isInsufficientMaterial(): boolean;
    isThreefoldRepetition(): boolean;
    loadPgn(pgn: string): boolean;
    pgn(): string;
    reset(): void;
    clear(): void;
    put(piece: { type: string; color: 'w' | 'b' }, square: string): boolean;
    get(square: string): { type: string; color: 'w' | 'b' } | null;
    remove(square: string): { type: string; color: 'w' | 'b' } | null;
    squareColor(square: string): 'light' | 'dark' | null;
    turn(): 'w' | 'b';
    moveNumber(): number;
    validateFen(fen: string): { valid: boolean; error_number?: number; error?: string };
  }
}
