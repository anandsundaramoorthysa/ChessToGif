# Chess Move GIF Maker

A fully functional Next.js application that allows users to input chess moves and generate animated GIFs of chess games. The app runs entirely in the browser (client-side) and provides a beautiful, modern interface for creating chess animations.

## Features

- **Chess Move Input**: Support for PGN and SAN format chess moves
- **Real-time Board Preview**: See the current position as you type moves
- **Animated GIF Generation**: Create smooth animations of chess games
- **Customizable Settings**: Adjust frame delay, board size, and move highlighting
- **Download Functionality**: Download generated GIFs directly to your device
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Client-side Only**: No backend required, everything runs in the browser

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **chess.js**: Chess game logic and move validation
- **gifenc**: GIF encoding library for creating animations
- **HTML Canvas**: Chess board rendering

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chess-move-gif-maker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Basic Usage

1. **Enter Chess Moves**: Paste or type chess moves in the text area. The app supports:
   - Standard Algebraic Notation (SAN): `e4 e5 Nf3 Nc6`
   - Portable Game Notation (PGN): Full game notation with move numbers

2. **Preview Position**: The current board position updates in real-time as you type

3. **Adjust Settings** (optional):
   - **Frame Delay**: Control the speed of the animation (500ms - 3000ms)
   - **Board Size**: Adjust the size of the chess board (200px - 600px)
   - **Highlight Last Move**: Toggle highlighting of the most recent move

4. **Generate GIF**: Click the "Generate GIF" button to create an animated GIF

5. **Download**: Use the download button to save the GIF to your device

### Example Moves

Try these example moves to get started:

**Ruy Lopez Opening:**
```
e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7
```

**Sicilian Defense:**
```
e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7
```

**Queen's Gambit:**
```
d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6
```

## Project Structure

```
chess-move-gif-maker/
├── app/
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main application page
├── components/
│   └── ChessBoard.tsx       # Chess board canvas component
├── utils/
│   ├── chessGame.ts         # Chess game logic and move parsing
│   └── gifGenerator.ts      # GIF generation utilities
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Key Components

### ChessBoard Component
- Renders chess positions on HTML Canvas
- Supports customizable board sizes
- Optional move highlighting
- Unicode chess piece symbols

### ChessGameManager Class
- Handles chess game logic using chess.js
- Parses and validates moves
- Manages game state and FEN positions
- Supports PGN and SAN notation

### GIF Generation
- Captures canvas frames for each position
- Uses gifenc library for efficient GIF creation
- Supports customizable frame delays and quality settings

## Customization

### Adding Custom Themes
You can customize the chess board appearance by modifying the colors in `components/ChessBoard.tsx`:

```typescript
// Light squares
ctx.fillStyle = '#F0D9B5' // Change this for different light square color

// Dark squares  
ctx.fillStyle = '#B58863' // Change this for different dark square color
```

### Adjusting Piece Symbols
Modify the `pieceSymbols` object in `components/ChessBoard.tsx` to use different Unicode chess pieces or custom symbols.

### Styling
The app uses Tailwind CSS for styling. You can customize the design by modifying the classes in the components or extending the Tailwind configuration in `tailwind.config.js`.

## Browser Compatibility

The app works in all modern browsers that support:
- ES6+ JavaScript features
- HTML5 Canvas API
- Web Workers (for GIF generation)
- File API (for downloads)

## Performance Considerations

- GIF generation is computationally intensive and may take a few seconds for games with many moves
- Large board sizes (600px+) may impact performance
- The app uses Web Workers where possible to avoid blocking the UI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [chess.js](https://github.com/jhlywa/chess.js) for chess game logic
- [gifenc](https://github.com/mattdesl/gifenc) for GIF encoding
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Next.js](https://nextjs.org/) for the React framework
