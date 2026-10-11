# Flowboard

A modern, high-performance project management web application built with React, TypeScript, Vite, Zustand, and Tailwind CSS.

## Architecture & System Design

- **State Management**: Reactive singleton Zustand store with pure domain selectors.
- **Hierarchy Engine**: Workspace -> Space -> Folder -> List -> Task container hierarchy with recursive inheritance and grant-based access control.
- **Views**: Interactive Kanban board with drag-and-drop (`@dnd-kit`) and responsive List view with multi-column sorting.
- **Task Management**: Unified modal dialog with draft form validation, explicit save semantics, and role-based permissions.

## Styling & Theme System (UI Refresh)

- **Tailwind v4 Token Strategy**: Theme tokens configured in `tailwind.config.ts` (colors, typography, radii, box shadows).
- **Dark Mode Directive**: Configured via `@custom-variant dark (&:where(.dark, .dark *));` in `src/index.css` (deliberate amendment to D-007 for selector-based dark theme compilation under `@tailwindcss/vite` v4).
- **Theme Foundation**: `ThemeProvider` with Light / Dark / System modes and zero flash-of-wrong-theme (FOWT) `<script>` in `index.html`.
- **Responsive Shell**: Collapsible sidebar with accessible `inert` and `aria-hidden` attributes, plus a slide-over mobile drawer below 768px with backdrop and `Escape` key dismissal.
