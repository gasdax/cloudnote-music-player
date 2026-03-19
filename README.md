# CloudNote Music Player 1.1

CloudNote is a desktop-style music player built with Vue 3, Vite, TypeScript, and a Tauri-ready structure.

This version adds a bigger product direction:

- Local music import and playback
- Favorites, recents, queue management
- Refreshed player UI
- Legal online music discovery via Jamendo

## What Changed In 1.1

- Redesigned the player into a more polished dashboard layout
- Added an `在线发现` view
- Integrated Jamendo search and featured discovery
- Allowed online tracks to be added to the queue or played directly
- Persisted user settings such as quality preference and Jamendo Client ID
- Kept the project GitHub-safe by using legal music sources instead of unauthorized song APIs

## Online Music Source

This project uses Jamendo as the first online provider.

Jamendo is suitable here because it offers Creative Commons music and an official API for discovery and streaming.

To enable online discovery:

1. Create a Jamendo developer application
2. Get your `Client ID`
3. Open CloudNote settings
4. Paste the `Client ID` into the Jamendo field

After that, you can search online tracks and add them to the queue.

## Run

Requirements:

- Node.js 20.19+ recommended

Install and start:

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:4173/
```

## Build

```bash
npm run build
```

## Screenshots

Existing screenshots are in `docs/screenshots/`.

## Notes

- Local files are still the core playback flow
- Online discovery currently focuses on legal content sources
- Jamendo integration is client-side and meant for discovery / playback workflows inside the app
