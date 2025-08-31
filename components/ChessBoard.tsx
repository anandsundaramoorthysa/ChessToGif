'use client'

import { useEffect, useRef } from 'react'

interface ChessBoardProps {
  fen: string
  size?: number
  highlightLastMove?: boolean
  lastMove?: string
  showCaptures?: boolean
}

const pieceSymbols: { [key: string]: string } = {
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
}

export default function ChessBoard({ 
  fen, 
  size = 400, 
  highlightLastMove = false,
  lastMove = '',
  showCaptures = true
}: ChessBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = size
    canvas.height = size

    const squareSize = size / 8

    // Parse FEN
    const [boardPart] = fen.split(' ')
    const ranks = boardPart.split('/')

    // Draw board with enhanced styling
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const isLight = (rank + file) % 2 === 0
        const x = file * squareSize
        const y = rank * squareSize

        // Enhanced square colors with subtle gradients
        if (isLight) {
          const gradient = ctx.createLinearGradient(x, y, x + squareSize, y + squareSize)
          gradient.addColorStop(0, '#F0D9B5')
          gradient.addColorStop(1, '#E6D3A8')
          ctx.fillStyle = gradient
        } else {
          const gradient = ctx.createLinearGradient(x, y, x + squareSize, y + squareSize)
          gradient.addColorStop(0, '#B58863')
          gradient.addColorStop(1, '#A67B5B')
          ctx.fillStyle = gradient
        }
        ctx.fillRect(x, y, squareSize, squareSize)

        // Enhanced move highlighting with better colors and effects
        if (highlightLastMove && lastMove) {
          const [from, to] = lastMove.split('-')
          if (from && to) {
            const fromFile = from.charCodeAt(0) - 97
            const fromRank = 8 - parseInt(from[1])
            const toFile = to.charCodeAt(0) - 97
            const toRank = 8 - parseInt(to[1])

            if ((file === fromFile && rank === fromRank) || 
                (file === toFile && rank === toRank)) {
              
              // Create highlight with better visual effect
              if (file === fromFile && rank === fromRank) {
                // From square - subtle highlight
                ctx.fillStyle = 'rgba(255, 255, 0, 0.4)'
                ctx.fillRect(x, y, squareSize, squareSize)
                
                // Add border highlight
                ctx.strokeStyle = 'rgba(255, 193, 7, 0.8)'
                ctx.lineWidth = 3
                ctx.strokeRect(x + 2, y + 2, squareSize - 4, squareSize - 4)
              } else {
                // To square - stronger highlight (might be a capture)
                ctx.fillStyle = 'rgba(255, 255, 0, 0.6)'
                ctx.fillRect(x, y, squareSize, squareSize)
                
                // Add border highlight
                ctx.strokeStyle = 'rgba(255, 193, 7, 1)'
                ctx.lineWidth = 4
                ctx.strokeRect(x + 2, y + 2, squareSize - 4, squareSize - 4)
              }
            }
          }
        }
      }
    }

    // Enhanced piece rendering with better shadows and effects
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

          // Enhanced piece rendering with better contrast and effects
          const isWhite = char === char.toUpperCase()
          
          if (isWhite) {
            // White pieces with enhanced styling
            ctx.fillStyle = '#FFFFFF'
            ctx.strokeStyle = '#2C3E50'
            ctx.lineWidth = 3
            
            // Add subtle shadow for white pieces
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
            ctx.shadowBlur = 3
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1
          } else {
            // Black pieces with enhanced visibility - using solid black fill
            ctx.fillStyle = '#000000'  // Solid black fill for black pieces
            ctx.strokeStyle = '#FFFFFF' // White outline for contrast
            ctx.lineWidth = 4  // Thick white outline
            
            // Strong shadow for black pieces
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
            ctx.shadowBlur = 4
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1
          }
          
          ctx.font = `bold ${Math.floor(squareSize * 0.65)}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const pieceSymbol = pieceSymbols[char] || char
          
          // Draw piece with enhanced effects
          ctx.strokeText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
          ctx.fillText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
          
          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          
          squareIndex++
        }
      }
    }

    // Enhanced coordinate rendering with better styling
    ctx.fillStyle = '#2C3E50'
    ctx.font = `bold ${Math.floor(squareSize * 0.18)}px Arial`
    ctx.textAlign = 'center'
    
    // Files (a-h) with enhanced styling
    for (let file = 0; file < 8; file++) {
      const x = file * squareSize + squareSize / 2
      const y = size - squareSize * 0.08
      
      // Add subtle background for better readability
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(x - 12, y - 12, 24, 24)
      
      ctx.fillStyle = '#2C3E50'
      ctx.fillText(String.fromCharCode(97 + file), x, y)
    }
    
    // Ranks (1-8) with enhanced styling
    for (let rank = 0; rank < 8; rank++) {
      const x = squareSize * 0.08
      const y = rank * squareSize + squareSize / 2
      
      // Add subtle background for better readability
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(x - 12, y - 12, 24, 24)
      
      ctx.fillStyle = '#2C3E50'
      ctx.fillText((8 - rank).toString(), x, y)
    }
  }, [fen, size, highlightLastMove, lastMove])

  return (
    <div className="relative group">
      <canvas
        ref={canvasRef}
        className="border-2 sm:border-4 border-slate-300 shadow-lg sm:shadow-2xl rounded-xl sm:rounded-2xl transition-all duration-300 group-hover:shadow-xl sm:group-hover:shadow-3xl group-hover:scale-[1.01] sm:group-hover:scale-[1.02]"
        style={{ width: size, height: size }}
      />
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}
