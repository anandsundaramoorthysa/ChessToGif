import { Chess } from 'chess.js'

export interface Move {
  from: string
  to: string
  piece: string
  color: 'w' | 'b'
  san?: string
}

export interface GameState {
  fen: string
  moves: Move[]
  isGameOver: boolean
  result?: string
}

export class ChessGameManager {
  private chess: Chess

  constructor() {
    this.chess = new Chess()
  }

  reset(): void {
    this.chess = new Chess()
  }

  getCurrentFen(): string {
    return this.chess.fen()
  }

  getMoves(): Move[] {
    return this.chess.history({ verbose: true })
  }

  getAllFens(): string[] {
    const fens: string[] = [this.chess.fen()]
    const history = this.chess.history()
    
    // Reset to initial position
    this.chess = new Chess()
    
    // Replay moves and collect FENs
    for (const move of history) {
      this.chess.move(move)
      fens.push(this.chess.fen())
    }
    
    return fens
  }

  loadPgn(pgn: string): boolean {
    try {
      this.chess = new Chess()
      this.chess.loadPgn(pgn)
      return true
    } catch (error) {
      console.error('Error loading PGN:', error)
      return false
    }
  }

  loadMoves(moves: string[]): boolean {
    try {
      this.chess = new Chess()
      for (const move of moves) {
        const result = this.chess.move(move)
        if (!result) {
          throw new Error(`Invalid move: ${move}`)
        }
      }
      return true
    } catch (error) {
      console.error('Error loading moves:', error)
      return false
    }
  }

  parseMovesText(text: string): string[] {
    // Remove comments, annotations, and extra whitespace
    const cleanText = text
      .replace(/\([^)]*\)/g, '') // Remove parentheses comments
      .replace(/\{[^}]*\}/g, '') // Remove brace comments
      .replace(/[!?+#]/g, '') // Remove move annotations
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Split by spaces and filter out empty strings and incomplete moves
    const moves = cleanText.split(' ').filter(move => {
      // Only include moves that are at least 2 characters long
      // This prevents single characters like 'e' from being treated as moves
      return move.length >= 2
    })
    
    return moves
  }

  isValidMove(move: string): boolean {
    try {
      const tempChess = new Chess(this.chess.fen())
      const result = tempChess.move(move)
      return !!result
    } catch {
      return false
    }
  }

  getGameState(): GameState {
    return {
      fen: this.chess.fen(),
      moves: this.getMoves(),
      isGameOver: this.chess.isGameOver(),
      result: this.chess.isGameOver() ? this.chess.isCheckmate() ? 'checkmate' : 
              this.chess.isDraw() ? 'draw' : 
              this.chess.isStalemate() ? 'stalemate' : 'gameover' : undefined
    }
  }
}
