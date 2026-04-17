# Culinary Lens v2 Technical Specification

> Public hosting/title branding uses "My Google AI Studio App"; the in-app working product name remains Culinary Lens.

## 1. Document Purpose
This document is a full technical specification for Culinary Lens v2. It explains system goals, architecture, file responsibilities, feature behavior, technology decisions, tradeoffs, and implementation standards.

This is intended for:
- Product owners and stakeholders
- New developers onboarding to the codebase
- Reviewers evaluating technical quality and novelty
- Maintainers planning future roadmap work

## 2. Product Summary
Culinary Lens v2 is an AI-assisted cooking platform that helps users move from ingredients to actionable meals with minimal friction.

Primary user outcome:
1. Capture or upload food images.
2. Detect and validate ingredients.
3. Generate or rank recipes based on available ingredients and user preferences.
4. Manage pantry, shopping list, and meal plans.
5. Cook with guided, timer-based flow.

## 3. Technical Goals and Non-Goals
### 3.1 Goals
- Provide a smooth, mobile-friendly cooking workflow.
- Support offline-first behavior with local persistence.
- Offer cloud sync when authenticated.
- Use AI where it creates clear user value (vision and recipe synthesis).
- Prevent unsafe scan flow outcomes (human/non-food guardrails).
- Keep architecture modular for iterative feature expansion.

### 3.2 Non-Goals
- Heavy server-side orchestration at current stage.
- Enterprise multi-tenant backend complexity.
- Full medical nutrition compliance.
- Real-time market pricing guarantees for all geographies.

## 4. Runtime Architecture
## 4.1 Layered Structure
1. Presentation Layer
- React components and workflow rendering
- Main orchestration in src/App.tsx

2. Domain/Service Layer
- Ingredient perception, recipe ranking/synthesis, pantry, shopping, meal planning, user preferences

3. Persistence Layer
- localStorage for guest/offline continuity
- Firebase Auth + Firestore for signed-in cloud persistence

4. External Intelligence Layer
- Google GenAI for image understanding and recipe generation
- Optional Hugging Face object detection for stage-1 visual candidates

## 4.2 Core Data Flow
1. Image capture/upload in camera workflow.
2. Vision processing in VisionEngine.
3. Ingredient confirmation and optional manual edits.
4. Pantry update and scan history persistence.
5. Recipe selection (instant ranking and/or synthesis).
6. Cooking execution with timers and step progression.
7. Optional shopping and meal planning actions.

## 5. Technology Stack and Decision Rationale
## 5.1 Frontend
- React 19 + TypeScript + Vite

Why this stack:
- Fast interactive UI delivery
- Strong typing for complex state and service contracts
- Quick dev feedback with HMR and rapid build pipeline

Why not heavier alternatives now:
- Next.js server features are not required for this SPA-centric flow
- Angular introduces higher boilerplate for this project size

## 5.2 Styling and Interaction
- Utility-class styling approach with Tailwind-compatible tooling
- motion for transitions and interaction polish
- lucide-react for iconography
- recharts for nutritional/timeline style visual data blocks

Reasoning:
- Fast iteration and consistent design language
- Lightweight animation primitives for UX clarity

## 5.3 AI and Vision
- @google/genai as primary intelligence provider
- Hugging Face object detection as optional stage-1 detector

Reasoning:
- Hybrid approach improves practical perception quality
- Schema-constrained AI output improves runtime robustness

## 5.4 Data and Authentication
- Firebase Auth (Google sign-in)
- Firestore for user-scoped cloud entities
- localStorage for guest and fallback mode

Reasoning:
- Minimal backend ops overhead
- Reliable user-scoped security model
- Excellent fit for incremental product evolution

## 6. Project Structure and File Responsibilities
## 6.1 Root and Configuration
- package.json: dependencies and scripts
- tsconfig.json: TypeScript compiler behavior
- vite.config.ts: bundling/dev server/build configuration
- firestore.rules: Firestore access control
- README.md: product-level overview and roadmap direction
- ROADMAP.md: planned milestones and expansions

## 6.2 Application Core
- src/main.tsx
  - App mounting and global boundary wrapping
- src/App.tsx
  - Workflow orchestration, major page composition, cross-feature handlers
- src/types.ts
  - Shared interfaces and domain contracts
- src/lib/utils.ts
  - Utility helpers for class composition and UI patterns

## 6.3 Component Layer
- src/components/CookingTimer.tsx: timer lifecycle and controls
- src/components/ErrorBoundary.tsx: runtime crash containment UI
- src/components/MealPlanner.tsx: planning UX by date and meal type
- src/components/PantryTracker.tsx: pantry management interface
- src/components/ProfileSettings.tsx: user preference controls
- src/components/ShoppingList.tsx: shopping list interaction and buy actions

## 6.4 Service Layer
- src/services/visionEngine.ts
  - Two-stage perception, confidence fusion, non-food filtering, guardrails
- src/services/recipeEngine.ts
  - Recipe matching and synthesis orchestration
- src/services/instantRecipeSuggestionService.ts
  - Readiness-weighted recommendation for immediate cooking
- src/services/pantryService.ts
  - Pantry CRUD and metadata normalization
- src/services/pantryProductDataset.ts
  - Shelf-life/storage/category metadata dictionary
- src/services/scanResultService.ts
  - Scan vault persistence and retrieval
- src/services/shoppingListService.ts
  - Shopping list persistence and cloud sync logic
- src/services/instamartService.ts
  - Google Shopping URL generation/opening abstraction
- src/services/mealPlanService.ts
  - Meal planning persistence and retrieval
