export type GamificationBadge = {
  id: string;
  title: string;
  description: string;
};

export type GamificationState = {
  streak: number;
  totalScans: number;
  totalCooks: number;
  unlockedBadgeIds: string[];
};

const STORAGE_KEY = 'CULINARY_LENS_GAMIFICATION';

const BADGES: GamificationBadge[] = [
  { id: 'first-scan', title: 'First Scan', description: 'Completed your first ingredient scan.' },
  { id: 'scan-10', title: 'Scanner Pro', description: 'Completed 10 ingredient scans.' },
  { id: 'first-cook', title: 'First Cook', description: 'Completed your first recipe.' },
  { id: 'cook-10', title: 'Kitchen Master', description: 'Completed 10 recipes.' },
  { id: 'streak-7', title: 'Weekly Streak', description: 'Maintained a 7-day streak.' },
];

function todayIsoDate(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function safeParse(raw: string | null): GamificationState {
  if (!raw) {
    return { streak: 0, totalScans: 0, totalCooks: 0, unlockedBadgeIds: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GamificationState>;
    return {
      streak: Number(parsed.streak) || 0,
      totalScans: Number(parsed.totalScans) || 0,
      totalCooks: Number(parsed.totalCooks) || 0,
      unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds) ? parsed.unlockedBadgeIds : [],
    };
  } catch {
    return { streak: 0, totalScans: 0, totalCooks: 0, unlockedBadgeIds: [] };
  }
}

function readState(): GamificationState {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function writeState(next: GamificationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function computeUnlockedIds(state: GamificationState): string[] {
  const unlocked = new Set<string>(state.unlockedBadgeIds);

  if (state.totalScans >= 1) unlocked.add('first-scan');
  if (state.totalScans >= 10) unlocked.add('scan-10');
  if (state.totalCooks >= 1) unlocked.add('first-cook');
  if (state.totalCooks >= 10) unlocked.add('cook-10');
  if (state.streak >= 7) unlocked.add('streak-7');

  return Array.from(unlocked);
}

export class GamificationService {
  static listBadges(): GamificationBadge[] {
    return BADGES;
  }

  static getState(): GamificationState {
    return readState();
  }

  static recordScan(): { state: GamificationState; newlyUnlocked: GamificationBadge[] } {
    const state = readState();
    const previousUnlocked = new Set(state.unlockedBadgeIds);

    state.totalScans += 1;

    const lastScanDay = localStorage.getItem('CULINARY_LENS_LAST_SCAN_DAY');
    const today = todayIsoDate();
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayIso = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    // FIX: Keep streak progression deterministic and prevent double increment on same day.
    if (lastScanDay === today) {
      // no-op for streak
    } else if (lastScanDay === yesterdayIso) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }

    localStorage.setItem('CULINARY_LENS_LAST_SCAN_DAY', today);

    state.unlockedBadgeIds = computeUnlockedIds(state);
    writeState(state);

    const newlyUnlocked = BADGES.filter((badge) => state.unlockedBadgeIds.includes(badge.id) && !previousUnlocked.has(badge.id));
    return { state, newlyUnlocked };
  }

  static recordCook(): { state: GamificationState; newlyUnlocked: GamificationBadge[] } {
    const state = readState();
    const previousUnlocked = new Set(state.unlockedBadgeIds);

    state.totalCooks += 1;
    state.unlockedBadgeIds = computeUnlockedIds(state);
    writeState(state);

    const newlyUnlocked = BADGES.filter((badge) => state.unlockedBadgeIds.includes(badge.id) && !previousUnlocked.has(badge.id));
    return { state, newlyUnlocked };
  }
}
