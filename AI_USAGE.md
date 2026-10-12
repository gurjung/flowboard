# AI Usage Log & Engineering Judgment Report

This document records the prompts, AI tooling assistance, hallucinations detected, and human engineering judgment corrections made throughout the development of **Flowboard**.

---

## 1. Tooling & Setup

- **Primary AI Assistant**: Antigravity AI (powered by Google DeepMind / Claude 3.7 Sonnet) with native IDE integration, automated testing loops, and Chrome browser subagent.
- **Workflow Paradigm**: Specification-first, test-driven development (TDD). Every major feature underwent architectural gate checks logged in `docs/DECISIONS_LOG.md` before implementation.
- **Testing Guardrails**: `vitest` unit & integration suite, `@testing-library/react`, TypeScript strict mode typechecking (`tsc --noEmit`), and ESLint (`eslint.config.js`).

---

## 2. Where AI Provided Strong Assistance

| Domain / Area                           | How AI Accelerated Development                                                                                                                                                 | Engineering Value                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Domain Modeling & Type Safety**       | Rapidly mapped the 5-level hierarchy (`Workspace -> Space -> Folder -> List -> Task`) and permission grant models to strict TypeScript algebraic data types and tagged unions. | Eliminated runtime null pointer errors with exhaustive discriminant checking. |
| **Comprehensive Test Generation**       | Generated matrix test fixtures testing public/private inheritance, allow/deny precedence, and admin bypass across all 3 mock users (Alice, Bob, Carol).                        | Achieved 35 test suites and 336 tests passing with 100% green coverage.       |
| **WAI-ARIA Roving Tabindex Logic**      | Implemented the pure recursive navigation reducer (`getNextFocusId`) for sidebar keyboard navigation (`ArrowUp`, `ArrowDown`, `ArrowRight`, `ArrowLeft`, `Home`, `End`).       | Full WAI-ARIA 1.2 compliance for hierarchical tree views.                     |
| **Micro-Interactions & Styling Tokens** | Translated Tailwind CSS tokens and dark mode styling pairs (`dark:bg-slate-900`, `dark:text-slate-100`) across all cards, badges, and modals.                                  | Seamless dark/light/system theme support without Flash of Wrong Theme (FOWT). |
| **Real-time Drag-and-Drop Primitives**  | Configured `@dnd-kit/core` pointer and keyboard sensors, custom drag overlays, and drop target indicators across Kanban status columns.                                        | Zero layout jumps during drag interactions.                                   |

---

## 3. Hallucinations & AI Mistakes Corrected (Human Overrides)

During the development lifecycle, AI suggestions were continuously reviewed and repeatedly corrected whenever they violated the assignment constraints, UX standards, or architectural guidelines:

### Correction 1: Tailwind v4 Dark Mode Selector Compilation

- **AI Initial Output**: Proposed standard Tailwind v3 `darkMode: 'class'` in `tailwind.config.ts`.
- **Failure Mode**: Under Tailwind v4 (`@tailwindcss/vite`), standard v3 configs fail to generate selector-based dark classes, causing dark mode styling to break.
- **Human Correction**: Diagnosed Tailwind v4 engine changes and implemented `@custom-variant dark (&:where(.dark, .dark *));` directly in `src/index.css`. Fully documented as an intentional architectural amendment.

### Correction 2: Accidental Removal of List View Row Click

- **AI Initial Output**: When converting the List view action column to a 3-dots popup menu, the AI removed the row-level `onClick` handler to avoid nested button click conflicts.
- **Failure Mode**: Violated assignment specification (PDF Page 3: _"Click row → task detail drawer/modal"_).
- **Human Correction**: Re-introduced the row `onClick` handler on `<tr>`, isolated the actions menu via `e.stopPropagation()`, added text-selection guards (`window.getSelection()`), and maintained an accessible keyboard trigger on the title button. (Logged as **C-003** in `DECISIONS_LOG.md`).

### Correction 3: Auto-Save vs Explicit Save Semantics

- **AI Initial Output**: The AI initially implemented an "auto-save on blur" pattern in the task drawer, modifying the central Zustand store on every keystroke.
- **Failure Mode**: Resulted in erratic focus jumps, unwanted mutations on accidental clicks, and lack of rollback when closing without saving.
- **Human Correction**: Mandated an explicit draft form model via `useTaskDrawerForm`. Edits are strictly held in component state until the user clicks "Save changes". Clicking "Cancel" or pressing `Escape` cleanly discards all changes.

### Correction 4: Due Date Past-Date Selection

- **AI Initial Output**: AI allowed any date string to be selected and saved, including dates in the distant past.
- **Failure Mode**: Degraded real-world project management UX.
- **Human Correction**: Added native `<input type="date" min={todayStr}>` constraints and validation preventing historical due dates with inline feedback.

### Correction 5: Strict 200-Line File Limit Enforcement

- **AI Initial Output**: AI repeatedly generated single 350+ line modal components that coupled layout, draft form logic, assignee multiselect, and delete confirmation into one file.
- **Failure Mode**: Violated the codebase architectural rule: _All source files must strictly be $\le 200$ lines_.
- **Human Correction**: Decomposed the monolithic drawer into clean, focused subcomponents (`TaskDrawerHeader`, `TaskDrawerBody`, `TaskDrawerFooter`, `TaskAssigneesField`, `useTaskDrawerForm`), ensuring every component adheres to the Single Responsibility Principle.

### Correction 6: Assignee Dropdown Accessibility & Boundary Clamping

- **AI Initial Output**: Implemented an absolute dropdown that expanded the drawer container downwards, causing layout jitter and allowing users without list view permissions to be selected.
- **Failure Mode**: Visual glitch and permission leak.
- **Human Correction**: Restricted assignees to users with explicit list view permissions (`selectAssignableUsersForList`), fixed modal layout height, and added a fixed-height scrollable multiselect container.

---

## 4. Summary of Engineering Judgment

AI was treated as an **accelerator and pair programmer**, never as an unmonitored decision maker. Every data structure, selector, permission boundary, and UI interaction was audited and verified against the official assignment specification, ensuring production-grade code quality suitable for an SDE 2 engineer.
