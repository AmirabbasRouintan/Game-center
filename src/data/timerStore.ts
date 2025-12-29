import { loadFromApi, saveToApi } from './storage';

export type GameCard = {
  id: number;
  title: string;
  time: number;
  isRunning: boolean;
  startedAt?: string;
  stoppedAt?: string;
  totalCost?: number;
  date?: string;
};

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  code: string;
  createdAt: string;
};

export type PlayHistoryItem = {
  id: string;
  cardId: number;
  cardTitle: string;
  sessionDate?: string;
  startedAt?: string;
  stoppedAt?: string;
  secondsPlayed: number;
  costPerHour: number;
  totalCost: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  paidAmount: number;
  paidFully: boolean;
  remainingAmount: number;
  createdAt: string;
};

const KEYS = {
  cards: 'gameCards',
  clients: 'gameClients',
  history: 'playHistory',
} as const;

export const timerStore = {
  async loadCards(): Promise<GameCard[]> {
    return loadFromApi<GameCard[]>(KEYS.cards, []);
  },
  async saveCards(cards: GameCard[]): Promise<void> {
    await saveToApi(KEYS.cards, cards);
  },

  async loadClients(): Promise<Client[]> {
    return loadFromApi<Client[]>(KEYS.clients, []);
  },
  async saveClients(clients: Client[]): Promise<void> {
    await saveToApi(KEYS.clients, clients);
  },

  async loadHistory(): Promise<PlayHistoryItem[]> {
    return loadFromApi<PlayHistoryItem[]>(KEYS.history, []);
  },
  async saveHistory(history: PlayHistoryItem[]): Promise<void> {
    await saveToApi(KEYS.history, history);
  },
};