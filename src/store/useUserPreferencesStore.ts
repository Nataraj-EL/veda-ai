import { create } from "zustand";

export interface UserPreferences {
  teacherName: string;
  schoolName: string;
  schoolAddress: string;
}

interface UserPreferencesState {
  preferences: UserPreferences | null;
  userId: string;
  showOnboarding: boolean;
  isSettingsOpen: boolean;
  
  // Actions
  loadPreferences: () => void;
  savePreferences: (prefs: UserPreferences) => void;
  setShowOnboarding: (val: boolean) => void;
  setIsSettingsOpen: (val: boolean) => void;
}

const LOCAL_STORAGE_KEY = "vedam_user_preferences";
const USER_ID_KEY = "vedam_user_id";

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    // Generate a unique 24-character hex ID (ObjectId-compatible length)
    const chars = "abcdef0123456789";
    id = "user_";
    for (let i = 0; i < 19; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export const useUserPreferencesStore = create<UserPreferencesState>((set) => ({
  preferences: null,
  userId: "",
  showOnboarding: false,
  isSettingsOpen: false,

  loadPreferences: () => {
    if (typeof window === "undefined") return;
    const userId = getOrCreateUserId();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as UserPreferences;
        if (
          parsed.teacherName &&
          parsed.schoolName &&
          parsed.schoolAddress
        ) {
          set({ preferences: parsed, userId, showOnboarding: false });
          return;
        }
      } catch (err) {
        console.error("Failed to parse preferences from localStorage", err);
      }
    }
    set({ preferences: null, userId, showOnboarding: true });
  },

  savePreferences: (prefs) => {
    if (typeof window === "undefined") return;
    const userId = getOrCreateUserId();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs));
    set({ preferences: prefs, userId, showOnboarding: false });
  },

  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
}));
