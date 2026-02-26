# TerpsDining Improvement Plan

This document outlines the phases for optimizing the codebase, fixing bugs, and improving overall code quality.

## Phase 1: Foundation & Styling Consistency
**Goal:** Eliminate "magic strings" for colors and centralize shared UI patterns.

- [ ] **Tailwind Configuration:**
  - Move UMD brand colors (`#E21833` - Red, `#FFD200` - Gold) into `tailwind.config.js` as theme colors (e.g., `primary`, `accent`).
  - Update all components to use `bg-primary`, `text-accent`, etc., instead of hardcoded hex codes.
- [ ] **Standardized UI Components:**
  - Extract a reusable `Button` component from `AuthModal`, `SearchPage`, and `FoodPage` to handle variants (primary, outline, ghost) and loading states consistently.
  - Extract a `Card` wrapper for consistent borders and shadows.
- [ ] **Centralized Date Utilities:**
  - Move all date formatting logic from `queries.js` and `hours.js` into a single `src/utils/date.js`.
  - Ensure consistent timezone handling (`America/New_York`) across the entire app.

## Phase 2: DRY & Architectural Refactoring
**Goal:** Reduce code duplication and improve maintainability.

- [ ] **Navbar Refactor:**
  - Consolidate the navigation links logic. Currently, the same links and auth buttons are duplicated for desktop and mobile views in `Navbar.jsx`.
- [ ] **Hall Metadata Management:**
  - Remove hardcoded hall slugs from `search.jsx`.
  - Create a `src/config/halls.js` or fetch dining hall metadata from the database to populate filters dynamically.
- [ ] **Supabase Wrapper/Helper:**
  - Create a small utility to handle common Supabase error patterns to avoid repetitive `if (error) throw error` blocks in every query.
- [ ] **Auth Form Improvements:**
  - Add a password confirmation field to the Sign Up mode in `AuthModal.jsx`.
  - Implement basic client-side validation for email and password strength.

## Phase 3: Performance & Search Optimization
**Goal:** Improve responsiveness, especially in the search and menu views.

- [ ] **Server-Side Filtering:**
  - Refactor `searchFoods` in `queries.js` to perform allergen exclusion and dietary filtering using Supabase's PostgREST logic (e.g., `.not.cs`) where possible, rather than fetching 200 items and filtering in JS.
- [ ] **Trending Logic Optimization:**
  - The "Trending" sort currently fetches a large set of ratings for all search results. Optimize this to use a Postgres view or a more targeted aggregation query.
- [ ] **Image Optimization:**
  - Add `loading="lazy"` to `FoodCard` images.
  - Implement a standard "ImageWithFallback" component to handle the 🍽️ placeholder consistently across `FoodCard`, `AdminPage`, and `ProfilePage`.

## Phase 4: Bug Fixes & Edge Cases
**Goal:** Robustness in time-based logic and user flows.

- [ ] **Enhanced Hall Status:**
  - Update `getHallStatus` in `hours.js` to look ahead. If it's 10 PM and everything is closed, it should ideally say "Opens Breakfast at 7:00am" (referring to tomorrow) instead of just "Closed Today".
- [ ] **Meal Period Edge Cases:**
  - Refine `getCurrentMealPeriod` to handle late-night/early-morning hours more gracefully (e.g., 2 AM should likely point to the next day's Breakfast).
- [ ] **Auth Callback Timeout:**
  - Improve the 10-second timeout logic in `auth.callback.jsx` to be more resilient or provide better "Try Again" instructions.
