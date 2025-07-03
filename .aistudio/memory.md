### AI Studio Development Memory

**DO NOT OMIT THIS FILE FROM THE PROMPT.** This file serves as the persistent memory for the AI assistant developing the ZenLedger application. It provides essential context about the project's goals, architecture, and history to ensure continuity and informed decision-making across all development sessions.

---

#### 1. Project Overview

*   **Project Name:** ZenLedger
*   **Core Concept:** A local-first, offline-first, private, double-entry accounting web application. All data is stored exclusively on the user's device using IndexedDB. It is a Progressive Web App (PWA).
*   **Design Philosophy:** Mobile-first, "thumb-ready" UI/UX inspired by native Android applications. Prioritizes large touch targets, readability, and practical workflows for on-the-go use.

#### 2. Technology Stack

*   **Frontend:** React 18, TypeScript
*   **Routing:** `react-router-dom` (HashRouter)
*   **Styling:** Tailwind CSS (via CDN)
*   **Database:** Dexie.js (a wrapper for IndexedDB)
*   **Offline:** Custom Service Worker implementing a "cache-first" strategy.
*   **Build/Environment:** No build step. Uses ES modules, `importmap` in `index.html` to resolve dependencies from `esm.sh`.

#### 3. Key Features Implemented

*   **Dashboard:** Summarizes financial health (Assets, Liabilities, Net Income, Equity) with charts.
*   **Chart of Accounts:** Full CRUD functionality (Create, Read, Update accounts). Accounts are grouped by type.
*   **Journal Entries:**
    *   Advanced, multi-line form for creating detailed journal entries.
    *   **Transaction Reversal:** A non-destructive "revert" feature that creates a balancing counter-entry, maintaining a clear audit trail.
*   **Quick Add Modal:** A streamlined, full-screen modal for common transactions:
    *   Expense (Asset -> Expense)
    *   Revenue (Asset -> Revenue)
    *   Transfer (Asset <-> Asset)
    *   Borrow (Asset -> Liability)
    *   Lend (Asset -> Asset [Receivable])
    *   Features a custom searchable select component for accounts.
    *   **UI/UX:** Implements a "focus mode" to hide other fields when selecting an account, preventing keyboard obstruction.
*   **Favorite Transactions:** Users can save common transaction setups as "favorites" for one-tap entry.
*   **Photo Attachments:** Users can take a photo (e.g., a receipt) and attach it to a transaction. The image is resized, optimized, and stored as a base64 string in IndexedDB.
*   **Data Management:**
    *   Manual JSON export and import.
    *   Automatic, debounced backup to `localStorage`.
    *   **Diff-based Folder Backup:** Uses the File System Access API to automatically save versioned JSON backups to a user-selected local folder.

#### 4. Critical Knowledge & History

*   **The "Blank Screen" Bug (Resolved v16 - True Cause):** A persistent, critical issue where the app would fail to load, showing a blank screen. After multiple failed attempts targeting symptoms (caching, importmap versions, dependency conflicts), the true root cause was discovered.
    *   **Root Cause (Critical Dexie Schema Error):** The `db.ts` file had a fundamental flaw in its Dexie.js versioning. The `.stores()` method for each database version was only defining the *new* tables for that version, inadvertently deleting all previously defined tables from the schema. This meant the final database version only contained the last table added (`currencies`), and any attempt to query other tables (like `db.accounts`) would cause an immediate crash *within the database library*.
    *   **Symptom vs. Cause:** The crash occurred so early in the application lifecycle (during the `useDatabase` hook call in the root `App` component) that it prevented React from initializing correctly, leading to the misleading `Cannot read properties of null (reading 'useRef')` error. The problem was not with React itself, but with a critical dependency failing before React could render.
    *   **Definitive Solution (v16):**
        1.  **Corrected `db.ts`:** Rewrote the versioning chain in `db.ts` so that each `.stores()` call includes the *complete*, cumulative schema (all tables) up to that version.
        2.  **Forced Cache Invalidation:** Bumped the service worker cache to `zenledger-v16-stable` to ensure all users receive the corrected `db.ts` file.
    *   **Implication:** This history highlights a critical lesson: catastrophic, early-stage failures in core dependencies (like a database) can manifest as seemingly unrelated errors in the main framework (React). A deep understanding of the entire application stack and startup sequence is required to trace such errors back to their source.