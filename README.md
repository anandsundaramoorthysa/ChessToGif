# 🧩 ChessToGif  

## 📑 Table of Contents  
1. [About Project](#about-project)
2. [Live Demo](#live-demo)  
3. [Installation](#installation)  
4. [Use/Run the Project](#userun-the-project)  
5. [Features](#features)  
6. [Contributing](#contributing)  
7. [Contributors](#contributors)  
8. [License](#license)  
9. [Contact Me](#contact-me)  

## 🏗️ About Project {#about-project}

**ChessToGif** is a fully functional **Next.js** application that allows users to input chess moves and generate animated GIFs of chess games — all within the browser.  
It provides a **modern, responsive interface** and runs **entirely client-side**, requiring no backend setup.  

## 🌐 Live Demo {#live-demo}

🚀 **Try it here:** [https://chesstogif.anandsundaramoorthy.com](https://chesstogif.anandsundaramoorthy.com)

### 🔧 Technologies Used  
- **Next.js** – React framework with App Router  
- **TypeScript** – Type-safe JavaScript  
- **Tailwind CSS** – Utility-first CSS framework  
- **chess.js** – Chess game logic and move validation  
- **gifenc** – GIF encoding library for animations  
- **HTML Canvas** – For rendering the chess board  

## ⚙️ Installation {#installation}

### 🧾 Prerequisites  
- Node.js 
- npm or yarn  

### 🪜 Steps  
1. **Clone the repository**  
   ```bash
   git clone https://github.com/anandsundaramoorthysa/ChessToGif/
   cd chesstogif
   ````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Then open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Use/Run the Project {#userun-the-project}

1. **Enter Chess Moves**

   * Paste or type moves in the text area.
   * Supports:

     * **SAN (Standard Algebraic Notation):** `e4 e5 Nf3 Nc6`
     * **PGN (Portable Game Notation):** Includes move numbers.

2. **Preview Board in Real-Time**

   * The board updates instantly as you type.

3. **Adjust Settings** (optional)

   * Frame Delay (speed): `500ms – 3000ms`
   * Board Size: `200px – 600px`
   * Highlight Last Move: On/Off toggle

4. **Generate GIF**

   * Click **Generate GIF** to create your animation.

5. **Download GIF**

   * Use the **Download** button to save it to your device.

### ♟️ Example Moves

#### Ruy Lopez Opening

```
e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7
```

#### Sicilian Defense

```
e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7
```

#### Queen’s Gambit

```
d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6
```

## 🌟 Features {#features}

* ✅ **Chess Move Input** – Supports both PGN and SAN formats
* ♟️ **Real-time Board Preview** – Instantly updates the board
* 🎞️ **Animated GIF Generation** – Create smooth chess animations
* ⚙️ **Customizable Settings** – Adjust board size, delay, and highlights
* 💾 **Download Functionality** – Save GIFs directly to your device
* 🖥️ **Modern UI** – Clean and responsive with Tailwind CSS
* 🌐 **Client-side Only** – No backend required

## 🤝 Contributing {#contributing}

Contributions to this project are welcome! 🎉  
If you find any bugs, have suggestions for improvements, or would like to add new features, please follow the steps below:  

### 🪜 Steps to Contribute  

1. **Fork the Repository**  
   Fork this repository to your own GitHub account:  
   👉 [ChessToGif Repository](https://github.com/anandsundaramoorthysa/ChessToGif)

2. **Clone the Forked Repository**  
   ```bash
   git clone https://github.com/your-username/ChessToGif.git
   cd ChessToGif
   ```

3. **Create a New Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**
   Implement your desired changes and ensure the code follows best practices and is well-documented.

5. **Commit Your Changes**

   ```bash
   git commit -m "Add your feature or fix"
   ```

6. **Push to Your Forked Repository**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**
   Go to your forked repository on GitHub and click on **"Compare & pull request"**.
   Provide a clear description of your changes and submit your pull request for review.

## 👨‍💻 Contributors {#contributors}

<a href="https://github.com/anandsundaramoorthysa/ChessToGif/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=anandsundaramoorthysa/ChessToGif" />
</a>

## 🪪 License {#license}

This project is open source and available under the **MIT License**.

## 📬 Contact Me {#contact-me}

If you have any questions, feedback, or suggestions, feel free to reach out to the author:

**ANAND SUNDARAMOORTHY SA:**
📧 [sanand03072005@gmail.com](mailto:sanand03072005@gmail.com?subject=Question%20about%20ChessToGif%20Project&body=Dear%20Author%2C%0A%0AI%20have%20a%20question%20regarding%20the%20ChessToGif%20project%2E%0A%0A%5BYour%20Question%20Here%5D%0A%0AThank%20you%21%0A%5BYour%20Name%5D)
