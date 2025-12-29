import { loadFromLocalStorage, saveToLocalStorage } from './storage';

// Keep Tournament shape flexible; competitions/page.tsx defines the real type.
export type Tournament = unknown;

const KEY = 'tournaments' as const;

export const competitionsStore = {
  loadTournaments<T = Tournament[]>(): T {
    return loadFromLocalStorage<T>(KEY, [] as unknown as T);
  },
  saveTournaments<T = Tournament[]>(tournaments: T): void {
    saveToLocalStorage(KEY, tournaments);
  },
};
