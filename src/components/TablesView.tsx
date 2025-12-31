'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayHistoryItem } from '@/data/timerStore';
import { Play, Pause, Search, X, Filter } from 'lucide-react';
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

type TableKind = 'snooker' | 'eightBall';

type TableSession = {
  kind: TableKind;
  running: boolean;
  elapsedSeconds: number;
  sessionCode: string | null;
  startedAt: string | null;
  customerFullName: string;
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
  history,
  onAddHistory,
}: {
  language: 'fa' | 'en';
  clients: TablesViewClient[];
  costPerHour: number;
  history: PlayHistoryItem[];
  onAddHistory: (item: PlayHistoryItem) => void;
}) {
  const [sessions, setSessions] = useState<Record<TableKind, TableSession>>({
    snooker: {
      kind: 'snooker',
      running: false,
      elapsedSeconds: 0,
      sessionCode: null,
      startedAt: null,
      customerFullName: '',
    },
    eightBall: {
      kind: 'eightBall',
      running: false,
      elapsedSeconds: 0,
      sessionCode: null,
      startedAt: null,
      customerFullName: '',
    },
  });

  const intervalIds = useRef<Record<TableKind, number | null>>({
    snooker: null,
    eightBall: null,
  });

  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [stopDraft, setStopDraft] = useState<StopDraft | null>(null);

  // Ask customer info timing
  const [askCustomerOnStart, setAskCustomerOnStart] = useState(false);

  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [startDraft, setStartDraft] = useState<{ kind: TableKind; sessionCode: string; startedAt: string } | null>(
    null,
  );

  // Top search (like stable page)
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableFilterOpen, setTableFilterOpen] = useState(false);
  const [tableFilterByCode, setTableFilterByCode] = useState(true);
  const [tableFilterByName, setTableFilterByName] = useState(false);

  // Table checkout customer info
  const [customerFullName, setCustomerFullName] = useState('');
  const [paidFullyChecked, setPaidFullyChecked] = useState(true);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
          return code.includes(q);
        }

        return matchesCode || matchesName;
      })
      .slice(0, 8);
  }, [clients, tableSearchQuery, tableFilterByCode, tableFilterByName]);

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

  const calcCost = (elapsedSeconds: number) => {
    const hours = elapsedSeconds / 3600;
    const cost = hours * (Number.isFinite(costPerHour) ? costPerHour : 0);
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

    if (askCustomerOnStart) {
      // Open popup to capture name and show code before starting
      setCustomerFullName(current.customerFullName || '');
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
    const totalCost = calcCost(current.elapsedSeconds);
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

    // Prefill name if we already have one (from start popup or from search)
    if (askCustomerOnStart) {
      setCustomerFullName(current.customerFullName || '');
    } else {
      setCustomerFullName((prev) => prev || current.customerFullName || '');
    }

    // Payment defaults
    setPaidFullyChecked(true);
    setPaidAmountInput(String(totalCost));

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
      [kind]: { kind, running: false, elapsedSeconds: 0, sessionCode: null, startedAt: null, customerFullName: '' },
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

  const handleCheckout = () => {
    if (!stopDraft) {
      setStopDialogOpen(false);
      return;
    }

    const totalCost = Math.round(stopDraft.totalCost || 0);

    const rawFull = (askCustomerOnStart ? stopDraft.customerFullName : customerFullName).trim();
    const full = rawFull || (matchedClient ? `${matchedClient.firstName || ''} ${matchedClient.lastName || ''}`.trim() : '');
    const parts = full.split(/\s+/).filter(Boolean);
    const firstName = (parts[0] ?? '').trim() || matchedClient?.firstName || '';
    const lastName = (parts.slice(1).join(' ') ?? '').trim() || matchedClient?.lastName || '';
    const phoneNumber = matchedClient?.phoneNumber || '';
    const clientCode = matchedClient?.code || '';

    const parsedPaid = Number(String(paidAmountInput || '').replace(/,/g, ''));
    const paidAmount = paidFullyChecked ? totalCost : Math.max(0, Math.min(totalCost, Number.isFinite(parsedPaid) ? parsedPaid : 0));
    const paidFully = paidAmount >= totalCost;
    const remainingAmount = Math.max(0, totalCost - paidAmount);

    // keep session customer name updated
    if (askCustomerOnStart) {
      setSessions((prev) => ({
        ...prev,
        [stopDraft.kind]: { ...prev[stopDraft.kind], customerFullName: full },
      }));
    }

    const item: PlayHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sessionType: 'table',
      tableKind: stopDraft.kind,
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
      costPerHour,
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
    setPaidFullyChecked(true);
    setPaidAmountInput('');
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
            {language === 'fa' ? 'مبلغ تا این لحظه:' : 'Cost so far:'} {calcCost(s.elapsedSeconds)}
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
                  onChange={(e) => setTableSearchQuery(e.target.value)}
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
                          setTableSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 transition flex items-center justify-between gap-3"
                      >
                        <span className="text-white/90 truncate">
                          {`${c.firstName || ''} ${c.lastName || ''}`.trim() || '-'}
                        </span>
                        <span className="text-white/70 font-mono tracking-widest whitespace-nowrap">{c.code || '-'}</span>
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

            {/* Toggle: ask customer on start vs stop */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/80">
                {language === 'fa' ? 'دریافت مشخصات مشتری:' : 'Ask customer info:'}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${askCustomerOnStart ? 'text-white/60' : 'text-emerald-300'}`}>
                  {language === 'fa' ? 'هنگام توقف' : 'On stop'}
                </span>
                <Switch checked={askCustomerOnStart} onCheckedChange={(v) => setAskCustomerOnStart(!!v)} />
                <span className={`text-xs ${askCustomerOnStart ? 'text-emerald-300' : 'text-white/60'}`}>
                  {language === 'fa' ? 'هنگام شروع' : 'On start'}
                </span>
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
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'زمان' : 'Time'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'مبلغ' : 'Amount'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'تاریخ' : 'Date'}</th>
                    <th className={`${language === 'fa' ? 'text-right' : 'text-left'} py-2 px-3`}>{language === 'fa' ? 'وضعیت' : 'Status'}</th>
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
      <AlertDialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <AlertDialogContent className="bg-[oklch(0.18_0.01_49)] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'fa' ? 'شروع میز' : 'Start Table'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {language === 'fa'
                ? 'نام مشتری را وارد کنید. کد جلسه هم نمایش داده می‌شود.'
                : 'Enter customer name. Session code is shown below.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {startDraft?.sessionCode ? (
              <button
                type="button"
                onClick={() => copyToClipboard(startDraft.sessionCode)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10 transition"
                title={language === 'fa' ? 'برای کپی کد کلیک کنید' : 'Click to copy code'}
              >
                <div className="text-[10px] text-white/60">{language === 'fa' ? 'کد' : 'CODE'}</div>
                <div className="text-base font-mono tracking-widest text-white">{startDraft.sessionCode}</div>
                {copiedCode === startDraft.sessionCode && (
                  <div className="text-[10px] text-emerald-300 mt-0.5">{language === 'fa' ? 'کپی شد' : 'Copied'}</div>
                )}
              </button>
            ) : null}

            <label className="block text-sm text-white/80">
              {language === 'fa' ? 'نام و نام خانوادگی' : 'Full name'}
            </label>
            <input
              value={customerFullName}
              onChange={(e) => setCustomerFullName(e.target.value)}
              placeholder={language === 'fa' ? 'نام و نام خانوادگی' : 'Full name'}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
                const name = customerFullName.trim();

                setSessions((prev) => {
                  const c = prev[kind];
                  return {
                    ...prev,
                    [kind]: {
                      ...c,
                      running: true,
                      sessionCode,
                      startedAt,
                      customerFullName: name,
                    },
                  };
                });

                setStartDialogOpen(false);
                setStartDraft(null);
                startTimerInternal(kind);
              }}
            >
              {language === 'fa' ? 'شروع' : 'Start'}
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
              disabled={askCustomerOnStart}
            />

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
