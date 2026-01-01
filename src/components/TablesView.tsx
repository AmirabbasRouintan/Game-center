'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayHistoryItem } from '@/data/timerStore';
import { tableSettingsStore, type AskCustomerTiming, type TableKind } from '@/data/tableSettingsStore';
import { Play, Pause, Search, X, Filter, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type TablesViewClient = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  code?: string;
};

type TablePlayer = {
  fullName: string;
  code: string;
};

type TableSession = {
  kind: TableKind;
  running: boolean;
  elapsedSeconds: number;
  sessionCode: string | null;
  startedAt: string | null;
  /** Players currently assigned to this table session */
  players: TablePlayer[];
  // kept for compatibility with existing checkout/history flow (uses a single name)
  customerFullName: string;
  customerClientId: string | null;
};

type StopDraft = {
  kind: TableKind;
  elapsedSeconds: number;
  totalCost: number;
  sessionCode: string | null;
  startedAt: string | null;
  stoppedAt: string;
  customerFullName: string;
};

export default function TablesView({
  language,
  clients,
  costPerHour,
  tableCostPerHourSnooker,
  tableCostPerHourEightBall,
  history,
  onAddHistory,
  onUpdateHistory,
  onDeleteHistory,
}: {
  language: 'fa' | 'en';
  clients: TablesViewClient[];
  costPerHour: number;
  tableCostPerHourSnooker: number;
  tableCostPerHourEightBall: number;
  history: PlayHistoryItem[];
  onAddHistory: (item: PlayHistoryItem) => void;
  onUpdateHistory: (item: PlayHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
}) {
  const [sessions, setSessions] = useState<Record<TableKind, TableSession>>({
    snooker: {
      kind: 'snooker',
      running: false,
      elapsedSeconds: 0,
      sessionCode: null,
      startedAt: null,
      players: [],
      customerFullName: '',
      customerClientId: null,
    },
    eightBall: {
      kind: 'eightBall',
      running: false,
      elapsedSeconds: 0,
      sessionCode: null,
      startedAt: null,
      players: [],
      customerFullName: '',
      customerClientId: null,
    },
  });

  const intervalIds = useRef<Record<TableKind, number | null>>({
    snooker: null,
    eightBall: null,
  });

  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [stopDraft, setStopDraft] = useState<StopDraft | null>(null);

  // Ask customer info timing (per table)
  // Default: ask on stop (so the cashier can enter details هنگام توقف)
  const [askCustomerTiming, setAskCustomerTiming] = useState<Record<TableKind, AskCustomerTiming>>({
    snooker: 'stop',
    eightBall: 'stop',
  });

  useEffect(() => {
    let mounted = true;
    tableSettingsStore
      .load()
      .then((s) => {
        if (!mounted) return;
        setAskCustomerTiming(s.askCustomerTimingByKind);
      })
      .catch(() => {
        // ignore load errors; keep defaults
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isAskCustomerOnStart = (kind: TableKind) => askCustomerTiming[kind] === 'start';

  const setAskCustomerTimingFor = async (kind: TableKind, timing: AskCustomerTiming) => {
    setAskCustomerTiming((prev) => ({ ...prev, [kind]: timing }));
    try {
      await tableSettingsStore.setAskCustomerTiming(kind, timing);
    } catch {
      // ignore persistence errors
    }
  };

  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [startDraft, setStartDraft] = useState<{ kind: TableKind; sessionCode: string; startedAt: string } | null>(
    null,
  );

  // Start popup: players
  const [playersCountInput, setPlayersCountInput] = useState('');
  const [startPlayers, setStartPlayers] = useState<TablePlayer[]>([]);

  const makePlayerCode = () => {
    // 2 letters (A-Z) for very fast typing/reading
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    try {
      const buf = new Uint8Array(2);
      crypto.getRandomValues(buf);
      return `${letters[buf[0] % letters.length]}${letters[buf[1] % letters.length]}`;
    } catch {
      const ms = Date.now();
      return `${letters[ms % letters.length]}${letters[(ms >> 3) % letters.length]}`;
    }
  };

  const clampPlayerCount = (n: number) => {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(12, Math.floor(n)));
  };

  const syncPlayersToCount = (count: number) => {
    setStartPlayers((prev) => {
      const c = clampPlayerCount(count);
      if (c <= 0) return [];
      const next = prev.slice(0, c);
      while (next.length < c) {
        next.push({ fullName: '', code: makePlayerCode() });
      }
      return next;
    });
  };

  // Top search (like stable page)
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // History search (removed)
  const [tableFilterOpen, setTableFilterOpen] = useState(false);
  const [tableFilterByCode, setTableFilterByCode] = useState(true);
  const [tableFilterByName, setTableFilterByName] = useState(false);

  // Table checkout customer info
  const [customerFullName, setCustomerFullName] = useState('');
  const [customerCodeInput, setCustomerCodeInput] = useState('');
  const [showManualCodeInput, setShowManualCodeInput] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [paidFullyChecked, setPaidFullyChecked] = useState(true);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [winnerCodeInput, setWinnerCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // History edit/delete
  const [historyEditOpen, setHistoryEditOpen] = useState(false);
  const [historyEditDraft, setHistoryEditDraft] = useState<PlayHistoryItem | null>(null);

  const copyToClipboard = async (value?: string | null) => {
    const v = (value || '').trim();
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      setCopiedCode(v);
      window.setTimeout(() => {
        setCopiedCode((prev) => (prev === v ? null : prev));
      }, 1200);
    } catch {
      // ignore (clipboard may not be available)
    }
  };

  const tableHistory = useMemo(() => {
    return (history || [])
      .filter((h) => h.sessionType === 'table')
      .slice()
      .sort((a, b) => {
        const at = new Date(a.createdAt || a.stoppedAt || 0).getTime();
        const bt = new Date(b.createdAt || b.stoppedAt || 0).getTime();
        return bt - at;
      });
  }, [history]);

  const getDayKey = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    // YYYY-MM-DD in local time
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const tableDailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of tableHistory) {
      const key = getDayKey(h.stoppedAt || h.createdAt);
      if (!key) continue;
      const amount = Math.round(h.paidAmount || h.totalCost || 0);
      map.set(key, (map.get(key) || 0) + amount);
    }

    const days = Array.from(map.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));

    return days;
  }, [tableHistory]);

  const [selectedEarningsDay, setSelectedEarningsDay] = useState<string>('');

  const effectiveSelectedDay = useMemo(() => {
    return selectedEarningsDay || tableDailyTotals[0]?.day || '';
  }, [selectedEarningsDay, tableDailyTotals]);

  const selectedDayTotal = useMemo(() => {
    if (!effectiveSelectedDay) return 0;
    return tableDailyTotals.find((d) => d.day === effectiveSelectedDay)?.total ?? 0;
  }, [effectiveSelectedDay, tableDailyTotals]);

  const matchedClient = useMemo(() => {
    const full = customerFullName.trim().toLowerCase();
    if (!full) return null;

    // try exact match on "first last" first
    const exact =
      clients.find((c) => `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === full) ?? null;
    if (exact) return exact;

    // fallback: match if both first and last tokens exist in the name
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;

    return (
      clients.find((c) => {
        const name = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
        return parts.every((p) => name.includes(p));
      }) ?? null
    );
  }, [clients, customerFullName]);

  const activeTableClientIds = useMemo(() => {
    const ids = new Set<string>();
    (Object.keys(sessions) as TableKind[]).forEach((k) => {
      const s = sessions[k];
      if (!s.running) return;

      // Prefer explicit client id
      if (s.customerClientId) {
        ids.add(s.customerClientId);
        return;
      }

      // Fallback: match by name if user started without selecting a client
      const full = (s.customerFullName || '').trim().toLowerCase();
      if (!full) return;
      const match = clients.find(
        (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === full,
      );
      if (match?.id) ids.add(match.id);
    });
    return ids;
  }, [sessions, clients]);

  const filteredClients = useMemo(() => {
    const q = tableSearchQuery.trim().toLowerCase();
    if (!q) return [] as TablesViewClient[];

    const byCode = tableFilterByCode;
    const byName = tableFilterByName;

    return clients
      .filter((c) => {
        const code = (c.code || '').trim().toLowerCase();
        const name = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();

        const matchesCode = byCode && code.includes(q);
        const matchesName = byName && name.includes(q);

        if (!byCode && !byName) {
          // fallback: behave like code search
          return code.includes(q) || name.includes(q);
        }

        return matchesCode || matchesName;
      })
      .sort((a, b) => {
        const ar = activeTableClientIds.has(a.id) ? 1 : 0;
        const br = activeTableClientIds.has(b.id) ? 1 : 0;
        if (ar !== br) return br - ar;
        return String(a.code || '').localeCompare(String(b.code || ''));
      })
      .slice(0, 8);
  }, [clients, tableSearchQuery, tableFilterByCode, tableFilterByName, activeTableClientIds]);

  useEffect(() => {
    // eslint wants us to snapshot refs inside the effect
    const ids = intervalIds.current;
    return () => {
      (Object.keys(ids) as TableKind[]).forEach((k) => {
        const id = ids[k];
        if (id) window.clearInterval(id);
      });
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  };

  const getEffectiveCostPerHour = (kind: TableKind) => {
    const perKind = kind === 'snooker' ? tableCostPerHourSnooker : tableCostPerHourEightBall;
    const v = Number.isFinite(perKind) && perKind > 0 ? perKind : costPerHour;
    return Number.isFinite(v) ? v : 0;
  };

  const calcCost = (kind: TableKind, elapsedSeconds: number) => {
    const hours = elapsedSeconds / 3600;
    const perHour = getEffectiveCostPerHour(kind);
    const cost = hours * perHour;
    // round to nearest whole unit
    return Math.round(cost);
  };

  const startTimerInternal = (kind: TableKind) => {
    if (intervalIds.current[kind]) return;
    intervalIds.current[kind] = window.setInterval(() => {
      setSessions((prev) => {
        const current = prev[kind];
        if (!current.running) return prev;
        return {
          ...prev,
          [kind]: {
            ...current,
            elapsedSeconds: current.elapsedSeconds + 1,
          },
        };
      });
    }, 1000);
  };

  const start = (kind: TableKind) => {
    const current = sessions[kind];
    if (current.running) return;

    const startedAt = current.startedAt ?? new Date().toISOString();

    const makeSessionCode = () => {
      // Prefer crypto randomness when available
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';
      try {
        const arr = new Uint8Array(2);
        crypto.getRandomValues(arr);
        const a = letters[arr[0] % letters.length];
        const b = digits[arr[1] % digits.length];
        return `${a}${b}`;
      } catch {
        // Fallback: deterministic based on current milliseconds (still runs only on click)
        const ms = new Date().getMilliseconds();
        const a = letters[ms % letters.length];
        const b = digits[ms % digits.length];
        return `${a}${b}`;
      }
    };

    const sessionCode = current.sessionCode ?? makeSessionCode();

    if (isAskCustomerOnStart(kind)) {
      // Open popup to capture players + show session code before starting
      setCustomerFullName(current.customerFullName || '');
      setPlayersCountInput('');
      setStartPlayers([]);
      setStartDraft({ kind, sessionCode, startedAt });
      setStartDialogOpen(true);
      return;
    }

    setSessions((prev) => {
      const c = prev[kind];
      return {
        ...prev,
        [kind]: {
          ...c,
          running: true,
          sessionCode,
          startedAt,
          players: c.players || [],
          customerClientId: selectedClientId,
        },
      };
    });

    startTimerInternal(kind);
  };

  const stop = (kind: TableKind) => {
    // stop the timer
    setSessions((prev) => {
      const current = prev[kind];
      if (!current.running) return prev;
      return {
        ...prev,
        [kind]: {
          ...current,
          running: false,
        },
      };
    });

    const id = intervalIds.current[kind];
    if (id) {
      window.clearInterval(id);
      intervalIds.current[kind] = null;
    }

    // open dialog
    const current = sessions[kind];
    const totalCost = calcCost(kind, current.elapsedSeconds);
    const stoppedAt = new Date().toISOString();
    setStopDraft({
      kind,
      elapsedSeconds: current.elapsedSeconds,
      totalCost,
      sessionCode: current.sessionCode,
      startedAt: current.startedAt,
      stoppedAt,
      customerFullName: current.customerFullName,
    });

    const askOnStart = isAskCustomerOnStart(kind);

    // Prefill name if we already have one (from start popup or from search)
    if (askOnStart) {
      setCustomerFullName(current.customerFullName || '');
      setCustomerCodeInput('');
      setShowManualCodeInput(false);
      setSelectedClientId(current.customerClientId || null);
    } else {
      setCustomerFullName((prev) => prev || current.customerFullName || '');
    }

    // Payment defaults
    setPaidFullyChecked(true);
    setPaidAmountInput(String(totalCost));

    // Winner defaults: if exactly 2 players, preselect first player's code
    const sessionPlayers = (current.players || []).filter((p) => (p.code || '').trim().length > 0);
    if (sessionPlayers.length === 2) {
      setWinnerCodeInput(sessionPlayers[0]?.code || '');
    } else {
      setWinnerCodeInput('');
    }

    setStopDialogOpen(true);
  };

  // (reset moved below to keep helpers together)
  const reset = (kind: TableKind) => {
    const id = intervalIds.current[kind];
    if (id) {
      window.clearInterval(id);
      intervalIds.current[kind] = null;
    }
    setSessions((prev) => ({
      ...prev,
      [kind]: {
        kind,
        running: false,
        elapsedSeconds: 0,
        sessionCode: null,
        startedAt: null,
        players: [],
        customerFullName: '',
        customerClientId: null,
      },
    }));
  };

  const formatHistoryDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(language === 'fa' ? 'fa-IR' : undefined);
  };

  const getTableLabel = (k?: string) => {
    if (k === 'snooker') return language === 'fa' ? 'اسنوکر' : 'Snooker';
    if (k === 'eightBall') return language === 'fa' ? 'ایت‌بال' : 'Eight Ball';
    return '-';
  };

  const openHistoryEdit = (item: PlayHistoryItem) => {
    setHistoryEditDraft({ ...item });
    setHistoryEditOpen(true);
  };

  const handleSaveHistoryEdit = () => {
    if (!historyEditDraft) return;
    onUpdateHistory(historyEditDraft);
    setHistoryEditOpen(false);
    setHistoryEditDraft(null);
  };

  const handleDeleteHistory = () => {
    if (!historyEditDraft) return;
    onDeleteHistory(historyEditDraft.id);
    setHistoryEditOpen(false);
    setHistoryEditDraft(null);
  };

  const handleCheckout = () => {
    if (!stopDraft) {
      setStopDialogOpen(false);
      return;
    }

    const totalCost = Math.round(stopDraft.totalCost || 0);
    const effectiveCostPerHour = getEffectiveCostPerHour(stopDraft.kind);

    const askOnStart = isAskCustomerOnStart(stopDraft.kind);
    const rawFull = (askOnStart ? stopDraft.customerFullName : customerFullName).trim();
    const full = rawFull || (matchedClient ? `${matchedClient.firstName || ''} ${matchedClient.lastName || ''}`.trim() : '');
    const parts = full.split(/\s+/).filter(Boolean);
    const firstName = (parts[0] ?? '').trim() || matchedClient?.firstName || '';
    const lastName = (parts.slice(1).join(' ') ?? '').trim() || matchedClient?.lastName || '';
    const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) : null;
    const phoneNumber = selectedClient?.phoneNumber || matchedClient?.phoneNumber || '';
    const clientCode = (selectedClient?.code || matchedClient?.code || customerCodeInput || '').trim();

    const parsedPaid = Number(String(paidAmountInput || '').replace(/,/g, ''));
    const paidAmount = paidFullyChecked ? totalCost : Math.max(0, Math.min(totalCost, Number.isFinite(parsedPaid) ? parsedPaid : 0));
    const paidFully = paidAmount >= totalCost;
    const remainingAmount = Math.max(0, totalCost - paidAmount);

    // keep session customer name updated
    if (askOnStart) {
      setSessions((prev) => ({
        ...prev,
        [stopDraft.kind]: { ...prev[stopDraft.kind], customerFullName: full },
      }));
    }

    const playersCount = sessions[stopDraft.kind]?.players?.length ?? 0;

    const item: PlayHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sessionType: 'table',
      tableKind: stopDraft.kind,
      winnerCode: (winnerCodeInput || '').trim() || undefined,
      playersCount: playersCount > 0 ? playersCount : undefined,
      // keep compatibility with existing history schema
      cardId: 0,
      cardTitle:
        language === 'fa'
          ? `میز ${getTableLabel(stopDraft.kind)}`
          : `Table ${getTableLabel(stopDraft.kind)}`,
      sessionDate: stopDraft.startedAt ?? undefined,
      startedAt: stopDraft.startedAt ?? undefined,
      stoppedAt: stopDraft.stoppedAt,
      secondsPlayed: stopDraft.elapsedSeconds,
      costPerHour: effectiveCostPerHour,
      totalCost,
      firstName,
      lastName,
      phoneNumber,
      clientCode: clientCode || undefined,
      paidAmount,
      paidFully,
      remainingAmount,
      createdAt: stopDraft.stoppedAt,
    };

    onAddHistory(item);

    reset(stopDraft.kind);
    setStopDialogOpen(false);
    setCustomerFullName('');
    setCustomerCodeInput('');
    setShowManualCodeInput(false);
    setSelectedClientId(null);
    setPaidFullyChecked(true);
    setPaidAmountInput('');
    setWinnerCodeInput('');
  };

  const renderTableCard = (kind: TableKind) => {
    const s = sessions[kind];
    const isSnooker = kind === 'snooker';
    const title = isSnooker
      ? language === 'fa'
        ? 'بیلیارد / اسنوکر'
        : 'Billiard / Snooker'
      : language === 'fa'
        ? 'ایت‌بال'
        : 'Eight Ball';

    const bgImage = isSnooker ? '/snoker.png' : '/eightball.png';

    return (
      <div
        className={`relative w-full max-w-md rounded-2xl border border-white/20 p-6 shadow-lg transition-all duration-300 overflow-hidden ${
          s.running ? 'ring-2 ring-primary/60' : ''
        }`}
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* readability overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>

        <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {language === 'fa' ? 'برای شروع، استارت را بزنید.' : 'Press start to begin.'}
            </p>
          </div>

          {s.sessionCode && (
            <button
              type="button"
              onClick={() => copyToClipboard(s.sessionCode)}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-1 text-left hover:bg-black/40 transition"
              title={language === 'fa' ? 'برای کپی کلیک کنید' : 'Click to copy'}
            >
              <div className="text-[10px] text-white/60">{language === 'fa' ? 'کد' : 'CODE'}</div>
              <div className="text-sm font-mono tracking-widest text-white">{s.sessionCode}</div>
              {copiedCode === s.sessionCode && (
                <div className="text-[10px] text-emerald-300 mt-0.5">
                  {language === 'fa' ? 'کپی شد' : 'Copied'}
                </div>
              )}
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="text-4xl font-mono font-bold text-white">{formatTime(s.elapsedSeconds)}</div>
          <div className="mt-2 text-sm text-white/70">
            {language === 'fa' ? 'مبلغ تا این لحظه:' : 'Cost so far:'} {calcCost(s.kind, s.elapsedSeconds)}
          </div>
        </div>

        {/* Players list (shown on the table card) */}
        {s.players?.length > 0 && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] tracking-wide text-white/60 mb-2">
              {language === 'fa' ? 'بازیکن‌ها' : 'PLAYERS'}
            </div>
            <div className="space-y-1">
              {s.players.map((p, idx) => (
                <div key={`${p.code}-${idx}`} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-white/90 truncate">
                    {p.fullName || (language === 'fa' ? `بازیکن ${idx + 1}` : `Player ${idx + 1}`)}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(p.code)}
                    className="shrink-0 font-mono text-xs tracking-widest text-white/90 rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
                    title={language === 'fa' ? 'برای کپی کد کلیک کنید' : 'Click to copy code'}
                  >
                    {p.code}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask customer timing (per table) */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-white/80">
            {language === 'fa' ? 'دریافت مشخصات مشتری:' : 'Ask customer info:'}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${isAskCustomerOnStart(kind) ? 'text-white/60' : 'text-emerald-300'}`}>
              {language === 'fa' ? 'هنگام توقف' : 'On stop'}
            </span>
            <Switch
              checked={isAskCustomerOnStart(kind)}
              onCheckedChange={(v) => setAskCustomerTimingFor(kind, v ? 'start' : 'stop')}
            />
            <span className={`text-xs ${isAskCustomerOnStart(kind) ? 'text-emerald-300' : 'text-white/60'}`}>
              {language === 'fa' ? 'هنگام شروع' : 'On start'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {!s.running ? (
            <Button className="flex-1" onClick={() => start(kind)}>
              <Play className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {language === 'fa' ? 'شروع' : 'Start'}
            </Button>
          ) : (
            <Button className="flex-1" variant="destructive" onClick={() => stop(kind)}>
              <Pause className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {language === 'fa' ? 'توقف' : 'Stop'}
            </Button>
          )}

          <Button
            className="whitespace-nowrap"
            variant="secondary"
            onClick={() => reset(kind)}
            disabled={s.running || (s.elapsedSeconds === 0 && !s.sessionCode)}
          >
            {language === 'fa' ? 'ریست' : 'Reset'}
          </Button>
        </div>

        {s.running && (
          <div className="mt-4 text-xs text-zinc-400">
            {language === 'fa'
              ? 'برای پایان و دریافت مبلغ، توقف را بزنید.'
              : 'Press stop to calculate and charge.'}
          </div>
        )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center py-16 gap-6">
        {/* Search like Stable page */}
        <div className="w-full max-w-6xl">
          <div className="mb-2 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={tableSearchQuery}
                  onChange={(e) => {
                    const next = e.target.value;
                    setTableSearchQuery(next);

                    // If user typed an exact code, auto-select that client so checkout saves the code
                    const q = next.trim().toUpperCase();
                    setCustomerCodeInput(q);
                    if (q) {
                      const exact = clients.find((c) => (c.code || '').trim().toUpperCase() === q);
                      if (exact) {
                        setSelectedClientId(exact.id);
                        setCustomerFullName(`${exact.firstName || ''} ${exact.lastName || ''}`.trim());
                        setCustomerCodeInput((exact.code || '').toUpperCase());
                      }
                    }
                  }}
                  placeholder={language === 'fa' ? 'جستجو...' : 'Search...'}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {/* Suggestions */}
                {tableSearchQuery.trim() && filteredClients.length > 0 && (
                  <div className="absolute z-50 mt-2 w-full rounded-lg border border-white/15 bg-black/70 backdrop-blur-lg overflow-hidden">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomerFullName(`${c.firstName || ''} ${c.lastName || ''}`.trim());
                          setCustomerCodeInput((c.code || '').toUpperCase());
                          setSelectedClientId(c.id);
                          setTableSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 transition flex items-center justify-between gap-3"
                      >
                        <span className="text-white/90 truncate">
                          {`${c.firstName || ''} ${c.lastName || ''}`.trim() || '-'}
                        </span>
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          {activeTableClientIds.has(c.id) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
                              {language === 'fa' ? 'درحال بازی' : 'Playing'}
                            </span>
                          )}
                          <span className="text-white/70 font-mono tracking-widest">{c.code || '-'}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {tableSearchQuery.trim() && filteredClients.length === 0 && (
                  <div className="absolute z-50 mt-2 w-full rounded-lg border border-white/15 bg-black/70 backdrop-blur-lg px-3 py-2 text-sm text-zinc-300">
                    {language === 'fa' ? 'موردی یافت نشد.' : 'No results.'}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-3 bg-white/5 border-white/15 text-white hover:bg-white/10"
                  onClick={() => setTableFilterOpen(true)}
                  title={language === 'fa' ? 'فیلتر' : 'Filter'}
                >
                  <Filter className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {language === 'fa' ? 'فیلتر' : 'Filter'}
                </Button>

                <Button
                  type="button"
                  variant={tableSearchQuery ? 'destructive' : 'default'}
                  className="h-10 px-3"
                  onClick={() => setTableSearchQuery('')}
                  title={language === 'fa' ? 'پاک کردن' : 'Clear'}
                >
                  {tableSearchQuery ? (
                    <>
                      <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {language === 'fa' ? 'پاک کردن' : 'Clear'}
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {language === 'fa' ? 'جستجو' : 'Search'}
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6">
          {renderTableCard('snooker')}
          {renderTableCard('eightBall')}
        </div>

        <AlertDialog open={tableFilterOpen} onOpenChange={setTableFilterOpen}>
          <AlertDialogContent className="bg-[oklch(0.18_0.01_49)] border border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>{language === 'fa' ? 'فیلتر جستجو' : 'Search Filter'}</AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                {language === 'fa'
                  ? 'تعیین کنید جستجو بر اساس کد باشد یا نام.'
                  : 'Choose searching by code and/or name.'}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-white/90">{language === 'fa' ? 'بر اساس کد' : 'By code'}</div>
                <Switch checked={tableFilterByCode} onCheckedChange={(v) => setTableFilterByCode(!!v)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-white/90">{language === 'fa' ? 'بر اساس نام' : 'By name'}</div>
                <Switch checked={tableFilterByName} onCheckedChange={(v) => setTableFilterByName(!!v)} />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 border border-white/20 text-white hover:bg-white/15">
                {language === 'fa' ? 'بستن' : 'Close'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => setTableFilterOpen(false)}>
                {language === 'fa' ? 'تایید' : 'Apply'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment history */}
        <div className="w-full max-w-6xl bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-4 mt-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h3 className="text-white font-semibold">
              {language === 'fa' ? 'تاریخچه پرداخت میز' : 'Table Payments History'}
            </h3>

            <div className="flex items-center gap-2">
              {tableDailyTotals.length > 0 && (
                <select
                  value={effectiveSelectedDay}
                  onChange={(e) => setSelectedEarningsDay(e.target.value)}
                  className="h-8 rounded-md bg-white/10 border border-white/15 text-white text-xs px-2"
                >
                  {tableDailyTotals.map((d) => (
                    <option key={d.day} value={d.day} className="bg-black">
                      {d.day}
                    </option>
                  ))}
                </select>
              )}

              <div className="text-xs text-emerald-300 whitespace-nowrap">
                {language === 'fa' ? 'درآمد روز:' : 'Day earnings:'} {selectedDayTotal.toLocaleString()}
              </div>

              <span className="text-xs text-zinc-400">{tableHistory.length}</span>
            </div>
          </div>

          {tableHistory.length === 0 ? (
            <p className="text-sm text-zinc-400">
              {language === 'fa' ? 'هنوز پرداختی ثبت نشده است.' : 'No table payments recorded yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/15 rounded-lg overflow-hidden" dir={language === 'fa' ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="text-zinc-300 bg-white/5 border-b border-white/10">
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'میز' : 'Table'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'مشتری' : 'Client'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'کد' : 'Code'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'برنده' : 'Winner'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'زمان' : 'Time'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'مبلغ' : 'Amount'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'تاریخ' : 'Date'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'وضعیت' : 'Status'}</th>
                    <th className={`${language === 'fa' ? 'text-left' : 'text-right'} py-2 px-3`}>{language === 'fa' ? 'ویرایش' : 'Edit'}</th>
                    <th className={`${language === 'fa' ? 'text-left' : 'text-right'} py-2 px-3`}>{language === 'fa' ? '!' : '!'}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableHistory.slice(0, 50).map((h) => {
                    const name = `${h.firstName || ''} ${h.lastName || ''}`.trim();
                    const clientCode =
                      (h.clientCode && h.clientCode.trim().length > 0)
                        ? h.clientCode
                        : h.phoneNumber && h.phoneNumber.trim().length > 0
                          ? (clients.find((c) => (c.phoneNumber || '').trim() === h.phoneNumber.trim())?.code ?? '-')
                          : '-';
                    return (
                      <tr key={h.id} className="border-b border-white/10 last:border-0 text-white/90">
                        <td className="py-2 px-3 whitespace-nowrap">{getTableLabel(h.tableKind)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{name || '-'}</td>
                        <td className="py-2 px-3 whitespace-nowrap font-mono tracking-widest">
                          {clientCode && clientCode !== '-' ? (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(clientCode)}
                              className="hover:underline underline-offset-4"
                              title={language === 'fa' ? 'برای کپی کلیک کنید' : 'Click to copy'}
                            >
                              {clientCode}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-mono tracking-widest">
                          {h.winnerCode ? (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(h.winnerCode)}
                              className="hover:underline underline-offset-4"
                              title={language === 'fa' ? 'برای کپی کلیک کنید' : 'Click to copy'}
                            >
                              {h.winnerCode}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-mono">{formatTime(h.secondsPlayed || 0)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{Math.round(h.paidAmount || h.totalCost || 0).toLocaleString()}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-zinc-300">{formatHistoryDate(h.stoppedAt || h.createdAt)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {h.paidFully ? (
                            <span className="text-emerald-300 text-xs">{language === 'fa' ? 'کامل' : 'Full'}</span>
                          ) : (
                            <span className="text-amber-300 text-xs">{language === 'fa' ? `نیمه (${(h.remainingAmount || 0).toLocaleString()})` : `Partial (${(h.remainingAmount || 0).toLocaleString()})`}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className={`${language === 'fa' ? 'text-left' : 'text-right'}`}>
                            <button
                              type="button"
                              onClick={() => openHistoryEdit(h)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                              title={language === 'fa' ? 'ویرایش' : 'Edit'}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {typeof h.playersCount === 'number' && h.playersCount > 0 ? (
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/15 bg-white/5 text-white/90 ${
                                language === 'fa' ? 'ml-0' : ''
                              }`}
                              title={language === 'fa' ? `تعداد بازیکن‌ها: ${h.playersCount}` : `Players: ${h.playersCount}`}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="text-white/30">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {tableHistory.length > 50 && (
                <p className="mt-2 text-xs text-zinc-400">
                  {language === 'fa' ? 'نمایش ۵۰ رکورد آخر' : 'Showing latest 50 records'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Start dialog (when asking customer info on start) */}
      <AlertDialog
       open={startDialogOpen}
       onOpenChange={(open) => {
         setStartDialogOpen(open);
         if (!open) {
           setStartDraft(null);
           setPlayersCountInput('');
           setStartPlayers([]);
         }
       }}
     >
        <AlertDialogContent className="bg-[oklch(0.18_0.01_49)] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'fa' ? 'شروع میز' : 'Start Table'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {language === 'fa'
                ? 'تعداد بازیکن‌ها را وارد کنید و نام آن‌ها را بنویسید. کد جلسه هم نمایش داده می‌شود.'
                : 'Enter number of players and their names. Session code is shown below.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {startDraft?.sessionCode ? (
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(startDraft.sessionCode)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10 transition"
                  title={language === 'fa' ? 'برای کپی کد کلیک کنید' : 'Click to copy code'}
                >
                  <div className="text-[10px] text-white/60">{language === 'fa' ? 'کد' : 'CODE'}</div>
                  <div className="text-base font-mono tracking-widest text-white">{startDraft.sessionCode}</div>
                  {copiedCode === startDraft.sessionCode && (
                    <div className="text-[10px] text-emerald-300 mt-0.5">{language === 'fa' ? 'کپی شد' : 'Copied'}</div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualCodeInput((p) => !p)}
                  className="w-10 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
                  title={language === 'fa' ? 'ویرایش کد مشتری' : 'Edit client code'}
                >
                  <Pencil className="w-4 h-4 text-white/80" />
                </button>
              </div>
            ) : null}

            <label className="block text-sm text-white/80">
              {language === 'fa' ? 'تعداد بازیکن‌ها' : 'How many players'}
            </label>
            <input
              inputMode="numeric"
              value={playersCountInput}
              onChange={(e) => {
                const raw = e.target.value;
                // keep only digits
                const digitsOnly = raw.replace(/[^0-9]/g, '');
                setPlayersCountInput(digitsOnly);
                const n = clampPlayerCount(Number(digitsOnly || 0));
                syncPlayersToCount(n);
              }}
              placeholder={language === 'fa' ? 'مثلا 3' : 'e.g. 3'}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {startPlayers.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-white/60">
                  {language === 'fa' ? 'نام هر بازیکن و کد کنار آن:' : 'Each player name + code:'}
                </div>
                {startPlayers.map((p, idx) => (
                  <div key={p.code} className="flex items-center gap-2">
                    <input
                      value={p.fullName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setStartPlayers((prev) => prev.map((x, i) => (i === idx ? { ...x, fullName: v } : x)));
                      }}
                      placeholder={language === 'fa' ? `بازیکن ${idx + 1} - نام و نام خانوادگی` : `Player ${idx + 1} - full name`}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    <button
                      type="button"
                      onClick={() => copyToClipboard(p.code)}
                      className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition"
                      title={language === 'fa' ? 'برای کپی کد کلیک کنید' : 'Click to copy code'}
                    >
                      <div className="text-[10px] text-white/60">{language === 'fa' ? 'کد' : 'CODE'}</div>
                      <div className="text-sm font-mono tracking-widest text-white">{p.code}</div>
                      {copiedCode === p.code && (
                        <div className="text-[10px] text-emerald-300 mt-0.5">
                          {language === 'fa' ? 'کپی شد' : 'Copied'}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* (kept) optional manual client code input for existing client selection */}
            {showManualCodeInput && (
              <input
                value={customerCodeInput}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setCustomerCodeInput(v);
                  const exact = clients.find((c) => (c.code || '').trim().toUpperCase() === v.trim());
                  if (exact) {
                    setSelectedClientId(exact.id);
                    setCustomerFullName(`${exact.firstName || ''} ${exact.lastName || ''}`.trim());
                  }
                }}
                placeholder={language === 'fa' ? 'کد مشتری (اختیاری) - مثال: A1' : 'Client code (optional) - e.g. A1'}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
              />
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border border-white/20 text-white hover:bg-white/15">
              {language === 'fa' ? 'بستن' : 'Close'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!startDraft) {
                  setStartDialogOpen(false);
                  return;
                }

                const { kind, sessionCode, startedAt } = startDraft;

                const players = startPlayers
                  .map((p) => ({ ...p, fullName: (p.fullName || '').trim() }))
                  .filter((p) => p.fullName.length > 0);

                // keep single-name field populated (for existing checkout/history)
                const name = (players[0]?.fullName || '').trim();

                setSessions((prev) => {
                  const c = prev[kind];
                  return {
                    ...prev,
                    [kind]: {
                      ...c,
                      running: true,
                      sessionCode,
                      startedAt,
                      players,
                      customerFullName: name,
                      customerClientId: selectedClientId,
                    },
                  };
                });

                setStartDialogOpen(false);
                setStartDraft(null);
                setPlayersCountInput('');
                setStartPlayers([]);
                startTimerInternal(kind);
              }}
            >
              {language === 'fa' ? 'شروع' : 'Start'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit table history item */}
      <AlertDialog open={historyEditOpen} onOpenChange={setHistoryEditOpen}>
        <AlertDialogContent className="bg-[oklch(0.18_0.01_49)] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'fa' ? 'ویرایش تاریخچه پرداخت میز' : 'Edit table payment'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {historyEditDraft?.stoppedAt
                ? formatHistoryDate(historyEditDraft.stoppedAt)
                : historyEditDraft?.createdAt
                  ? formatHistoryDate(historyEditDraft.createdAt)
                  : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {historyEditDraft && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={historyEditDraft.firstName || ''}
                  onChange={(e) =>
                    setHistoryEditDraft((prev) => (prev ? { ...prev, firstName: e.target.value } : prev))
                  }
                  placeholder={language === 'fa' ? 'نام' : 'First name'}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={historyEditDraft.lastName || ''}
                  onChange={(e) =>
                    setHistoryEditDraft((prev) => (prev ? { ...prev, lastName: e.target.value } : prev))
                  }
                  placeholder={language === 'fa' ? 'نام خانوادگی' : 'Last name'}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <input
                value={historyEditDraft.clientCode || ''}
                onChange={(e) =>
                  setHistoryEditDraft((prev) => (prev ? { ...prev, clientCode: e.target.value.toUpperCase() } : prev))
                }
                placeholder={language === 'fa' ? 'کد مشتری' : 'Client code'}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
              />

              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-sm text-white/90">{language === 'fa' ? 'پرداخت کامل؟' : 'Paid fully?'}</div>
                <Switch
                  checked={!!historyEditDraft.paidFully}
                  onCheckedChange={(v) =>
                    setHistoryEditDraft((prev) => {
                      if (!prev) return prev;
                      const total = Math.round(prev.totalCost || 0);
                      const paidFully = !!v;
                      const paidAmount = paidFully ? total : Math.min(Math.round(prev.paidAmount || 0), total);
                      const remainingAmount = paidFully ? 0 : Math.max(0, total - paidAmount);
                      return { ...prev, paidFully, paidAmount, remainingAmount };
                    })
                  }
                />
              </div>

              {!historyEditDraft.paidFully && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={String(historyEditDraft.paidAmount ?? 0)}
                    onChange={(e) => {
                      const n = Number(String(e.target.value || '').replace(/,/g, ''));
                      setHistoryEditDraft((prev) => {
                        if (!prev) return prev;
                        const total = Math.round(prev.totalCost || 0);
                        const paidAmount = Math.max(0, Math.min(total, Number.isFinite(n) ? n : 0));
                        const remainingAmount = Math.max(0, total - paidAmount);
                        return { ...prev, paidAmount, remainingAmount };
                      });
                    }}
                    placeholder={language === 'fa' ? 'مبلغ پرداختی' : 'Paid amount'}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    value={String(historyEditDraft.remainingAmount ?? 0)}
                    readOnly
                    placeholder={language === 'fa' ? 'باقی‌مانده' : 'Remaining'}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80"
                  />
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <Button type="button" variant="destructive" onClick={handleDeleteHistory} disabled={!historyEditDraft}>
              <Trash2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {language === 'fa' ? 'حذف' : 'Delete'}
            </Button>
            <AlertDialogCancel
              className="bg-white/10 border border-white/20 text-white hover:bg-white/15"
              onClick={() => {
                setHistoryEditOpen(false);
                setHistoryEditDraft(null);
              }}
            >
              {language === 'fa' ? 'بستن' : 'Close'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveHistoryEdit} disabled={!historyEditDraft}>
              {language === 'fa' ? 'ذخیره' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <AlertDialogContent className="bg-[oklch(0.18_0.01_49)] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'fa' ? 'پرداخت میز' : 'Table Checkout'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {stopDraft
                ? language === 'fa'
                  ? `زمان: ${formatTime(stopDraft.elapsedSeconds)} — مبلغ: ${stopDraft.totalCost}`
                  : `Time: ${formatTime(stopDraft.elapsedSeconds)} — Amount: ${stopDraft.totalCost}`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <label className="block text-sm text-white/80">
              {language === 'fa' ? 'نام و نام خانوادگی' : 'Full name'}
            </label>

            <input
              value={customerFullName}
              onChange={(e) => setCustomerFullName(e.target.value)}
              placeholder={language === 'fa' ? 'نام و نام خانوادگی' : 'Full name'}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={stopDraft ? isAskCustomerOnStart(stopDraft.kind) : false}
            />

            <div className="flex items-center justify-between">
              <label className="block text-sm text-white/80">
                {language === 'fa' ? 'کد مشتری' : 'Client code'}
              </label>
              <button
                type="button"
                onClick={() => setShowManualCodeInput((p) => !p)}
                className="text-xs text-white/80 hover:text-white underline-offset-4 hover:underline"
              >
                {showManualCodeInput
                  ? language === 'fa'
                    ? 'بستن'
                    : 'Hide'
                  : language === 'fa'
                    ? 'ثبت کد'
                    : 'Enter code'}
              </button>
            </div>

            {showManualCodeInput && (
              <input
                value={customerCodeInput}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setCustomerCodeInput(v);
                  const exact = clients.find((c) => (c.code || '').trim().toUpperCase() === v.trim());
                  if (exact) {
                    setSelectedClientId(exact.id);
                    if (stopDraft && !isAskCustomerOnStart(stopDraft.kind)) {
                      setCustomerFullName(`${exact.firstName || ''} ${exact.lastName || ''}`.trim());
                    }
                  }
                }}
                placeholder={language === 'fa' ? 'مثال: A1' : 'e.g. A1'}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
              />
            )}

            {/* Winner */}
            {stopDraft && sessions[stopDraft.kind]?.players?.length > 0 && (
              <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-sm text-white/90">
                  {language === 'fa' ? 'برنده کیست؟ (کد)' : 'Who wins? (code)'}
                </div>

                <select
                  value={winnerCodeInput}
                  onChange={(e) => setWinnerCodeInput(e.target.value)}
                  className="h-10 w-full rounded-lg bg-white/10 border border-white/20 text-white text-sm px-3"
                >
                  <option value="" className="bg-black">
                    {language === 'fa' ? 'انتخاب کنید' : 'Select winner'}
                  </option>
                  {sessions[stopDraft.kind].players.map((p, idx) => (
                    <option key={`${p.code}-${idx}`} value={p.code} className="bg-black">
                      {p.code} — {p.fullName || (language === 'fa' ? `بازیکن ${idx + 1}` : `Player ${idx + 1}`)}
                    </option>
                  ))}
                </select>

                {winnerCodeInput && (
                  <div className="text-xs text-white/70">
                    {language === 'fa' ? 'کد برنده:' : 'Winner code:'}{' '}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(winnerCodeInput)}
                      className="font-mono tracking-widest hover:underline underline-offset-4"
                      title={language === 'fa' ? 'برای کپی کلیک کنید' : 'Click to copy'}
                    >
                      {winnerCodeInput}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payment status */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-sm text-white/90">{language === 'fa' ? 'پرداخت کامل؟' : 'Paid fully?'}</div>
              <Switch checked={paidFullyChecked} onCheckedChange={(v) => {
                setPaidFullyChecked(!!v);
                if (!!v && stopDraft) setPaidAmountInput(String(Math.round(stopDraft.totalCost || 0)));
              }} />
            </div>

            {!paidFullyChecked && (
              <div className="space-y-2">
                <label className="block text-sm text-white/80">
                  {language === 'fa' ? 'مبلغ پرداختی' : 'Paid amount'}
                </label>
                <input
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  placeholder={language === 'fa' ? 'مثال: 100000' : 'Example: 100000'}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {stopDraft && (
                  <div className="text-xs text-white/70">
                    {language === 'fa' ? 'باقی‌مانده:' : 'Remaining:'}{' '}
                    {Math.max(0, Math.round(stopDraft.totalCost || 0) - Math.max(0, Number(String(paidAmountInput || '').replace(/,/g, '')) || 0)).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {matchedClient && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-sm text-white">
                  {language === 'fa' ? 'مشتری ثبت‌شده:' : 'Saved client:'} {matchedClient.firstName} {matchedClient.lastName}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-white/70">
                  {matchedClient.code ? (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(matchedClient.code)}
                      className="font-mono tracking-widest hover:underline underline-offset-4"
                      title={language === 'fa' ? 'برای کپی کد کلیک کنید' : 'Click to copy code'}
                    >
                      {language === 'fa' ? 'کد:' : 'Code:'} {matchedClient.code}
                    </button>
                  ) : null}
                  {matchedClient.phoneNumber ? (
                    <span>
                      {language === 'fa' ? 'تلفن:' : 'Phone:'} {matchedClient.phoneNumber}
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {stopDraft && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <div className="text-sm text-white">
                  {language === 'fa' ? 'مبلغ قابل پرداخت:' : 'Amount to pay:'} {stopDraft.totalCost}
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border border-white/20 text-white hover:bg-white/15">
              {language === 'fa' ? 'بستن' : 'Close'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckout}>
              {language === 'fa' ? 'تسویه' : 'Checkout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
