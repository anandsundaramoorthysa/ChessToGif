declare module 'gifenc' {
  export interface GIFEncoderOptions {
    initialCapacity?: number;
    auto?: boolean;
  }

  export interface FrameOptions {
    transparent?: boolean;
    transparentIndex?: number;
    delay?: number;
    palette?: number[][];
    repeat?: number;
    colorDepth?: number;
    dispose?: number;
    first?: boolean;
  }

  export interface GIFEncoder {
    reset(): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    buffer: ArrayBuffer;
    stream: any;
    writeHeader(): void;
    writeFrame(index: Uint8Array, width: number, height: number, opts?: FrameOptions): void;
  }

  export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoder;
  
  export default function GIFEncoder(options?: GIFEncoderOptions): GIFEncoder;
  
  export function quantize(data: Uint8Array, maxColors: number, options?: any): number[][];
  export function applyPalette(data: Uint8Array, palette: number[][], format?: string): Uint8Array;
  export function prequantize(data: Uint8Array, options?: any): void;
  export function nearestColorIndex(palette: number[][], color: number[]): number;
  export function nearestColor(palette: number[][], color: number[]): number[];
  export function nearestColorIndexWithDistance(palette: number[][], color: number[]): [number, number];
  export function snapColorsToPalette(palette: number[][], colors: number[][], threshold?: number): void;
}
