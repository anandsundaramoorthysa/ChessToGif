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

// Create animated chess GIF showing piece movements
export async function generateAnimatedChessGif(
  moves: ChessMove[],
  boardSize: number,
  frameDelay: number
): Promise<Uint8Array> {
  try {
    console.log(`Creating animated GIF with ${moves.length} moves...`)
    console.log('Moves:', moves)
    
    // Use fewer animation steps for better performance
    const animationSteps = 8
    
    // Initialize chess game
    const { Chess } = await import('chess.js')
    const chess = new Chess()
    
    // Create frames array to store all animation frames
    const frames: ImageData[] = []
    
    // Add initial position frame
    const initialCanvas = document.createElement('canvas')
    initialCanvas.width = boardSize
    initialCanvas.height = boardSize
    const initialCtx = initialCanvas.getContext('2d')
    if (initialCtx) {
      renderChessBoard(initialCtx, chess.fen(), boardSize)
      const initialData = initialCtx.getImageData(0, 0, boardSize, boardSize)
      frames.push(initialData)
    }
    
    // For each move, create animation frames
    for (let moveIndex = 0; moveIndex < moves.length; moveIndex++) {
      const move = moves[moveIndex]
      console.log(`Animating move ${moveIndex + 1}/${moves.length}: ${move.from} to ${move.to} (${move.piece})`)
      
      // Get current FEN before the move
      const currentFen = chess.fen()
      
      // Get start and end coordinates
      const fromCoords = notationToCoords(move.from)
      const toCoords = notationToCoords(move.to)
      const fromPixels = coordsToPixels(fromCoords.file, fromCoords.rank, boardSize / 8)
      const toPixels = coordsToPixels(toCoords.file, toCoords.rank, boardSize / 8)
      
      // Create animation frames for this move
      for (let step = 0; step <= animationSteps; step++) {
        const progress = step / animationSteps
        
        // Create canvas for this frame
        const canvas = document.createElement('canvas')
        canvas.width = boardSize
        canvas.height = boardSize
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.error('Could not get canvas context for frame')
          continue
        }
        
        // Calculate current position of moving piece
        const currentPos = interpolatePosition(fromPixels, toPixels, progress)
        
        // Get the correct piece symbol for the moving piece
        const pieceSymbol = move.piece.toUpperCase() === move.piece ? move.piece : move.piece.toLowerCase()
        
        // Render the board with the moving piece
        renderChessBoard(ctx, currentFen, boardSize, {
          symbol: pieceSymbol,
          x: currentPos.x,
          y: currentPos.y,
          color: move.color
        })
        
        // Capture frame
        const frameData = ctx.getImageData(0, 0, boardSize, boardSize)
        frames.push(frameData)
      }
      
      // Execute the move to update board state
      const moveResult = chess.move(move)
      if (!moveResult) {
        console.error(`Failed to execute move: ${move.from}-${move.to}`)
      }
    }
    
    // Add a final frame showing the completed position
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = boardSize
    finalCanvas.height = boardSize
    const finalCtx = finalCanvas.getContext('2d')
    if (finalCtx) {
      renderChessBoard(finalCtx, chess.fen(), boardSize)
      const finalFrameData = finalCtx.getImageData(0, 0, boardSize, boardSize)
      frames.push(finalFrameData)
    }
    
    // Convert frames to GIF using a working approach
    const gifData = await framesToGif(frames, boardSize, boardSize, frameDelay)
    
    console.log('Animated GIF encoding completed, size:', gifData.length, 'bytes')
    return gifData
    
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

// Convert frames to GIF using a working method
async function framesToGif(frames: ImageData[], width: number, height: number, delay: number): Promise<Uint8Array> {
  try {
    // Try to use gif.js library if available, otherwise fall back to a different approach
    const gifData = await createGifWithGifJs(frames, width, height, delay)
    return gifData
  } catch (error) {
    console.log('GIF.js not available, using alternative method:', error)
    // Fallback: create a simple animated sequence
    return await createSimpleAnimatedSequence(frames, width, height, delay)
  }
}

// Try to use gif.js library for proper GIF generation
async function createGifWithGifJs(frames: ImageData[], width: number, height: number, delay: number): Promise<Uint8Array> {
  // Dynamic import of gif.js
  const GIF = await import('gif.js')
  
  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: width,
      height: height,
      workerScript: '/gif.worker.js' // You might need to add this file
    })
    
    // Add frames
    frames.forEach((frame, index) => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(frame, 0, 0)
        gif.addFrame(canvas, { delay: delay })
      }
    })
    
    gif.on('finished', (blob: Blob) => {
      blob.arrayBuffer().then(buffer => {
        resolve(new Uint8Array(buffer))
      }).catch(reject)
    })
    
    gif.render()
  })
}

// Fallback method: create a simple animated sequence
async function createSimpleAnimatedSequence(frames: ImageData[], width: number, height: number, delay: number): Promise<Uint8Array> {
  // Create a canvas that shows all frames in sequence
  const canvas = document.createElement('canvas')
  canvas.width = width * frames.length
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Could not create canvas context')
  }
  
  // Fill background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw all frames horizontally
  frames.forEach((frame, index) => {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCtx.putImageData(frame, 0, 0)
      ctx.drawImage(tempCanvas, index * width, 0)
    }
  })
  
  // Convert to blob and then to array
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
}
