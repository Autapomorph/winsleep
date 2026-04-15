# WinSleep - Developer Guidelines & Instructions

WinSleep is a modern Windows desktop utility for scheduled system action execution (Sleep, Hibernate, Shutdown, Restart, Lock, Sign Out).

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, HeroUI v3 (React Aria Components)
- **Backend (Rust)**: Tauri v2, Windows Sys APIs (`windows-sys` crate v0.59 bindings)

## Development, Build & Lint Commands
- **Run dev environment**: `npm run tauri:dev` (Rust backend + React frontend in Tauri dev mode)
- **Run frontend only**: `npm run dev` (Vite dev server)
- **Build production release**: `npm run tauri:build` (Tauri bundle compilation)
- **Compile & Lint check**: `npm run lint` (Runs typecheck and ESLint)
- **Typecheck only**: `npm run typecheck` (`tsc --noEmit -p ./tsconfig.app.json`)
- **FSD Architectural check**: `npx steiger ./src` (Lints Feature-Sliced Design structure compliance)
- **Apply Prettier formatting**: `npx prettier --write <file_path>` or `npm run format`

## Feature-Sliced Design (FSD) Layout
Always structure and assign files according to the FSD v2.1 specifications:
- **`shared/config`**: STRICTLY configuration-only settings, environments, static arrays, and pure types (e.g. `action.ts` has `DEFAULT_ACTION`, `ACTIONS` array, and `Action` types). NO executable logic or helper functions.
- **`shared/lib`**: Executable helper functions, custom react hooks, and Type Guards (e.g. `isValidAction` lives in `shared/lib/action`).
- **`shared/ui`**: Highly reusable dumb UI components and primitives.
- **`shared/api`**: Bridges and command invocation wrappers for Tauri backend.
- **`shared/locales`**: i18n translation resources.
- **`entities`**: Domain entities, business logic, state stores (e.g. state models using Zustand: `timer`, `session`, `setting`).
- **`features`**: Actionable components and interactive elements (e.g. `manage-timer`, `toggle-action`, `toggle-theme`).
- **`widgets`**: Self-contained component blocks combining features/entities (e.g. `timer`, `page-error-boundary`).
- **`pages`**: Key app screens (`home`, `settings`).
- **`app`**: App entry point, bootstrap scripts, providers, global router, and stylesheet setup (`App.tsx`, `bootstrap.ts`).

## Code style & Best Practices
- **Tauri Commands**: Prefer direct Win32 API calls (`SetSuspendState` for sleep/hibernate, `LockWorkStation` for locking) in Rust over spawning external processes (`Command::new("shutdown")`) unless special OS privileges are required (reboot, shutdown, signout).
- **Rust Architecture**: Organize backend code into feature modules under `src-tauri/src/` (e.g. `app`, `logging`, `settings`, `tray`, `pc_management`, `notifications`). Each module should contain its core business logic and expose its Tauri commands directly or via a nested `commands` submodule, registered cleanly in `lib.rs`.
- Do not hardcode user-facing strings.
- All UI text must go through i18n resources.
- **Conditional Returns**: Never write a `return` statement on the same line as the `if` condition. `if (condition) return;` is strictly forbidden. Always use block formatting:
  ```typescript
  if (condition) {
    return;
  }
  ```

## Git Guidelines
- **Commit, Push & Dangerous Operations**: The AI agent MUST NOT perform `git commit`, `git push`, or any potentially destructive git operations (such as resetting, deleting branches, or forcing changes) without explicit user approval or direct user instruction.

## AI Agent Hooks (Pre-completion Verification)
Before declaring any task complete, the AI agent MUST run the following command sequence depending on the files modified:
- **If frontend files (e.g., in `src/`, `package.json`, `vite.config.ts`, etc.) are modified**:
  1. Format all code: `npm run format`
  2. Run TypeScript typecheck: `npm run typecheck`
  3. Run JS linting with auto-fix:
   - **Windows PowerShell**: `npm run lint:js -- -- --fix`
   - **All other shells (cmd.exe, Git Bash, WSL, macOS/Linux terminals)** `npm run lint:js -- --fix`
- **If Rust backend files (e.g., in `src-tauri/src/`, `src-tauri/Cargo.toml`, etc.) are modified**:
  1. Run compiler check: `cargo check --manifest-path src-tauri/Cargo.toml`

## Definition of Done**All other shells** (cmd.exe, Git Bash, WSL, macOS/Linux terminals)
A task is complete only if:
1. The relevant AI Agent Hooks sequence is executed successfully based on the modified files.
2. TypeScript typecheck passes (if frontend files were modified).
3. ESLint passes (if frontend files were modified).
4. FSD structure remains valid (if frontend files were modified).
5. Rust compilation check passes (`cargo check`) (if Rust files were modified).
6. No dead code is introduced.
7. No console logs remain.
