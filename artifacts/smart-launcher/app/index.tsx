import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Pedometer } from 'expo-sensors';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { LauncherApp, launcherApps, useLauncher } from '@/context/LauncherContext';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const cardColors = {
  coral: '#FF765C',
  blue: '#5D8BFF',
  aqua: '#2BC8C3',
  lime: '#A4CF57',
  orange: '#F5A43A',
  purple: '#8E73E8',
  pink: '#E477B4',
};

const appImages = {
  news: require('@/assets/images/news-coast.png'),
  drama: require('@/assets/images/drama-lanterns.png'),
};

function AppIcon({ app, size = 54 }: { app: LauncherApp; size?: number }) {
  return (
    <View style={[styles.appIcon, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: cardColors[app.color] }]}>
      <Feather name={app.icon as FeatherName} size={size * 0.42} color="#FFFFFF" />
    </View>
  );
}

function HomeAppTile({ app, onPress }: { app: LauncherApp; onPress: () => void }) {
  return (
    <Pressable
      testID={`app-tile-${app.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.appTile, pressed && styles.pressed]}
    >
      <AppIcon app={app} />
      <Text numberOfLines={1} style={styles.appLabel}>{app.label}</Text>
      <Text numberOfLines={1} style={styles.appSubtitle}>{app.subtitle}</Text>
    </Pressable>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CalculatorModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const colors = useColors();
  const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', 'C', '0', '=', '+'];

  const handleKey = (key: string) => {
    Haptics.selectionAsync();
    if (key === 'C') return setDisplay('0');
    if (key === '=') {
      try {
        const expression = display.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
        // eslint-disable-next-line no-new-func
        const answer = Function(`"use strict"; return (${expression})`)();
        setDisplay(Number.isFinite(answer) ? String(answer) : 'Error');
      } catch {
        setDisplay('Error');
      }
      return;
    }
    setDisplay((current) => (current === '0' || current === 'Error' ? key : `${current}${key}`));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.eyebrow}>UTILITY</Text>
              <Text style={styles.modalTitle}>Calculator</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} testID="close-calculator">
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.calculatorDisplay, { backgroundColor: colors.card }]}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.calculatorText}>{display}</Text>
          </View>
          <View style={styles.calculatorKeys}>
            {keys.map((key) => (
              <Pressable
                key={key}
                onPress={() => handleKey(key)}
                style={({ pressed }) => [
                  styles.calculatorKey,
                  key === '=' && styles.calculatorEqual,
                  ['÷', '×', '−', '+'].includes(key) && styles.calculatorOperator,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.calculatorKeyText, (key === '=' || ['÷', '×', '−', '+'].includes(key)) && styles.calculatorAccentText]}>{key}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ManageAppsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { visibleApps, toggleApp } = useLauncher();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, styles.manageSheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.eyebrow}>PERSONALIZE</Text>
              <Text style={styles.modalTitle}>Your apps</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} testID="close-app-manager">
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
          </View>
          <Text style={styles.modalDescription}>Choose the tools you want on your home screen.</Text>
          {launcherApps.map((app) => {
            const selected = visibleApps.includes(app.id);
            return (
              <Pressable key={app.id} onPress={() => toggleApp(app.id)} style={styles.manageRow}>
                <AppIcon app={app} size={44} />
                <View style={styles.manageCopy}>
                  <Text style={styles.manageLabel}>{app.label}</Text>
                  <Text style={styles.manageSubtitle}>{app.subtitle}</Text>
                </View>
                <View style={[styles.check, selected && styles.checkSelected]}>
                  {selected ? <Feather name="check" size={16} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
          <Pressable onPress={onClose} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function useActivityData() {
  const [steps, setSteps] = useState<number | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      if (Platform.OS === 'web') return;
      const supported = await Pedometer.isAvailableAsync();
      if (!mounted) return;
      setAvailable(supported);
      if (!supported) return;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const result = await Pedometer.getStepCountAsync(start, new Date());
      if (mounted) setSteps(result.steps);
    };
    refresh().catch(() => mounted && setAvailable(false));
    const interval = setInterval(() => refresh().catch(() => undefined), 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { steps, available };
}

const dramaReels = [
  { id: 'drama-1', title: 'Somewhere between hello and goodbye', subtitle: 'Episode 04 · The last train home', duration: '12:08', tint: '#E477B4' },
  { id: 'drama-2', title: 'The message she never sent', subtitle: 'Episode 02 · Read at 2:17 AM', duration: '08:42', tint: '#8E73E8' },
  { id: 'drama-3', title: 'A little more time', subtitle: 'Episode 01 · New today', duration: '06:15', tint: '#FF765C' },
];

function DramaReelsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.reelsScreen, { backgroundColor: '#13182B', paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
        <FlatList
          data={dramaReels}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.reel}>
              <Image source={appImages.drama} style={styles.reelImage} resizeMode="cover" />
              <View style={[styles.reelTint, { backgroundColor: item.tint, opacity: 0.18 }]} />
              <LinearGradient colors={['transparent', 'rgba(13, 17, 34, 0.92)']} style={styles.reelGradient} />
              <View style={styles.reelTop}><Text style={styles.reelLogo}>short drama</Text><Pressable onPress={onClose} style={styles.reelClose}><Feather name="x" size={20} color="#FFFFFF" /></Pressable></View>
              <View style={styles.reelCopy}><View style={styles.reelTag}><Feather name="play" size={11} color="#FFD275" /><Text style={styles.reelTagText}>FOR YOU · {item.duration} LEFT</Text></View><Text style={styles.reelTitle}>{item.title}</Text><Text style={styles.reelSubtitle}>{item.subtitle}</Text><Pressable style={styles.watchButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}><Feather name="play" size={15} color="#202A45" /><Text style={styles.watchButtonText}>Watch now</Text></Pressable></View>
              <View style={styles.reelSide}><Pressable style={styles.reelSideButton}><Feather name="heart" size={23} color="#FFFFFF" /><Text style={styles.reelSideText}>Like</Text></Pressable><Pressable style={styles.reelSideButton}><Feather name="bookmark" size={23} color="#FFFFFF" /><Text style={styles.reelSideText}>Save</Text></Pressable><Pressable style={styles.reelSideButton}><Feather name="share-2" size={22} color="#FFFFFF" /><Text style={styles.reelSideText}>Share</Text></Pressable></View>
            </View>
          )}
        />
        <View style={styles.reelHint}><Feather name="chevron-up" size={16} color="#FFFFFF" /><Text style={styles.reelHintText}>Swipe for next</Text></View>
      </View>
    </Modal>
  );
}

const newsFeed = [
  { id: 'n1', category: 'WORLD', time: '12 min ago', title: 'The small cities building a bigger future', summary: 'Across the country, a new generation of makers is choosing community over the commute.', image: appImages.news },
  { id: 'n2', category: 'IDEAS', time: '28 min ago', title: 'Why the best mornings start a little slower', summary: 'A practical case for making room before the day begins asking for it.', image: appImages.news },
  { id: 'n3', category: 'CULTURE', time: '1 hr ago', title: 'The return of the long conversation', summary: 'What we gain when we stop trying to fit every thought into a headline.', image: appImages.news },
];

function NewsFeedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.feedScreen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
        <View style={styles.feedHeader}><View><Text style={styles.eyebrow}>YOUR DAILY BRIEF</Text><Text style={styles.feedTitle}>News, with room to think.</Text></View><Pressable onPress={onClose} style={styles.closeButton}><Feather name="x" size={20} color={colors.foreground} /></Pressable></View>
        <Text style={styles.feedDescription}>A thoughtful feed built from your news API. Stories will appear here once your endpoint is connected.</Text>
        <FlatList
          data={newsFeed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [styles.feedItem, pressed && styles.pressed]}>
              <Image source={item.image} style={styles.feedImage} />
              <View style={styles.feedItemCopy}><View style={styles.feedMeta}><Text style={styles.feedCategory}>{item.category}</Text><Text style={styles.feedTime}>{item.time}</Text></View><Text style={styles.feedItemTitle}>{item.title}</Text><Text style={styles.feedSummary}>{item.summary}</Text><View style={styles.feedRead}><Text style={styles.feedReadText}>Read story</Text><Feather name="arrow-up-right" size={15} color="#7383B8" /></View></View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

function NotesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('smart-launcher-note').then((value) => value && setNote(value)).catch(() => undefined);
  }, []);
  const save = async () => {
    await AsyncStorage.setItem('smart-launcher-note', note);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSaved(false), 1800);
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
        <View style={styles.sheetHandle} /><View style={styles.modalHeader}><View><Text style={styles.eyebrow}>CAPTURE</Text><Text style={styles.modalTitle}>Notes</Text></View><Pressable onPress={onClose} style={styles.closeButton}><Feather name="x" size={20} color={colors.foreground} /></Pressable></View>
        <TextInput multiline value={note} onChangeText={setNote} placeholder="Write an idea before it gets away..." placeholderTextColor="#9AA2B7" style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.card }]} textAlignVertical="top" />
        <Pressable onPress={save} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}><Text style={styles.doneButtonText}>{saved ? 'Saved' : 'Save note'}</Text></Pressable>
      </View></View>
    </Modal>
  );
}

function ScannerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.scannerScreen, { paddingTop: Platform.OS === 'web' ? 67 : 0 }]}>
        {Platform.OS === 'web' ? <View style={styles.scannerFallback}><Feather name="maximize" size={40} color="#FFD275" /><Text style={styles.scannerTitle}>QR scanner</Text><Text style={styles.scannerCopy}>Open this tool on your Android phone to use the camera scanner.</Text><Pressable onPress={onClose} style={styles.doneButton}><Text style={styles.doneButtonText}>Close</Text></Pressable></View> : !permission?.granted ? <View style={styles.scannerFallback}><Feather name="camera" size={40} color="#FFD275" /><Text style={styles.scannerTitle}>Camera access</Text><Text style={styles.scannerCopy}>Allow camera access to scan QR codes and links.</Text><Pressable onPress={requestPermission} style={styles.doneButton}><Text style={styles.doneButtonText}>Allow camera</Text></Pressable></View> : <><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : ({ data }) => setScanned(data)} /><View style={styles.scannerOverlay}><View style={styles.scannerHeader}><Text style={styles.reelLogo}>QR scanner</Text><Pressable onPress={onClose} style={styles.reelClose}><Feather name="x" size={20} color="#FFFFFF" /></Pressable></View><View style={styles.scanBox}><View style={styles.scanCornerTopLeft} /><View style={styles.scanCornerTopRight} /><View style={styles.scanCornerBottomLeft} /><View style={styles.scanCornerBottomRight} /></View><Text style={styles.scanHint}>{scanned ? `Found: ${scanned}` : 'Point your camera at a QR code'}</Text>{scanned ? <Pressable onPress={() => setScanned(null)} style={styles.scanAgain}><Text style={styles.scanAgainText}>Scan another</Text></Pressable> : null}</View></>}
      </View>
    </Modal>
  );
}

function TorchModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [torchOn, setTorchOn] = useState(false);
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.torchScreen, { backgroundColor: torchOn ? '#FFF4D7' : '#11162A' }]}><Pressable onPress={onClose} style={styles.torchClose}><Feather name="x" size={21} color={torchOn ? '#202A45' : '#FFFFFF'} /></Pressable><Pressable onPress={() => setTorchOn((value) => !value)} style={[styles.torchButton, torchOn && styles.torchButtonOn]}><Feather name="sun" size={50} color={torchOn ? '#202A45' : '#FFD275'} /><Text style={[styles.torchLabel, torchOn && styles.torchLabelOn]}>{torchOn ? 'Tap to turn off' : 'Tap to turn on'}</Text></Pressable><Text style={[styles.torchHint, torchOn && styles.torchLabelOn]}>Flashlight</Text></View>
    </Modal>
  );
}

function PdfMakerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [creating, setCreating] = useState(false);
  const createPdf = async () => {
    if (!title.trim() && !body.trim()) return Alert.alert('Add some content', 'Enter a title or a note before making your PDF.');
    setCreating(true);
    try {
      const result = await Print.printToFileAsync({ html: `<html><body style="font-family: Arial; padding: 36px;"><h1>${title || 'Untitled note'}</h1><p>${body.replaceAll('\n', '<br/>')}</p></body></html>` });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
      else Alert.alert('PDF ready', 'Your PDF was created successfully.');
    } catch {
      Alert.alert('Could not create PDF', 'Please try again on your Android device.');
    } finally {
      setCreating(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={[styles.modalSheet, { backgroundColor: colors.background }]}><View style={styles.sheetHandle} /><View style={styles.modalHeader}><View><Text style={styles.eyebrow}>MAKE SOMETHING</Text><Text style={styles.modalTitle}>PDF maker</Text></View><Pressable onPress={onClose} style={styles.closeButton}><Feather name="x" size={20} color={colors.foreground} /></Pressable></View><TextInput value={title} onChangeText={setTitle} placeholder="Document title" placeholderTextColor="#9AA2B7" style={[styles.singleLineInput, { color: colors.foreground, backgroundColor: colors.card }]} /><TextInput multiline value={body} onChangeText={setBody} placeholder="Start writing..." placeholderTextColor="#9AA2B7" style={[styles.pdfBodyInput, { color: colors.foreground, backgroundColor: colors.card }]} textAlignVertical="top" /><Pressable onPress={createPdf} disabled={creating} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed, creating && { opacity: 0.6 }]}><Text style={styles.doneButtonText}>{creating ? 'Making PDF…' : 'Create and share PDF'}</Text></Pressable></View></View></Modal>
  );
}

function ToolModal({ app, onClose }: { app: LauncherApp | null; onClose: () => void }) {
  const colors = useColors();
  const { waterCount, setWaterCount, calorieCount, setCalorieCount } = useLauncher();
  const { steps, available } = useActivityData();
  if (!app || ['calculator', 'news', 'drama', 'notes', 'qr', 'flashlight', 'pdf'].includes(app.id)) return null;
  const details: Record<'weather' | 'water' | 'steps' | 'calories', { overline: string; title: string; copy: string; metric: string; unit: string }> = {
    weather: { overline: 'TODAY · BENGALURU', title: 'Bright and easy', copy: 'Perfect weather for a walk or a coffee outside.', metric: '24°', unit: 'Sunny · feels like 25°' },
    water: { overline: 'HYDRATION', title: 'Keep the rhythm', copy: 'Small sips add up. You are halfway to your daily goal.', metric: `${waterCount}/8`, unit: 'glasses today' },
    steps: { overline: 'MOVEMENT', title: 'You are on a roll', copy: available ? 'Measured from your phone today. A little more movement gets you to your daily target.' : 'Step tracking becomes available when you open the app on an Android phone with motion access.', metric: steps === null ? '--' : steps.toLocaleString(), unit: available ? 'steps today' : 'Android sensor unavailable' },
    calories: { overline: 'ENERGY', title: 'Your activity burn', copy: 'This is an estimate based on steps, not food intake. Use the buttons below to record calories manually.', metric: calorieCount.toLocaleString(), unit: 'calories logged' },
  };
  const detail = details[app.id as keyof typeof details];
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <AppIcon app={app} size={42} />
              <View>
                <Text style={styles.eyebrow}>{detail.overline}</Text>
                <Text style={styles.modalTitle}>{detail.title}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.detailMetric, { backgroundColor: colors.card }]}>
            <Text style={styles.detailMetricValue}>{detail.metric}</Text>
            <Text style={styles.detailMetricUnit}>{detail.unit}</Text>
          </View>
          <Text style={styles.detailCopy}>{detail.copy}</Text>
          {app.id === 'water' ? (
            <View style={styles.waterActions}>
              <Pressable onPress={() => setWaterCount(waterCount - 1)} style={styles.circleAction}><Feather name="minus" size={18} color={colors.foreground} /></Pressable>
              <Text style={styles.waterActionLabel}>Log a glass</Text>
              <Pressable onPress={() => { setWaterCount(waterCount + 1); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} style={[styles.circleAction, styles.circleActionPrimary]}><Feather name="plus" size={18} color="#FFFFFF" /></Pressable>
            </View>
          ) : app.id === 'calories' ? (
            <View style={styles.waterActions}>
              <Pressable onPress={() => setCalorieCount(calorieCount - 100)} style={styles.circleAction}><Feather name="minus" size={18} color={colors.foreground} /></Pressable>
              <Text style={styles.waterActionLabel}>Log 100 kcal</Text>
              <Pressable onPress={() => { setCalorieCount(calorieCount + 100); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} style={[styles.circleAction, styles.circleActionPrimary]}><Feather name="plus" size={18} color="#FFFFFF" /></Pressable>
            </View>
          ) : (
            <Pressable onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>{app.id === 'drama' ? 'Keep watching' : app.id === 'news' ? 'Read the brief' : 'Got it'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function LauncherHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { visibleApps, waterCount } = useLauncher();
  const { steps, available: stepsAvailable } = useActivityData();
  const [query, setQuery] = useState('');
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [manageVisible, setManageVisible] = useState(false);
  const [newsVisible, setNewsVisible] = useState(false);
  const [dramaVisible, setDramaVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [torchVisible, setTorchVisible] = useState(false);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LauncherApp | null>(null);

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  }, []);
  const filteredApps = launcherApps.filter((app) => visibleApps.includes(app.id) && app.label.toLowerCase().includes(query.toLowerCase()));
  const openApp = (app: LauncherApp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (app.id === 'calculator') setCalculatorVisible(true);
    else if (app.id === 'news') setNewsVisible(true);
    else if (app.id === 'drama') setDramaVisible(true);
    else if (app.id === 'notes') setNotesVisible(true);
    else if (app.id === 'qr') setScannerVisible(true);
    else if (app.id === 'flashlight') setTorchVisible(true);
    else if (app.id === 'pdf') setPdfVisible(true);
    else setSelectedApp(app);
  };
  const stepsLabel = steps === null ? '--' : steps.toLocaleString();
  const movementPercent = steps === null ? 0 : Math.min(100, Math.round((steps / 10000) * 100));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>{dateLabel.toUpperCase()}</Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>Good morning, A.</Text>
          </View>
          <Pressable onPress={() => setManageVisible(true)} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]} testID="open-settings">
            <Text style={styles.avatarText}>A</Text>
            <View style={styles.onlineDot} />
          </Pressable>
        </View>

        <View style={styles.clockRow}>
          <Text style={[styles.clock, { color: colors.foreground }]}>{new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date())}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={19} color={colors.mutedForeground} />
          <TextInput
            testID="launcher-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Search your apps"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
          {query ? <Pressable onPress={() => setQuery('')}><Feather name="x-circle" size={18} color={colors.mutedForeground} /></Pressable> : <View style={styles.searchShortcut}><Text style={styles.searchShortcutText}>⌘ K</Text></View>}
        </View>

        <LinearGradient colors={['#202B50', '#17203B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>YOUR DAY AT A GLANCE</Text>
            <Text style={styles.heroTitle}>Make space for{'\n'}what matters.</Text>
            <Text style={styles.heroBody}>You have a calm, clear day ahead.</Text>
          </View>
          <View style={styles.heroOrb}><Feather name="sun" size={27} color="#FFD275" /></View>
          <View style={styles.heroLine}><View style={styles.heroLineFill} /></View>
        </LinearGradient>

        <SectionHeader title="Your apps" action="Manage" onAction={() => setManageVisible(true)} />
        <View style={styles.appGrid}>
          {filteredApps.map((app) => <HomeAppTile key={app.id} app={app} onPress={() => openApp(app)} />)}
          {!filteredApps.length ? (
            <View style={styles.emptyApps}>
              <Feather name="search" size={22} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>No apps found</Text>
            </View>
          ) : null}
        </View>

        <SectionHeader title="Today" />
        <View style={styles.todayGrid}>
          <Pressable onPress={() => openApp(launcherApps.find((app) => app.id === 'water')!)} style={({ pressed }) => [styles.waterCard, pressed && styles.pressed]}>
            <View style={styles.todayHeader}><View style={[styles.miniIcon, { backgroundColor: cardColors.aqua }]}><Feather name="droplet" size={15} color="#FFFFFF" /></View><Text style={styles.todayLabel}>Hydration</Text><Feather name="arrow-up-right" size={16} color={colors.mutedForeground} /></View>
            <Text style={styles.waterValue}>{waterCount}<Text style={styles.waterGoal}> / 8</Text></Text>
            <Text style={styles.todayMeta}>glasses today</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, (waterCount / 8) * 100)}%`, backgroundColor: cardColors.aqua }]} /></View>
          </Pressable>
          <Pressable onPress={() => openApp(launcherApps.find((app) => app.id === 'steps')!)} style={({ pressed }) => [styles.stepsCard, pressed && styles.pressed]}>
            <View style={styles.todayHeader}><View style={[styles.miniIcon, { backgroundColor: cardColors.lime }]}><Feather name="activity" size={15} color="#FFFFFF" /></View><Text style={styles.todayLabel}>Movement</Text><Feather name="arrow-up-right" size={16} color={colors.mutedForeground} /></View>
            <Text style={styles.stepsValue}>{stepsLabel}</Text>
            <Text style={styles.todayMeta}>steps · <Text style={styles.stepsAccent}>{stepsAvailable ? `${movementPercent}%` : 'Android only'}</Text> of goal</Text>
            <View style={styles.stepDots}>{Array.from({ length: 12 }).map((_, index) => <View key={index} style={[styles.stepDot, index < Math.round((movementPercent / 100) * 12) && styles.stepDotActive]} />)}</View>
          </Pressable>
        </View>

        <SectionHeader title="For you" action="See all" onAction={() => openApp(launcherApps.find((app) => app.id === 'news')!)} />
        <View style={styles.featureRow}>
          <Pressable onPress={() => openApp(launcherApps.find((app) => app.id === 'news')!)} style={({ pressed }) => [styles.storyCard, pressed && styles.pressed]}>
            <Image source={appImages.news} style={styles.storyImage} />
            <View style={styles.storyOverlay} />
            <View style={styles.storyCopy}><Text style={styles.storyTag}>THE DAILY BRIEF</Text><Text style={styles.storyTitle}>The small cities building a bigger future</Text><View style={styles.storyMeta}><Text style={styles.storyMetaText}>4 min read</Text><Feather name="arrow-up-right" size={15} color="#FFFFFF" /></View></View>
          </Pressable>
          <Pressable onPress={() => openApp(launcherApps.find((app) => app.id === 'drama')!)} style={({ pressed }) => [styles.storyCard, pressed && styles.pressed]}>
            <Image source={appImages.drama} style={styles.storyImage} />
            <View style={styles.storyOverlay} />
            <View style={styles.storyCopy}><Text style={styles.storyTag}>SHORT DRAMA</Text><Text style={styles.storyTitle}>Somewhere between hello and goodbye</Text><View style={styles.storyMeta}><Text style={styles.storyMetaText}>12 min left</Text><Feather name="play" size={15} color="#FFFFFF" /></View></View>
          </Pressable>
        </View>
        <View style={styles.footerNote}><View style={styles.footerDot} /><Text style={styles.footerText}>Everything you need, right where you left it.</Text></View>
      </ScrollView>
      <CalculatorModal visible={calculatorVisible} onClose={() => setCalculatorVisible(false)} />
      <ManageAppsModal visible={manageVisible} onClose={() => setManageVisible(false)} />
      <ToolModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      <NewsFeedModal visible={newsVisible} onClose={() => setNewsVisible(false)} />
      <DramaReelsModal visible={dramaVisible} onClose={() => setDramaVisible(false)} />
      <NotesModal visible={notesVisible} onClose={() => setNotesVisible(false)} />
      <ScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} />
      <TorchModal visible={torchVisible} onClose={() => setTorchVisible(false)} />
      <PdfMakerModal visible={pdfVisible} onClose={() => setPdfVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#8790A8', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.35 },
  greeting: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.6, marginTop: 5 },
  avatar: { width: 43, height: 43, borderRadius: 16, backgroundColor: '#202B50', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { color: '#FFD275', fontFamily: 'Inter_700Bold', fontSize: 17 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#A4CF57', borderWidth: 2, borderColor: '#F7F8FC', position: 'absolute', right: -1, bottom: -1 },
  clockRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 23, gap: 10 },
  clock: { fontFamily: 'Inter_700Bold', fontSize: 46, letterSpacing: -2.6 },
  date: { color: '#8790A8', fontFamily: 'Inter_500Medium', fontSize: 12 },
  searchWrap: { height: 48, backgroundColor: '#F0F2F7', borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 21 },
  searchInput: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, marginLeft: 10, paddingVertical: 0 },
  searchShortcut: { backgroundColor: '#FFFFFF', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  searchShortcutText: { color: '#9AA2B7', fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  heroCard: { height: 156, borderRadius: 24, marginTop: 18, padding: 20, overflow: 'hidden', position: 'relative' },
  heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -52, top: -68, backgroundColor: 'rgba(255, 210, 117, 0.09)' },
  heroCopy: { zIndex: 1 },
  heroEyebrow: { color: '#96A2C8', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.25 },
  heroTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.85, lineHeight: 27, marginTop: 7 },
  heroBody: { color: '#AEB8D2', fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 8 },
  heroOrb: { position: 'absolute', right: 24, top: 31, width: 55, height: 55, borderRadius: 28, backgroundColor: 'rgba(255, 210, 117, 0.14)', alignItems: 'center', justifyContent: 'center' },
  heroLine: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 3, borderRadius: 2, backgroundColor: '#303B5D' },
  heroLineFill: { width: '42%', height: 3, borderRadius: 2, backgroundColor: '#FFD275' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 13 },
  sectionTitle: { color: '#1F2740', fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.4 },
  sectionAction: { color: '#7383B8', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  appTile: { width: '25%', alignItems: 'center', paddingHorizontal: 5, marginBottom: 19 },
  appIcon: { alignItems: 'center', justifyContent: 'center' },
  appLabel: { color: '#27304A', fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 8, maxWidth: 83 },
  appSubtitle: { color: '#99A0B3', fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 3, maxWidth: 88 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  emptyApps: { width: '100%', alignItems: 'center', paddingVertical: 22, gap: 8 },
  emptyText: { color: '#99A0B3', fontFamily: 'Inter_500Medium', fontSize: 13 },
  todayGrid: { flexDirection: 'row', gap: 12 },
  waterCard: { flex: 1, backgroundColor: '#E8F7F5', borderRadius: 20, padding: 15, minHeight: 149 },
  stepsCard: { flex: 1, backgroundColor: '#F2F7E7', borderRadius: 20, padding: 15, minHeight: 149 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  miniIcon: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  todayLabel: { flex: 1, color: '#4C5A65', fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  waterValue: { color: '#1F5960', fontFamily: 'Inter_700Bold', fontSize: 31, letterSpacing: -1, marginTop: 13 },
  waterGoal: { color: '#75A5A3', fontSize: 17 },
  stepsValue: { color: '#526633', fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -1, marginTop: 17 },
  todayMeta: { color: '#7A9393', fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 2 },
  stepsAccent: { color: '#71983D', fontFamily: 'Inter_700Bold' },
  progressTrack: { height: 5, backgroundColor: '#C9E9E3', borderRadius: 3, marginTop: 15, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  stepDots: { flexDirection: 'row', gap: 3, marginTop: 16 },
  stepDot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#DBEAC2' },
  stepDotActive: { backgroundColor: '#A4CF57' },
  featureRow: { flexDirection: 'row', gap: 12 },
  storyCard: { flex: 1, height: 204, borderRadius: 19, overflow: 'hidden', position: 'relative', backgroundColor: '#202B50' },
  storyImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  storyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 27, 49, 0.48)' },
  storyCopy: { position: 'absolute', left: 14, right: 12, bottom: 13 },
  storyTag: { color: '#FFD275', fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1.15 },
  storyTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 18, letterSpacing: -0.35, marginTop: 6 },
  storyMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  storyMetaText: { color: '#D2D8E8', fontFamily: 'Inter_500Medium', fontSize: 10 },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 26 },
  footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A4CF57' },
  footerText: { color: '#9AA2B7', fontFamily: 'Inter_400Regular', fontSize: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(16, 22, 42, 0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 28, paddingTop: 11, minHeight: 390 },
  manageSheet: { minHeight: 570 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#D8DCE7', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  modalTitle: { color: '#202A45', fontFamily: 'Inter_700Bold', fontSize: 23, letterSpacing: -0.75, marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F2F7', alignItems: 'center', justifyContent: 'center' },
  modalDescription: { color: '#81899D', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 6, marginBottom: 14 },
  featureImage: { width: '100%', height: 132, borderRadius: 18, marginTop: 19 },
  detailMetric: { borderRadius: 18, padding: 15, marginTop: 17 },
  detailMetricValue: { color: '#202A45', fontFamily: 'Inter_700Bold', fontSize: 33, letterSpacing: -1.2 },
  detailMetricUnit: { color: '#8891A6', fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  detailCopy: { color: '#687188', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 16 },
  doneButton: { height: 51, borderRadius: 16, backgroundColor: '#202B50', alignItems: 'center', justifyContent: 'center', marginTop: 21 },
  doneButtonText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
  waterActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 },
  circleAction: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#F0F2F7', alignItems: 'center', justifyContent: 'center' },
  circleActionPrimary: { backgroundColor: '#2BC8C3' },
  waterActionLabel: { color: '#44516E', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  manageRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  manageCopy: { flex: 1, marginLeft: 12 },
  manageLabel: { color: '#2A334D', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  manageSubtitle: { color: '#9AA2B7', fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  check: { width: 25, height: 25, borderRadius: 9, borderWidth: 1.5, borderColor: '#DDE1EA', alignItems: 'center', justifyContent: 'center' },
  checkSelected: { backgroundColor: '#7383B8', borderColor: '#7383B8' },
  calculatorDisplay: { borderRadius: 18, padding: 20, alignItems: 'flex-end', marginTop: 20, minHeight: 82, justifyContent: 'center' },
  calculatorText: { color: '#202A45', fontFamily: 'Inter_700Bold', fontSize: 38, letterSpacing: -1.2 },
  calculatorKeys: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 16 },
  calculatorKey: { width: '22%', aspectRatio: 1.3, borderRadius: 14, backgroundColor: '#F0F2F7', alignItems: 'center', justifyContent: 'center' },
  calculatorOperator: { backgroundColor: '#E9ECF8' },
  calculatorEqual: { backgroundColor: '#7383B8' },
  calculatorKeyText: { color: '#39445F', fontFamily: 'Inter_700Bold', fontSize: 19 },
  calculatorAccentText: { color: '#FFFFFF' },
  reelsScreen: { flex: 1 },
  reel: { height: 760, position: 'relative', overflow: 'hidden' },
  reelImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  reelTint: { ...StyleSheet.absoluteFillObject },
  reelGradient: { ...StyleSheet.absoluteFillObject },
  reelTop: { position: 'absolute', top: 18, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reelLogo: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.45 },
  reelClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(20, 26, 48, 0.5)', alignItems: 'center', justifyContent: 'center' },
  reelCopy: { position: 'absolute', left: 20, right: 74, bottom: 45 },
  reelTag: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reelTagText: { color: '#FFD275', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  reelTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 31, letterSpacing: -0.8, marginTop: 10 },
  reelSubtitle: { color: '#D9DDEE', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 9 },
  watchButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, height: 43, borderRadius: 14, backgroundColor: '#FFD275', marginTop: 18 },
  watchButtonText: { color: '#202A45', fontFamily: 'Inter_700Bold', fontSize: 12 },
  reelSide: { position: 'absolute', right: 16, bottom: 50, gap: 18 },
  reelSideButton: { alignItems: 'center', gap: 4 },
  reelSideText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 10 },
  reelHint: { position: 'absolute', bottom: 13, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.8 },
  reelHintText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 10 },
  feedScreen: { flex: 1, paddingHorizontal: 20 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  feedTitle: { color: '#202A45', fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.8, marginTop: 5 },
  feedDescription: { color: '#81899D', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 13 },
  feedList: { paddingTop: 19, paddingBottom: 30 },
  feedItem: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#E8EBF2' },
  feedImage: { width: '100%', height: 135 },
  feedItemCopy: { padding: 15 },
  feedMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedCategory: { color: '#7383B8', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  feedTime: { color: '#A0A7B7', fontFamily: 'Inter_400Regular', fontSize: 10 },
  feedItemTitle: { color: '#202A45', fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 21, letterSpacing: -0.4, marginTop: 8 },
  feedSummary: { color: '#727C91', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 7 },
  feedRead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  feedReadText: { color: '#7383B8', fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  noteInput: { minHeight: 180, borderRadius: 18, padding: 16, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 21 },
  singleLineInput: { height: 52, borderRadius: 15, paddingHorizontal: 15, fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 21 },
  pdfBodyInput: { minHeight: 150, borderRadius: 15, padding: 15, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 10 },
  scannerScreen: { flex: 1, backgroundColor: '#11162A' },
  scannerFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  scannerTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 25, marginTop: 18 },
  scannerCopy: { color: '#B8C0D6', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 290 },
  camera: { flex: 1 },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center' },
  scannerHeader: { width: '100%', paddingHorizontal: 20, paddingTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scanBox: { width: 245, height: 245, marginTop: 150, position: 'relative' },
  scanCornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#FFD275', borderTopLeftRadius: 12 },
  scanCornerTopRight: { position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#FFD275', borderTopRightRadius: 12 },
  scanCornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#FFD275', borderBottomLeftRadius: 12 },
  scanCornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#FFD275', borderBottomRightRadius: 12 },
  scanHint: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 24, paddingHorizontal: 20, textAlign: 'center' },
  scanAgain: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFD275', marginTop: 15 },
  scanAgainText: { color: '#202A45', fontFamily: 'Inter_700Bold', fontSize: 12 },
  torchScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  torchClose: { position: 'absolute', top: 55, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  torchButton: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255, 210, 117, 0.08)', alignItems: 'center', justifyContent: 'center' },
  torchButtonOn: { backgroundColor: '#FFD275' },
  torchLabel: { color: '#FFD275', fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 12 },
  torchLabelOn: { color: '#202A45' },
  torchHint: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 25 },
});