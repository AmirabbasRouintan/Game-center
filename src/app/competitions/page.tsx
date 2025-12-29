'use client';

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Shuffle, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotification } from "@/contexts/NotificationContext";
import { numberToWords } from "@/utils/numberToWords";
import ShinyText from "@/components/ShinyText";
import { formatNumberLocale, convertToEnglishDigits } from "@/utils/formatNumber";
import { competitionsStore } from "@/data/competitionsStore";

interface Match {
  id: string;
  player1: string | null;
  player2: string | null;
  winner: string | null;
}

interface Tournament {
  id: string;
  name: string;
  entryPrice: string;
  players: string[];
  rounds: Match[][];
  createdAt: string;
  completed: boolean;
  winner?: string;
  showSecondPlace?: boolean;
  showThirdPlace?: boolean;
}

export default function CompetitionsPage() {
  const { t, language } = useLanguage();
  const { showNotification } = useNotification();
  const [tournamentName, setTournamentName] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [savedTournaments, setSavedTournaments] = useState<Tournament[]>(() => competitionsStore.loadTournaments<Tournament[]>());
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showSecondPlace, setShowSecondPlace] = useState(false);
  const [showThirdPlace, setShowThirdPlace] = useState(false);

  const priceInWords = entryPrice && !isNaN(Number(entryPrice)) && Number(entryPrice) > 0
    ? numberToWords(Number(entryPrice), language)
    : '';

  const addPlayer = () => {
    if (playerName.trim() && !players.includes(playerName.trim())) {
      setPlayers([...players, playerName.trim()]);
      setPlayerName("");
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const shufflePlayers = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    setPlayers(shuffled);
  };

  const saveTournaments = (tournaments: Tournament[]) => {
    competitionsStore.saveTournaments(tournaments);
    setSavedTournaments(tournaments);
    // Also save to ensure data persistence
    saveTournamentsToJson(tournaments);
  };

  const saveTournamentsToJson = (tournamentsData: Tournament[]) => {
    // Save to localStorage for export feature
    competitionsStore.saveTournaments(tournamentsData);
  };

  const createTournament = () => {
    if (!tournamentName || players.length < 2) return;

    // Pad players to next power of 2
    const paddedPlayers = [...players];
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(players.length)));
    while (paddedPlayers.length < nextPowerOf2) {
      paddedPlayers.push("BYE");
    }

    // Create first round matches
    const firstRound: Match[] = [];
    for (let i = 0; i < paddedPlayers.length; i += 2) {
      firstRound.push({
        id: `r0-m${i / 2}`,
        player1: paddedPlayers[i],
        player2: paddedPlayers[i + 1],
        winner: null,
      });
    }

    // Create subsequent rounds
    const rounds: Match[][] = [firstRound];
    let currentRoundSize = firstRound.length;
    let roundNum = 1;

    while (currentRoundSize > 1) {
      currentRoundSize = Math.floor(currentRoundSize / 2);
      const round: Match[] = [];
      for (let i = 0; i < currentRoundSize; i++) {
        round.push({
          id: `r${roundNum}-m${i}`,
          player1: null,
          player2: null,
          winner: null,
        });
      }
      rounds.push(round);
      roundNum++;
    }

    const newTournament: Tournament = {
      id: Date.now().toString(),
      name: tournamentName,
      entryPrice: entryPrice || '0',
      players: paddedPlayers,
      rounds,
      createdAt: new Date().toISOString(),
      completed: false,
      showSecondPlace,
      showThirdPlace,
    };

    setTournament(newTournament);
    setShowForm(false);
    setShowList(false);
    showNotification('success', t('comp.tournamentCreated') || 'Tournament Created', `${tournamentName} has been created successfully`);
  };

  const selectWinner = (roundIndex: number, matchIndex: number, winner: string) => {
    if (!tournament) return;

    const newRounds = [...tournament.rounds];
    newRounds[roundIndex][matchIndex].winner = winner;

    // Update next round
    if (roundIndex < newRounds.length - 1) {
      const nextRoundMatchIndex = Math.floor(matchIndex / 2);
      const isFirstPlayer = matchIndex % 2 === 0;

      if (isFirstPlayer) {
        newRounds[roundIndex + 1][nextRoundMatchIndex].player1 = winner;
      } else {
        newRounds[roundIndex + 1][nextRoundMatchIndex].player2 = winner;
      }
    }

    setTournament({ ...tournament, rounds: newRounds });
  };

  const saveTournamentResult = () => {
    if (!tournament) return;

    const finalWinner = tournament.rounds[tournament.rounds.length - 1][0].winner;
    const updatedTournament = {
      ...tournament,
      completed: true,
      winner: finalWinner || undefined,
      showSecondPlace,
      showThirdPlace,
    };

    const updated = [...savedTournaments.filter(t => t.id !== tournament.id), updatedTournament];
    saveTournaments(updated);
  };

  const resetTournament = () => {
    if (tournament && tournament.rounds[tournament.rounds.length - 1][0].winner) {
      saveTournamentResult();
    }
    setTournament(null);
    setShowForm(false);
    setShowList(true);
    setTournamentName("");
    setEntryPrice("");
    setPlayers([]);
    setShowSecondPlace(false);
    setShowThirdPlace(false);
  };

  const loadTournament = (tourney: Tournament) => {
    setTournament(tourney);
    setShowForm(false);
    setShowList(false);
    setShowSecondPlace(!!tourney.showSecondPlace);
    setShowThirdPlace(!!tourney.showThirdPlace);
  };

  const deleteTournament = (id: string) => {
    const tournament = savedTournaments.find(t => t.id === id);
    const updated = savedTournaments.filter(t => t.id !== id);
    saveTournaments(updated);
    showNotification('info', t('comp.tournamentDeleted') || 'Tournament Deleted', `${tournament?.name || 'Tournament'} has been deleted`);
  };

  const getRoundName = (roundIndex: number, totalRounds: number) => {
    const remaining = totalRounds - roundIndex;
    if (remaining === 1) return t('comp.final');
    if (remaining === 2) return t('comp.semiFinals');
    if (remaining === 3) return t('comp.quarterFinals');
    return `${t('comp.round')} ${roundIndex + 1}`;
  };

  const isRealPlayer = (name: string | null | undefined) => !!name && name !== 'BYE';

  const getWinsMap = (rounds: Match[][]) => {
    const wins: Record<string, number> = {};
    rounds.forEach((round) => {
      round.forEach((m) => {
        if (isRealPlayer(m.winner)) {
          wins[m.winner!] = (wins[m.winner!] ?? 0) + 1;
        }
      });
    });
    return wins;
  };

  const getTotalPool = (entry: number, tourneyPlayers: string[]) => {
    const count = tourneyPlayers.filter((p) => p !== 'BYE').length;
    return entry * count;
  };

  const getPodiumPrizes = (totalPool: number, thirdCount: number) => {
    // Default split: 50% / 30% / 20%
    const champion = Math.floor(totalPool * 0.5);
    const second = Math.floor(totalPool * 0.3);
    const thirdTotal = Math.max(0, totalPool - champion - second);
    const thirdEach = thirdCount > 0 ? Math.floor(thirdTotal / thirdCount) : 0;

    return { champion, second, thirdEach, thirdTotal };
  };

  const moneyLabel = language === 'fa' ? 'تومان' : 'Toman';

  const formatMoney = (amount: number) => `${formatNumberLocale(String(amount), language)} ${moneyLabel}`;

  return (
    <main className="min-h-screen py-10 animate-in fade-in duration-500 pt-24">
      <div className="mx-auto w-[80%]">
        <div className="flex items-center justify-between">
          <div className={(tournament || showList) ? "" : "mx-auto text-center"}>
            <h1 className="text-3xl font-bold text-white">{t('comp.title')}</h1>
            <ShinyText 
              text={t('comp.subtitle')} 
              disabled={false} 
              speed={3} 
              className="mt-2 text-zinc-400" 
            />
          </div>
          {tournament && (
            <Button onClick={resetTournament} variant="outline">
              {t('comp.newTournament')}
            </Button>
          )}
          {showList && !tournament && (
            <Button onClick={() => { setShowList(false); setShowForm(true); }} variant="default">
              {t('comp.newTournament')}
            </Button>
          )}
        </div>

        {/* Tournament List */}
        {showList && !tournament && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('comp.tournaments') || 'Tournaments'}</h2>
            {savedTournaments.length === 0 ? (
              <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-8 text-center">
                <p className="text-zinc-400">{t('comp.noTournaments') || 'No tournaments yet. Create your first tournament!'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedTournaments.map((tourney) => (
                  <div
                    key={tourney.id}
                    className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1" onClick={() => loadTournament(tourney)}>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">{tourney.name}</h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          {new Date(tourney.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this tournament?')) deleteTournament(tourney.id);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm" onClick={() => loadTournament(tourney)}>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">{t('comp.players')}:</span>
                        <span className="text-white">{tourney.players.filter(p => p !== 'BYE').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">{t('comp.entryPrice') || 'Entry Price'}:</span>
                        <span className="text-white">{formatNumberLocale(tourney.entryPrice || '0', language)} {language === 'fa' ? 'تومان' : 'Toman'}</span>
                      </div>
                      {tourney.completed && tourney.winner && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">{t('comp.winner') || 'Winner'}:</span>
                          <span className="text-primary font-semibold">{tourney.winner}</span>
                        </div>
                      )}
                      {!tourney.completed && (
                        <div className="text-yellow-400 text-xs">{t('comp.inProgress') || 'In Progress'}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="mt-8 mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30">
              <h2 className="text-2xl font-semibold text-white mb-6">{t('comp.createNew')}</h2>

              {/* Tournament Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  {t('comp.tournamentName')}
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder={t('comp.enterTournamentName')}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Entry Price */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  {t('comp.entryPrice') || 'Entry Price'} ({language === 'fa' ? 'تومان' : 'Toman'})
                </label>
                <input
                  type="text"
                  value={entryPrice ? formatNumberLocale(entryPrice, language) : ''}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // Convert Persian/Arabic digits to English
                    value = convertToEnglishDigits(value);
                    
                    // Remove all commas and separators
                    value = value.replace(/[,،]/g, '');
                    
                    // Only allow numbers
                    if (value === '' || /^\d+$/.test(value)) {
                      setEntryPrice(value);
                    }
                  }}
                  placeholder={t('comp.enterEntryPrice') || 'Enter entry price (optional)'}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {priceInWords && (
                  <p className="mt-2 text-sm text-green-400 animate-in fade-in duration-300">
                    {priceInWords} {language === 'fa' ? 'تومان' : 'toman'}
                  </p>
                )}
              </div>

              {/* Placement visibility */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  {language === 'fa' ? 'نمایش رتبه‌ها' : 'Show placements'}
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-white text-sm">
                      {language === 'fa' ? 'نمایش رتبه دوم' : 'Show 2nd place'}
                    </span>
                    <Switch checked={showSecondPlace} onCheckedChange={setShowSecondPlace} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-white text-sm">
                      {language === 'fa' ? 'نمایش رتبه سوم' : 'Show 3rd place'}
                    </span>
                    <Switch checked={showThirdPlace} onCheckedChange={setShowThirdPlace} />
                  </div>
                </div>
              </div>

              {/* Add Players */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  {t('comp.addPlayers')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addPlayer()}
                    placeholder={t('comp.enterPlayerName')}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button onClick={addPlayer}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Players List */}
              {players.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">
                      {t('comp.players')} ({players.length})
                    </h3>
                    <Button
                      onClick={shufflePlayers}
                      variant="outline"
                      size="sm"
                      className="text-foreground bg-white hover:bg-gray-100 border-gray-300"
                    >
                      <Shuffle className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-black" />
                      <span className="text-black">{t('comp.shuffle')}</span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg border border-white/10"
                      >
                        <span className="text-white text-sm">{player}</span>
                        <button
                          onClick={() => removePlayer(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Button */}
              <Button
                onClick={createTournament}
                disabled={!tournamentName || players.length < 2}
                className="w-full"
                size="lg"
              >
                {t('comp.createBracket')}
              </Button>
              {players.length < 2 && players.length > 0 && (
                <p className="text-sm text-red-400 mt-2 text-center">
                  {t('comp.minPlayers')}
                </p>
              )}
            </div>
          </div>
        )}

        {tournament && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {tournament.name}
            </h2>

            {/* Tournament Bracket */}
            {(() => {
              // Bracket positioning constants (tuned for consistent centering)
              const MATCH_HEIGHT = 140;
              const MATCH_GAP = 16;
              const BLOCK = MATCH_HEIGHT + MATCH_GAP;
              const HEADER_HEIGHT = 56; // room for round title

              const round0Matches = tournament.rounds[0]?.length ?? 0;
              const bracketHeight = Math.max(0, round0Matches * BLOCK - MATCH_GAP) + HEADER_HEIGHT;

              const getMatchTop = (roundIndex: number, matchIndex: number) => {
                const step = Math.pow(2, roundIndex);
                // Center each next-round match between the 2 matches feeding into it
                const base = (step - 1) / 2;
                return HEADER_HEIGHT + (base + matchIndex * step) * BLOCK;
              };

              return (
                <div className="overflow-x-auto pb-8">
                  <div className="flex gap-8 justify-center min-w-max px-4 relative">
                    {tournament.rounds.map((round, roundIndex) => (
                      <div
                        key={roundIndex}
                        className="relative min-w-[250px]"
                        style={{ height: bracketHeight }}
                      >
                        <h3 className="text-lg font-semibold text-white text-center py-2" style={{ height: HEADER_HEIGHT }}>
                          {getRoundName(roundIndex, tournament.rounds.length)}
                        </h3>

                        {round.map((match, matchIndex) => (
                          <div
                            key={match.id}
                            className="absolute left-0 right-0 flex justify-center"
                            style={{ top: getMatchTop(roundIndex, matchIndex) }}
                          >
                            <div className="w-full">
                              <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in zoom-in-95 duration-500 relative z-10 min-h-[140px]">
                                <div className="space-y-2">
                                  {/* Player 1 */}
                                  <button
                                    onClick={() => match.player1 && !match.winner && selectWinner(roundIndex, matchIndex, match.player1)}
                                    disabled={!match.player1 || match.player1 === "BYE" || !!match.winner}
                                    className={`w-full px-3 py-2 rounded text-left transition-all ${
                                      match.winner === match.player1
                                        ? "bg-primary text-primary-foreground font-semibold"
                                        : match.player1 === "BYE"
                                        ? "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
                                        : !match.winner
                                        ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                                        : "bg-white/5 text-zinc-400"
                                    }`}
                                  >
                                    {match.player1 || t('comp.tbd')}
                                  </button>

                                  {/* VS Divider */}
                                  <div className="text-center text-xs text-zinc-400">{t('comp.vs')}</div>

                                  {/* Player 2 */}
                                  <button
                                    onClick={() => match.player2 && !match.winner && selectWinner(roundIndex, matchIndex, match.player2)}
                                    disabled={!match.player2 || match.player2 === "BYE" || !!match.winner}
                                    className={`w-full px-3 py-2 rounded text-left transition-all ${
                                      match.winner === match.player2
                                        ? "bg-primary text-primary-foreground font-semibold"
                                        : match.player2 === "BYE"
                                        ? "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
                                        : !match.winner
                                        ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                                        : "bg-white/5 text-zinc-400"
                                    }`}
                                  >
                                    {match.player2 || t('comp.tbd')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Winner Display */}
            {tournament.rounds[tournament.rounds.length - 1][0].winner && (() => {
              const finalMatch = tournament.rounds[tournament.rounds.length - 1][0];
              const champion = finalMatch.winner;
              const second = champion
                ? (finalMatch.player1 === champion ? finalMatch.player2 : finalMatch.player1)
                : null;

              const winsMap = getWinsMap(tournament.rounds);

              const semiRoundIndex = tournament.rounds.length - 2;
              const semiLosers: string[] = [];
              if (semiRoundIndex >= 0) {
                tournament.rounds[semiRoundIndex].forEach((m) => {
                  if (!m.player1 || !m.player2 || !m.winner) return;
                  const loser = m.player1 === m.winner ? m.player2 : m.player1;
                  if (loser && loser !== 'BYE') semiLosers.push(loser);
                });
              }

              // We must have ONLY 1 third place: pick the first semi-final loser (deterministic).
              const third = semiLosers.length > 0 ? semiLosers[0] : null;

              const entry = Number(tournament.entryPrice || 0);
              const totalPool = getTotalPool(entry, tournament.players);
              const show2 = (showSecondPlace || tournament.showSecondPlace) && isRealPlayer(second);
              const show3 = (showThirdPlace || tournament.showThirdPlace) && isRealPlayer(third);
              const prizes = getPodiumPrizes(totalPool, show3 ? 1 : 0);

              const PodiumCard = ({
                title,
                name,
                prize,
                gradient,
              }: {
                title: string;
                name: string;
                prize: number;
                gradient: string;
              }) => (
                <div className={`w-full sm:w-[320px] ${gradient} text-white px-8 py-5 rounded-lg shadow-2xl border border-white/10`}>
                  <div className="text-xs text-white/90 mb-2 font-medium">{title}</div>
                  <div className="text-2xl font-bold truncate" title={name}>{name}</div>
                  <div className="mt-2 text-sm text-white/90">
                    {language === 'fa' ? 'جایزه:' : 'Prize:'} <span className="font-semibold">{formatMoney(prize)}</span>
                  </div>
                </div>
              );

              return (
                <div className="mt-8">
                  <div className="flex flex-col items-center gap-4">
                    {champion && (
                      <PodiumCard
                        title={t('comp.champion')}
                        name={champion}
                        prize={prizes.champion}
                        gradient="bg-gradient-to-r from-yellow-400 to-yellow-600"
                      />
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 w-full max-w-5xl">
                      {show2 && second && (
                        <PodiumCard
                          title={language === 'fa' ? 'رتبه دوم' : '2nd place'}
                          name={second}
                          prize={prizes.second}
                          gradient="bg-gradient-to-r from-zinc-300 to-zinc-500"
                        />
                      )}

                      {show3 && third && (
                        <PodiumCard
                          title={language === 'fa' ? 'رتبه سوم' : '3rd place'}
                          name={third}
                          prize={prizes.thirdEach}
                          gradient="bg-gradient-to-r from-amber-600 to-amber-800"
                        />
                      )}
                    </div>

                    {/* All players: entry price + wins + prize */}
                    <div className="mt-6 w-full max-w-5xl bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-4 text-white">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h3 className="text-lg font-semibold">
                          {language === 'fa' ? 'بازیکنان و جوایز' : 'Players & prizes'}
                        </h3>
                        <div className="text-sm text-white/80">
                          {language === 'fa' ? 'مجموع جایزه:' : 'Total pool:'} <span className="font-semibold">{formatMoney(totalPool)}</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        {(() => {
                          const realPlayers = tournament.players.filter((p) => p !== 'BYE');

                          const rankIndex = (player: string) => {
                            if (player === champion) return 0;
                            if (player === second) return 1;
                            if (player === third) return 2;
                            return 3;
                          };

                          // Ensure winners always appear at the top of the list
                          const sortedPlayers = [...realPlayers].sort((a, b) => {
                            const ra = rankIndex(a);
                            const rb = rankIndex(b);
                            if (ra !== rb) return ra - rb;
                            return a.localeCompare(b);
                          });

                          const getPositionTag = (player: string) => {
                            if (player === champion) {
                              return language === 'fa' ? '🏆 قهرمان' : '🏆 Champion';
                            }
                            if (player === second) {
                              return language === 'fa' ? 'رتبه دوم' : '2nd';
                            }
                            if (player === third) {
                              return language === 'fa' ? 'رتبه سوم' : '3rd';
                            }
                            return null;
                          };

                          const PositionBadge = ({ label }: { label: string }) => (
                            <span className="ml-2 rtl:ml-0 rtl:mr-2 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white border border-white/10 whitespace-nowrap">
                              {label}
                            </span>
                          );

                          return (
                            <table className="w-full text-sm">
                              <thead className="text-white/80">
                                <tr className="border-b border-white/10">
                                  <th className="text-left py-2 pr-3 w-10">#</th>
                                  <th className="text-left py-2 pr-3">
                                    {language === 'fa' ? 'بازیکن' : 'Player'}
                                    <span className="ml-2 rtl:ml-0 rtl:mr-2 text-xs text-white/60">({realPlayers.length})</span>
                                  </th>
                                  <th className="text-left py-2 pr-3">{language === 'fa' ? 'برد' : 'Wins'}</th>
                                  <th className="text-left py-2 pr-3">{language === 'fa' ? 'ورودی' : 'Entry'}</th>
                                  <th className="text-left py-2">{language === 'fa' ? 'جایزه' : 'Prize'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedPlayers.map((p, idx) => {
                                  let prize = 0;
                                  if (p === champion) prize = prizes.champion;
                                  else if (p === second) prize = prizes.second;
                                  else if (p === third) prize = prizes.thirdEach;

                                  const tag = getPositionTag(p);

                                  return (
                                    <tr key={p} className="border-b border-white/5 last:border-0">
                                      <td className="py-2 pr-3 text-white/70">{idx + 1}</td>
                                      <td className="py-2 pr-3 font-medium truncate" title={p}>
                                        <span className="truncate">{p}</span>
                                        {tag && <PositionBadge label={tag} />}
                                      </td>
                                      <td className="py-2 pr-3">{winsMap[p] ?? 0}</td>
                                      <td className="py-2 pr-3">{formatMoney(entry)}</td>
                                      <td className="py-2">{formatMoney(prize)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}
