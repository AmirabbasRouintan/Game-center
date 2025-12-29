'use client';

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, Upload, FileSpreadsheet, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const [darkVeilEnabled, setDarkVeilEnabled] = useState(true);
  const [exportFormat, setExportFormat] = useState<'json' | 'excel'>('json');

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('darkVeilEnabled');
    if (saved !== null) {
      setDarkVeilEnabled(JSON.parse(saved));
    }
  }, []);

  const toggleDarkVeil = (checked: boolean) => {
    setDarkVeilEnabled(checked);
    localStorage.setItem('darkVeilEnabled', JSON.stringify(checked));
    
    // Dispatch event to notify layout
    window.dispatchEvent(new CustomEvent('darkVeilToggle', { detail: checked }));
  };

  const exportData = () => {
    // Get data from localStorage
    const gameCards = localStorage.getItem('gameCards') || '[]';
    const tournaments = localStorage.getItem('tournaments') || '[]';
    
    const data = {
      gameCards: JSON.parse(gameCards),
      tournaments: JSON.parse(tournaments),
      settings: {
        darkVeilEnabled,
      },
      exportDate: new Date().toISOString(),
    };

    if (exportFormat === 'json') {
      // Export as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-center-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Export as Excel (CSV format)
      let csv = 'Type,Name,Time,Status,Created\n';
      
      // Add game cards
      data.gameCards.forEach((card: any) => {
        csv += `Game Card,"${card.title}",${card.time},${card.isRunning ? 'Running' : 'Stopped'},${new Date(card.id).toLocaleString()}\n`;
      });
      
      // Add tournaments
      data.tournaments.forEach((tournament: any) => {
        csv += `Tournament,"${tournament.name}",${tournament.players.length} players,Completed,${new Date().toLocaleString()}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-center-data-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Import data to localStorage
        if (data.gameCards) {
          localStorage.setItem('gameCards', JSON.stringify(data.gameCards));
        }
        if (data.tournaments) {
          localStorage.setItem('tournaments', JSON.stringify(data.tournaments));
        }
        if (data.settings?.darkVeilEnabled !== undefined) {
          setDarkVeilEnabled(data.settings.darkVeilEnabled);
          localStorage.setItem('darkVeilEnabled', JSON.stringify(data.settings.darkVeilEnabled));
          window.dispatchEvent(new CustomEvent('darkVeilToggle', { detail: data.settings.darkVeilEnabled }));
        }
        
        alert('Data imported successfully! Please refresh the page to see changes.');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('gameCards');
      localStorage.removeItem('tournaments');
      alert('All data cleared successfully!');
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 animate-in fade-in duration-500 pt-24">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-white animate-in fade-in slide-in-from-bottom-4 duration-700">{t('settings.title')}</h1>
        <p className="mt-2 text-zinc-400 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {t('settings.subtitle')}
        </p>

        {/* Two Column Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dark Veil Animation */}
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-xl font-semibold text-white">{t('settings.bgAnimation')}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('settings.bgDesc')}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkVeilEnabled ? (
                  <Eye className="w-5 h-5 text-primary transition-all duration-300" />
                ) : (
                  <EyeOff className="w-5 h-5 text-zinc-400 transition-all duration-300" />
                )}
                <span className="text-white font-medium">
                  {t('settings.darkVeil')}
                </span>
              </div>
              <Switch
                checked={darkVeilEnabled}
                onCheckedChange={toggleDarkVeil}
                className="transition-all duration-300"
              />
            </div>
          </section>

          {/* Theme Settings */}
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <h2 className="text-xl font-semibold text-white">{t('settings.display')}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('settings.displayDesc')}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-white mb-2">
                {t('settings.theme')}
              </label>
              <select className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300">
                <option value="system">{t('settings.system')}</option>
                <option value="light">{t('settings.light')}</option>
                <option value="dark">{t('settings.dark')}</option>
              </select>
            </div>
          </section>
        </div>

        {/* Full Width Section for Data Management */}
        <div className="mt-6">
          {/* Data Management */}
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <h2 className="text-xl font-semibold text-white">{t('settings.dataManagement')}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('settings.dataDesc')}
            </p>
            
            <div className="mt-6 space-y-4">
              {/* Export Format Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.exportFormat')}
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setExportFormat('json')}
                    variant={exportFormat === 'json' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    JSON
                  </Button>
                  <Button
                    onClick={() => setExportFormat('excel')}
                    variant={exportFormat === 'excel' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    Excel (CSV)
                  </Button>
                </div>
              </div>

              {/* Export and Import in Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Data */}
                <div>
                  <Button
                    onClick={exportData}
                    className="w-full transition-all duration-300 hover:scale-105"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t('settings.exportData')}
                  </Button>
                  <p className="text-xs text-zinc-400 mt-1">
                    {t('settings.exportDesc')}
                  </p>
                </div>

                {/* Import Data */}
                <div>
                  <label htmlFor="import-file">
                    <Button
                      className="w-full transition-all duration-300 hover:scale-105"
                      size="lg"
                      variant="outline"
                      onClick={() => document.getElementById('import-file')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {t('settings.importData')}
                    </Button>
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    {t('settings.importDesc')}
                  </p>
                </div>
              </div>

              {/* Clear Data */}
              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={clearAllData}
                  variant="destructive"
                  className="w-full transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  {t('settings.clearData')}
                </Button>
                <p className="text-xs text-red-400 mt-1">
                  {t('settings.clearWarning')}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Info Section - Full Width */}
        <div className="mt-6">
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <h2 className="text-xl font-semibold text-white">{t('settings.about')}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('settings.version')}
            </p>
            <div className="mt-4 space-y-1 text-sm text-zinc-400">
              <p>{t('settings.builtWith')}</p>
              <p>{t('settings.copyright')}</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
