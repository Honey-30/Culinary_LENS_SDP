# Culinary Lens - Implementation Roadmap

## Priority Tiers for Feature Development

### 🔴 Tier 1: MVP+ (Foundation for Value)

These establish the core differentiator and should ship first:

1. **"What Can I Cook RIGHT NOW?" Mode** (Week 1-2)
   - Effort: Medium (depends on recipe ranking engine)
   - Impact: High (main landing page feature)
   - Dependencies: Existing pantry, scan vault, recipe engine

2. **Conversational Cooking Assistant** (Week 2-3)
   - Effort: Medium (uses existing Gemini integration)
   - Impact: High (game changer for UX)
   - Dependencies: `visionEngine.ts` + new intent handler

3. **Personalized Cooking Brain** (Week 3-4)
   - Effort: Medium (data model + ranking logic)
   - Impact: High (improves all recipe suggestions)
   - Dependencies: User profile service

### 🟡 Tier 2: Experience Enhancement (Next Phase)

These polish the cooking experience:

4. **Voice-First Cooking Mode** (Week 4-5)
   - Effort: Medium (Web Speech API integration)
   - Impact: Medium-High (kitchen usability)
   - Dependencies: React + `CookingTimer.tsx` refactor

5. **Fridge Intelligence Mode** (Week 5-6)
   - Effort: Medium (expiry model + UI)
   - Impact: Medium (waste reduction value)
   - Dependencies: Pantry service upgrade

6. **Adaptive Cooking Mode** (Week 6-7)
   - Effort: High (complex state management)
   - Impact: Medium (niche but powerful)
   - Dependencies: `CookingTimer.tsx` + analytics

7. **Packaged Food OCR + Nutrition Extraction** (Week 7-8)
   - Effort: High (OCR + parsing + AI extraction)
   - Impact: Medium-High (handles real pantries)
   - Dependencies: Vision API + new service layer

### 🟢 Tier 3: Intelligence & Analytics (Growth Features)

These add depth and data insights:

8. **Ingredient Graph / Knowledge Graph** (Week 8-10)
   - Effort: High (complex data structure)
   - Impact: Medium (enables cross-recipe features)
   - Dependencies: Recipe corpus analysis

9. **Scan Evolution Tracking** (Week 10-11)
   - Effort: Medium (historical data + UI)
   - Impact: Medium (analytics value)
   - Dependencies: Scan vault + Recharts

10. **Cost-Aware Cooking** (Week 11-12)
    - Effort: Medium (pricing model + filtering)
    - Impact: Medium (budget users care about this)
    - Dependencies: Ingredient database + user preferences

11. **Health Mode (AI Dietician Lite)** (Week 12-13)
    - Effort: Medium (macro tracking + suggestions)
    - Impact: Medium-High (health-conscious users)
    - Dependencies: Nutrition database + user goals

12. **Sustainability Mode** (Week 13-14)
    - Effort: Low (filter + scoring logic)
    - Impact: Medium (environmental value)
    - Dependencies: Ingredient graph + recipe corpus

### 🟣 Tier 4: Advanced (Nice-to-Have)

These are future-state capabilities:

- **Multi-Zone Scene Detection** → Phase 2 (requires ML/MediaPipe investment)
- **AR Cooking Overlay** → Phase 3 (requires WebAR stack)
- **Team Meal Planning** → Phase 2 (collaboration sync)
- **Social Recipe Sharing** → Phase 3 (community)

---

## Estimated Timeline

| Tier | Duration | Ship Target |
|------|----------|------------|
| MVP+ (Tier 1) | 4 weeks | Month 1 |
| Experience+ (Tier 2) | 8 weeks | Month 3 |
| Intelligence+ (Tier 3) | 6 weeks | Month 5 |
| Advanced (Tier 4) | TBD | Phase 2+ |

---

## Development Checklist

### Before Starting Tier 2:

- [ ] Tier 1 features shipped and validated
- [ ] User feedback on "What Can I Cook?" mode
- [ ] Taste model accuracy ≥ 80%
- [ ] Conversational engine handles ≥ 10 intent types

### Before Starting Tier 3:

- [ ] Tier 2 features stable (< 2% crash rate)
- [ ] Voice mode adoption ≥ 30% of users
- [ ] Fridge mode detecting expiry correctly ≥ 85%

### Before Phase 2:

