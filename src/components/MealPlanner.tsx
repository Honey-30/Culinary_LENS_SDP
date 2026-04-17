import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, ChevronLeft, ChevronRight, Clock, ChefHat, Utensils, WandSparkles } from 'lucide-react';
import { MealPlanService, MealPlanEntry } from '../services/mealPlanService';
import { LARGE_RECIPE_DATABASE } from '../services/recipeDatabase';
import { STATIC_RECIPES } from '../services/staticRecipes';

const FALLBACK_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000';

interface MealPlannerProps {
  userId: string;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ userId }) => {
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plannerError, setPlannerError] = useState<string | null>(null);
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<'BALANCED' | 'HIGH_PROTEIN' | 'LOW_CARB' | 'VEG_FORWARD'>('BALANCED');
  const [draft, setDraft] = useState<{ id?: string; date: string; type: MealPlanEntry['type']; recipeTitle: string; recipeImageUrl?: string } | null>(null);

  useEffect(() => {
    loadMealPlan();
  }, [userId]);

  const loadMealPlan = async () => {
    try {
      const entries = await MealPlanService.getEntries(userId);
      setMealPlan(entries);
    } catch {
      // FIX: Catch planner load failures to avoid unhandled promise rejections on screen entry.
      setPlannerError('Unable to load meal plan right now.');
    }
  };

  const handleDelete = async (id: string) => {
    setPlannerError(null);
    try {
      await MealPlanService.removeEntry(userId, id);
      loadMealPlan();
    } catch {
      setPlannerError('Failed to remove meal entry.');
    }
  };

  const toIsoDate = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const getWeekStart = (date: Date) => {
    const next = new Date(date);
    const day = next.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    next.setDate(next.getDate() + diff);
    return next;
  };

  const scoreRecipeForGoal = (title: string, goal: typeof selectedGoal) => {
    const text = title.toLowerCase();
    if (goal === 'HIGH_PROTEIN') {
      return /chicken|egg|tofu|lentil|salmon|beef|protein/.test(text) ? 2 : 0;
    }
    if (goal === 'LOW_CARB') {
      return /salad|grill|roast|stir|soup/.test(text) ? 2 : /pasta|rice|bread/.test(text) ? -1 : 0;
    }
    if (goal === 'VEG_FORWARD') {
      return /veggie|vegetable|salad|tofu|lentil|bean/.test(text) ? 2 : 0;
    }
    return 1;
  };

  const handleGenerateWeek = async () => {
    setPlannerError(null);
    setIsGenerating(true);
    try {
      const pool = [...LARGE_RECIPE_DATABASE, ...STATIC_RECIPES]
        .sort((a, b) => scoreRecipeForGoal(b.title, selectedGoal) - scoreRecipeForGoal(a.title, selectedGoal));
      const weekStart = getWeekStart(currentDate);
      const mealTypes: MealPlanEntry['type'][] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
      const nextEntries: MealPlanEntry[] = [];

      for (let d = 0; d < 7; d += 1) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + d);
        const isoDate = toIsoDate(dayDate);

        for (let t = 0; t < mealTypes.length; t += 1) {
          const recipe = pool[(d * mealTypes.length + t) % pool.length];
          nextEntries.push({
            id: `week-${isoDate}-${mealTypes[t]}`,
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            recipeImageUrl: recipe.imageUrl,
            date: isoDate,
            type: mealTypes[t],
          });
        }
      }

      // FIX: Replace existing generated week rows before inserting to prevent duplicate weekly cells.
      const existing = await MealPlanService.getEntries(userId);
      const generatedIds = new Set(nextEntries.map((entry) => entry.id));
      await Promise.all(
        existing
          .filter((entry) => entry.id && generatedIds.has(entry.id))
          .map((entry) => MealPlanService.removeEntry(userId, entry.id!))
      );

      await Promise.all(nextEntries.map((entry) => MealPlanService.addEntry(userId, entry)));
      await loadMealPlan();
      setGoalPickerOpen(false);
    } catch {
      setPlannerError('Could not generate your week. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draft || !draft.recipeTitle.trim()) return;
    setPlannerError(null);
    try {
      if (draft.id) {
        await MealPlanService.removeEntry(userId, draft.id);
      }
      await MealPlanService.addEntry(userId, {
        id: draft.id,
        recipeId: `manual-${Date.now()}`,
        recipeTitle: draft.recipeTitle.trim(),
        recipeImageUrl: draft.recipeImageUrl,
        date: draft.date,
        type: draft.type,
      });
      setDraft(null);
      await loadMealPlan();
    } catch {
      setPlannerError('Unable to save this edit.');
    }
  };

  const getDayEntries = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealPlan.filter(e => e.date === dateStr);
  };

  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const dayEntries = getDayEntries(currentDate);
  const weekStart = getWeekStart(currentDate);
  const weeklyDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });
  const mealTypes: MealPlanEntry['type'][] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f8fbff,transparent_32%),radial-gradient(circle_at_top_right,#eefdf4,transparent_28%),linear-gradient(180deg,#fbfbfd_0%,#f4f7fb_100%)] px-4 py-6 sm:px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
          <Calendar className="w-3.5 h-3.5" />
          Meal Planner
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.45)] border border-zinc-100">
            <Calendar className="w-7 h-7 text-emerald-500" />
          </span>
          Meal Planner
        </h1>

        <div className="flex items-center justify-between rounded-[1.75rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <button onClick={prevDay} className="p-2.5 hover:bg-zinc-100 rounded-xl transition-all text-zinc-500">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.24em]">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-zinc-950">
              {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button onClick={nextDay} className="p-2.5 hover:bg-zinc-100 rounded-xl transition-all text-zinc-500">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 space-y-3 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-[0.22em]">Generate My Week</p>
            <p className="text-sm text-zinc-600">Create a complete 7-day plan with one tap.</p>
          </div>
          <button
            onClick={() => setGoalPickerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold shadow-[0_12px_30px_-18px_rgba(15,23,42,0.6)]"
          >
            <WandSparkles className="w-4 h-4" />
            Generate
          </button>
        </div>
        {plannerError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{plannerError}</p>
        )}
      </div>

      <section className="space-y-3">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.24em]">Weekly Grid</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {weeklyDays.map((day) => {
            const isoDate = toIsoDate(day);
            const entries = mealPlan.filter((entry) => entry.date === isoDate);
            return (
              <div key={isoDate} className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 space-y-3 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                <p className="text-sm font-extrabold tracking-tight text-zinc-950">{day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <div className="space-y-1.5">
                  {mealTypes.map((type) => {
                    const entry = entries.find((item) => item.type === type);
                    return (
                      <button
                        key={`${isoDate}-${type}`}
                        onClick={() => setDraft({
                          id: entry?.id,
                          date: isoDate,
                          type,
                          recipeTitle: entry?.recipeTitle || '',
                          recipeImageUrl: entry?.recipeImageUrl,
                        })}
                        className="w-full text-left rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 hover:border-emerald-200 hover:bg-emerald-50/60 transition-colors"
                      >
                        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{type}</p>
                        <p className="text-sm font-medium text-zinc-900 truncate">{entry?.recipeTitle || 'Tap to add meal'}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-6">
        {mealTypes.map((type) => {
          const typeEntries = dayEntries.filter(e => e.type === type);
          
          return (
            <section key={type} className="space-y-3">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.24em] flex items-center gap-2">
                <Utensils className="w-3 h-3" />
                {type}
              </h3>
              
              <div className="space-y-3">
                {typeEntries.length > 0 ? (
                  typeEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white border border-zinc-100 rounded-[1.35rem] p-4 flex items-center justify-between group hover:border-emerald-200 hover:shadow-[0_16px_36px_-28px_rgba(15,23,42,0.45)] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden ring-1 ring-zinc-100">
                          {entry.recipeImageUrl ? (
                            <img src={entry.recipeImageUrl} alt={entry.recipeTitle} className="w-full h-full object-cover" onError={(event) => {
                              const img = event.currentTarget;
                              img.onerror = null;
                              img.src = FALLBACK_RECIPE_IMAGE;
                            }} />
                          ) : (
                            <ChefHat className="w-6 h-6 text-zinc-400 m-3" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-zinc-950 font-semibold">{entry.recipeTitle}</h4>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {entry.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(entry.id!)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="border border-dashed border-zinc-200 rounded-[1.35rem] p-6 text-center text-zinc-500 text-sm bg-white/70">
                    No {type.toLowerCase()} planned
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <AnimatePresence>
        {goalPickerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 p-4 flex items-end sm:items-center justify-center">
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="w-full max-w-sm bg-white border border-zinc-100 rounded-3xl p-5 space-y-4 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.5)]">
              <h3 className="text-zinc-950 font-bold">Weekly Goal</h3>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'BALANCED', label: 'Balanced' },
                  { key: 'HIGH_PROTEIN', label: 'High Protein' },
                  { key: 'LOW_CARB', label: 'Low Carb' },
                  { key: 'VEG_FORWARD', label: 'Veg Forward' },
                ] as const).map((goal) => (
                  <button
                    key={goal.key}
                    onClick={() => setSelectedGoal(goal.key)}
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors ${selectedGoal === goal.key ? 'bg-emerald-500 text-zinc-950 border-emerald-300 shadow-sm' : 'bg-zinc-50 text-zinc-700 border-zinc-100 hover:bg-zinc-100'}`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setGoalPickerOpen(false)} className="px-3 py-2 rounded-2xl bg-zinc-100 text-zinc-700 font-medium">Cancel</button>
                <button onClick={handleGenerateWeek} disabled={isGenerating} className="px-3 py-2 rounded-2xl bg-emerald-500 text-zinc-950 font-semibold disabled:opacity-60">
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {draft && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 p-4 flex items-end sm:items-center justify-center">
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="w-full max-w-sm bg-white border border-zinc-100 rounded-3xl p-5 space-y-4 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.5)]">
              <h3 className="text-zinc-950 font-bold">Edit Meal</h3>
              <p className="text-xs text-zinc-500">{draft.date} · {draft.type}</p>
              <input
                value={draft.recipeTitle}
                onChange={(event) => setDraft({ ...draft, recipeTitle: event.target.value })}
                placeholder="Recipe name"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setDraft(null)} className="px-3 py-2 rounded-2xl bg-zinc-100 text-zinc-700 font-medium">Cancel</button>
                <button onClick={handleSaveDraft} className="px-3 py-2 rounded-2xl bg-emerald-500 text-zinc-950 font-semibold">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
