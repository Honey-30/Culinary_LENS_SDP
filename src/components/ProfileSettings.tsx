import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Bell, LogOut, ChevronRight, Check, X, Settings, Heart, Zap, Award } from 'lucide-react';
import { AllergyService } from '../services/allergyService';
import { UserProfile } from '../types';

interface ProfileSettingsProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onLogout }) => {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => localStorage.getItem('CL_NOTIFICATIONS_ENABLED') !== 'false');

  useEffect(() => {
    setAllergies(AllergyService.getAllergies());
  }, []);

  useEffect(() => {
    localStorage.setItem('CL_NOTIFICATIONS_ENABLED', notificationsEnabled ? 'true' : 'false');
  }, [notificationsEnabled]);

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    const updated = [...allergies, newAllergy.trim()];
    setAllergies(updated);
    AllergyService.setAllergies(updated);
    setNewAllergy('');
  };

  const handleRemoveAllergy = (allergy: string) => {
    const updated = allergies.filter(a => a !== allergy);
    setAllergies(updated);
    AllergyService.setAllergies(updated);
  };

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto pb-24">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-500/50 flex items-center justify-center text-blue-400 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.displayName || 'Chef Guest'}</h1>
            <p className="text-zinc-500 text-sm">{user?.email || 'guest@culinarylens.ai'}</p>
          </div>
        </div>
      </header>

      {/* Skill Level */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Cooking Skill Level
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setSkillLevel(level)}
              className={`p-4 rounded-2xl border-2 transition-all text-center ${
                skillLevel === level 
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-bold mb-1">{level}</div>
              <div className="text-[10px] opacity-60">
                {level === 'BEGINNER' && 'Simple recipes'}
                {level === 'INTERMEDIATE' && 'Complex flavors'}
                {level === 'ADVANCED' && 'Professional techniques'}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Allergies & Restrictions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          Allergies & Dietary Restrictions
        </h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
            placeholder="Add allergy (e.g., Peanuts, Shellfish)..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
          />
          <button
            onClick={handleAddAllergy}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {allergies.map((allergy) => (
              <motion.div
                key={allergy}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
              >
                {allergy}
                <button onClick={() => handleRemoveAllergy(allergy)} className="hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Account Actions */}
      <div className="pt-8 border-t border-zinc-800 space-y-4">
        <button
          onClick={() => setNotificationsEnabled(prev => !prev)}
          className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all group"
        >
          <div className="flex items-center gap-3 text-zinc-300">
            <Bell className="w-5 h-5" />
            <span>Notifications {notificationsEnabled ? 'On' : 'Off'}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400" />
        </button>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-between p-4 bg-red-500/10 rounded-2xl hover:bg-red-500/20 transition-all group"
        >
          <div className="flex items-center gap-3 text-red-400">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400/50 group-hover:text-red-400" />
        </button>
      </div>
    </div>
  );
};
