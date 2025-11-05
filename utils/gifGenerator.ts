export interface GifOptions {
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
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
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
          
          // Better contrast for black pieces
          if (isWhite) {
            ctx.fillStyle = '#FFFFFF'
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 3
          } else {
            // Make black pieces much more visible with solid black fill and white outline
            ctx.fillStyle = '#000000'  // Solid black fill for black pieces
            ctx.strokeStyle = '#FFFFFF' // White outline for contrast
            ctx.lineWidth = 4  // Thick white outline
          }
          
          ctx.font = `bold ${Math.floor(squareSize * 0.7)}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const pieceSymbol = pieceSymbols[char] || char
          
          // Add shadow for better visibility
          if (isWhite) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
            ctx.shadowBlur = 2
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1
          } else {
            // Strong shadow for black pieces to ensure visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
            ctx.shadowBlur = 6
            ctx.shadowOffsetX = 2
            ctx.shadowOffsetY = 2
          }
          
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
  boardSize: number
): Promise<Uint8Array> {
  try {
    
    // Use fewer animation steps for better performance
    const animationSteps = 8
    
    // Initialize chess game with starting position
    const { Chess } = await import('chess.js')
    const chess = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    
    // Create frames array to store all animation frames
    const frames: ImageData[] = []
    
    // Add initial position frame
    const initialCanvas = document.createElement('canvas')
    initialCanvas.width = boardSize
    initialCanvas.height = boardSize
    const initialCtx = initialCanvas.getContext('2d', { willReadFrequently: true })
    if (initialCtx) {
      renderChessBoard(initialCtx, chess.fen(), boardSize)
      const initialData = initialCtx.getImageData(0, 0, boardSize, boardSize)
      frames.push(initialData)
    }
    
    // For each move, create animation frames
    for (let moveIndex = 0; moveIndex < moves.length; moveIndex++) {
      const move = moves[moveIndex]
      
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
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
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })
    if (finalCtx) {
      renderChessBoard(finalCtx, chess.fen(), boardSize)
      const finalFrameData = finalCtx.getImageData(0, 0, boardSize, boardSize)
      frames.push(finalFrameData)
    }
    
    // Convert frames to GIF using a working approach
    const gifData = await framesToGif(frames, boardSize, boardSize, 200)
    
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
  const blob = new Blob([imageData as BlobPart], { type: 'image/png' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Convert frames to GIF using gifenc (more reliable in browser/bundled environments)
async function framesToGif(frames: ImageData[], width: number, height: number, delay: number): Promise<Uint8Array> {
  // Directly use gifenc to avoid worker/script path issues from gif.js
  return await createGifWithGifenc(frames, width, height, delay)
}

// Create GIF using gif.js library
async function createGifWithGifJs(frames: ImageData[], width: number, height: number, delay: number): Promise<Uint8Array> {
  try {
    // Import gif.js library
    const GIF = (await import('gif.js')).default
    
    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('GIF generation timed out after 15 seconds'))
      }, 15000)
      
      let isCompleted = false
      
      const complete = (result: Uint8Array) => {
        if (!isCompleted) {
          isCompleted = true
          clearTimeout(timeout)
          resolve(result)
        }
      }
      
      const fail = (error: Error) => {
        if (!isCompleted) {
          isCompleted = true
          clearTimeout(timeout)
          reject(error)
        }
      }
      // Create GIF instance with simpler configuration
      const gif = new GIF({
        workers: 0, // No workers to avoid timeout issues
        quality: 10,
        width: width,
        height: height,
        workerScript: undefined,
        dither: false, // Disable dithering for better performance
        transparent: null, // No transparency
        background: '#FFFFFF' // White background
      })
      
      // Add frames to GIF
      frames.forEach((frame, index) => {
        // Create a canvas for each frame
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        
        if (ctx) {
          // Put the frame data on the canvas
          ctx.putImageData(frame, 0, 0)
          
          // Add the canvas as a frame to the GIF
          gif.addFrame(canvas, { delay: delay })
        }
      })
      
      // Handle GIF completion
      gif.on('finished', (blob: Blob) => {
        // Convert blob to Uint8Array
        blob.arrayBuffer().then(buffer => {
          const gifData = new Uint8Array(buffer)
          complete(gifData)
        }).catch(fail)
      })
      
      // Start rendering the GIF
      gif.render()
    })
    
  } catch (error) {
    console.error('Error creating GIF with gif.js:', error)
    throw error
  }
}

// Create GIF using gifenc library as fallback
async function createGifWithGifenc(frames: ImageData[], width: number, height: number, delay: number): Promise<Uint8Array> {
  try {
    // Import gifenc library
    const gifenc = await import('gifenc')
    
    // Create GIF encoder
    const gif = gifenc.GIFEncoder()
    
    // Create a global palette from the first frame
    const firstFrame = frames[0]
    const imageData = firstFrame.data
    const rgbaData = new Uint8Array(imageData.length)
    
    // Copy and convert the data
    for (let j = 0; j < imageData.length; j++) {
      rgbaData[j] = imageData[j]
    }
    
    // Create global palette from first frame
    const globalPalette = gifenc.quantize(rgbaData, 256)
    
    // Process each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      
      // Convert ImageData to proper format for gifenc
      const frameImageData = frame.data
      const frameRgbaData = new Uint8Array(frameImageData.length)
      
      // Copy and convert the data
      for (let j = 0; j < frameImageData.length; j++) {
        frameRgbaData[j] = frameImageData[j]
      }
      
      // Apply global palette to get indexed data
      const indexedData = gifenc.applyPalette(frameRgbaData, globalPalette, 'rgb565')
      
      // Add frame to GIF with proper options
      gif.writeFrame(indexedData, width, height, {
        delay: delay,
        transparent: false,
        first: i === 0,
        palette: i === 0 ? globalPalette : undefined // Include palette only for first frame
      })
    }
    
    // Finish the GIF
    gif.finish()
    
    // Get the GIF data
    const gifBytes = gif.bytes()
    
    return gifBytes
    
  } catch (error) {
    console.error('Error creating GIF with gifenc:', error)
    throw error
  }
}