- src/services/storageService.ts
  - Authentication and cloud saved recipe operations
- src/services/localSavedRecipeService.ts
  - Local saved recipes fallback mode
- src/services/allergyService.ts
  - Allergen filtering and safety checks
- src/services/tasteModelService.ts
  - Preference model and recommendation biasing
- src/services/ingredientSuggestionService.ts
  - Ingredient dictionary and suggestion logic
- src/services/ingredientPresetService.ts
  - Preset save/load/delete for ingredient bundles
- src/services/recipeDatabase.ts
  - Large local recipe dataset
- src/services/staticRecipes.ts
  - Curated static recipe set

## 7. Workflow State Machine
Primary states are represented by WorkflowState in src/types.ts and driven in src/App.tsx.

Key path:
- LANDING
- CAMERA_SCAN
- PROCESSING
- PERCEPTION_MAP
- INGREDIENT_LIST
- RECIPE_SELECTOR
- RECIPE_DETAIL
- COOKING_MODE
- POST_COMPLETION

Auxiliary paths:
- API_CONFIG
- OFFLINE_MANUAL
- SAVED_RECIPES
- SCAN_HISTORY
- PANTRY_TRACKER
- MEAL_PLANNER
- PROFILE_SETTINGS
- SHOPPING_LIST

Design benefits:
- Predictable state transitions
- Easier debugging and extension
- Feature isolation by workflow context

## 8. Feature Specification
## 8.1 Ingredient Perception
User can capture image or upload photo.

System behavior:
1. Optional stage-1 detector extracts initial object candidates.
2. Gemini performs semantic enrichment and structured extraction.
3. Non-food/human cues are filtered.
4. Candidate list is normalized, deduplicated, and surfaced for review.

Output contract:
- Ingredient list with confidence and optional location metadata
- Human detection signal for safety handling

## 8.2 Perception Map and Ingredient Manifest
- Visual overlay and list representation
- Manual correction support (add/remove)
- Confidence-aware display

Purpose:
- Improve trust by making AI output inspectable
- Keep user in control before recipe generation

## 8.3 Recipe Intelligence
Two complementary recommendation modes:
1. Instant suggestions from known data (fast path)
2. Synthesized recipes from AI (creative path)

Ranking factors:
- Ingredient overlap/readiness
- Taste model alignment
- Nutritional goal constraints
- Allergy constraints

## 8.4 Offline-First Support
- Local storage fallback for critical entities
- Static/local recipe corpus as resilience layer

Outcome:
- App remains useful in low-connectivity or guest mode

## 8.5 Pantry Intelligence
- Ingredient persistence with metadata (storage class and shelf life)
- Expiry-aware handling and usage cues
- Manual plus scan source handling

## 8.6 Shopping Experience
- Shopping list CRUD and check states
- Direct product search launch using Google Shopping URLs
- Single-item and multi-item query support

## 8.7 Meal Planning
- Date and meal-type organization
- Local and cloud persistence model

## 8.8 Guided Cooking
- Step-by-step mode with progress and timer support
- Completion state and summary context

## 8.9 Newly Introduced Premium Features
1. Smart Cost Intelligence (Recipe Detail)
- Estimated total recipe cost
- Missing-ingredient spend estimate
- In-stock value estimate
- Cost per serving estimate

2. Precision Cook Timeline (Recipe Detail)
- Total, active, and passive duration breakdown
- Per-step minute windows and phase labeling

## 9. Security, Privacy, and Guardrails
## 9.1 Data Access
- Firestore rules enforce user-scoped access boundaries
- Cloud data paths are under users/{uid}

## 9.2 Scan Guardrails
- Non-edible and human filtering in vision pipeline
- Prevents unsafe progression from invalid perception context

## 9.3 Error Handling
- Error boundary protects UX from full app crash
- Service-level try/catch and fallback strategy for external calls

## 10. Performance and Reliability Approach
- Local caching in vision pipeline for identical image payloads
- Fallback-first strategy for external AI failures
- Dataset-backed static recommendations when AI or network is unavailable
- Bounded local storage patterns (example: scan history limits)

## 11. Why This Product Is Competitive
## 11.1 Practical End-to-End Value
This project combines perception, recommendation, pantry, shopping, planning, and execution in one continuous user journey.

## 11.2 Reliability Through Hybrid Design
- Not fully dependent on one remote model
- Not fully dependent on cloud availability
- Multiple graceful fallback routes

## 11.3 User-Centric Novelty
- Zero-to-recipe journey with minimal user friction
- Missing-ingredient purchase paths in context
- Recipe-level cost and timeline intelligence

## 12. Tradeoffs and Constraints
- AI output quality still depends on image quality and model behavior.
- Cost intelligence currently relies on heuristic estimates, not market feeds.
- Timeline estimation is approximate when step durations are absent.

These are acceptable for current product stage and can be incrementally improved.

## 13. Suggested Next Iteration Roadmap
1. Provider abstraction for live regional pricing data.
2. Persistent bought-state and shopping completion analytics.
3. Semantic ingredient ontology for stronger substitution and matching.
4. Explainability panel for AI confidence and rejection reasons.

## 14. Build and Validation Standard
Expected routine checks before release:
1. Type validation: npm run lint
2. Production build: npm run build
3. Manual workflow checks for scan, recipe, shopping, and cooking paths

## 15. Conclusion
Culinary Lens v2 is architected as a modular, resilient, AI-assisted cooking platform with practical real-world flows. It balances innovation with stability through a hybrid recommendation and persistence model, and it is positioned well for premium feature growth without requiring disruptive rewrites.
