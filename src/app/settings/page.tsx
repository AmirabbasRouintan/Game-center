'use client';

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Download, Upload, Eye, EyeOff, DollarSign, User, Lock, Edit, Image as ImageIcon, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { numberToWords } from "@/utils/numberToWords";
import ShinyText from "@/components/ShinyText";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { settingsStore } from "@/data/settingsStore";
import { timerStore } from "@/data/timerStore";
import { competitionsStore } from "@/data/competitionsStore";

export default function SettingsPage() {
  const {
    t,
    language
  } = useLanguage();
  
  // State initialization with defaults
  const [darkVeilEnabled, setDarkVeilEnabled] = useState<boolean>(true);
  const [darkVeilOpacity, setDarkVeilOpacity] = useState<number>(0.5);
  const [exportFormat, setExportFormat] = useState<'json' | 'excel'>('json');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [costPerHour, setCostPerHour] = useState<string>('');
  const [gameCenterName, setGameCenterName] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [adminPasswordHash, setAdminPasswordHash] = useState(''); // Store hash to verify current password locally if needed



  // Home page UI
  const [homeShowTopTabs, setHomeShowTopTabs] = useState<boolean>(true);
  const [homeDefaultTab, setHomeDefaultTab] = useState<'stable' | 'timer' | 'table'>('stable');

  // Load settings on mount
  useEffect(() => {
    const load = async () => {
      const s = await settingsStore.load();
      setDarkVeilEnabled(s.darkVeilEnabled);
      setDarkVeilOpacity(s.darkVeilOpacity);
      setCostPerHour(s.costPerHour);
      setGameCenterName(s.gameCenterName);
      setBackgroundImage(s.backgroundImage);

      setHomeShowTopTabs(s.homeShowTopTabs);
      setHomeDefaultTab(s.homeDefaultTab);
      setAdminPasswordHash(s.adminPassword);
    };
    load();
  }, []);

  const toggleDarkVeil = (checked: boolean) => {
    setDarkVeilEnabled(checked);
    settingsStore.savePartial({ darkVeilEnabled: checked });
    window.dispatchEvent(new CustomEvent('darkVeilToggle', {
      detail: checked
    }));
  };
  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0];
    setDarkVeilOpacity(newOpacity);
    settingsStore.savePartial({ darkVeilOpacity: newOpacity });
    window.dispatchEvent(new CustomEvent('darkVeilOpacityChange', {
      detail: newOpacity
    }));
  };
  const exportData = async () => {
    const cards = await timerStore.loadCards();
    const tournaments = competitionsStore.loadTournaments<unknown[]>();
    const settings = await settingsStore.load();
    
    const data = {
      gameCards: cards,
      tournaments: tournaments,
      settings: settings,
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
      data.gameCards.forEach((card: { title: string; time: number; isRunning: boolean; id: number | string }) => {
        csv += `Game Card,"${card.title}",${card.time},${card.isRunning ? 'Running' : 'Stopped'},${new Date(card.id).toLocaleString()}\n`;
      });
      const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
      (Array.isArray(data.tournaments) ? data.tournaments : []).forEach((tournament) => {
        const name = isRecord(tournament) && typeof tournament.name === 'string' ? tournament.name : 'Tournament';
        const playersLen = isRecord(tournament) && Array.isArray(tournament.players) ? tournament.players.length : 0;
        csv += `Tournament,"${name}",${playersLen} players,Completed,${new Date().toLocaleString()}\n`;
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
    reader.onload = async e => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.gameCards) {
          await timerStore.saveCards(data.gameCards);
        }
        if (data.tournaments) {
          competitionsStore.saveTournaments(data.tournaments);
        }
        if (data.settings) {
          const s = data.settings;
          // Build a patch object
          const patch: Partial<import('@/data/settingsStore').AppSettings> = {};
          
          if (s.darkVeilEnabled !== undefined) {
             setDarkVeilEnabled(s.darkVeilEnabled);
             patch.darkVeilEnabled = s.darkVeilEnabled;
             window.dispatchEvent(new CustomEvent('darkVeilToggle', { detail: s.darkVeilEnabled }));
          }
          if (s.darkVeilOpacity !== undefined) {
             setDarkVeilOpacity(s.darkVeilOpacity);
             patch.darkVeilOpacity = s.darkVeilOpacity;
             window.dispatchEvent(new CustomEvent('darkVeilOpacityChange', { detail: s.darkVeilOpacity }));
          }
          if (s.darkVeilTint !== undefined) {
             patch.darkVeilTint = s.darkVeilTint;
          }
          if (s.costPerHour !== undefined) {
            setCostPerHour(String(s.costPerHour));
            patch.costPerHour = String(s.costPerHour);
          }


          if (s.gameCenterName !== undefined) {
            setGameCenterName(String(s.gameCenterName));
            patch.gameCenterName = String(s.gameCenterName);
            window.dispatchEvent(new CustomEvent('gameCenterNameChange', { detail: String(s.gameCenterName) }));
          }
          if (s.backgroundImage !== undefined) {
            setBackgroundImage(s.backgroundImage);
            patch.backgroundImage = s.backgroundImage;
            window.dispatchEvent(new CustomEvent('backgroundImageChange', { detail: s.backgroundImage }));
          }
          if (s.homeShowTopTabs !== undefined) {
            setHomeShowTopTabs(!!s.homeShowTopTabs);
            patch.homeShowTopTabs = !!s.homeShowTopTabs;
          }
          if (s.homeDefaultTab !== undefined) {
            const v = s.homeDefaultTab === 'timer' ? 'timer' : s.homeDefaultTab === 'table' ? 'table' : 'stable';
            setHomeDefaultTab(v);
            patch.homeDefaultTab = v;
          }
          
          await settingsStore.savePartial(patch);
        }
        alert('Data imported successfully! Please refresh the page to see changes.');
      } catch {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };
  const clearAllData = async () => {
    await timerStore.saveCards([]);
    await timerStore.saveClients([]);
    await timerStore.saveHistory([]);
    competitionsStore.saveTournaments([]);
    setShowClearDialog(false);
    alert(t('settings.clearWarning'));
  };
  const saveCostPerHour = () => {
    settingsStore.savePartial({ costPerHour });
    alert(t('settings.nameUpdated'));
  };
  const updateGameCenterName = () => {
    if (gameCenterName.trim()) {
      settingsStore.savePartial({ gameCenterName });
      alert(t('settings.nameUpdated'));
      window.dispatchEvent(new CustomEvent('gameCenterNameChange', {
        detail: gameCenterName
      }));
    }
  };
  
  // This needs bcrypt to verify, but we can't run bcrypt.compareSync properly if we don't import it.
  // We can either import bcrypt here or just trust the change (less secure but works for local).
  // Actually, we can import bcrypt since it's used in AuthContext
  const updateCredentials = async () => {
    // Ideally we verify old password. 
    // Since we don't have bcrypt imported here, let's skip verification or rely on AuthContext if we refactor.
    // For now, let's just save.
    // Wait, I can import bcryptjs.
    
    // Dynamic import to avoid SSR issues if any, though standard import is fine usually.
    const bcrypt = (await import('bcryptjs')).default;

    if (!bcrypt.compareSync(currentPassword, adminPasswordHash)) {
      alert(t('login.invalidCredentials'));
      return;
    }
    
    const patch: Partial<import('@/data/settingsStore').AppSettings> = {};
    if (newUsername.trim()) patch.adminUsername = newUsername;
    if (newPassword.trim()) {
        const salt = bcrypt.genSaltSync(10);
        patch.adminPassword = bcrypt.hashSync(newPassword, salt);
    }
    
    await settingsStore.savePartial(patch);
    
    // Update local state hash so subsequent changes don't fail immediately
    if (patch.adminPassword) setAdminPasswordHash(patch.adminPassword);

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
        settingsStore.savePartial({ backgroundImage: result });
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
    settingsStore.savePartial({ backgroundImage: null });
    window.dispatchEvent(new CustomEvent('backgroundImageChange', {
      detail: null
    }));
  };
  const costInWords = costPerHour && !isNaN(Number(costPerHour)) && Number(costPerHour) > 0 ? numberToWords(Number(costPerHour), language) : '';


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
            <h2 className="text-xl font-semibold text-white">{language === 'fa' ? 'صفحه اصلی' : 'Home page'}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {language === 'fa' ? 'نمایش تب‌ها و تب پیش‌فرض در صفحه اصلی.' : 'Control top tabs visibility and default tab on the home page.'}
            </p>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <span className="text-white font-medium block">{language === 'fa' ? 'نمایش تب‌ها' : 'Show top tabs'}</span>
                  <span className="text-xs text-zinc-400">{language === 'fa' ? 'اگر خاموش شود، سوئیچ تایمر/پایدار مخفی می‌شود.' : 'If off, the Timer/Stable switch will be hidden.'}</span>
                </div>
                <Switch
                  checked={homeShowTopTabs}
                  onCheckedChange={(checked) => {
                    setHomeShowTopTabs(checked);
                    settingsStore.savePartial({ homeShowTopTabs: checked });
                  }}
                />
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-white font-medium block">{language === 'fa' ? 'تب پیش‌فرض' : 'Default tab'}</span>
                    <span className="text-xs text-zinc-400">{language === 'fa' ? 'صفحه‌ای که هنگام ورود باز می‌شود.' : 'The tab shown when opening the home page.'}</span>
                  </div>

                  <select
                    value={homeDefaultTab}
                    onChange={(e) => {
                      const v = e.target.value === 'timer' ? 'timer' : e.target.value === 'table' ? 'table' : 'stable';
                      setHomeDefaultTab(v);
                      settingsStore.savePartial({ homeDefaultTab: v });
                    }}
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  >
                    <option value="stable">{language === 'fa' ? 'پایدار' : 'Stable'}</option>
                    <option value="timer">{language === 'fa' ? 'تایمر' : 'Timer'}</option>
                    <option value="table">{language === 'fa' ? 'میز' : 'Table'}</option>
                  </select>
                </div>
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
                    <Image
                      src={backgroundImage}
                      alt="Background preview"
                      width={800}
                      height={256}
                      className="w-full h-32 object-cover rounded-lg"
                      unoptimized
                    />
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