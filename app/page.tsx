'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ChessBoard from '@/components/ChessBoard'
import { ChessGameManager } from '@/utils/chessGame'
import { generateAnimatedChessGif } from '@/utils/gifGenerator'

export default function Home() {
  const [movesText, setMovesText] = useState('')
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [isGenerating, setIsGenerating] = useState(false)
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [frameDelay, setFrameDelay] = useState(200)
  const [boardSize, setBoardSize] = useState(400)
  const [lastMove, setLastMove] = useState('')
  const [legalMoves, setLegalMoves] = useState<string[]>([])
  
  const chessGame = useRef(new ChessGameManager())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Example moves with different complexity levels
  const examples = {
    beginner: 'e4 e5 Nf3 Nc6',
    intermediate: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7',
    captures: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 e6 Be3 Nf6 Nf3 Be7 Bd3 O-O O-O Nc6'
  }

  // Update board preview when settings change
  useEffect(() => {
    if (movesText.trim()) {
      // Re-apply moves to update the board with current settings
      const moves = chessGame.current.parseMovesText(movesText)
      if (moves.length > 0) {
        try {
          const success = chessGame.current.loadMoves(moves)
          if (success) {
            setCurrentFen(chessGame.current.getCurrentFen())
            const gameMoves = chessGame.current.getMoves()
            if (gameMoves.length > 0) {
              const lastGameMove = gameMoves[gameMoves.length - 1]
              setLastMove(`${lastGameMove.from}-${lastGameMove.to}`)
            } else {
              setLastMove('')
            }
            // Update legal moves for current position
            setLegalMoves(chessGame.current.getLegalMoves())
          }
        } catch (error) {
          console.log('Settings update error:', error)
        }
      }
    }
  }, [boardSize, frameDelay])

  const handleMovesChange = useCallback((text: string) => {
    setMovesText(text)
    setError(null)
    
    if (text.trim()) {
      const moves = chessGame.current.parseMovesText(text)
      if (moves.length > 0) {
        try {
          const success = chessGame.current.loadMoves(moves)
          if (success) {
            setCurrentFen(chessGame.current.getCurrentFen())
            // Set last move for highlighting
            const gameMoves = chessGame.current.getMoves()
            if (gameMoves.length > 0) {
              const lastGameMove = gameMoves[gameMoves.length - 1]
              setLastMove(`${lastGameMove.from}-${lastGameMove.to}`)
            } else {
              setLastMove('')
            }
            // Update legal moves for current position
            setLegalMoves(chessGame.current.getLegalMoves())
          } else {
            // Try to identify which move failed
            const tempChess = new (require('chess.js').Chess)()
            let failedMove = ''
            let failedIndex = 0
            
            for (let i = 0; i < moves.length; i++) {
              const move = moves[i]
              if (!move || move.trim() === '') continue
              
              const result = tempChess.move(move)
              if (!result) {
                failedMove = move
                failedIndex = i + 1
                break
              }
            }
            
            if (failedMove) {
              setError(`Invalid move at position ${failedIndex}: "${failedMove}". This move is not legal in the current position.`)
            } else {
              setError('Invalid moves detected. Please check your chess notation.')
            }
          }
        } catch (error) {
          // Don't show error for incomplete moves while typing
          console.log('Move parsing error (likely incomplete):', error)
        }
      } else {
        // Reset to initial position if no valid moves
        chessGame.current.reset()
        setCurrentFen(chessGame.current.getCurrentFen())
        setLastMove('')
        setLegalMoves(chessGame.current.getLegalMoves())
      }
    } else {
      chessGame.current.reset()
      setCurrentFen(chessGame.current.getCurrentFen())
      setLastMove('')
    }
  }, [])

  const generateGif = useCallback(async () => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      setError('GIF generation is only available in the browser')
      return
    }

    if (!movesText.trim()) {
      setError('Please enter some moves first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log('Starting animated GIF generation...')
      console.log('Settings:', { frameDelay, boardSize })
      
      const moves = chessGame.current.parseMovesText(movesText)
      console.log('Parsed moves:', moves)
      
      if (moves.length === 0) {
        throw new Error('No valid moves found')
      }

      // Validate moves first
      const validation = chessGame.current.validateMoves(moves)
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid moves detected')
      }

      // Load moves and get all FENs
      const success = chessGame.current.loadMoves(moves)
      if (!success) {
        throw new Error('Failed to load moves')
      }

      const gameMoves = chessGame.current.getMoves()
      console.log(`Generating animated GIF for ${gameMoves.length} moves...`)

      // Generate animated GIF with piece movements
      const gif = await generateAnimatedChessGif(
        gameMoves, 
        boardSize, 
        frameDelay
      )
      
      console.log('Animated GIF created successfully, size:', gif.length, 'bytes')
      
      // Create preview URL
      const blob = new Blob([gif], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)
      setGifUrl(url)

      console.log('Animated GIF generation completed successfully')

    } catch (err) {
      console.error('GIF generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate GIF')
    } finally {
      setIsGenerating(false)
    }
  }, [movesText, frameDelay, boardSize])

  const handleDownload = useCallback(() => {
    if (gifUrl) {
      const link = document.createElement('a')
      link.href = gifUrl
      link.download = 'chess-animation.gif'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [gifUrl])

  const handleExampleLoad = useCallback((exampleType: keyof typeof examples) => {
    const exampleMoves = examples[exampleType]
    setMovesText(exampleMoves)
    handleMovesChange(exampleMoves)
  }, [handleMovesChange])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 mr-4 relative">
              <div className="w-full h-full bg-gradient-to-br from-chess-gold to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">♞</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-chess-dark">
              Chess <span className="text-chess-gold">Animation</span> Maker
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-4">
            Create animated GIFs showing chess piece movements
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input and Controls */}
          <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-chess-dark">Chess Moves</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter moves (PGN or SAN format)
                </label>
                <textarea
                  value={movesText}
                  onChange={(e) => handleMovesChange(e.target.value)}
                  placeholder="e4 e5 Nf3 Nc6 Bb5 a6..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chess-gold focus:border-transparent resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleExampleLoad('beginner')}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  Beginner (4 moves)
                </button>
                <button
                  onClick={() => handleExampleLoad('intermediate')}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Intermediate (16 moves)
                </button>
                <button
                  onClick={() => handleExampleLoad('captures')}
                  className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                >
                  Captures (16 moves)
                </button>
                <button
                  onClick={() => {
                    setMovesText('')
                    handleMovesChange('')
                  }}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>

              {/* Chess Notation Help */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Chess Notation Help:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div><strong>Pawn moves:</strong> e4, d5, exd5 (capture)</div>
                  <div><strong>Piece moves:</strong> Nf3, Bxe4 (capture), Qxd8+ (check)</div>
                  <div><strong>Castling:</strong> O-O (kingside), O-O-O (queenside)</div>
                  <div><strong>Promotion:</strong> e8=Q (pawn promotes to queen)</div>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-chess-dark">Animation Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frame Delay: <span className="font-bold text-chess-gold">{frameDelay}ms</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={frameDelay}
                    onChange={(e) => setFrameDelay(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Fast (50ms)</span>
                    <span>Slow (500ms)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Board Size: <span className="font-bold text-chess-gold">{boardSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    step="50"
                    value={boardSize}
                    onChange={(e) => setBoardSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small (200px)</span>
                    <span>Large (600px)</span>
                  </div>
                </div>


              </div>
            </div>

            {/* Generate Button */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <button
                onClick={generateGif}
                disabled={isGenerating || !movesText.trim()}
                className="w-full py-3 px-6 bg-chess-gold text-white font-semibold rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating Animation...' : 'Generate Animation'}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  <div className="font-medium mb-2">Error: {error}</div>
                  {legalMoves.length > 0 && (
                    <div className="text-sm">
                      <div className="font-medium text-red-600 mb-1">Available legal moves:</div>
                      <div className="flex flex-wrap gap-1">
                        {legalMoves.slice(0, 10).map((move, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                          >
                            {move}
                          </span>
                        ))}
                        {legalMoves.length > 10 && (
                          <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                            +{legalMoves.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview and Output */}
          <div className="space-y-6">
            {/* Current Board Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-chess-dark">Current Position</h2>
              <div className="flex justify-center">
                <ChessBoard
                  fen={currentFen}
                  size={boardSize}
                  highlightLastMove={true}
                  lastMove={lastMove}
                />
              </div>
              
              {/* Legal Moves Display */}
              {legalMoves.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Legal moves ({legalMoves.length} available):
                  </h3>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {legalMoves.slice(0, 20).map((move, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border"
                      >
                        {move}
                      </span>
                    ))}
                    {legalMoves.length > 20 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                        +{legalMoves.length - 20} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Game State Information */}
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Game State:</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Turn:</strong> {chessGame.current.getTurn() === 'w' ? 'White' : 'Black'}</div>
                  <div><strong>Move:</strong> {Math.ceil(chessGame.current.getMoveNumber() / 2)}</div>
                  {chessGame.current.isCheck() && (
                    <div className="text-red-600 font-medium">CHECK!</div>
                  )}
                  {chessGame.current.isCheckmate() && (
                    <div className="text-red-800 font-bold">CHECKMATE!</div>
                  )}
                  {chessGame.current.isDraw() && (
                    <div className="text-orange-600 font-medium">DRAW!</div>
                  )}
                </div>
              </div>

              {/* Captured Pieces Display */}
              {(() => {
                const gameMoves = chessGame.current.getMoves();
                const capturedPieces = gameMoves
                  .filter(move => move.captured)
                  .map(move => ({
                    piece: move.captured,
                    color: move.color === 'w' ? 'black' : 'white',
                    symbol: move.captured === 'p' ? '♙' : 
                           move.captured === 'n' ? '♘' : 
                           move.captured === 'b' ? '♗' : 
                           move.captured === 'r' ? '♖' : 
                           move.captured === 'q' ? '♕' : '♔'
                  }));

                if (capturedPieces.length > 0) {
                  return (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-sm font-medium text-red-700 mb-2">Captured Pieces:</h3>
                      <div className="flex flex-wrap gap-1">
                        {capturedPieces.map((piece, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-sm rounded border ${
                              piece.color === 'white' 
                                ? 'bg-white text-black border-gray-300' 
                                : 'bg-black text-white border-gray-600'
                            }`}
                            title={`Captured ${piece.color} ${piece.piece}`}
                          >
                            {piece.symbol}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* GIF Preview */}
            {gifUrl && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-chess-dark">Generated Animation</h2>
                <div className="flex justify-center mb-4">
                  <img
                    src={gifUrl}
                    alt="Generated chess animation"
                    className="border-2 border-gray-300 rounded-lg shadow-md"
                  />
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-3 px-6 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                >
                  Download Animation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Chess Animation Maker - Create beautiful moving chess games</p>
        </div>
      </div>
    </div>
  )
}
