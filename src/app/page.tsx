'use client';

import { Button } from "@/components/ui/button";
import { Plus, X, Play, Pause, RotateCcw, Pencil, Trash2, Search, Copy } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { numberToWords } from "@/utils/numberToWords";
import { convertToEnglishDigits, formatNumberLocale } from "@/utils/formatNumber";
interface GameCard {
  id: number;
  title: string;
  time: number;
  isRunning: boolean;
  startedAt?: string;
  stoppedAt?: string;
  totalCost?: number;
  date?: string;
}
type PlayHistoryItem = {
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

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  code: string;
  createdAt: string;
}

export default function Home() {
  const {
    t,
    language
  } = useLanguage();
  const [cards, setCards] = useState<GameCard[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [showCodeDialogOpen, setShowCodeDialogOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [generatedCode, setGeneratedCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [filteredCards, setFilteredCards] = useState<GameCard[] | null>(null);
  const [lastAddedCardId, setLastAddedCardId] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [newCardDate, setNewCardDate] = useState<Date | undefined>(new Date());
  const [gameCenterName, setGameCenterName] = useState<string>('');
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [stoppedCardDraft, setStoppedCardDraft] = useState<{
    cardId: number;
    cardTitle: string;
    startedAt?: string;
    stoppedAt: string;
    secondsPlayed: number;
    totalCost: number;
    costPerHour: number;
    sessionDate?: string;
  } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [paidFully, setPaidFully] = useState(true);
  const [remainingAmount, setRemainingAmount] = useState<string>("");
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const intervalIds = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  const [historyEditOpen, setHistoryEditOpen] = useState(false);
  const [historyEditDraft, setHistoryEditDraft] = useState<PlayHistoryItem | null>(null);

  const stopDialogDefaultPaidRef = useRef<string | null>(null);

  const applyCustomerToForm = (c: { firstName: string; lastName: string; phoneNumber: string }) => {
    setFirstName(c.firstName || '');
    setLastName(c.lastName || '');
    setPhoneNumber(c.phoneNumber || '');
  };

  useEffect(() => {
    const savedName = localStorage.getItem('gameCenterName');
    if (savedName) setGameCenterName(savedName);

    const handleNameChange = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setGameCenterName(custom.detail || localStorage.getItem('gameCenterName') || '');
    };
    window.addEventListener('gameCenterNameChange', handleNameChange);

    const savedCards = localStorage.getItem('gameCards');
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    }
    const savedHistory = localStorage.getItem('playHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        setHistory([]);
      }
    }
    const savedClients = localStorage.getItem('gameClients');
    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch {
        setClients([]);
      }
    }
    return () => {
      window.removeEventListener('gameCenterNameChange', handleNameChange);
    };
  }, []);
  useEffect(() => {
    localStorage.setItem('gameCards', JSON.stringify(cards));
  }, [cards]);
  useEffect(() => {
    localStorage.setItem('playHistory', JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    localStorage.setItem('gameClients', JSON.stringify(clients));
  }, [clients]);

  const generateClientCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 2; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddNewClient = () => {
    const code = generateClientCode();
    setGeneratedCode(code);
    
    const newClient: Client = {
        id: Date.now().toString(),
        firstName: newClientData.firstName,
        lastName: newClientData.lastName,
        phoneNumber: newClientData.phoneNumber,
        code: code,
        createdAt: new Date().toISOString()
    };
    
    setClients(prev => [...prev, newClient]);
    setAddClientDialogOpen(false);
    setShowCodeDialogOpen(true);
    
    // Also create a card for them
    const newCard: GameCard = {
      id: Date.now(),
      title: `${newClient.firstName} ${newClient.lastName}`,
      time: 0,
      isRunning: false,
      date: new Date().toISOString()
    };
    setCards(prev => [...prev, newCard]);
    setLastAddedCardId(newCard.id); // Store the ID of the newly created card
    
    // Reset form
    setNewClientData({ firstName: '', lastName: '', phoneNumber: '' });
  };

  const handleSaveAndStartSession = () => {
    setShowCodeDialogOpen(false);
    if (lastAddedCardId) {
        toggleTimer(lastAddedCardId);
        setLastAddedCardId(null);
    }
  };

  // Live search effect
  useEffect(() => {
    const query = searchCode.trim();
    if (!query) {
      setFilteredCards(null);
      return;
    }

    const matchingClients = clients.filter(c => 
      c.code.toLowerCase().includes(query.toLowerCase())
    );

    if (matchingClients.length > 0) {
      const clientNames = matchingClients.map(c => `${c.firstName} ${c.lastName}`);
      const matchingCards = cards.filter(c => clientNames.includes(c.title));
      setFilteredCards(matchingCards);
    } else {
      setFilteredCards([]);
    }
  }, [searchCode, clients, cards]);


  // Auto-fill "Paid amount" with the calculated cost when stop dialog opens.
  // If user edits the field manually, we don't overwrite it.
  useEffect(() => {
    if (!stopDialogOpen || !stoppedCardDraft) return;

    const totalCostRounded = Math.round(stoppedCardDraft.totalCost || 0);
    const defaultPaid = String(totalCostRounded);

    stopDialogDefaultPaidRef.current = defaultPaid;
    setPaidAmount(prev => (prev && prev.trim().length > 0 ? prev : defaultPaid));

    // Auto-fill client details if card title matches a client
    const foundClient = clients.find(c => `${c.firstName} ${c.lastName}` === stoppedCardDraft.cardTitle);
    if (foundClient) {
        setFirstName(foundClient.firstName);
        setLastName(foundClient.lastName);
        setPhoneNumber(foundClient.phoneNumber || '');
    }
  }, [stopDialogOpen, stoppedCardDraft, clients]);
  const resetStopDialogForm = () => {
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setPaidAmount('');
    setPaidFully(true);
    setRemainingAmount('');
  };
  const saveStoppedSessionToHistory = () => {
    if (!stoppedCardDraft) return;
    const totalCost = stoppedCardDraft.totalCost;
    const paid = Math.max(0, parseFloat(paidAmount || '0') || 0);
    const remaining = paidFully ? Math.max(0, totalCost - paid) : Math.max(0, parseFloat(remainingAmount || '0') || 0);
    const item: PlayHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      cardId: stoppedCardDraft.cardId,
      cardTitle: stoppedCardDraft.cardTitle,
      sessionDate: stoppedCardDraft.sessionDate,
      startedAt: stoppedCardDraft.startedAt,
      stoppedAt: stoppedCardDraft.stoppedAt,
      secondsPlayed: stoppedCardDraft.secondsPlayed,
      costPerHour: stoppedCardDraft.costPerHour,
      totalCost,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      paidAmount: paid,
      paidFully,
      remainingAmount: remaining,
      createdAt: new Date().toISOString()
    };
    setHistory(prev => [item, ...prev]);
    setStopDialogOpen(false);
    setStoppedCardDraft(null);
    resetStopDialogForm();
  };
  const addCard = () => {
    const newCard: GameCard = {
      id: Date.now(),
      title: t('home.untitledGame'),
      time: 0,
      isRunning: false,
      date: newCardDate ? newCardDate.toISOString() : undefined
    };
    setCards([...cards, newCard]);
  };
  const removeCard = (id: number) => {
    setCards(cards.filter(card => card.id !== id));
  };
  const handleDoubleClick = (card: GameCard) => {
    setEditingCard(card.id);
    setTitleInput(card.title);
    setDialogOpen(true);
  };
  const handleSaveTitle = () => {
    if (editingCard) {
      setCards(cards.map(card => card.id === editingCard ? {
        ...card,
        title: titleInput
      } : card));
    }
    setDialogOpen(false);
    setEditingCard(null);
    setTitleInput("");
  };
  const toggleTimer = (id: number) => {
    const costPerHour = parseFloat(localStorage.getItem('costPerHour') || '0');
    setCards(cards.map(card => {
      if (card.id !== id) return card;
      if (!card.isRunning) {
        const interval = setInterval(() => {
          setCards(prev => prev.map(c => {
            if (c.id === id && c.isRunning) {
              const newTime = c.time + 1;
              const totalCost = costPerHour > 0 ? newTime / 3600 * costPerHour : 0;
              return {
                ...c,
                time: newTime,
                totalCost
              };
            }
            return c;
          }));
        }, 1000);
        intervalIds.current[id] = interval;
        return {
          ...card,
          isRunning: true,
          startedAt: new Date().toISOString()
        };
      }
      const interval = intervalIds.current[id];
      if (interval) {
        clearInterval(interval);
        delete intervalIds.current[id];
      }
      const stoppedAt = new Date().toISOString();
      const totalCost = costPerHour > 0 ? card.time / 3600 * costPerHour : 0;
      setStoppedCardDraft({
        cardId: card.id,
        cardTitle: card.title,
        startedAt: card.startedAt,
        stoppedAt,
        secondsPlayed: card.time,
        totalCost,
        costPerHour,
        sessionDate: card.date
      });
      setStopDialogOpen(true);
      resetStopDialogForm();
      return {
        ...card,
        isRunning: false,
        stoppedAt,
        totalCost
      };
    }));
  };

  const restartTimer = (id: number) => {
    setCards(prev =>
      prev.map(card => {
        if (card.id !== id) return card;
        const interval = intervalIds.current[id];
        if (interval) {
          clearInterval(interval);
          delete intervalIds.current[id];
        }
        return {
          ...card,
          time: 0,
          totalCost: 0,
          isRunning: false,
          startedAt: undefined,
          stoppedAt: undefined,
        };
      })
    );
  };

  const resumeTimer = (id: number) => {
    const costPerHour = parseFloat(localStorage.getItem('costPerHour') || '0');

    // avoid creating multiple intervals
    if (intervalIds.current[id]) return;

    const interval = setInterval(() => {
      setCards(prev =>
        prev.map(c => {
          if (c.id === id && c.isRunning) {
            const newTime = c.time + 1;
            const totalCost = costPerHour > 0 ? (newTime / 3600) * costPerHour : 0;
            return { ...c, time: newTime, totalCost };
          }
          return c;
        })
      );
    }, 1000);

    intervalIds.current[id] = interval;

    setCards(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          isRunning: true,
          stoppedAt: undefined,
          // don't reset time; continue
        };
      })
    );
  };
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openHistoryEdit = (item: PlayHistoryItem) => {
    setHistoryEditDraft({ ...item });
    setHistoryEditOpen(true);
  };

  const saveHistoryEdit = () => {
    if (!historyEditDraft) return;
    setHistory(prev => prev.map(h => (h.id === historyEditDraft.id ? historyEditDraft : h)));
    setHistoryEditOpen(false);
    setHistoryEditDraft(null);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    setHistoryEditOpen(false);
    setHistoryEditDraft(null);
  };

  const formatSelectedDateLabel = (d?: Date) => {
    const date = d ?? new Date();
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return language === 'fa' ? 'امروز' : 'Today';

    const locale = language === 'fa' ? 'fa-IR-u-ca-persian' : undefined;
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };
  return <div className="min-h-screen bg-transparent text-foreground animate-in fade-in duration-500 pt-24">
      {}
      <div className="mx-auto w-[80%]">
        {}
        <div className="fixed top-28 right-[10%] z-40 rtl:right-auto rtl:left-[10%] animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
        <Button onClick={() => setAddClientDialogOpen(true)} size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('home.addNewCard')}
        </Button>
      </div>

        {}
        <div className="flex min-h-screen flex-col items-center justify-center py-16 gap-8">
          
          {/* Search Box */}
          <div className="w-full max-w-md flex items-center gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="flex-1 px-4 py-2 rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={() => setSearchCode('')} className="whitespace-nowrap" variant={searchCode ? "destructive" : "default"}>
              {searchCode ? <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" /> : <Search className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />}
              {searchCode ? t('home.cancel') : t('home.search')}
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-center">
        {(filteredCards ?? cards).map(card => {
            const client = clients.find(c => `${c.firstName} ${c.lastName}` === card.title);
            return (
        <div key={card.id} className="relative w-80 h-60 bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group animate-in fade-in zoom-in-95 duration-500" onDoubleClick={() => handleDoubleClick(card)}>
            {/* Client Code Display */}
            {client && (
              <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/60 font-mono tracking-widest border border-white/5 z-20">
                {client.code}
              </div>
            )}

            {}
            <button onClick={e => {
              e.stopPropagation();
              removeCard(card.id);
            }} className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 z-10">
              <X className="w-3 h-3 text-white" />
            </button>

            <div className="flex flex-col h-full justify-between">
              <div>
                <h3 className="text-xl font-semibold truncate text-white">{card.title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{t('home.doubleClick')}</p>
              </div>

              <div className="space-y-4">
                {}
                <div className="text-center">
                  <p className="text-4xl font-mono font-bold text-white">{formatTime(card.time)}</p>
                </div>

                {}
                <div className="flex w-full gap-2">
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      toggleTimer(card.id);
                    }}
                    className="w-[70%]"
                    variant={card.isRunning ? "destructive" : "default"}
                  >
                    {card.isRunning ? <>
                        <Pause className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {t('home.stop')}
                      </> : <>
                        <Play className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {t('home.start')}
                      </>}
                  </Button>

                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      restartTimer(card.id);
                    }}
                    className="w-[30%]"
                    variant="outline"
                    title={language === 'fa' ? 'ریست' : 'Restart'}
                    aria-label={language === 'fa' ? 'ریست' : 'Restart'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
         );
        })}
        
        {cards.length === 0 && <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 sm:text-8xl md:text-9xl">
              {gameCenterName || t('nav.gameCenter') || t('home.title')}
            </h1>

          </div>}
          </div>

          {}
          {(() => {
            const HistoryBox = (
              <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-4 flex-1">
                {(() => {
              const selectedDay = newCardDate ?? new Date();
              const sameDay = (iso?: string) => {
                if (!iso) return false;
                const d = new Date(iso);
                return d.toDateString() === selectedDay.toDateString();
              };

              const dailyItems = history.filter((h) => sameDay(h.stoppedAt || h.createdAt));
              const dailyEarned = dailyItems.reduce((sum, h) => sum + (h.paidAmount || 0), 0);
              const dailyUsers = new Set(
                dailyItems.map((h) => (h.phoneNumber?.trim() ? h.phoneNumber.trim() : `${h.firstName} ${h.lastName}`.trim()))
              ).size;

              const customerMap: Record<string, {
                key: string;
                name: string;
                phone: string;
                count: number;
                totalSeconds: number;
                totalPaid: number;
              }> = {};

              history.forEach((h) => {
                const phone = (h.phoneNumber || '').trim();
                const name = `${h.firstName} ${h.lastName}`.trim() || (language === 'fa' ? 'بدون نام' : 'Unknown');
                const key = phone || name;
                if (!customerMap[key]) {
                  customerMap[key] = {
                    key,
                    name,
                    phone,
                    count: 0,
                    totalSeconds: 0,
                    totalPaid: 0,
                  };
                }
                customerMap[key].count += 1;
                customerMap[key].totalSeconds += h.secondsPlayed || 0;
                customerMap[key].totalPaid += h.paidAmount || 0;
              });

              const customers = Object.values(customerMap);
              const repeatCustomers = customers
                .filter((c) => c.count > 1)
                .sort((a, b) => b.count - a.count);

              const topByCount = [...customers].sort((a, b) => b.count - a.count).slice(0, 5);
              const topByTime = [...customers].sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, 5);

              return (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-semibold">
                        {language === 'fa' ? 'تاریخچه بازی کاربران' : 'Players History'}
                      </h3>
                      <span className="text-xs text-zinc-400">
                        {history.length} {language === 'fa' ? 'رکورد' : 'records'}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs bg-white/5 border-white/15 text-white hover:bg-white/10"
                      onClick={() => setCalendarDialogOpen(true)}
                    >
                      {formatSelectedDateLabel(newCardDate)}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs text-white/70">
                      {language === 'fa' ? 'آمار روز انتخاب‌شده:' : 'Selected day stats:'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs text-white border border-white/10">
                      {language === 'fa' ? 'درآمد' : 'Earned'}: {Math.round(dailyEarned).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs text-white border border-white/10">
                      {language === 'fa' ? 'تعداد کاربران' : 'Users'}: {dailyUsers}
                    </span>
                  </div>

                  {/* Layout: history table */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="min-w-0">
                      {history.length === 0 ? (
                        <p className="text-sm text-zinc-400">
                          {language === 'fa' ? 'هنوز رکوردی ثبت نشده است.' : 'No history recorded yet.'}
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-zinc-300 border-b border-white/10">
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'نام' : 'Name'}</th>
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'تلفن' : 'Phone'}</th>
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'کارت' : 'Card'}</th>
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'زمان' : 'Time'}</th>
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'هزینه' : 'Cost'}</th>
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'پرداختی' : 'Paid'}</th>
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'باقی‌مانده' : 'Remaining'}</th>
                                <th className="text-left py-2">{language === 'fa' ? 'تاریخ' : 'Date'}</th>
                                <th className="text-right py-2">{language === 'fa' ? 'ویرایش' : 'Edit'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.slice(0, 50).map((h) => (
                                <tr key={h.id} className="border-b border-white/5 text-white/90">
                                  <td className="py-2 pr-3 whitespace-nowrap">
                                    {h.firstName} {h.lastName}
                                  </td>
                                  <td className="py-2 pr-3 whitespace-nowrap">{h.phoneNumber}</td>
                                  <td className="py-2 pr-3 whitespace-nowrap">{h.cardTitle}</td>
                                  <td className="py-2 pr-3 whitespace-nowrap font-mono">{formatTime(h.secondsPlayed)}</td>
                                  <td className="py-2 pr-3 whitespace-nowrap">{Math.round(h.totalCost).toLocaleString()}</td>
                                  <td className="py-2 pr-3 whitespace-nowrap">{Math.round(h.paidAmount).toLocaleString()}</td>
                                  <td className="py-2 pr-3 whitespace-nowrap">{Math.round(h.remainingAmount).toLocaleString()}</td>
                                  <td className="py-2 whitespace-nowrap text-zinc-300">
                                    {h.stoppedAt ? new Date(h.stoppedAt).toLocaleString() : ''}
                                  </td>
                                  <td className="py-2 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => openHistoryEdit(h)}
                                      className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                                      title={language === 'fa' ? 'ویرایش' : 'Edit'}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {history.length > 50 && (
                            <p className="mt-2 text-xs text-zinc-400">
                              {language === 'fa' ? 'نمایش ۵۰ رکورد آخر' : 'Showing latest 50 records'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Best clients section (moved to bottom of Players History box) */}
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">
                          {language === 'fa' ? 'مشتریان تکراری (بیش از ۱ بار)' : 'Repeat clients (more than once)'}
                        </h4>
                        <span className="text-xs text-white/60">{repeatCustomers.length}</span>
                      </div>
                      {repeatCustomers.length === 0 ? (
                        <p className="text-sm text-zinc-400">{language === 'fa' ? 'فعلاً موردی نیست.' : 'No repeat clients yet.'}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="text-white/70">
                              <tr className="border-b border-white/10">
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'نام' : 'Name'}</th>
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'تلفن' : 'Phone'}</th>
                                <th className="text-left py-2 pr-3">{language === 'fa' ? 'دفعات' : 'Plays'}</th>
                                <th className="text-left py-2">{language === 'fa' ? 'کل پرداختی' : 'Total paid'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {repeatCustomers.slice(0, 10).map((c) => (
                                <tr key={c.key} className="border-b border-white/5 last:border-0 text-white/90">
                                  <td className="py-2 pr-3 truncate" title={c.name}>{c.name}</td>
                                  <td className="py-2 pr-3 whitespace-nowrap">{c.phone || '-'}</td>
                                  <td className="py-2 pr-3">{c.count}</td>
                                  <td className="py-2">{Math.round(c.totalPaid).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">
                          {language === 'fa' ? 'بهترین مشتری‌ها' : 'Top clients'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                          <div className="text-xs text-white/70 mb-2">
                            {language === 'fa' ? 'بیشترین دفعات بازی' : 'Most sessions'}
                          </div>
                          {topByCount.map((c) => (
                            <div key={c.key} className="flex items-center justify-between py-1 text-sm text-white/90">
                              <span className="truncate" title={c.name}>{c.name}</span>
                              <span className="text-white/70">{c.count}</span>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                          <div className="text-xs text-white/70 mb-2">
                            {language === 'fa' ? 'بیشترین زمان بازی' : 'Most play time'}
                          </div>
                          {topByTime.map((c) => (
                            <div key={c.key} className="flex items-center justify-between py-1 text-sm text-white/90">
                              <span className="truncate" title={c.name}>{c.name}</span>
                              <span className="text-white/70 font-mono">{formatTime(c.totalSeconds)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
                })()}
              </div>
            );

            return (
              <div className="w-full max-w-6xl">
                {HistoryBox}
              </div>
            );
          })()}
        </div>
      </div>

      {}
      {/* Calendar popup (opened from Today button in Players History) */}
      <AlertDialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
        <AlertDialogContent className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {language === 'fa' ? 'انتخاب تاریخ' : 'Select date'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              {language === 'fa' ? 'یک روز را انتخاب کنید.' : 'Pick a day.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-center justify-between gap-2 py-1">
            <Button
              variant="outline"
              className="h-8 px-3 text-xs bg-white/5 border-white/15 text-white hover:bg-white/10"
              onClick={() => {
                setNewCardDate(new Date());
                setCalendarDialogOpen(false);
              }}
            >
              {language === 'fa' ? 'امروز' : 'Today'}
            </Button>

            <div className="text-xs text-white/70">
              {language === 'fa' ? 'تاریخ انتخاب‌شده:' : 'Selected:'} {formatSelectedDateLabel(newCardDate)}
            </div>
          </div>

          <div className="flex justify-center py-2">
            <div className="w-fit">
              <Calendar
                mode="single"
                selected={newCardDate}
                onSelect={(d) => {
                  if (d) setNewCardDate(d);
                  setCalendarDialogOpen(false);
                }}
                className="rounded-lg border border-white/20 bg-white/5"
                calendar={language === 'fa' ? 'persian' : 'gregorian'}
                timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'fa' ? 'بستن' : 'Close'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setNewCardDate(new Date());
                setCalendarDialogOpen(false);
              }}
            >
              {language === 'fa' ? 'امروز' : 'Today'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <AlertDialogContent className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {language === 'fa' ? 'اطلاعات مشتری و پرداخت' : 'Customer & Payment'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              {stoppedCardDraft ? `${stoppedCardDraft.cardTitle} • ${formatTime(stoppedCardDraft.secondsPlayed)} • ${Math.round(stoppedCardDraft.totalCost).toLocaleString()}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(() => {
              const qRaw = `${firstName} ${lastName} ${phoneNumber}`.trim();
              const q = qRaw.toLowerCase();
              if (!q || q.length < 2) return null;

              const map = new Map<string, { firstName: string; lastName: string; phoneNumber: string; lastSeen: string }>();
              for (const h of history) {
                const phone = (h.phoneNumber || '').trim();
                const first = (h.firstName || '').trim();
                const last = (h.lastName || '').trim();
                if (!phone && !first && !last) continue;

                const key = phone || `${first} ${last}`.trim();
                const prev = map.get(key);
                const lastSeen = h.stoppedAt || h.createdAt;

                if (!prev || new Date(lastSeen).getTime() > new Date(prev.lastSeen).getTime()) {
                  map.set(key, { firstName: first, lastName: last, phoneNumber: phone, lastSeen });
                }
              }

              const candidates = Array.from(map.values())
                .filter((c) => {
                  const name = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
                  const phone = (c.phoneNumber || '').toLowerCase();
                  return name.includes(q) || phone.includes(q);
                })
                .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
                .slice(0, 6);

              if (candidates.length === 0) return null;

              return (
                <div className="sm:col-span-2 -mt-1">
                  <div className="w-full max-h-56 overflow-auto rounded-lg border border-white/15 bg-black/70 backdrop-blur-xl shadow-xl">
                    {candidates.map((c, idx) => {
                      const name = `${c.firstName} ${c.lastName}`.trim() || (language === 'fa' ? 'بدون نام' : 'Unknown');
                      return (
                        <button
                          key={`${c.phoneNumber}-${name}-${idx}`}
                          type="button"
                          onClick={() => {
                            applyCustomerToForm(c);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                        >
                          <div className="text-sm text-white">
                            {name}
                            {c.phoneNumber ? <span className="text-xs text-white/70">{' '}• {c.phoneNumber}</span> : null}
                          </div>
                          <div className="text-xs text-white/60">
                            {language === 'fa' ? 'آخرین مراجعه:' : 'Last seen:'} {new Date(c.lastSeen).toLocaleString()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <input
              type="text"
              value={firstName}
              onChange={e => {
                setFirstName(e.target.value);
              }}
              placeholder={language === 'fa' ? 'نام' : 'First name'}
              className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              value={lastName}
              onChange={e => {
                setLastName(e.target.value);
              }}
              placeholder={language === 'fa' ? 'نام خانوادگی' : 'Last name'}
              className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => {
                setPhoneNumber(e.target.value);
              }}
              placeholder={language === 'fa' ? 'شماره تلفن' : 'Phone number'}
              className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
            />

            <div className="sm:col-span-2">
              <input
                type="text"
                value={paidAmount ? formatNumberLocale(paidAmount, language) : ''}
                onChange={(e) => {
                  let value = e.target.value;
                  value = convertToEnglishDigits(value);
                  value = value.replace(/[,،]/g, '');
                  if (value === '' || /^\d+$/.test(value)) {
                    setPaidAmount(value);
                  }
                }}
                placeholder={language === 'fa' ? 'مبلغ پرداختی' : 'Paid amount'}
                className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {(() => {
                const n = Number(paidAmount);
                const words = paidAmount && !isNaN(n) && n > 0 ? numberToWords(n, language) : '';
                return words ? (
                  <p className="mt-2 text-sm text-green-400 animate-in fade-in duration-300">
                    {words} {language === 'fa' ? 'تومان' : 'toman'}
                  </p>
                ) : null;
              })()}
            </div>

            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm text-white">
                {language === 'fa' ? 'پرداخت کامل؟' : 'Paid fully?'}
              </span>
              <Switch checked={paidFully} onCheckedChange={setPaidFully} />
            </div>

            {!paidFully && <input type="number" value={remainingAmount} onChange={e => setRemainingAmount(e.target.value)} placeholder={language === 'fa' ? 'مبلغ باقی‌مانده' : 'Remaining amount'} className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2" />}

            <div className="sm:col-span-2 text-xs text-zinc-400">
              {stoppedCardDraft ? <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>{language === 'fa' ? 'زمان بازی:' : 'Played:'} {formatTime(stoppedCardDraft.secondsPlayed)}</span>
                  <span>{language === 'fa' ? 'هزینه:' : 'Cost:'} {Math.round(stoppedCardDraft.totalCost).toLocaleString()}</span>
                </div> : null}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
            if (stoppedCardDraft?.cardId) {
              resumeTimer(stoppedCardDraft.cardId);
            }
            setStopDialogOpen(false);
            setStoppedCardDraft(null);
            resetStopDialogForm();
          }}>
              {t('home.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={saveStoppedSessionToHistory} disabled={!stoppedCardDraft}>
              {language === 'fa' ? 'ثبت' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      {/* Edit History dialog */}
      <AlertDialog open={historyEditOpen} onOpenChange={setHistoryEditOpen}>
        <AlertDialogContent className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {language === 'fa' ? 'ویرایش تاریخچه' : 'Edit history'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              {historyEditDraft ? `${historyEditDraft.cardTitle} • ${new Date(historyEditDraft.stoppedAt || historyEditDraft.createdAt).toLocaleString()}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {historyEditDraft ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={historyEditDraft.firstName}
                onChange={(e) => setHistoryEditDraft({ ...historyEditDraft, firstName: e.target.value })}
                placeholder={language === 'fa' ? 'نام' : 'First name'}
                className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={historyEditDraft.lastName}
                onChange={(e) => setHistoryEditDraft({ ...historyEditDraft, lastName: e.target.value })}
                placeholder={language === 'fa' ? 'نام خانوادگی' : 'Last name'}
                className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="tel"
                value={historyEditDraft.phoneNumber}
                onChange={(e) => setHistoryEditDraft({ ...historyEditDraft, phoneNumber: e.target.value })}
                placeholder={language === 'fa' ? 'شماره تلفن' : 'Phone number'}
                className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
              />

              <div className="sm:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">{language === 'fa' ? 'پرداختی' : 'Paid'}</label>
                <input
                  type="text"
                  value={formatNumberLocale(String(historyEditDraft.paidAmount ?? 0), language)}
                  onChange={(e) => {
                    let v = convertToEnglishDigits(e.target.value);
                    v = v.replace(/[,،]/g, '');
                    if (v === '' || /^\d+$/.test(v)) {
                      setHistoryEditDraft({ ...historyEditDraft, paidAmount: Number(v || 0) });
                    }
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">{language === 'fa' ? 'باقی‌مانده' : 'Remaining'}</label>
                <input
                  type="text"
                  value={formatNumberLocale(String(historyEditDraft.remainingAmount ?? 0), language)}
                  onChange={(e) => {
                    let v = convertToEnglishDigits(e.target.value);
                    v = v.replace(/[,،]/g, '');
                    if (v === '' || /^\d+$/.test(v)) {
                      setHistoryEditDraft({ ...historyEditDraft, remainingAmount: Number(v || 0) });
                    }
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2 text-xs text-zinc-400">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>{language === 'fa' ? 'زمان بازی:' : 'Played:'} {formatTime(historyEditDraft.secondsPlayed)}</span>
                  <span>{language === 'fa' ? 'هزینه:' : 'Cost:'} {Math.round(historyEditDraft.totalCost).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setHistoryEditOpen(false);
                setHistoryEditDraft(null);
              }}
            >
              {language === 'fa' ? 'بستن' : 'Close'}
            </AlertDialogCancel>

            <Button
              type="button"
              variant="destructive"
              disabled={!historyEditDraft}
              onClick={() => {
                if (!historyEditDraft) return;
                const ok = confirm(language === 'fa' ? 'آیا مطمئن هستید؟' : 'Are you sure?');
                if (ok) deleteHistoryItem(historyEditDraft.id);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {language === 'fa' ? 'حذف' : 'Delete'}
            </Button>

            <AlertDialogAction onClick={saveHistoryEdit} disabled={!historyEditDraft}>
              {language === 'fa' ? 'ذخیره' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('home.editGameCard')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              {t('home.enterTitle')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <input type="text" value={titleInput} onChange={e => setTitleInput(e.target.value)} placeholder={t('home.gameTitle')} className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500" autoFocus />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
            setDialogOpen(false);
            setEditingCard(null);
            setTitleInput("");
          }}>
              {t('home.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveTitle}>
              {t('home.save')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={addClientDialogOpen} onOpenChange={setAddClientDialogOpen}>
        <AlertDialogContent className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('home.addNewCard')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
               {language === 'fa' ? 'اطلاعات مشتری را وارد کنید.' : 'Enter client details.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <input
              type="text"
              value={newClientData.firstName}
              onChange={(e) => setNewClientData({ ...newClientData, firstName: e.target.value })}
              placeholder={t('client.firstName')}
              className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              value={newClientData.lastName}
              onChange={(e) => setNewClientData({ ...newClientData, lastName: e.target.value })}
              placeholder={t('client.lastName')}
              className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
             <input
              type="tel"
              value={newClientData.phoneNumber}
              onChange={(e) => setNewClientData({ ...newClientData, phoneNumber: e.target.value })}
              placeholder={t('client.phone')}
              className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddClientDialogOpen(false)}>{t('home.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddNewClient} disabled={!newClientData.firstName && !newClientData.lastName}>
              {t('client.generateCode')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCodeDialogOpen} onOpenChange={setShowCodeDialogOpen}>
        <AlertDialogContent className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('client.code')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              {t('client.codeInstructions')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-wider">
              {generatedCode}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-black border-white/20 hover:bg-white/10"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
              }}
            >
              <Copy className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {language === 'fa' ? 'کپی کد' : 'Copy Code'}
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSaveAndStartSession}>
              {t('client.saveAndStart')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}