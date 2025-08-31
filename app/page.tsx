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
  const [boardSize, setBoardSize] = useState(400)
  const [lastMove, setLastMove] = useState('')
  const [legalMoves, setLegalMoves] = useState<string[]>([])
  const [showPromotion, setShowPromotion] = useState(false)
  const [promotionMove, setPromotionMove] = useState('')
  const [promotionOptions] = useState([
    { piece: 'Q', symbol: '♕', name: 'Queen', color: 'from-purple-500 to-purple-600' },
    { piece: 'R', symbol: '♖', name: 'Rook', color: 'from-blue-500 to-blue-600' },
    { piece: 'B', symbol: '♗', name: 'Bishop', color: 'from-green-500 to-green-600' },
    { piece: 'N', symbol: '♘', name: 'Knight', color: 'from-orange-500 to-purple-600' }
  ])
  
  const chessGame = useRef(new ChessGameManager())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Responsive board size based on screen size
  useEffect(() => {
    const updateBoardSize = () => {
      if (window.innerWidth < 640) { // sm breakpoint
        setBoardSize(280) // Smaller for mobile
      } else if (window.innerWidth < 1024) { // lg breakpoint
        setBoardSize(320) // Medium for tablets
      } else {
        setBoardSize(400) // Full size for desktop
      }
    }

    updateBoardSize()
    window.addEventListener('resize', updateBoardSize)
    
    return () => window.removeEventListener('resize', updateBoardSize)
  }, [])

  // Example moves with different complexity levels
  const examples = {
    beginner: { name: 'Beginner', moves: 'e4 e5 Nf3 Nc6', color: 'from-green-500 to-green-600', icon: '🌱' },
    intermediate: { name: 'Intermediate', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7', color: 'from-blue-500 to-blue-600', icon: '🎯' },
    captures: { name: 'Captures', moves: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 e6 Be3 Nf6 Nf3 Be7 Bd3 O-O O-O Nc6', color: 'from-purple-500 to-purple-600', icon: '⚔️' }
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
  }, [boardSize])

  const handleMovesChange = useCallback((text: string) => {
    setMovesText(text)
    setError(null)
    setShowPromotion(false) // Hide promotion UI when text changes
    
    if (text.trim()) {
      const moves = chessGame.current.parseMovesText(text)
      if (moves.length > 0) {
        try {
          // Check if the last move is a pawn promotion
          const lastMove = moves[moves.length - 1]
          if (chessGame.current.isPawnPromotion(lastMove) && !lastMove.includes('=')) {
            // Show promotion selection
            setPromotionMove(lastMove)
            setShowPromotion(true)
            return // Don't execute the move yet
          }
          
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
      const moves = chessGame.current.parseMovesText(movesText)
      
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

      // Generate animated GIF with piece movements
      const gif = await generateAnimatedChessGif(
        gameMoves, 
        boardSize
      )
      
      if (gif.length === 0) {
        throw new Error('Generated GIF is empty')
      }
      
      // Create preview URL
      const blob = new Blob([gif], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)
      setGifUrl(url)

    } catch (err) {
      console.error('GIF generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate GIF')
    } finally {
      setIsGenerating(false)
    }
  }, [movesText, boardSize])

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
    const example = examples[exampleType]
    setMovesText(example.moves)
    handleMovesChange(example.moves)
  }, [handleMovesChange])

  const handlePromotion = useCallback((promotionPiece: string) => {
    if (promotionMove) {
      const newMove = promotionMove + '=' + promotionPiece
      const updatedMovesText = movesText.replace(promotionMove, newMove)
      setMovesText(updatedMovesText)
      setShowPromotion(false)
      setPromotionMove('')
      // Now process the updated moves
      handleMovesChange(updatedMovesText)
    }
  }, [promotionMove, movesText, handleMovesChange])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with floating animation */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="flex flex-col items-center justify-center mb-6 lg:mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 mb-4 lg:mb-6 relative float">
              <img 
                src="/ChessToGIf.png" 
                alt="ChessToGif Logo" 
                className="w-full h-full object-contain drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-3 lg:mb-4 tracking-tight">
              ChessToGif
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-4 lg:mb-6 font-medium">
              Animated Chess Game Creator
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <p className="text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed mb-6 lg:mb-8 px-4">
              Transform your chess games into beautiful animated GIFs. Perfect for sharing moves, 
              analyzing games, or creating chess content for social media.
            </p>
            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 lg:mb-8 px-4">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 shadow-lg">
                <span className="text-lg sm:text-2xl">🎬</span>
                <span className="font-semibold text-slate-700 text-sm sm:text-base">Animated GIFs</span>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 shadow-lg">
                <span className="text-lg sm:text-2xl">♟️</span>
                <span className="font-semibold text-slate-700 text-sm sm:text-base">Real-time Preview</span>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 shadow-lg">
                <span className="text-lg sm:text-2xl">💾</span>
                <span className="font-semibold text-slate-700 text-sm sm:text-base">Easy Download</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-10">
          {/* Left Column - Input and Controls */}
          <div className="space-y-6 lg:space-y-8">
            {/* Enhanced Input Section */}
            <div className="glass card-hover rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/30 shadow-2xl">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 mr-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">♟️</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Chess Moves</h2>
              </div>
              
              <div className="mb-8">
                <label className="block text-lg font-semibold text-slate-700 mb-4">
                  Enter moves (PGN or SAN format)
                </label>
                <textarea
                  value={movesText}
                  onChange={(e) => handleMovesChange(e.target.value)}
                  placeholder="e4 e5 Nf3 Nc6 Bb5 a6..."
                  className="w-full h-40 p-6 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-400/30 focus:border-amber-400 resize-none transition-all duration-300 text-slate-800 text-lg font-mono shadow-lg focus:shadow-xl"
                />
              </div>

              {/* Enhanced Example Buttons */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                {Object.entries(examples).map(([key, example]) => (
                  <button
                    key={key}
                    onClick={() => handleExampleLoad(key as keyof typeof examples)}
                    className={`p-4 bg-gradient-to-r ${example.color} text-white rounded-2xl hover:shadow-xl transition-all duration-300 text-sm font-semibold btn-hover group`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                        {example.icon}
                      </span>
                      <span>{example.name}</span>
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                      {example.moves.split(' ').length} moves
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setMovesText('')
                    handleMovesChange('')
                  }}
                  className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:shadow-xl transition-all duration-300 text-sm font-semibold btn-hover"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-xl">🗑️</span>
                    <span>Clear All Moves</span>
                  </div>
                </button>
              </div>

              {/* Enhanced Chess Notation Help */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl">
                <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <span className="w-6 h-6 mr-3 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">📚</span>
                  Chess Notation Help
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div className="space-y-2">
                    <div><strong>Pawn moves:</strong> e4, d5, exd5 (capture)</div>
                    <div><strong>Piece moves:</strong> Nf3, Bxe4 (capture), Qxd8+ (check)</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>Castling:</strong> O-O (kingside), O-O-O (queenside)</div>
                    <div><strong>Promotion:</strong> e8=Q (queen), e8=R (rook), e8=B (bishop), e8=N (knight)</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Pawn Promotion Selection */}
              {showPromotion && (
                <div className="mt-8 p-8 bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-300 rounded-2xl shadow-xl">
                  <h4 className="text-lg font-semibold text-amber-800 mb-6 flex items-center">
                    <span className="w-8 h-8 mr-3 bg-amber-500 rounded-xl flex items-center justify-center text-white text-xl">👑</span>
                    Pawn Promotion: Choose your piece
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {promotionOptions.map((option) => (
                      <button
                        key={option.piece}
                        onClick={() => handlePromotion(option.piece)}
                        className={`p-6 bg-gradient-to-r ${option.color} text-white rounded-2xl hover:shadow-xl transition-all duration-300 btn-hover group`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                            {option.symbol}
                          </span>
                          <span className="font-semibold">{option.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-amber-700 font-medium text-lg">
                      Move: <span className="font-mono bg-white/50 px-3 py-1 rounded-lg">{promotionMove}</span> → Choose promotion piece
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Enhanced Generate Button */}
            <div className="glass card-hover rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/30 shadow-2xl">
              <button
                onClick={generateGif}
                disabled={isGenerating || !movesText.trim()}
                className="w-full py-6 px-8 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold text-xl rounded-2xl hover:from-yellow-500 hover:to-amber-400 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-3xl btn-hover group"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="spinner -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Animation...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-3 text-2xl group-hover:scale-110 transition-transform duration-200">🎬</span>
                    Generate Animation
                  </span>
                )}
              </button>
              
              {error && (
                <div className="mt-8 p-6 bg-gradient-to-br from-red-50 to-pink-100 border border-red-300 rounded-2xl shadow-lg">
                  <div className="font-semibold mb-4 text-red-800 flex items-center">
                    <span className="w-6 h-6 mr-3 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm">⚠️</span>
                    Error: {error}
                  </div>
                  {legalMoves.length > 0 && (
                    <div className="text-sm">
                      <div className="font-semibold text-red-700 mb-3">Available legal moves:</div>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-3 bg-red-50 rounded-lg">
                        {legalMoves.slice(0, 10).map((move, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 bg-red-100 text-red-800 text-sm rounded-lg border border-red-300 font-medium shadow-sm hover:bg-red-200 transition-colors duration-200"
                          >
                            {move}
                          </span>
                        ))}
                        {legalMoves.length > 10 && (
                          <span className="px-3 py-2 bg-red-200 text-red-700 text-sm rounded-lg font-medium">
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
          <div className="space-y-6 lg:space-y-8">
            {/* Enhanced Current Board Preview */}
            <div className="glass card-hover rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/30 shadow-2xl">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 mr-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏁</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Current Position</h2>
              </div>
              <div className="flex justify-center mb-6 lg:mb-8">
                <div className="p-2 sm:p-3 lg:p-4 bg-white rounded-2xl lg:rounded-3xl shadow-lg lg:shadow-2xl">
                  <ChessBoard
                    fen={currentFen}
                    size={boardSize}
                    highlightLastMove={true}
                    lastMove={lastMove}
                  />
                </div>
              </div>
              
              {/* Enhanced Legal Moves Display */}
              {legalMoves.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                    <span className="w-6 h-6 mr-3 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">🎯</span>
                    Legal moves ({legalMoves.length} available):
                  </h3>
                  <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto custom-scrollbar p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    {legalMoves.slice(0, 20).map((move, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-white text-slate-700 text-sm rounded-xl border border-slate-200 font-medium shadow-md hover:shadow-lg hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                      >
                        {move}
                      </span>
                    ))}
                    {legalMoves.length > 20 && (
                      <span className="px-4 py-2 bg-slate-200 text-slate-600 text-sm rounded-xl font-medium">
                        +{legalMoves.length - 20} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Game State Information */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl shadow-lg">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                  <span className="w-6 h-6 mr-3 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">📊</span>
                  Game State
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="font-medium">Turn:</span>
                    <span className={`font-semibold px-3 py-1 rounded-lg ${
                      chessGame.current.getTurn() === 'w' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {chessGame.current.getTurn() === 'w' ? 'White' : 'Black'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="font-medium">Move:</span>
                    <span className="font-semibold text-slate-800 bg-amber-100 px-3 py-1 rounded-lg">
                      {chessGame.current.getMoves().length > 0 ? Math.ceil(chessGame.current.getMoves().length / 2) : 1}
                    </span>
                  </div>
                </div>
                
                {/* Game Status Indicators */}
                <div className="mt-4 space-y-2">
                  {chessGame.current.isCheck() && (
                    <div className="text-red-600 font-bold text-center py-3 bg-red-100 rounded-xl border border-red-200 shadow-md">
                      ⚡ CHECK! ⚡
                    </div>
                  )}
                  {chessGame.current.isCheckmate() && (
                    <div className="text-red-800 font-bold text-center py-3 bg-red-200 rounded-xl border border-red-300 shadow-md">
                      🏆 CHECKMATE! 🏆
                    </div>
                  )}
                  {chessGame.current.isDraw() && (
                    <div className="text-orange-600 font-bold text-center py-3 bg-orange-100 rounded-xl border border-orange-200 shadow-md">
                      🤝 DRAW! 🤝
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Captured Pieces Display */}
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
                    <div className="mt-8 p-6 bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 rounded-2xl shadow-lg">
                      <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                        <span className="w-6 h-6 mr-3 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm">⚔️</span>
                        Captured Pieces
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {capturedPieces.map((piece, index) => (
                          <span
                            key={index}
                            className={`px-4 py-3 text-2xl rounded-xl border-2 shadow-lg hover:scale-110 transition-transform duration-200 ${
                              piece.color === 'white' 
                                ? 'bg-white text-black border-slate-300' 
                                : 'bg-black text-white border-slate-600'
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

            {/* Enhanced GIF Preview */}
            {gifUrl && (
              <div className="glass card-hover rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/30 shadow-2xl">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 mr-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Generated Animation</h2>
                </div>
                <div className="flex justify-center mb-6 lg:mb-8">
                  <div className="p-2 sm:p-3 lg:p-4 bg-white rounded-2xl lg:rounded-3xl shadow-lg lg:shadow-2xl">
                    <img
                      src={gifUrl}
                      alt="Generated chess animation"
                      className="border-2 sm:border-4 border-slate-200 rounded-xl sm:rounded-2xl shadow-lg max-w-full"
                    />
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-6 px-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl rounded-2xl hover:from-emerald-600 hover:to-green-500 transition-all duration-300 shadow-2xl hover:shadow-3xl btn-hover group"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-3 text-2xl group-hover:scale-110 transition-transform duration-200">💾</span>
                    Download Animation
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-12 lg:mt-20 text-center">
          <div className="glass rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/30 shadow-xl">
            <p className="text-slate-600 text-lg mb-4">
              Crafted with ❤️ & code by{' '}
              <a 
                href="https://www.linkedin.com/in/anandsundaramoorthysa/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gradient font-semibold hover:scale-105 transition-transform duration-200 underline"
              >
                Anand Sundaramoorthy SA
              </a>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
