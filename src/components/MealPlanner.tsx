import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, ChevronLeft, ChevronRight, Plus, Clock, ChefHat, Utensils } from 'lucide-react';
import { MealPlanService, MealPlanEntry } from '../services/mealPlanService';

const FALLBACK_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000';

interface MealPlannerProps {
  userId: string;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ userId }) => {
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadMealPlan();
  }, [userId]);

  const loadMealPlan = async () => {
    const entries = await MealPlanService.getEntries(userId);
    setMealPlan(entries);
  };

  const handleDelete = async (id: string) => {
    await MealPlanService.removeEntry(userId, id);
    loadMealPlan();
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

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto pb-24">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-emerald-400" />
          Meal Planner
        </h1>
        
        <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <button onClick={prevDay} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className="text-xl font-bold text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button onClick={nextDay} className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="space-y-6">
        {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((type) => {
          const typeEntries = dayEntries.filter(e => e.type === type);
          
          return (
            <section key={type} className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
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
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden">
                          {entry.recipeImageUrl ? (
                            <img src={entry.recipeImageUrl} alt={entry.recipeTitle} className="w-full h-full object-cover" onError={(event) => {
                              const img = event.currentTarget;
                              img.onerror = null;
                              img.src = FALLBACK_RECIPE_IMAGE;
                            }} />
                          ) : (
                            <ChefHat className="w-6 h-6 text-zinc-600 m-3" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{entry.recipeTitle}</h4>
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
                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="border border-dashed border-zinc-800 rounded-2xl p-6 text-center text-zinc-600 text-sm">
                    No {type.toLowerCase()} planned
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