- [ ] All Tier 3 features shipped and validated
- [ ] Analytics dashboard showing clear usage patterns
- [ ] Community requests indicating demand for features
- [ ] Infrastructure ready for ML model serving (if using local ML)

---

## Architecture Decisions to Make

### 1. Taste Model Storage

- **Option A:** Firestore (cloud) + localStorage (guest) ✅ Recommended
  - Sync-friendly, real-time collaborative
  - Easy backup and analytics

- **Option B:** Local-only (IndexedDB)
  - Privacy-first, faster, no sync needed
  - Harder to migrate/backup

### 2. Ingredient Graph

- **Option A:** Static JSON in code
  - Fast, simple, version-controlled
  - Hard to scale, inflexible

- **Option B:** Generated from recipe corpus at build time ✅ Recommended
  - Automatic, scales with recipes
  - Build-time optimization

- **Option C:** Dynamic Firestore collection
  - Flexible, collaborative possibilities
  - Server costs, latency

### 3. Vision Enhancement Stack

- **Multi-Zone Detection:** TensorFlow.js + Coco SSD or MediaPipe
  - TensorFlow = better customization
  - MediaPipe = easier to integrate

- **OCR:** Google Vision API vs Tesseract.js
  - Google = more accurate, costs money
  - Tesseract.js = local, free, slower

### 4. Conversational Engine

- Keep existing Gemini API approach for consistency
- Consider prompt engineering over multi-model approach
- Plan for rate limiting (user fairness)

---

## Performance Targets

| Feature | Target | Metric |
|---------|--------|--------|
| "What Can I Cook?" load | < 500ms | Time to first suggestion |
| Conversational response | < 2s | LLM response time |
| Voice command recognition | < 1s | Latency |
| Pantry search | < 100ms | Ingredient lookup |
| Recipe ranking | < 200ms | Full recipe sort |

---

## Risk Assessment & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| Taste model overfits to user patterns | Medium | High | Regularization + user feedback |
| OCR accuracy poor on worn labels | Medium | Medium | Fallback to manual entry + user correction |
| Voice in noisy kitchen environment | High | Medium | Multi-modal input (text backup) |
| Latency on large recipe searches | High | Medium | IndexedDB caching + pagination |
| Privacy concerns (health data) | High | Medium | Encryption + transparency in TOS |

---

## Success Metrics

By end of Phase 1 (Month 3):

1. ✅ "What Can I Cook?" mode: ≥ 50% daily active users
2. ✅ Conversational mode: ≥ 3 avg intents per cooking session
3. ✅ Voice mode: ≥ 20% adoption among active users
4. ✅ Fridge mode: ≥ 40% of pantry users enable expiry tracking
5. ✅ Overall app retention: ≥ 60% week-over-week

---

## File Structure for New Services

```
src/
├── services/
│   ├── instantRecipeSuggestion.ts      # Zero-input mode
│   ├── tasteModel.ts                    # Personalization brain
│   ├── conversationalEngine.ts          # Conversational assistant
│   ├── voiceCommand.ts                  # Voice interface
│   ├── fridgeIntelligence.ts            # Expiry detection
│   ├── adaptiveCooking.ts               # Dynamic timing
│   ├── packagedFoodParser.ts            # OCR + nutrition
│   ├── ingredientGraph.ts               # Knowledge graph
│   ├── scanEvolution.ts                 # Historical trends
│   ├── costAnalyzer.ts                  # Budget sorting
│   ├── nutritionTracker.ts              # Health mode
│   └── sustainabilityScore.ts           # Eco mode
├── components/
│   ├── QuickCookMode.tsx                # Zero-input landing
│   ├── ConversationalCooking.tsx        # Chat interface
│   ├── VoiceInterface.tsx               # Voice controls
│   ├── AnalyticsBoard.tsx               # Scan evolution dashboard
│   └── HealthDashboard.tsx              # Nutritional tracking
└── types/
    ├── tasteProfile.ts
    ├── conversationIntent.ts
    ├── costModel.ts
    └── nutritionData.ts
```

---

## Community & Feedback Loop

- Prioritize user testing on "What Can I Cook?" before scaling
- Beta test voice features with kitchen-focused users
- Gather feedback on personalization accuracy (Tier 1 completion = 2-3 weeks user testing)
- Iterate on Conversational AI based on real questions users ask
