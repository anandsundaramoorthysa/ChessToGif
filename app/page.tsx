'use client'

import { useState, useRef, useCallback } from 'react'
import ChessBoard from '@/components/ChessBoard'
import { ChessGameManager } from '@/utils/chessGame'
import { generateChessGif, downloadGif } from '@/utils/gifGenerator'

export default function Home() {
  const [movesText, setMovesText] = useState('')
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [isGenerating, setIsGenerating] = useState(false)
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [frameDelay, setFrameDelay] = useState(1000)
  const [boardSize, setBoardSize] = useState(400)
  const [highlightLastMove, setHighlightLastMove] = useState(true)
  
  const chessGame = useRef(new ChessGameManager())
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
          } else {
            setError('Invalid moves detected')
          }
        } catch (error) {
          // Don't show error for incomplete moves while typing
          console.log('Move parsing error (likely incomplete):', error)
        }
      } else {
        // Reset to initial position if no valid moves
        chessGame.current.reset()
        setCurrentFen(chessGame.current.getCurrentFen())
      }
    } else {
      chessGame.current.reset()
      setCurrentFen(chessGame.current.getCurrentFen())
    }
  }, [])

  const generateGif = useCallback(async () => {
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

      // Load moves and get all FENs
      const success = chessGame.current.loadMoves(moves)
      if (!success) {
        throw new Error('Invalid moves detected')
      }

      const fens = chessGame.current.getAllFens()
      const gameMoves = chessGame.current.getMoves()

      // Create a temporary canvas for GIF generation
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = boardSize
      tempCanvas.height = boardSize
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        throw new Error('Could not create canvas context')
      }

      // Generate frames for each position
      const frames: ImageData[] = []
      
      for (let i = 0; i < fens.length; i++) {
        const fen = fens[i]
        const lastMove = i > 0 ? `${gameMoves[i - 1].from}-${gameMoves[i - 1].to}` : ''
        
        // Create a temporary board component to render this position
        const boardCanvas = document.createElement('canvas')
        boardCanvas.width = boardSize
        boardCanvas.height = boardSize
        const boardCtx = boardCanvas.getContext('2d')
        if (!boardCtx) continue

        // Draw board
        const squareSize = boardSize / 8
        for (let rank = 0; rank < 8; rank++) {
          for (let file = 0; file < 8; file++) {
            const isLight = (rank + file) % 2 === 0
            const x = file * squareSize
            const y = rank * squareSize

            boardCtx.fillStyle = isLight ? '#F0D9B5' : '#B58863'
            boardCtx.fillRect(x, y, squareSize, squareSize)

            // Highlight last move if enabled
            if (highlightLastMove && lastMove) {
              const [from, to] = lastMove.split('-')
              if (from && to) {
                const fromFile = from.charCodeAt(0) - 97
                const fromRank = 8 - parseInt(from[1])
                const toFile = to.charCodeAt(0) - 97
                const toRank = 8 - parseInt(to[1])

                if ((file === fromFile && rank === fromRank) || 
                    (file === toFile && rank === toRank)) {
                  boardCtx.fillStyle = 'rgba(255, 255, 0, 0.5)'
                  boardCtx.fillRect(x, y, squareSize, squareSize)
                }
              }
            }
          }
        }

        // Draw pieces
        const pieceSymbols: { [key: string]: string } = {
          'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
          'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
        }

        const [boardPart] = fen.split(' ')
        const ranks = boardPart.split('/')
        let squareIndex = 0
        
        for (const rank of ranks) {
          for (const char of rank) {
            if (char >= '1' && char <= '8') {
              squareIndex += parseInt(char)
            } else {
              const file = squareIndex % 8
              const rankIndex = Math.floor(squareIndex / 8)
              const x = file * squareSize
              const y = rankIndex * squareSize

              boardCtx.fillStyle = char === char.toUpperCase() ? '#FFFFFF' : '#000000'
              boardCtx.strokeStyle = char === char.toUpperCase() ? '#000000' : '#FFFFFF'
              boardCtx.lineWidth = 2
              boardCtx.font = `${squareSize * 0.6}px Arial`
              boardCtx.textAlign = 'center'
              boardCtx.textBaseline = 'middle'
              
              const pieceSymbol = pieceSymbols[char] || char
              boardCtx.strokeText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
              boardCtx.fillText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
              
              squareIndex++
            }
          }
        }

        // Draw coordinates
        boardCtx.fillStyle = '#000000'
        boardCtx.font = `${squareSize * 0.15}px Arial`
        boardCtx.textAlign = 'center'
        
        // Files (a-h)
        for (let file = 0; file < 8; file++) {
          const x = file * squareSize + squareSize / 2
          const y = boardSize - squareSize * 0.1
          boardCtx.fillText(String.fromCharCode(97 + file), x, y)
        }
        
        // Ranks (1-8)
        for (let rank = 0; rank < 8; rank++) {
          const x = squareSize * 0.1
          const y = rank * squareSize + squareSize / 2
          boardCtx.fillText((8 - rank).toString(), x, y)
        }

        // Capture frame
        const frameData = boardCtx.getImageData(0, 0, boardSize, boardSize)
        frames.push(frameData)
      }

      // Generate GIF
      const gif = await generateChessGifFromFrames(frames, frameDelay)
      
      // Create preview URL
      const blob = new Blob([gif], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)
      setGifUrl(url)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate GIF')
    } finally {
      setIsGenerating(false)
    }
  }, [movesText, frameDelay, boardSize, highlightLastMove])

  const generateChessGifFromFrames = async (frames: ImageData[], delay: number): Promise<Uint8Array> => {
    const { encodeGIF } = await import('gifenc')
    
    const frameData = frames.map(frame => frame.data)
    
    return encodeGIF(frameData, {
      width: boardSize,
      height: boardSize,
      delay: delay,
      quality: 10,
    })
  }

  const handleDownload = useCallback(() => {
    if (gifUrl) {
      const link = document.createElement('a')
      link.href = gifUrl
      link.download = 'chess-game.gif'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [gifUrl])

  const handleExampleLoad = useCallback(() => {
    const exampleMoves = 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7'
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
              {/* Logo placeholder - you can replace this with the actual logo image */}
              <div className="w-full h-full bg-gradient-to-br from-chess-gold to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">♞</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-chess-dark">
              Chess <span className="text-chess-gold">To</span>Gif
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Create animated GIFs from chess moves
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

              <div className="flex gap-2">
                <button
                  onClick={handleExampleLoad}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Load Example
                </button>
                <button
                  onClick={() => {
                    setMovesText('')
                    handleMovesChange('')
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-chess-dark">Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frame Delay (ms): {frameDelay}
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="100"
                    value={frameDelay}
                    onChange={(e) => setFrameDelay(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Board Size (px): {boardSize}
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
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="highlightLastMove"
                    checked={highlightLastMove}
                    onChange={(e) => setHighlightLastMove(e.target.checked)}
                    className="h-4 w-4 text-chess-gold focus:ring-chess-gold border-gray-300 rounded"
                  />
                  <label htmlFor="highlightLastMove" className="ml-2 block text-sm text-gray-700">
                    Highlight last move
                  </label>
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
                {isGenerating ? 'Generating GIF...' : 'Generate GIF'}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
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
                  highlightLastMove={highlightLastMove}
                />
              </div>
            </div>

            {/* GIF Preview */}
            {gifUrl && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-chess-dark">Generated GIF</h2>
                <div className="flex justify-center mb-4">
                  <img
                    src={gifUrl}
                    alt="Generated chess GIF"
                    className="border-2 border-gray-300 rounded-lg shadow-md"
                  />
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-3 px-6 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                >
                  Download GIF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Chess Move GIF Maker - Create beautiful animated chess games</p>
        </div>
      </div>
    </div>
  )
}
