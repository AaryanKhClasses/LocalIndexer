# LocalIndexer
LocalIndexer is a cross-platform desktop app for quickly scanning and classifying local projects and folders. It's implemented with a **TypeScript** frontend and a **Rust** backend using **Tauri**.

## Features
- Detects project types using file-based heuristics (configured in `src-tauri/config.json`).
- Built-in actions and app shortcuts to open projects in common IDEs/editors.
- Lightweight local indexing for fast folder scanning.
- Cross-platform desktop UI with a native Rust backend via Tauri.

## Project Structure
- `frontend/` — TypeScript UI (Vite + TS). Entry: `frontend/src/main.ts`.
- `src-tauri/` — Tauri (Rust) backend and config. See `src-tauri/config.json` for detection rules and apps.

## Prerequisites
- Node.js (16+ recommended)
- Cargo / Rust toolchain
- Tauri prerequisites for your OS (see [here](https://tauri.app/start/prerequisites/))

## Setup
Install JS dependencies and the Rust toolchain, then build and run the app in development.

Install frontend dependencies:
```bash
cd frontend
npm install
```

From the repository root, install root JS deps (if any) and run Tauri in dev mode:
```bash
npx tauri dev
```

Or, to build a release bundle:
```bash
npx tauri build
```

## Usage
- Launch the app with `npx tauri dev` during development.
- Point the app at a folder to index; LocalIndexer will scan files and match folder types using the rules in `src-tauri/config.json`.
- Use the app's quick actions to open the scanned folder in supported apps (VSCode, IntelliJ, Explorer, etc.).

## Configuration (`src-tauri/config.json`)
The project ships with `src-tauri/config.json` containing:
- `types`: an array of project type definitions (id, label, icon, and `detect` rules).
- `apps`: shortcuts and commands used to open folders in external apps.

Detection rules support `all` and `any` arrays where the presence of all or any listed files/paths will mark the project as that type. Example types include `next`, `react`, `flutter`, `python`, and `tauri`.

You can edit the file at [src-tauri/config.json](src-tauri/config.json) to add custom types or change detection heuristics.

## Example `config.json` location
See the bundled config: [src-tauri/config.json](src-tauri/config.json)

## Development Notes
- The frontend is a standard Vite + TypeScript app. Use `npm run dev` inside `frontend/` to iterate on UI.
- Backend code lives in `src-tauri/src/` and follows typical Rust/Tauri patterns. Use `cargo build` inside `src-tauri/` to compile Rust code.

## Contributing
Contributions are welcome. Please open issues for feature requests or bugs, and submit PRs for fixes.

## License
See the `LICENSE` file in the repository root.

## Where to look next
- App config: [src-tauri/config.json](src-tauri/config.json)
- Frontend entry: [frontend/src/main.ts](frontend/src/main.ts)
- Backend entry: [src-tauri/src/main.rs](src-tauri/src/main.rs)

Enjoy!
