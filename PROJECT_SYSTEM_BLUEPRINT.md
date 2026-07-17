# LLM AGENT BLUEPRINT & SYSTEM INSTRUCTIONS
## Project: Spotify Multiplayer Music Quiz (Monorepo)

> **IMPORTANT FOR THE LLM AGENT:** Read, internalize, and strictly adhere to this blueprint throughout our entire development lifecycle. Every code change, architecture recommendation, and component creation must align perfectly with the guidelines, patterns, and architectural boundaries defined in this document.

---

## 1. Role & Behavior Guidelines
You are an expert, world-class software engineer specializing in **Clean Architecture**, **NestJS**, **React**, and the **TanStack Start** framework. 
*   **Production-Ready:** Write clean, robust, type-safe, and self-documenting production-ready code.
*   **No Shortcuts:** Never write placeholder code, "TODOs", or incomplete implementations unless explicitly requested.
*   **Type Safety:** Never use `any` under any circumstances. Use strict, precise TypeScript typing, generic interfaces, and exhaustive discriminated unions.
*   **Proactive but Respectful:** If you encounter a complex architectural challenge or a limitation in TanStack Start, look for clean, standard patterns first. Ask the user for confirmation and explain the trade-offs before proceeding with non-standard workarounds.
*   **CLI First:** For NestJS, leverage the Nest CLI to generate files (modules, controllers, services, guards) so that the framework registers and links them automatically in the correct modules.

---

## 2. Core App Concept & Gameplay Mechanics

This app is a real-time, multiplayer music quiz where players connect with friends.

### 2.1 User Personas & Auth States
1.  **Guest Users:** Can join lobbies and play quizzes without an account. They must enter a unique name when joining a lobby.
2.  **Spotify Premium Users:** Can sign in with Spotify OAuth. They are authorized to create quizzes, manage them in Studio Mode, host lobbies, and control game playback.

### 2.2 Quiz Structure
*   **Quiz Meta:** Title, description, creator ID, created timestamp.
*   **Quiz Songs:** A collection of songs. Each song contains:
    *   Spotify Track ID / metadata (Title, Artist, Album, Cover Art URL, Preview URL).
    *   **Question Type:** `TRACK_NAME` (identify title), `ARTIST_NAME` (identify artist), or `FILL_IN_THE_GAP` (fill in missing lyrics/words).
    *   **Snippet Timestamps:** `start_offset_ms` and `end_offset_ms` to play a specific portion of the track.

### 2.3 Gameplay Flow & States

[ Idle / Dashboard ]
│
▼ (Host creates/selects quiz)
[ Host Lobby ] <────────── Guests/Users Join (Check Name Uniqueness)
│
▼ (Host starts quiz)
[ Quiz Game Loop ] <─────── Turn-based phase (1 Song per Turn)
│                   ├─ Active Player guesses
│                   ├─ If Correct: Point awarded -> Next Turn
│                   └─ If "I Don't Know": Pass to next player
│
▼ (Leftover Songs < Total Players)
[ Speed Round Phase ] <───── Rapid-fire phase (Saves fairness)
│                   └─ Played to all players; fastest correct guess wins
│
▼ (All Songs Spent)
[ Leaderboard / End ]

#### The Lobby Phase
*   Host transitions quiz to "Play Mode" (Full screen).
*   Opens a real-time multiplayer lobby.
*   Guests/Users join. Guests input a username. **Validation Rule:** The system must check if the username is already taken in that specific lobby. If taken, block entry and show a clear UI validation error.

#### The Turn-Based Game Loop
*   Each song is played sequentially.
*   Only the **Active Player** can submit a guess during their turn.
*   **Correct Guess:** Active Player gains +1 point. The turn ends; transition to the next song/player.
*   **Pass / "I Don't Know":** Active Player can yield. The opportunity to guess moves to the *next sequential player* in the circle for the *same song*.
*   **Incorrect Guess:** Handle according to game mode (either immediate pass, or lock out and let others try).

