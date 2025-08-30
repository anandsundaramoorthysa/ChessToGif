'use client'

import { useEffect, useRef } from 'react'

interface ChessBoardProps {
  fen: string
  size?: number
  highlightLastMove?: boolean
  lastMove?: string
}

const pieceSymbols: { [key: string]: string } = {
  'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
  'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
}

export default function ChessBoard({ 
  fen, 
  size = 400, 
  highlightLastMove = false,
  lastMove = ''
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

    // Draw board
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const isLight = (rank + file) % 2 === 0
        const x = file * squareSize
        const y = rank * squareSize

        // Draw square
        ctx.fillStyle = isLight ? '#F0D9B5' : '#B58863'
        ctx.fillRect(x, y, squareSize, squareSize)

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
              ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'
              ctx.fillRect(x, y, squareSize, squareSize)
            }
          }
        }
      }
    }

    // Draw pieces
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

          // Draw piece
          ctx.fillStyle = char === char.toUpperCase() ? '#FFFFFF' : '#000000'
          ctx.strokeStyle = char === char.toUpperCase() ? '#000000' : '#FFFFFF'
          ctx.lineWidth = 2
          ctx.font = `${squareSize * 0.6}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const pieceSymbol = pieceSymbols[char] || char
          ctx.strokeText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
          ctx.fillText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
          
          squareIndex++
        }
      }
    }

    // Draw coordinates
    ctx.fillStyle = '#000000'
    ctx.font = `${squareSize * 0.15}px Arial`
    ctx.textAlign = 'center'
    
    // Files (a-h)
    for (let file = 0; file < 8; file++) {
      const x = file * squareSize + squareSize / 2
      const y = size - squareSize * 0.1
      ctx.fillText(String.fromCharCode(97 + file), x, y)
    }
    
    // Ranks (1-8)
    for (let rank = 0; rank < 8; rank++) {
      const x = squareSize * 0.1
      const y = rank * squareSize + squareSize / 2
      ctx.fillText((8 - rank).toString(), x, y)
    }
  }, [fen, size, highlightLastMove, lastMove])

  return (
    <canvas
      ref={canvasRef}
      className="border-2 border-gray-800 shadow-lg"
      style={{ width: size, height: size }}
    />
  )
}
