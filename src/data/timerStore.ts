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

export type PaymentRecord = {
  amount: number;
  date: string;
  note?: string;
};

export type PlayHistoryItem = {
  id: string;
  // where this history row came from
  sessionType?: 'timer' | 'stable' | 'table';
  // for table sessions
  tableKind?: 'snooker' | 'eightBall';

  // for table sessions: winner information
  winnerCode?: string;

  // for table sessions: how many players were in this match
  playersCount?: number;

  // for table sessions: list of players (so we can resolve winner code -> name later)
  players?: { code: string; fullName: string }[];

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
  // optional client code (used in table/stable for faster lookups)
  clientCode?: string;
  paidAmount: number;
  paidFully: boolean;
  remainingAmount: number;
  createdAt: string;
  // payment history tracking
  paymentHistory?: PaymentRecord[];
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