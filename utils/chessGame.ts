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
    return this.chess.history({ verbose: true }) as Move[]
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
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i]
        // Skip empty or invalid moves
        if (!move || move.trim() === '') continue
        
        // Handle pawn promotion automatically
        let moveToExecute = move
        if (this.isPawnPromotion(move)) {
          // Auto-promote to queen if no promotion piece specified
          if (!move.includes('=')) {
            moveToExecute = move + '=Q'
          }
        }
        
        const result = this.chess.move(moveToExecute)
        if (!result) {
          console.warn(`Invalid move at position ${i + 1}: ${move}`)
          // Don't throw error, just return false
          return false
        }
      }
      return true
    } catch (error) {
      console.error('Error loading moves:', error)
      return false
    }
  }

  // Check if a move is a pawn promotion
  private isPawnPromotion(move: string): boolean {
    // Check if it's a pawn move to the last rank
    const lastRank = move.includes('8') || move.includes('1')
    const isPawnMove = /^[a-h]?x?[a-h][18]/.test(move)
    return lastRank && isPawnMove
  }

  // Get promotion options for a pawn move
  getPromotionOptions(move: string): string[] {
    if (!this.isPawnPromotion(move)) {
      return []
    }
    return ['Q', 'R', 'B', 'N'] // Queen, Rook, Bishop, Knight
  }

  // Execute a move with specific promotion
  executeMoveWithPromotion(move: string, promotionPiece: string = 'Q'): boolean {
    try {
      let moveToExecute = move
      if (this.isPawnPromotion(move) && !move.includes('=')) {
        moveToExecute = move + '=' + promotionPiece
      }
      
      const result = this.chess.move(moveToExecute)
      return !!result
    } catch (error) {
      console.error('Error executing move with promotion:', error)
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

    // Split by spaces and filter out empty strings
    const moves = cleanText.split(' ').filter(move => {
      const trimmedMove = move.trim()
      return trimmedMove.length >= 2 && trimmedMove !== ''
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

  // Helper method to validate a sequence of moves
  validateMoves(moves: string[]): { valid: boolean; error?: string } {
    try {
      const tempChess = new Chess()
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i]
        if (!move || move.trim() === '') continue
        
        const result = tempChess.move(move)
        if (!result) {
          return { valid: false, error: `Invalid move at position ${i + 1}: ${move}` }
        }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Get all legal moves for current position
  getLegalMoves(): string[] {
    return this.chess.moves() as string[]
  }

  // Check if a specific move is legal
  isMoveLegal(move: string): boolean {
    const legalMoves = this.chess.moves() as string[]
    return legalMoves.includes(move)
  }

  // Get detailed move information
  getMoveDetails(move: string): any {
    try {
      const tempChess = new Chess(this.chess.fen())
      return tempChess.move(move)
    } catch {
      return null
    }
  }

  // Check if a square is occupied
  isSquareOccupied(square: string): boolean {
    return this.chess.get(square) !== null
  }

  // Get piece at a specific square
  getPieceAt(square: string): any {
    return this.chess.get(square)
  }

  // Check if it's check
  isCheck(): boolean {
    return this.chess.isCheck()
  }

  // Check if it's checkmate
  isCheckmate(): boolean {
    return this.chess.isCheckmate()
  }

  // Check if it's a draw
  isDraw(): boolean {
    return this.chess.isDraw()
  }

  // Get whose turn it is
  getTurn(): 'w' | 'b' {
    return this.chess.turn()
  }

  // Get move number
  getMoveNumber(): number {
    return this.chess.moveNumber()
  }
}
