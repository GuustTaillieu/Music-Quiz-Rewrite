# Architecture & Clean Code Guidelines

This document outlines the core architectural principles, component patterns, and state management rules for the `spotify-music-quiz` codebase. All AI coding assistants and developers must strictly follow these practices when extending or refactoring the project.

---

## 1. Route-Driven Architecture (TanStack Router & Start)

- **Layout-Based Route Groups**: Use underscore-prefixed layout routes (e.g., `src/routes/_authenticated.tsx`) to group related pages and share layout wrappers or context (such as session data or SDK providers).
- **Page File Organization**: Place page-level routes in dedicated subfolders reflecting their path hierarchy (e.g., `src/routes/_authenticated/studio.$quizId.tsx`).
- **SSR Authentication in `beforeLoad`**: In TanStack Start, use `createServerFn` with `getRequestHeaders()` (e.g. `getSessionFn`) inside route `beforeLoad` functions so request cookies are forwarded during server-side rendering instead of calling client-only SDK methods directly.

---

## 2. Component Scoping & Hook Consumption

- **Avoid Unnecessary Prop-Drilling**: If a component is specific, single-use, and lives in a targeted feature directory (e.g., `HostGameView`, `PlayerBuzzerScreen`, `HostLobbyView`), **do not** pass endless state and callback props down from parent pages.
- **Direct Feature Hook Usage**: Invoke feature-specific hooks (`useGameAudio`, `useGameTimer`, `usePlayerActions`, `useQuizGame`) directly inside the target component.
- **Reserve Props for Reusable Primitives**: Props should only be used for UI primitives, generic layout wrappers, or components explicitly intended to be reused across different contexts.

---

## 3. SDK & Media Player Lifecycle

- **Centralized Provider Pattern**: Global SDKs (such as the Spotify Web Playback SDK) must be initialized and managed via a React Context Provider (e.g., `SpotifyPlayerProvider`) at the layout route level (`_authenticated.tsx`), ensuring single-instance lifetime across child route transitions.
- **Immediate Side-Effects on Ready Events**: When an SDK fires an initialization event (e.g., Spotify SDK `ready` with a new `deviceId`), perform side-effects immediately (e.g., transferring playback) rather than routing through slow `useState` cycles or microtask delays.
- **No Legacy Fallbacks**: Remove dead or abandoned fallback logic (e.g., legacy HTML `<audio>` elements or preview audio hooks) once a core SDK strategy is adopted.

---

## 4. Feature Directory Structure

Structure feature modules cleanly under `src/features/<feature-name>`:
- `components/`: UI components for the feature.
- `hooks/`: Custom React hooks encapsulating business logic, timers, or socket communication.
- `api/`: API callers or SDK client wrappers.
- `utils/`: Feature-specific helper functions.
- `index.ts`: Public API export barrel file for the feature.

---

## 5. Type Safety & Event Constants

- **Shared Contracts**: Import schemas and event constants from `@spotify-music-quiz/shared`.
- **Strict Typing**: Use strict TypeScript types and export helper type aliases (e.g., `GameEvent`) alongside event object constants (`GAME_EVENTS`).
