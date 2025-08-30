export interface GifOptions {
  frameDelay?: number
  quality?: number
  boardSize?: number
}

export interface ChessMove {
  from: string
  to: string
  piece: string
  color: 'w' | 'b'
  san?: string
}

// Convert chess notation to board coordinates
function notationToCoords(notation: string): { file: number; rank: number } {
  const file = notation.charCodeAt(0) - 97 // 'a' = 0, 'b' = 1, etc.
  const rank = 8 - parseInt(notation[1]) // '1' = 7, '2' = 6, etc.
  return { file, rank }
}

// Convert board coordinates to pixel coordinates
function coordsToPixels(file: number, rank: number, squareSize: number): { x: number; y: number } {
  return {
    x: file * squareSize,
    y: rank * squareSize
  }
}

// Interpolate between two positions for smooth animation
function interpolatePosition(from: { x: number; y: number }, to: { x: number; y: number }, progress: number) {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress
  }
}

// Render a chess board with pieces at specific positions
function renderChessBoard(
  ctx: CanvasRenderingContext2D,
  fen: string,
  boardSize: number,
  movingPiece?: { symbol: string; x: number; y: number; color: 'w' | 'b' }
): void {
  const squareSize = boardSize / 8
  const pieceSymbols: { [key: string]: string } = {
    'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
    'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
  }

  // Clear the entire canvas first
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, boardSize, boardSize)

  // Draw board squares
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const isLight = (rank + file) % 2 === 0
      const x = file * squareSize
      const y = rank * squareSize

      ctx.fillStyle = isLight ? '#F0D9B5' : '#B58863'
      ctx.fillRect(x, y, squareSize, squareSize)
    }
  }

  // Draw pieces from FEN
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

        // Don't draw the piece if it's the moving piece
        if (!movingPiece || char !== movingPiece.symbol) {
          // Enhanced piece rendering for better visibility
          const isWhite = char === char.toUpperCase()
          ctx.fillStyle = isWhite ? '#FFFFFF' : '#000000'
          ctx.strokeStyle = isWhite ? '#000000' : '#FFFFFF'
          ctx.lineWidth = 3
          ctx.font = `bold ${Math.floor(squareSize * 0.7)}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const pieceSymbol = pieceSymbols[char] || char
          
          // Add shadow for better visibility
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
          ctx.shadowBlur = 2
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 1
          
          ctx.strokeText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
          ctx.fillText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
          
          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        }
        
        squareIndex++
      }
    }
  }

  // Draw the moving piece at its current position
  if (movingPiece) {
    // Enhanced moving piece rendering
    ctx.fillStyle = movingPiece.color === 'w' ? '#FFFFFF' : '#000000'
    ctx.strokeStyle = movingPiece.color === 'w' ? '#000000' : '#FFFFFF'
    ctx.lineWidth = 4
    ctx.font = `bold ${Math.floor(squareSize * 0.7)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const pieceSymbol = pieceSymbols[movingPiece.symbol] || movingPiece.symbol
    
    // Add glow effect for moving piece
    ctx.shadowColor = '#FFFF00'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    ctx.strokeText(pieceSymbol, movingPiece.x + squareSize / 2, movingPiece.y + squareSize / 2)
    ctx.fillText(pieceSymbol, movingPiece.x + squareSize / 2, movingPiece.y + squareSize / 2)
    
    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  // Draw coordinates with better visibility
  ctx.fillStyle = '#000000'
  ctx.font = `bold ${Math.floor(squareSize * 0.18)}px Arial`
  ctx.textAlign = 'center'
  
  // Files (a-h)
  for (let file = 0; file < 8; file++) {
    const x = file * squareSize + squareSize / 2
    const y = boardSize - squareSize * 0.08
    ctx.fillText(String.fromCharCode(97 + file), x, y)
  }
  
  // Ranks (1-8)
  for (let rank = 0; rank < 8; rank++) {
    const x = squareSize * 0.08
    const y = rank * squareSize + squareSize / 2
    ctx.fillText((8 - rank).toString(), x, y)
  }
}

// Simple GIF-like animation using canvas and image data
export async function generateAnimatedChessGif(
  moves: ChessMove[],
  boardSize: number,
  frameDelay: number
): Promise<Uint8Array> {
  try {
    console.log(`Creating animated chess sequence with ${moves.length} moves...`)
    console.log('Moves:', moves)
    
    // Use fewer animation steps for better performance
    const animationSteps = 6
    
    // Initialize chess game
    const { Chess } = await import('chess.js')
    const chess = new Chess()
    
    // Create a canvas for the final composite image
    const canvas = document.createElement('canvas')
    canvas.width = boardSize * (moves.length + 1) // +1 for initial position
    canvas.height = boardSize
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Could not create canvas context')
    }
    
    // Fill background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    let currentX = 0
    
    // Draw initial position
    const initialCanvas = document.createElement('canvas')
    initialCanvas.width = boardSize
    initialCanvas.height = boardSize
    const initialCtx = initialCanvas.getContext('2d')
    if (initialCtx) {
      renderChessBoard(initialCtx, chess.fen(), boardSize)
      ctx.drawImage(initialCanvas, currentX, 0)
      currentX += boardSize
    }
    
    // For each move, create animation frames and draw final position
    for (let moveIndex = 0; moveIndex < moves.length; moveIndex++) {
      const move = moves[moveIndex]
      console.log(`Processing move ${moveIndex + 1}/${moves.length}: ${move.from} to ${move.to} (${move.piece})`)
      
      // Get current FEN before the move
      const currentFen = chess.fen()
      
      // Execute the move to update board state
      const moveResult = chess.move(move)
      if (!moveResult) {
        console.error(`Failed to execute move: ${move.from}-${move.to}`)
        continue
      }
      
      // Draw the position after this move
      const moveCanvas = document.createElement('canvas')
      moveCanvas.width = boardSize
      moveCanvas.height = boardSize
      const moveCtx = moveCanvas.getContext('2d')
      if (moveCtx) {
        renderChessBoard(moveCtx, chess.fen(), boardSize)
        ctx.drawImage(moveCanvas, currentX, 0)
        currentX += boardSize
      }
    }
    
    // Convert canvas to blob and then to array
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          blob.arrayBuffer().then(buffer => {
            resolve(new Uint8Array(buffer))
          }).catch(reject)
        } else {
          reject(new Error('Failed to create blob'))
        }
      }, 'image/png', 0.9)
    })
    
  } catch (error) {
    console.error('Error in generateAnimatedChessGif:', error)
    throw error
  }
}

// Generate a simple static chess board image
export async function generateChessBoardImage(
  fen: string,
  boardSize: number
): Promise<Uint8Array> {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = boardSize
    canvas.height = boardSize
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Could not create canvas context')
    }
    
    renderChessBoard(ctx, fen, boardSize)
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          blob.arrayBuffer().then(buffer => {
            resolve(new Uint8Array(buffer))
          }).catch(reject)
        } else {
          reject(new Error('Failed to create blob'))
        }
      }, 'image/png', 0.9)
    })
    
  } catch (error) {
    console.error('Error in generateChessBoardImage:', error)
    throw error
  }
}

// Download function for the generated image
export function downloadImage(imageData: Uint8Array, filename: string = 'chess-sequence.png') {
  const blob = new Blob([imageData], { type: 'image/png' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
