// Utility functions for saving data to JSON files

export const saveToJsonFile = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const saveGameCardsToJson = (gameCards: any[]) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveToJsonFile(gameCards, `game-cards-${timestamp}.json`);
};

export const saveTournamentsToJson = (tournaments: any[]) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveToJsonFile(tournaments, `tournaments-${timestamp}.json`);
};
