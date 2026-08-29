import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppId =
  | 'calculator'
  | 'weather'
  | 'water'
  | 'steps'
  | 'calories'
  | 'news'
  | 'drama'
  | 'notes'
  | 'qr'
  | 'flashlight'
  | 'pdf';

export type LauncherApp = {
  id: AppId;
  label: string;
  subtitle: string;
  icon: string;
  color: 'coral' | 'blue' | 'aqua' | 'lime' | 'orange' | 'purple' | 'pink';
};

export const launcherApps: LauncherApp[] = [
  { id: 'calculator', label: 'Calculator', subtitle: 'Quick math', icon: 'grid', color: 'coral' },
  { id: 'weather', label: 'Weather', subtitle: '24° · Sunny', icon: 'sun', color: 'blue' },
  { id: 'water', label: 'Water', subtitle: '4 / 8 glasses', icon: 'droplet', color: 'aqua' },
  { id: 'steps', label: 'Steps', subtitle: '6,842 today', icon: 'activity', color: 'lime' },
  { id: 'calories', label: 'Calories', subtitle: '1,240 kcal', icon: 'zap', color: 'orange' },
  { id: 'news', label: 'News', subtitle: 'For you', icon: 'radio', color: 'purple' },
  { id: 'drama', label: 'Short drama', subtitle: 'Continue watching', icon: 'play', color: 'pink' },
  { id: 'notes', label: 'Notes', subtitle: 'Capture an idea', icon: 'edit-3', color: 'blue' },
  { id: 'qr', label: 'QR scanner', subtitle: 'Scan anything', icon: 'maximize', color: 'purple' },
  { id: 'flashlight', label: 'Flashlight', subtitle: 'Light it up', icon: 'sunrise', color: 'orange' },
  { id: 'pdf', label: 'PDF maker', subtitle: 'Make a document', icon: 'file-text', color: 'coral' },
];

const STORAGE_KEY = 'smart-launcher-preferences';

type LauncherState = {
  waterCount: number;
  calorieCount: number;
  visibleApps: AppId[];
  setWaterCount: (count: number) => void;
  setCalorieCount: (count: number) => void;
  toggleApp: (id: AppId) => void;
  isHydrated: boolean;
};

const LauncherContext = createContext<LauncherState | null>(null);

export function LauncherProvider({ children }: { children: React.ReactNode }) {
  const [waterCount, setWaterCount] = useState<number>(4);
  const [calorieCount, setCalorieCount] = useState<number>(1240);
  const [visibleApps, setVisibleApps] = useState<AppId[]>(launcherApps.map((app) => app.id));
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<{ waterCount: number; calorieCount: number; visibleApps: AppId[] }>;
          if (typeof parsed.waterCount === 'number') setWaterCount(Math.min(8, Math.max(0, parsed.waterCount)));
          if (typeof parsed.calorieCount === 'number') setCalorieCount(Math.max(0, parsed.calorieCount));
          if (Array.isArray(parsed.visibleApps) && parsed.visibleApps.length > 0) setVisibleApps(parsed.visibleApps);
        }
      })
      .catch(() => undefined)
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ waterCount, calorieCount, visibleApps })).catch(() => undefined);
  }, [calorieCount, isHydrated, visibleApps, waterCount]);

  const value = useMemo(
    () => ({
      waterCount,
      calorieCount,
      visibleApps,
      setWaterCount: (count: number) => setWaterCount(Math.min(8, Math.max(0, count))),
      setCalorieCount: (count: number) => setCalorieCount(Math.max(0, count)),
      toggleApp: (id: AppId) => {
        setVisibleApps((current) =>
          current.includes(id) ? current.filter((appId) => appId !== id) : [...current, id],
        );
      },
      isHydrated,
    }),
    [calorieCount, isHydrated, visibleApps, waterCount],
  );

  return <LauncherContext.Provider value={value}>{children}</LauncherContext.Provider>;
}

export function useLauncher() {
  const context = useContext(LauncherContext);
  if (!context) throw new Error('useLauncher must be used inside LauncherProvider');
  return context;
}