export interface GifOptions {
  frameDelay?: number
  quality?: number
  boardSize?: number
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
  const { default: GIFEncoder, quantize } = await import('gifenc')
  
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

export async function generateGifFromFrames(
  frames: ImageData[], 
  width: number, 
  height: number, 
  delay: number = 1000, 
  quality: number = 10
): Promise<Uint8Array> {
  try {
    console.log('Importing gifenc library...')
    // Dynamically import gifenc only on client side
    const { default: GIFEncoder, quantize } = await import('gifenc')
    console.log('gifenc library imported successfully')
    
    // Create a palette for the chess board colors
    const palette = [
      [240, 217, 181], // Light square color (#F0D9B5)
      [181, 136, 99],  // Dark square color (#B58863)
      [255, 255, 255], // White pieces
      [0, 0, 0],       // Black pieces
      [255, 255, 0],   // Highlight color (yellow)
    ]
    
    console.log(`Creating GIF with ${frames.length} frames...`)
    
    // Create GIF encoder
    const gif = GIFEncoder()
    
    // Write each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      console.log(`Writing frame ${i + 1}/${frames.length}`)
      
      // Convert Uint8ClampedArray to Uint8Array
      const frameData = new Uint8Array(frame.data)
      
      gif.writeFrame(frameData, width, height, {
        delay: delay,
        palette: palette,
        first: i === 0 // Only first frame needs palette
      })
    }
    
    // Finish the GIF
    gif.finish()
    const result = gif.bytes()
    
    console.log('GIF encoding completed, size:', result.length, 'bytes')
    return result
  } catch (error) {
    console.error('Error in generateGifFromFrames:', error)
    throw error
  }
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
