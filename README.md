# 🚀 Stacks Hurry

A fast-paced blockchain-powered rocket shooter game built on the **Stacks** network. Dodge asteroids, shoot enemies, earn on-chain scores, and mint NFTs — all secured by smart contracts on Stacks mainnet.

![Stacks](https://img.shields.io/badge/Stacks-Mainnet-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Game](https://img.shields.io/badge/Genre-Rocket%20Shooter-orange?style=for-the-badge)

## 🎮 Features

- **Rocket Shooter Gameplay** — Pilot your rocket, dodge asteroids, and shoot to survive
- **On-Chain Scoring** — Submit scores directly to Stacks smart contracts
- **NFT Minting** — Mint collectible Stacks Hurry NFTs
- **Leaderboard** — View global player statistics from the blockchain
- **Progressive Difficulty** — Game gets harder as you level up
- **Wallet Integration** — Connect via Stacks Connect (Hiro Wallet, etc.)

## 📜 Smart Contracts

| Contract | Address | Purpose |
|---|---|---|
| `open-mint-nft` | `SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF` | Open edition NFT minting |
| `character-nft` | `SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF` | Character NFT collection |
| `score` | `SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF` | Hall of Fame scoring (5000 uSTX fee) |
| `rocket-shooter` | `SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF` | Game score tracking |

## 🛠 Tech Stack

- **Vite** — Lightning-fast dev server & build
- **HTML5 Canvas** — Smooth 60fps game rendering
- **Stacks.js** — Blockchain interaction
- **Web Audio API** — Procedural sound effects
- **Vanilla CSS** — Custom space theme

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🌐 Deployment

This project is configured for **Vercel** deployment:

1. Push to GitHub
2. Connect the repo to Vercel
3. Deploy automatically

## 📦 NPM Package

```bash
npm install stacks-hurry
```

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
