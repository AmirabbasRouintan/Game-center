import { loadFromApi, saveToApi } from './storage';

export type TableKind = 'snooker' | 'eightBall';
export type AskCustomerTiming = 'start' | 'stop';

export type TableSettings = {
  askCustomerTimingByKind: Record<TableKind, AskCustomerTiming>;
};

const KEY = 'tableSettings';

export const defaultTableSettings: TableSettings = {
  askCustomerTimingByKind: {
    snooker: 'stop',
    eightBall: 'stop',
  },
};

export const tableSettingsStore = {
  async load(): Promise<TableSettings> {
    const loaded = await loadFromApi<TableSettings>(KEY, defaultTableSettings);

    // Defensive merge for forward/backward compatibility
    return {
      ...defaultTableSettings,
      ...loaded,
      askCustomerTimingByKind: {
        ...defaultTableSettings.askCustomerTimingByKind,
        ...(loaded?.askCustomerTimingByKind || {}),
      },
    };
  },

  async savePartial(patch: Partial<TableSettings>): Promise<void> {
    const current = await this.load();
    const updated: TableSettings = {
      ...current,
      ...patch,
      askCustomerTimingByKind: {
        ...current.askCustomerTimingByKind,
        ...(patch.askCustomerTimingByKind || {}),
      },
    };
    await saveToApi(KEY, updated);
  },

  async setAskCustomerTiming(kind: TableKind, timing: AskCustomerTiming): Promise<void> {
    await this.savePartial({
      askCustomerTimingByKind: {
        [kind]: timing,
      } as Record<TableKind, AskCustomerTiming>,
    });
  },

  async resetToDefault(): Promise<TableSettings> {
    await saveToApi(KEY, defaultTableSettings);
    return defaultTableSettings;
  },
};
