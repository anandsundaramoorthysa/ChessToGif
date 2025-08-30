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
          ctx.fillStyle = char === char.toUpperCase() ? '#FFFFFF' : '#000000'
          ctx.strokeStyle = char === char.toUpperCase() ? '#000000' : '#FFFFFF'
          ctx.lineWidth = 2
          ctx.font = `${squareSize * 0.6}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const pieceSymbol = pieceSymbols[char] || char
          ctx.strokeText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
          ctx.fillText(pieceSymbol, x + squareSize / 2, y + squareSize / 2)
        }
        
        squareIndex++
      }
    }
  }

  // Draw the moving piece at its current position
  if (movingPiece) {
    ctx.fillStyle = movingPiece.color === 'w' ? '#FFFFFF' : '#000000'
    ctx.strokeStyle = movingPiece.color === 'w' ? '#000000' : '#FFFFFF'
    ctx.lineWidth = 2
    ctx.font = `${squareSize * 0.6}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const pieceSymbol = pieceSymbols[movingPiece.symbol] || movingPiece.symbol
    ctx.strokeText(pieceSymbol, movingPiece.x + squareSize / 2, movingPiece.y + squareSize / 2)
    ctx.fillText(pieceSymbol, movingPiece.x + squareSize / 2, movingPiece.y + squareSize / 2)
  }

  // Draw coordinates
  ctx.fillStyle = '#000000'
  ctx.font = `${squareSize * 0.15}px Arial`
  ctx.textAlign = 'center'
  
  // Files (a-h)
  for (let file = 0; file < 8; file++) {
    const x = file * squareSize + squareSize / 2
    const y = boardSize - squareSize * 0.1
    ctx.fillText(String.fromCharCode(97 + file), x, y)
  }
  
  // Ranks (1-8)
  for (let rank = 0; rank < 8; rank++) {
    const x = squareSize * 0.1
    const y = rank * squareSize + squareSize / 2
    ctx.fillText((8 - rank).toString(), x, y)
  }
}

export async function generateAnimatedChessGif(
  moves: ChessMove[],
  boardSize: number,
  frameDelay: number
): Promise<Uint8Array> {
  try {
    console.log('Importing gifenc library...')
    const { default: GIFEncoder } = await import('gifenc')
    const { Chess } = await import('chess.js')
    console.log('gifenc library imported successfully')
    
    // Use default animation steps
    const animationSteps = 10
    
    // Create a palette for the chess board colors
    const palette = [
      [240, 217, 181], // Light square color (#F0D9B5)
      [181, 136, 99],  // Dark square color (#B58863)
      [255, 255, 255], // White pieces
      [0, 0, 0],       // Black pieces
    ]
    
    console.log(`Creating animated GIF with ${moves.length} moves...`)
    
    // Create GIF encoder
    const gif = GIFEncoder()
    const squareSize = boardSize / 8
    
    // Initialize chess game
    const chess = new Chess()
    
    // For each move, create animation frames
    for (let moveIndex = 0; moveIndex < moves.length; moveIndex++) {
      const move = moves[moveIndex]
      console.log(`Animating move ${moveIndex + 1}/${moves.length}: ${move.from} to ${move.to}`)
      
      // Get current FEN before the move
      const currentFen = chess.fen()
      
      // Get start and end coordinates
      const fromCoords = notationToCoords(move.from)
      const toCoords = notationToCoords(move.to)
      const fromPixels = coordsToPixels(fromCoords.file, fromCoords.rank, squareSize)
      const toPixels = coordsToPixels(toCoords.file, toCoords.rank, squareSize)
      
      // Create animation frames for this move
      for (let step = 0; step <= animationSteps; step++) {
        const progress = step / animationSteps
        
        // Create canvas for this frame
        const canvas = document.createElement('canvas')
        canvas.width = boardSize
        canvas.height = boardSize
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        
        // Calculate current position of moving piece
        const currentPos = interpolatePosition(fromPixels, toPixels, progress)
        
        // Render the board with the moving piece
        renderChessBoard(ctx, currentFen, boardSize, {
          symbol: move.piece,
          x: currentPos.x,
          y: currentPos.y,
          color: move.color
        })
        
        // Capture frame
        const frameData = ctx.getImageData(0, 0, boardSize, boardSize)
        const frameArray = new Uint8Array(frameData.data)
        
        // Write frame to GIF
        gif.writeFrame(frameArray, boardSize, boardSize, {
          delay: frameDelay,
          palette: palette,
          first: moveIndex === 0 && step === 0
        })
      }
      
      // Execute the move to update board state
      chess.move(move)
    }
    
    // Add a final frame showing the completed position
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = boardSize
    finalCanvas.height = boardSize
    const finalCtx = finalCanvas.getContext('2d')
    if (finalCtx) {
      renderChessBoard(finalCtx, chess.fen(), boardSize)
      const finalFrameData = finalCtx.getImageData(0, 0, boardSize, boardSize)
      const finalFrameArray = new Uint8Array(finalFrameData.data)
      
      gif.writeFrame(finalFrameArray, boardSize, boardSize, {
        delay: frameDelay * 2, // Hold final position longer
        palette: palette,
        first: false
      })
    }
    
    // Finish the GIF
    gif.finish()
    const result = gif.bytes()
    
    console.log('Animated GIF encoding completed, size:', result.length, 'bytes')
    return result
  } catch (error) {
    console.error('Error in generateAnimatedChessGif:', error)
    throw error
  }
}

export async function generateChessGif(
  canvas: HTMLCanvasElement,
  frameDelay: number = 1000,
  quality: number = 10
): Promise<Uint8Array> {
  // Get canvas context
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Get image data from canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  
  // Dynamically import gifenc only on client side
  const { default: GIFEncoder } = await import('gifenc')
  
  // Create a simple palette for the chess board
  const palette = [
    [240, 217, 181], // Light square color
    [181, 136, 99],  // Dark square color
    [255, 255, 255], // White pieces
    [0, 0, 0],       // Black pieces
    [255, 255, 0],   // Highlight color
  ]
  
  // Create GIF encoder
  const gif = GIFEncoder()
  
  // Convert Uint8ClampedArray to Uint8Array
  const frameData = new Uint8Array(imageData.data)
  
  // Write the frame
  gif.writeFrame(frameData, canvas.width, canvas.height, {
    delay: frameDelay,
    palette: palette,
    first: true
  })
  
  gif.finish()
  return gif.bytes()
}

export async function captureCanvasFrame(canvas: HTMLCanvasElement): Promise<ImageData> {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }
  
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function downloadGif(gifData: Uint8Array, filename: string = 'chess-game.gif') {
  const blob = new Blob([gifData], { type: 'image/gif' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
