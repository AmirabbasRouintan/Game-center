import { loadFromApi, saveToApi } from './storage';

export type AppSettings = {
  darkVeilEnabled: boolean;
  darkVeilOpacity: number;
  darkVeilTint: string;
  costPerHour: string;
  loadingEnabled: boolean;
  loadingDurationMs: number;
  gameCenterName: string;
  backgroundImage: string | null;
  adminUsername: string;
  adminPassword: string;

  // Home page UI
  homeShowTopTabs: boolean;
  homeDefaultTab: 'stable' | 'timer';
};

const KEY = 'appSettings';

const defaultSettings: AppSettings = {
  darkVeilEnabled: true,
  darkVeilOpacity: 0.5,
  darkVeilTint: '#ffffff',
  costPerHour: '',
  loadingEnabled: true,
  loadingDurationMs: 2000,
  gameCenterName: '',
  backgroundImage: null,
  adminUsername: '',
  adminPassword: '',
  homeShowTopTabs: true,
  homeDefaultTab: 'stable',
};

export const settingsStore = {
  async load(): Promise<AppSettings> {
    // Load the entire settings object
    return loadFromApi<AppSettings>(KEY, defaultSettings);
  },

  async savePartial(patch: Partial<AppSettings>): Promise<void> {
    // 1. Load current
    const current = await this.load();
    // 2. Merge
    const updated = { ...current, ...patch };
    // 3. Save
    await saveToApi(KEY, updated);
  },
  
  // Helper to save all (if needed)
  async save(settings: AppSettings): Promise<void> {
    await saveToApi(KEY, settings);
  }
};