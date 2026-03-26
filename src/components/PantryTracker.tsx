import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Trash2, Calendar, Plus, AlertTriangle, ChevronRight } from 'lucide-react';
import { PantryService } from '../services/pantryService';
import { Ingredient } from '../types';
import { getIngredientSuggestions } from '../services/ingredientSuggestionService';
import { getPantryProductMeta } from '../services/pantryProductDataset';

export const PantryTracker: React.FC = () => {
  const getTodayInputDate = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const [pantry, setPantry] = useState<Ingredient[]>([]);
  const [newItem, setNewItem] = useState('');
  const [manualExpiry, setManualExpiry] = useState<string>('');
  const [expiringItems, setExpiringItems] = useState<Ingredient[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadPantry();
  }, []);

  useEffect(() => {
    if (!newItem.trim()) {
      setSuggestions([]);
      return;
    }

    setSuggestions(getIngredientSuggestions(newItem));
  }, [newItem]);

  const loadPantry = () => {
    const items = PantryService.getPantry();
    setPantry(items);
    setExpiringItems(PantryService.checkExpiry());
  };

  const handleAdd = () => {
    if (!newItem.trim()) return;
    const normalizedExpiry = manualExpiry
      ? new Date(`${manualExpiry}T12:00:00`).toISOString()
      : undefined;

    PantryService.addManualItem(newItem, normalizedExpiry);
    setNewItem('');
    setManualExpiry('');
    setSuggestions([]);
    loadPantry();
  };

  const handleRemove = (id: string) => {
    PantryService.removeFromPantry(id);
    loadPantry();
  };

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto pb-24">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-400" />
          Smart Pantry
        </h1>
        <p className="text-zinc-400">Track your staples and avoid food waste.</p>
      </header>

      {/* Add Item */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_190px_auto] gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add staple (e.g., Olive Oil, Flour)..."
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
        <input
          type="date"
          min={getTodayInputDate()}
          value={manualExpiry}
          onChange={(e) => setManualExpiry(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          title="Optional custom expiry date"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add
        </button>
      </div>

      {newItem.trim() && (
        <p className="text-[11px] text-zinc-500 -mt-4">
          Auto details: {getPantryProductMeta(newItem).category} • {getPantryProductMeta(newItem).storage} storage • {getPantryProductMeta(newItem).shelfLifeDays} day shelf life
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="-mt-5 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setNewItem(suggestion)}
              className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-blue-300 hover:bg-zinc-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Expiry Alerts */}
      {expiringItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
          <div>
            <h3 className="text-amber-500 font-semibold">Expiring Soon</h3>
            <p className="text-amber-500/80 text-sm">
              {expiringItems.map(i => i.name).join(', ')} should be used soon.
            </p>
          </div>
        </motion.div>
      )}

      {/* Pantry List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
          Your Inventory
          <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
            {pantry.length} items
          </span>
        </h2>
        
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {pantry.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{item.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {item.category} • {item.pantryDetails?.storage || 'PANTRY'} • {item.pantryDetails?.source || 'MANUAL'}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {pantry.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-3xl">
              <Package className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">Your pantry is empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