#### The "Unfairness Prevention" Speed Round (Critical Rule)
*   *The Problem:* If there are 19 questions and 9 players, each player gets 2 dedicated questions, but 1 question remains. It is unfair to give the first player a 3rd opportunity to score.
*   *The Solution:* When the remaining number of questions is less than the total number of active players, the game transitions to a **Speed Round**.
*   *Speed Round Mechanics:*
    *   These remaining questions are open to *everyone* simultaneously.
    *   The song plays, and players must answer as fast as possible (first correct answer gets the point).
    *   **Important UX Rule:** The UI must display a clear modal/announcement to all players *before* the Speed Round song starts, explaining that the game is now in free-for-all speed mode!

---

## 3. Database Layer & Core Infrastructure

The monorepo database operations and architecture are centralized exclusively within the NestJS workspace using **Drizzle ORM** and **Hexagonal Architecture (Ports & Adapters)**.

   ┌─────────────────────────────────────────┐
   │                 ADAPTERS                │
   │  (NestJS Controllers, Drizzle Repo,     │
   │   Spotify Web API, WebSockets Gateway)  │
   └────────────────────┬────────────────────┘
                        │  implements / drives
                        ▼
   ┌─────────────────────────────────────────┐
   │                  PORTS                  │
   │     (Interfaces: IQuizRepository,       │
   │      ISpotifyService, IGameGateway)     │
   └────────────────────┬────────────────────┘
                        │  uses
                        ▼
   ┌─────────────────────────────────────────┐
   │              DOMAIN / CORE              │
   │     (Quiz Entities, GameState Engine,   │
   │          Business Use Cases)            │
   └─────────────────────────────────────────┘
   
### 3.1 Swappable Providers & DB Independence
To easily swap PostgreSQL for MongoDB, Redis, or an In-Memory store, enforce Dependency Injection:
*   **Ports (Interfaces):** Define abstract classes (since TypeScript interfaces are erased at runtime and cannot be used as NestJS DI tokens) or string/symbol tokens for all external contracts.
*   **Adapters (Implementations):** Write DB-specific implementations (e.g., `DrizzleQuizRepository` extending `QuizRepository`).
*   **NestJS Modules:** Bind the abstraction to the concrete implementation in your module providers:
    ```typescript
    {
      provide: QuizRepository, // Abstract Class Port
      useClass: DrizzleQuizRepository, // Concrete Adapter
    }
    ```
*   **Zero Database Logic on Frontend:** The TanStack Start workspace must remain completely devoid of direct database configurations, connection drivers, or ORM layers. It accesses data purely through the NestJS REST and WebSocket layers.

---

## 4. Frontend Architecture (TanStack Start)

The web client is built on **TanStack Start**, acting as a pure, highly optimized frontend client layer that consumes the NestJS API.

### 4.1 Component Patterns
Use designated component patterns depending on the context:
1.  **Children Pattern:** Build highly composable, flexible UI components.
2.  **Function Children Pattern / Render Props:** Use for dynamic rendering, passing internal state to consumer-defined elements.
3.  **Compound Components:** Structure complex UI blocks intuitively (similar to Radix UI and `shadcn/ui` style), keeping state encapsulated but accessible:
    ```tsx
    <QuizStudio>
      <QuizStudio.Header/>
      <QuizStudio.Timeline/>
      <QuizStudio.TrackList/>
    </QuizStudio>
    ```
4.  **Higher-Order Components (HOCs):** Enhance components with cross-cutting concerns.
5.  **Dynamic Component Loading:** Code-split non-essential or heavy parts of the UI (e.g., Studio Mode heavy editors) using `React.lazy` or dynamic imports for performance optimization.

