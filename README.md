# Culinary Lens

AI-powered cooking assistant for ingredient recognition, offline-first recipe discovery, pantry intelligence, meal planning, and guided cooking.

## What This Project Is

Culinary Lens helps users:

1. Scan ingredients from camera or uploaded photos.
2. Convert detected items into usable recipe suggestions.
3. Cook with real-time guided steps, timers, and nutrition insights.
4. Work in both online mode (AI-assisted) and offline mode (large local recipe corpus).
5. Save and reuse data across scans, ingredient sessions, shopping, and planning.

## Core Features

1. AI Ingredient Vision
- Camera scan and image upload.
- Ingredient detection with confidence cues.
- Human-detection guardrail for privacy.

2. Perception Map and Ingredient Manifest
- Visual ingredient mapping view.
- Manual add/remove ingredient control.
- Smart ingredient substitutions.

3. Recipe Intelligence
- Hybrid matching against static and large local recipe datasets.
- Nutritional-goal aware sorting.
- Readiness score to show how closely a recipe matches available ingredients.

4. Offline-First Cooking
- Offline Manual Mode for recipe discovery without camera/API.
- Large local dataset fallback for robust suggestions.

5. Scan Vault
- Auto-save scan results.
- Reuse prior scan results in one click.
- Delta insights between scans.

6. Saved Recipes (Guest + Signed-in)
- Works without sign-in via local storage fallback.
- Cloud sync when signed in.

7. Smart Pantry
- Pantry tracking with expiry awareness.
- Ingredient suggestion chips while typing.

8. Shopping List
- Add from recipe ingredients.
- Toggle and clear items.
- Guest mode local fallback + signed-in cloud mode.

9. Meal Planner
- Plan meals by date and type.
- Guest mode local fallback + signed-in cloud mode.

10. Cooking Mode
- Step-by-step guided instructions.
- Built-in per-step countdown timer.
- Voice playback support.

11. Top-Tier UX Additions
- Ingredient Presets: save, reuse, and delete custom ingredient sets.
- Pantry Autofill Assistant: merge missing pantry items into current session.
- Ingredient type-ahead support across key manual inputs.

## Tech Stack

1. Frontend: React 19 + TypeScript + Vite
2. UI/Motion: Tailwind-style utility classes + Motion + Lucide icons
3. Charts: Recharts
4. AI: Google GenAI SDK
5. Auth/Cloud: Firebase Auth + Firestore
6. Offline Persistence: localStorage-based service layer

## Project Structure

1. `src/App.tsx`:
- Main workflow state machine and primary pages.

2. `src/components/`:
- Focused feature UIs (Pantry, Meal Planner, Profile, Timer, Shopping List, Error Boundary).

3. `src/services/`:
- Domain logic for recipes, vision, storage, pantry, meal plan, shopping list, scan vault, ingredient presets, suggestions.

4. `src/services/staticRecipes.ts`:
- Large static recipe source for offline matching.

5. `src/services/recipeDatabase.ts`:
- Additional generated local recipe dataset used in matching logic.

## Prerequisites

1. Node.js 18+
2. npm 9+

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure API key (optional for online AI features):

- In-app settings supports entering Gemini API key.
- You can also provide `GEMINI_API_KEY` via environment at runtime.

3. Start development server:

```bash
npm run dev
```

4. Open:

- http://localhost:3000

## Scripts

1. Development

```bash
npm run dev
```

2. TypeScript check

```bash
npm run lint
```

3. Production build

```bash
npm run build
```

4. Preview build

```bash
npm run preview
```

## Data and Persistence Model

1. Firestore (signed-in mode)
- Saved recipes
- Shopping list
- Meal planner

2. localStorage (guest/offline mode)
- Saved recipes fallback
- Shopping list fallback
- Meal plan fallback
- Scan vault
- Ingredient presets
- Pantry
- Notification preference and local UX states

## Offline Experience

1. Offline Manual Mode allows ingredient entry without camera/API.
2. Recipe selection uses local datasets for continuity.
3. Most planning/list/saved flows remain usable in guest mode.

## Quality Checks

Use these before shipping:

```bash
npm run lint
npm run build
```

## Notes

1. Build may emit non-blocking chunk size warnings due large client-side datasets.
2. If desired, use route/component code-splitting to reduce bundle size.

## License

Apache-2.0 (see source headers).
