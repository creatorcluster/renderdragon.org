<h1 align="center">🐉🔥 Renderdragon 🔥🐉</h1>

<p align="center">
  <img src="public/renderdragon.png" alt="Renderdragon logo" width="180" />
</p>

<p align="center">
  <b>Free tools &amp; assets for Minecraft YouTube creators.</b><br>
  No ads. No gimmicks. Just creative power.<br>
  <a href="https://renderdragon.org">Website</a> •
  <a href="https://discord.renderdragon.org">Discord</a> •
  <a href="https://x.com/_renderdragon">Twitter</a> •
  <a href="https://www.youtube.com/channel/UCOheNYpPEHcS2ljttRmllxg">YouTube</a>
</p>

---

## What is Renderdragon?

Renderdragon is a web platform offering free, ad-free tools, assets, music, and shaders for Minecraft content creators to level up their YouTube videos and thumbnails.

## Features

### Tools

- **YouTube Tools** — Download thumbnails and view video stats
- **Copyright Checker** — Check whether music is safe for content
- **Background Generator** — Create custom backgrounds
- **Text Generator** — Generate pixel-style text overlays
- **Player Renderer** — Render Minecraft player skins

### Assets

Browse free resources curated for Minecraft creators, including music, sound effects, animations, fonts, images, and icons.

## Tech stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** for auth, database, and storage
- **UploadThing** for uploads
- **Express** (`server.js`) for local API development, deployed as **Vercel** serverless functions (`api/`)
- **Cloudflare Workers** for the assets API

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install
```

Create a `.env` file in the project root with the required keys (Supabase URL/key, and any service keys used by the API routes you plan to run). These values are not committed to the repository.

### Development

```bash
pnpm dev
```

This starts the Vite dev server and the local Express API server concurrently.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the Vite dev server and Express API together |
| `pnpm dev:vite` | Run the Vite dev server only |
| `pnpm dev:server` | Run the Express API server only |
| `pnpm build` | Build for production |
| `pnpm build:dev` | Build in development mode |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` | Lint the codebase with ESLint |

## Project structure

```
api/                Vercel serverless API handlers
public/             Static assets
scripts/            Utility scripts (e.g. resource export)
src/
  components/       React components
  integrations/     Supabase and UploadThing clients
  lib/              API clients and helpers
  pages/            Route pages
server.js           Local Express server for API routes
supabase/           Database migrations
```

## Deployment

The site is deployed on **Vercel**, with the API routes under `api/` served as serverless functions. The assets API is served by Cloudflare Workers.

## Contributing

Contributions are welcome! Join the [Discord](https://discord.renderdragon.org), share your ideas, or open a pull request.

## License

Licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.
