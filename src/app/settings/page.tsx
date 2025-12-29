'use client';

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Download, Upload, FileSpreadsheet, Eye, EyeOff, DollarSign, User, Lock, Edit, Image as ImageIcon, X, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { numberToWords } from "@/utils/numberToWords";
import ShinyText from "@/components/ShinyText";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
export default function SettingsPage() {
  const {
    t,
    language
  } = useLanguage();
  const [darkVeilEnabled, setDarkVeilEnabled] = useState(true);
  const [darkVeilOpacity, setDarkVeilOpacity] = useState(0.5);
  const [darkVeilTint, setDarkVeilTint] = useState<string>('#ffffff');
  const [exportFormat, setExportFormat] = useState<'json' | 'excel'>('json');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [costPerHour, setCostPerHour] = useState('');
  const [gameCenterName, setGameCenterName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loadingEnabled, setLoadingEnabled] = useState(true);
  const [loadingDurationMs, setLoadingDurationMs] = useState(2000);
  useEffect(() => {
    const saved = localStorage.getItem('darkVeilEnabled');
    if (saved !== null) {
      setDarkVeilEnabled(JSON.parse(saved));
    }
    const savedOpacity = localStorage.getItem('darkVeilOpacity');
    if (savedOpacity !== null) {
      setDarkVeilOpacity(parseFloat(savedOpacity));
    }
    const savedTint = localStorage.getItem('darkVeilTint');
    if (savedTint) {
      setDarkVeilTint(savedTint);
    }
    const savedCost = localStorage.getItem('costPerHour');
    if (savedCost) {
      setCostPerHour(savedCost);
    }
    const savedLoadingEnabled = localStorage.getItem('loadingEnabled');
    if (savedLoadingEnabled !== null) {
      setLoadingEnabled(JSON.parse(savedLoadingEnabled));
    }
    const savedLoadingDuration = localStorage.getItem('loadingDurationMs');
    if (savedLoadingDuration !== null && !isNaN(parseInt(savedLoadingDuration))) {
      setLoadingDurationMs(parseInt(savedLoadingDuration));
    }

    const savedName = localStorage.getItem('gameCenterName');
    if (savedName) {
      setGameCenterName(savedName);
    }
    const savedBgImage = localStorage.getItem('backgroundImage');
    if (savedBgImage) {
      setBackgroundImage(savedBgImage);
    }
  }, []);
  const toggleDarkVeil = (checked: boolean) => {
    setDarkVeilEnabled(checked);
    localStorage.setItem('darkVeilEnabled', JSON.stringify(checked));
    window.dispatchEvent(new CustomEvent('darkVeilToggle', {
      detail: checked
    }));
  };
  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0];
    setDarkVeilOpacity(newOpacity);
    localStorage.setItem('darkVeilOpacity', newOpacity.toString());
    window.dispatchEvent(new CustomEvent('darkVeilOpacityChange', {
      detail: newOpacity
    }));
  };
  const setDarkVeilTintAndPersist = (hex: string) => {
    setDarkVeilTint(hex);
    localStorage.setItem('darkVeilTint', hex);
    window.dispatchEvent(new CustomEvent('darkVeilTintChange', {
      detail: hex
    }));
  };
  const exportData = () => {
    const gameCards = localStorage.getItem('gameCards') || '[]';
    const tournaments = localStorage.getItem('tournaments') || '[]';
    const data = {
      gameCards: JSON.parse(gameCards),
      tournaments: JSON.parse(tournaments),
      settings: {
        darkVeilEnabled
      },
      exportDate: new Date().toISOString()
    };
    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-center-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let csv = 'Type,Name,Time,Status,Created\n';
      data.gameCards.forEach((card: any) => {
        csv += `Game Card,"${card.title}",${card.time},${card.isRunning ? 'Running' : 'Stopped'},${new Date(card.id).toLocaleString()}\n`;
      });
      data.tournaments.forEach((tournament: any) => {
        csv += `Tournament,"${tournament.name}",${tournament.players.length} players,Completed,${new Date().toLocaleString()}\n`;
      });
      const blob = new Blob([csv], {
        type: 'text/csv'
      });
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
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.gameCards) {
          localStorage.setItem('gameCards', JSON.stringify(data.gameCards));
        }
        if (data.tournaments) {
          localStorage.setItem('tournaments', JSON.stringify(data.tournaments));
        }
        if (data.settings?.darkVeilEnabled !== undefined) {
          setDarkVeilEnabled(data.settings.darkVeilEnabled);
          localStorage.setItem('darkVeilEnabled', JSON.stringify(data.settings.darkVeilEnabled));
          window.dispatchEvent(new CustomEvent('darkVeilToggle', {
            detail: data.settings.darkVeilEnabled
          }));
        }
        alert('Data imported successfully! Please refresh the page to see changes.');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };
  const clearAllData = () => {
    localStorage.removeItem('gameCards');
    localStorage.removeItem('tournaments');
    setShowClearDialog(false);
    alert(t('settings.clearWarning'));
  };
  const saveCostPerHour = () => {
    localStorage.setItem('costPerHour', costPerHour);
    alert(t('settings.nameUpdated'));
  };
  const updateGameCenterName = () => {
    if (gameCenterName.trim()) {
      localStorage.setItem('gameCenterName', gameCenterName);
      alert(t('settings.nameUpdated'));
      window.dispatchEvent(new CustomEvent('gameCenterNameChange', {
        detail: gameCenterName
      }));
    }
  };
  const updateCredentials = () => {
    const savedPassword = localStorage.getItem('adminPassword');
    if (currentPassword !== savedPassword) {
      alert(t('login.invalidCredentials'));
      return;
    }
    if (newUsername.trim()) {
      localStorage.setItem('adminUsername', newUsername);
    }
    if (newPassword.trim()) {
      localStorage.setItem('adminPassword', newPassword);
    }
    setCurrentPassword('');
    setNewUsername('');
    setNewPassword('');
    alert(t('settings.credentialsUpdated'));
  };
  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setBackgroundImage(result);
        localStorage.setItem('backgroundImage', result);
        window.dispatchEvent(new CustomEvent('backgroundImageChange', {
          detail: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const removeBackgroundImage = () => {
    setBackgroundImage(null);
    localStorage.removeItem('backgroundImage');
    window.dispatchEvent(new CustomEvent('backgroundImageChange', {
      detail: null
    }));
  };
  const costInWords = costPerHour && !isNaN(Number(costPerHour)) && Number(costPerHour) > 0 ? numberToWords(Number(costPerHour), language) : '';

  const saveLoadingSettings = (nextEnabled: boolean, nextDurationMs: number) => {
    localStorage.setItem('loadingEnabled', JSON.stringify(nextEnabled));
    localStorage.setItem('loadingDurationMs', String(nextDurationMs));

    window.dispatchEvent(new CustomEvent('loadingEnabledChange', { detail: nextEnabled }));
    window.dispatchEvent(new CustomEvent('loadingDurationChange', { detail: nextDurationMs }));
  };
  return <main className="min-h-screen py-10 animate-in fade-in duration-500 pt-24">
      <div className="mx-auto w-[80%]">
        <h1 className="text-3xl font-bold text-white animate-in fade-in slide-in-from-bottom-4 duration-700">{t('settings.title')}</h1>
        <ShinyText text={t('settings.subtitle')} disabled={false} speed={3} className="mt-2 text-zinc-400 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100" />

        {}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-xl font-semibold text-white">{t('settings.costPerHour')}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('settings.costPerHourDesc')}
            </p>
            <div className="mt-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input type="number" value={costPerHour} onChange={e => setCostPerHour(e.target.value)} placeholder={t('settings.enterCost')} className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300" />
              </div>
              {costInWords && <p className="mt-2 text-sm text-green-400 animate-in fade-in duration-300">
                  {costInWords} {language === 'fa' ? 'تومان' : 'toman'}
                </p>}
              <Button onClick={saveCostPerHour} className="w-full mt-3 transition-all duration-300 hover:scale-105">
                {t('update Price')}
              </Button>
            </div>
          </section>

          {}
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-xl font-semibold text-white">{language === 'fa' ? 'لودینگ' : 'Loading'}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {language === 'fa' ? 'کنترل نمایش لودینگ و زمان آن' : 'Control loading screen visibility and duration'}
            </p>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <Loader className={`w-5 h-5 transition-all duration-300 ${loadingEnabled ? 'text-primary' : 'text-zinc-400'}`} />
                  <div>
                    <span className="text-white font-medium block">{language === 'fa' ? 'نمایش لودینگ' : 'Show loading'}</span>
                    <span className="text-xs text-zinc-400">{language === 'fa' ? 'فعال/غیرفعال کردن لودینگ ابتدایی' : 'Enable/disable the startup loading screen'}</span>
                  </div>
                </div>
                <Switch
                  checked={loadingEnabled}
                  onCheckedChange={(checked) => {
                    setLoadingEnabled(checked);
                    saveLoadingSettings(checked, loadingDurationMs);
                  }}
                />
              </div>

              <div className={`p-4 bg-white/5 rounded-lg border border-white/10 transition-all ${loadingEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-zinc-300">{language === 'fa' ? 'زمان لودینگ' : 'Loading duration'}</span>
                  <span className="text-sm font-mono text-primary">{Math.round(loadingDurationMs / 100) / 10}s</span>
                </div>
                <Slider
                  defaultValue={[loadingDurationMs]}
                  min={0}
                  max={8000}
                  step={250}
                  onValueChange={(value) => {
                    const next = value[0] ?? 0;
                    setLoadingDurationMs(next);
                    saveLoadingSettings(loadingEnabled, next);
                  }}
                  className="w-full"
                />
                <p className="mt-2 text-xs text-zinc-400">
                  {language === 'fa'
                    ? 'اگر 0 باشد، لودینگ سریع بسته می‌شود.'
                    : 'If set to 0, loading will close immediately.'}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white">{t('settings.display')}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('settings.displayDesc')}
            </p>
            
            {}
            <div className="mt-4 mb-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  {darkVeilEnabled ? <Eye className="w-5 h-5 text-primary transition-all duration-300" /> : <EyeOff className="w-5 h-5 text-zinc-400 transition-all duration-300" />}
                  <div>
                    <span className="text-white font-medium block">{t('settings.darkVeil')}</span>
                    <span className="text-xs text-zinc-400">{t('settings.bgAnimation')}</span>
                  </div>
                </div>
                <Switch checked={darkVeilEnabled} onCheckedChange={toggleDarkVeil} />
              </div>

              {}
              {darkVeilEnabled && <div className="p-4 bg-white/5 rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-zinc-300">{t('settings.opacity')}</span>
                      <span className="text-sm font-mono text-primary">{Math.round(darkVeilOpacity * 100)}%</span>
                    </div>
                    <Slider defaultValue={[darkVeilOpacity]} max={1} step={0.05} onValueChange={handleOpacityChange} className="w-full" />
                  </div>

                </div>}
            </div>

            {}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                {t('settings.backgroundImage')}
              </label>
              
              {}
              <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-300 ${isDragging ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-white/40'}`}>
                {backgroundImage ? <div className="relative">
                    <img src={backgroundImage} alt="Background preview" className="w-full h-32 object-cover rounded-lg" />
                    <button onClick={removeBackgroundImage} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div> : <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
                    <p className="text-sm text-white mb-1">{t('settings.dragDropImage')}</p>
                    <p className="text-xs text-zinc-400">{t('settings.orClickUpload')}</p>
                  </div>}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${backgroundImage ? 'pointer-events-none' : ''}`}
                />
              </div>
            </div>

          </section>
        </div>


        {}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <h2 className="text-xl font-semibold text-white">{t('settings.adminSettings')}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('settings.adminDesc')}
            </p>
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.gameCenterName')}
                </label>
                <div className="relative">
                  <Edit className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input type="text" value={gameCenterName} onChange={e => setGameCenterName(e.target.value)} placeholder={t('settings.enterGameCenterName')} className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300" />
                </div>
                <Button onClick={updateGameCenterName} className="w-full mt-3 transition-all duration-300 hover:scale-105">
                  {t('settings.updateName')}
                </Button>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('settings.changeCredentials')}
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder={t('settings.username')} className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder={t('settings.currentPassword')} className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300" />
                  </div>
                  <hr className="border-white/10 my-2" />
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('settings.newPassword')} className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300" />
                  </div>
                </div>
                <Button onClick={updateCredentials} className="w-full mt-3 transition-all duration-300 hover:scale-105">
                  {t('settings.changeCredentials')}
                </Button>
              </div>
            </div>
          </section>

          {}
          <section className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <h2 className="text-xl font-semibold text-white">{t('settings.dataManagement')}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {t('settings.dataDesc')}
            </p>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              {}
              <label htmlFor="import-json-side">
                <Button className="w-full transition-all duration-300 hover:scale-105" size="sm" variant="outline" onClick={() => document.getElementById('import-json-side')?.click()}>
                  <Upload className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {t('settings.importJson')}
                </Button>
              </label>
              <input id="import-json-side" type="file" accept=".json" onChange={importData} className="hidden" />

              {}
              <Button onClick={() => {
              setExportFormat('json');
              exportData();
            }} className="w-full transition-all duration-300 hover:scale-105" size="sm">
                <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {t('settings.exportJson')}
              </Button>

              {}
              <label htmlFor="import-excel-side">
                <Button className="w-full transition-all duration-300 hover:scale-105" size="sm" variant="outline" onClick={() => document.getElementById('import-excel-side')?.click()}>
                  <Upload className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {t('settings.importExcel')}
                </Button>
              </label>
              <input id="import-excel-side" type="file" accept=".csv,.xlsx" onChange={importData} className="hidden" />

              {}
              <Button onClick={() => {
              setExportFormat('excel');
              exportData();
            }} className="w-full transition-all duration-300 hover:scale-105" size="sm">
                <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {t('settings.exportExcel')}
              </Button>
            </div>

            {}
            <div className="mt-6 pt-6 border-t border-white/10">
              <Button onClick={() => setShowClearDialog(true)} variant="destructive" className="w-full transition-all duration-300 hover:scale-105" size="lg">
                {t('settings.clearData')}
              </Button>
              <p className="text-xs text-red-400 mt-2 text-center">
                {t('settings.clearWarning')}
              </p>
            </div>
          </section>
        </div>

        {}
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

      {}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="bg-white/10 dark:bg-black/80 backdrop-blur-lg border border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('settings.clearDataConfirm')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              {t('settings.clearDataDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              {t('settings.cancelDelete')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={clearAllData} className="bg-red-600 hover:bg-red-700">
              {t('settings.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>;
}