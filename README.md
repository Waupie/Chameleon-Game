# 🦎 Chameleon Game

A real-time multiplayer web game built with React, TypeScript, and WebSockets.

## 🚀 Features

- **Real-time multiplayer** - Multiple players can join lobbies and play together
- **Live chat system** - Communicate with other players in real-time
- **Lobby management** - Create and join lobbies with unique codes
- **Responsive design** - Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + WebSockets (ws library)
- **Development**: Docker + Docker Compose

## 🐳 Docker Development Setup (Recommended)

The easiest way to run the entire application is using Docker Compose:

### Quick Start
```bash
# Start both frontend and WebSocket server
npm run docker:dev

# Or run in background (detached mode)
npm run docker:dev:detached

# View logs
npm run docker:logs

# Stop all services
npm run docker:stop
```

### What gets started:
- **Frontend** (React app): `http://localhost:5173`
- **WebSocket Server**: `ws://localhost:8080`

### Testing Multiplayer
1. Open multiple browser windows/tabs to `http://localhost:5173`
2. Create a lobby in one window
3. Join the same lobby from other windows using the lobby code
4. See real-time updates and chat between users!

## 💻 Local Development Setup

If you prefer to run without Docker:

### Prerequisites
- Node.js 18+ 
- npm

### Start WebSocket Server
```bash
cd server
npm install
npm start
```

### Start Frontend (in another terminal)
```bash
npm install
npm run dev
```

## 🎮 How to Play

1. **Create a Lobby**: Enter your name and click "Create"
2. **Share the Code**: Give the generated lobby code to friends
3. **Join Lobby**: Others enter their name and the lobby code, then click "Join"
4. **Chat & Play**: Use the built-in chat and start your game!

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
