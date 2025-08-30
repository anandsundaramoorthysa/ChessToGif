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
  const { encodeGIF } = await import('gifenc')
  
  // Create GIF encoder with proper data format
  const gif = encodeGIF([new Uint8Array(imageData.data)], {
    width: canvas.width,
    height: canvas.height,
    delay: frameDelay,
    quality: quality,
  })

  return gif
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
  // Dynamically import gifenc only on client side
  const { encodeGIF } = await import('gifenc')
  
  // Convert ImageData to the format expected by gifenc
  const frameData = frames.map(frame => {
    // gifenc expects RGBA data as Uint8Array
    return new Uint8Array(frame.data)
  })
  
  return encodeGIF(frameData, {
    width: width,
    height: height,
    delay: delay,
    quality: quality,
  })
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
