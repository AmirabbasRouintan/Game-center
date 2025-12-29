'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, X, Play, Pause } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface GameCard {
  id: number;
  title: string;
  time: number;
  isRunning: boolean;
}

export default function Home() {
  const { t } = useLanguage();
  const [cards, setCards] = useState<GameCard[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [titleInput, setTitleInput] = useState("");

  const addCard = () => {
    const newCard: GameCard = {
      id: Date.now(),
      title: t('home.untitledGame'),
      time: 0,
      isRunning: false,
    };
    setCards([...cards, newCard]);
  };

  const removeCard = (id: number) => {
    setCards(cards.filter((card) => card.id !== id));
  };

  const handleDoubleClick = (card: GameCard) => {
    setEditingCard(card.id);
    setTitleInput(card.title);
    setDialogOpen(true);
  };

  const handleSaveTitle = () => {
    if (editingCard) {
      setCards(cards.map((card) => 
        card.id === editingCard ? { ...card, title: titleInput } : card
      ));
    }
    setDialogOpen(false);
    setEditingCard(null);
    setTitleInput("");
  };

  const toggleTimer = (id: number) => {
    setCards(cards.map((card) => {
      if (card.id === id) {
        if (!card.isRunning) {
          // Start timer
          const interval = setInterval(() => {
            setCards((prev) => prev.map((c) => 
              c.id === id && c.isRunning ? { ...c, time: c.time + 1 } : c
            ));
          }, 1000);
          (card as any).intervalId = interval;
        } else {
          // Stop timer
          if ((card as any).intervalId) {
            clearInterval((card as any).intervalId);
          }
        }
        return { ...card, isRunning: !card.isRunning };
      }
      return card;
    }));
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground animate-in fade-in duration-500 pt-24">
      {/* Add new Card button - top right below navbar */}
      <div className="fixed top-28 right-6 z-40 rtl:right-auto rtl:left-6 animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
        <Button 
          onClick={addCard}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('home.addNewCard')}
        </Button>
      </div>

      {/* Cards Container - centered */}
      <div className="mx-auto flex min-h-screen max-w-5xl flex-wrap gap-4 items-center justify-center px-6 py-16">
        {cards.map((card) => (
          <div 
            key={card.id} 
            className="relative w-64 h-48 bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group animate-in fade-in zoom-in-95 duration-500"
            onDoubleClick={() => handleDoubleClick(card)}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Remove button on hover */}
            {hoveredCard === card.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCard(card.id);
                }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all z-10"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}

            <div className="flex flex-col h-full justify-between">
              <div>
                <h3 className="text-lg font-semibold truncate">{card.title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{t('home.doubleClick')}</p>
              </div>

              <div className="space-y-2">
                {/* Timer display */}
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold">{formatTime(card.time)}</p>
                </div>

                {/* Start/Stop button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTimer(card.id);
                  }}
                  className="w-full"
                  variant={card.isRunning ? "destructive" : "default"}
                >
                  {card.isRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {t('home.stop')}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {t('home.start')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {cards.length === 0 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 sm:text-8xl md:text-9xl">{t('home.title')}</h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              {t('home.subtitle')}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/competitions">{t('home.joinCompetitions')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/settings">{t('nav.settings')}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Card Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('home.editGameCard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('home.enterTitle')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder={t('home.gameTitle')}
              className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
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
    </div>
  );
}
