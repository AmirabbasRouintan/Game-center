'use client';

import { Button } from "@/components/ui/button";
import { Plus, Shuffle, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotification } from "@/contexts/NotificationContext";
import { numberToWords } from "@/utils/numberToWords";

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
}

export default function CompetitionsPage() {
  const { t, language } = useLanguage();
  const { showNotification } = useNotification();
  const [tournamentName, setTournamentName] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [savedTournaments, setSavedTournaments] = useState<Tournament[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = window.localStorage.getItem('tournaments');
    if (!saved) return [];
    try {
      return JSON.parse(saved) as Tournament[];
    } catch {
      return [];
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(true);

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
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    setSavedTournaments(tournaments);
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
  };

  const loadTournament = (tourney: Tournament) => {
    setTournament(tourney);
    setShowForm(false);
    setShowList(false);
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

  return (
    <main className="min-h-screen px-6 py-10 animate-in fade-in duration-500 pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div className={(tournament || showList) ? "" : "mx-auto text-center"}>
            <h1 className="text-3xl font-bold text-white">{t('comp.title')}</h1>
            <p className="mt-2 text-zinc-400">
              {t('comp.subtitle')}
            </p>
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
                        <span className="text-white">{tourney.entryPrice || '0'} {language === 'fa' ? 'تومان' : 'Toman'}</span>
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
                  value={entryPrice}
                  onChange={(e) => {
                    const value = e.target.value;
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
            <div className="overflow-x-auto pb-8">
              <div className="flex gap-8 justify-center min-w-max px-4 relative">
                {tournament.rounds.map((round, roundIndex) => (
                  <div key={roundIndex} className="relative">
                    {/* Separator line between rounds */}
                    {roundIndex > 0 && (
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-white/20 -ml-4"></div>
                    )}
                    <div className="flex flex-col justify-around min-w-[250px] relative">
                      <h3 className="text-lg font-semibold text-white text-center mb-4 py-2">
                        {getRoundName(roundIndex, tournament.rounds.length)}
                      </h3>
                      <div className="flex flex-col justify-around flex-1 gap-4">
                        {round.map((match, matchIndex) => (
                          <div key={match.id} className="relative">
                            {/* Connection lines to next round */}
                            {roundIndex < tournament.rounds.length - 1 && match.winner && (
                              <div className="absolute left-full top-1/2 w-8 h-px bg-primary z-0">
                                <div className={`absolute right-0 w-px h-[${roundIndex > 0 ? `${(roundIndex + 1) * 40}` : '20'}px] bg-primary ${matchIndex % 2 === 0 ? 'top-0' : 'bottom-0'}`}></div>
                              </div>
                            )}
                            <div
                              className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in zoom-in-95 duration-500 relative z-10"
                              style={{
                                marginTop: roundIndex > 0 ? `${roundIndex * 20}px` : '0',
                                marginBottom: roundIndex > 0 ? `${roundIndex * 20}px` : '0',
                              }}
                            >
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
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Winner Display */}
            {tournament.rounds[tournament.rounds.length - 1][0].winner && (
              <div className="mt-8 text-center">
                <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-8 py-4 rounded-lg shadow-2xl">
                  <p className="text-sm font-medium mb-1">{t('comp.champion')}</p>
                  <p className="text-2xl font-bold">
                    {tournament.rounds[tournament.rounds.length - 1][0].winner}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