### 4.2 State, Queries, & Performance
*   **TanStack Query:** Use for server-state synchronization. Treat cached data as single sources of truth. Leverage mutations with **Optimistic Updates** on actions like reordering tracks or updating timestamps to make the application feel instantaneous.
*   **Virtualization:** Use `@tanstack/react-virtual` for rendering large lists (e.g., searching Spotify's catalog or rendering extensive quiz indexes) to maintain a steady 60 FPS.
*   **Custom Hooks:** Abstract complex state machine loops, Spotify playback APIs, and WebSocket game event handlers into dedicated, custom hooks (e.g., `useQuizGame`, `useWebSocket`). Separating UI markup from state logic is mandatory.
*   **Tailwind CSS:** Rely entirely on Tailwind utility classes. Use CSS variables combined with Tailwind themes to manage light/dark modes and custom soundscape color palettes.

### 4.3 Interactive UI & UX Patterns
*   **Error Boundaries:** Use react-error-boundary around isolated UI sections to prevent a localized crash from taking down the whole app.
*   **Guard Clauses:** Keep component renders clean and readable with short-circuit guard clauses at the top of the file instead of nested ternary elements.
*   **Skeletons & Empty States:** Always design a corresponding loading skeleton and a pleasing empty state for lists, dashboards, and lobby grids.
*   **State Derivation:** Derive values during render instead of syncing state with `useEffect` (e.g., scoring calculations, active turn indices).
*   **React Concurrent Features:** Use `useDeferredValue` for fast-typing filters, and `useTransition` for non-blocking UI transitions to keep inputs crisp.
*   **Debouncing Patterns:** Debounce heavy queries (like Spotify catalog searches) to minimize API rate-limiting risks.

---

## 5. Backend Architecture (NestJS & Identity Core)

NestJS is our structured core engine, functioning as the centralized identity provider, gameplay coordinator, and database authority.

### 5.1 Centralized Better-Auth Integration
*   **Hosting Instance:** Better-Auth is hosted and executed inside the NestJS engine using the `@thallesp/nestjs-better-auth` integration module.
*   **Database Driver:** Better-Auth hooks into our centralized database via the `@better-auth/drizzle-adapter` using PostgreSQL.
*   **Client Consumability:** The `/api/auth/*` endpoints are exposed directly by NestJS. Both the TanStack Start frontend and the upcoming Expo mobile application utilize a pure client instance (`createAuthClient`) configured to target the NestJS deployment URL as their authorization source of truth (`baseURL`). This completely decouples web and mobile clients from each other.
*   **Security & Guards:** Endpoints and WebSocket connections are strictly controlled using the global NestJS `AuthGuard` provided by the integration module, leveraging custom session decorators for data parsing.

### 5.2 Real-time Layer & Conventions
*   **Strict Typings:** Set `noImplicitAny: true` and `strict: true` in your TS Config. Define strong typings for WebSocket events, REST payloads (using class-validator and class-transformer DTOs), and database schema mappings.
*   **Nest CLI Rules:** Always generate modules, services, controllers, and exception filters via `nest generate`.
*   **Real-time Layer:** Implement real-time lobby synchronization and gameplay mechanics using NestJS WebSockets (`@nestjs/websockets`). Define clear state-transition guards on the server to prevent guests from altering game states out of order.
*   **Clean Error Handling:** Map internal domain errors to HTTP/WebSocket exceptions using custom NestJS Exception Filters.

---

## 6. Visual Design Context & Assets Reference

To guarantee visual alignment and layout precision:
*   **Refer to Design Files:** Look inside `/apps/web/src/assets/designs/` (or specified design folders) for mockups, component maps, and styling layouts before building new pages.
*   **Tailwind Sync:** Align Tailwind colors, borders, shadows, and dark-theme configurations with the designated design files to represent the planned branding consistently.

---

## 7. Working Protocols for the LLM
1.  **Read Files First:** Before modifying or generating any files, inspect the existing folder structure, monorepo configuration, and workspaces to align with current tooling.
2.  **Incremental Iteration:** Build feature by feature (e.g., Core Domain -> Database Schema/Adapter -> Core Business Logic -> NestJS WebSocket -> TanStack Router Client -> UI Patterns). Ensure tests/compilation pass at each milestone.
3.  **Proactive Validation:** If any requirement conflicts with TanStack Start's routing mechanisms or NestJS modules, request guidance or explain alternative approaches first.