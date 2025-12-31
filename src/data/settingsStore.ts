import { loadFromApi, saveToApi } from './storage';

export type AppSettings = {
  darkVeilEnabled: boolean;
  darkVeilOpacity: number;
  darkVeilTint: string;
  costPerHour: string;

  gameCenterName: string;
  backgroundImage: string | null;

  // Auth
  authEnabled: boolean;
  adminUsername: string;
  adminPassword: string;

  // Home page UI
  homeShowTopTabs: boolean;
  homeDefaultTab: 'stable' | 'timer' | 'table';
};

const KEY = 'appSettings';

const defaultSettings: AppSettings = {
  darkVeilEnabled: true,
  darkVeilOpacity: 0.5,
  darkVeilTint: '#ffffff',
  costPerHour: '',

  gameCenterName: '',
  backgroundImage: null,

  // Auth is OFF by default
  authEnabled: false,
  adminUsername: '',
  adminPassword: '',

  homeShowTopTabs: false,
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