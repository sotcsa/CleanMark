import React, { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit3,
  Plus,
  Search,
  Filter,
  Star,
  BookOpen,
  CheckCircle2,
  Globe,
  Smartphone,
  Puzzle,
  Download,
  Upload,
  ClipboardPaste,
  ArrowRight,
  Eye,
  Tag,
  RefreshCw,
  Info,
  X,
  ChevronRight,
  Layers,
  Code,
  Share2,
  AlertCircle,
  Zap,
  Link2,
  SlidersHorizontal,
  Mail,
  Video,
  MessageSquare,
  Terminal
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

// ==========================================
// 1. FIREBASE INICIALIZÁLÁS (Környezeti változókból)
// ==========================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cleanmark-bookmark-app';

// ==========================================
// 2. FORRÁS DEFINÍCIÓK ÉS SZÍNEK
// ==========================================
const SOURCES = {
  all: { id: 'all', label: 'Összes forrás', color: 'bg-slate-700 text-slate-200 border-slate-600', badge: 'bg-slate-800 text-slate-300' },
  facebook: { id: 'facebook', label: 'Facebook', color: 'bg-blue-600/20 text-blue-400 border-blue-500/40', badge: 'bg-blue-600 text-white' },
  google: { id: 'google', label: 'Google', color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40', badge: 'bg-emerald-600 text-white' },
  youtube: { id: 'youtube', label: 'YouTube', color: 'bg-red-600/20 text-red-400 border-red-500/40', badge: 'bg-red-600 text-white' },
  instagram: { id: 'instagram', label: 'Instagram', color: 'bg-pink-600/20 text-pink-400 border-pink-500/40', badge: 'bg-pink-600 text-white' },
  tiktok: { id: 'tiktok', label: 'TikTok', color: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40', badge: 'bg-cyan-600 text-slate-950' },
  twitter: { id: 'twitter', label: 'X / Twitter', color: 'bg-sky-600/20 text-sky-400 border-sky-500/40', badge: 'bg-sky-600 text-white' },
  linkedin: { id: 'linkedin', label: 'LinkedIn', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40', badge: 'bg-indigo-600 text-white' },
  reddit: { id: 'reddit', label: 'Reddit', color: 'bg-orange-600/20 text-orange-400 border-orange-500/40', badge: 'bg-orange-600 text-white' },
  newsletter: { id: 'newsletter', label: 'Hírlevél / Email', color: 'bg-amber-600/20 text-amber-400 border-amber-500/40', badge: 'bg-amber-600 text-slate-950' },
  github: { id: 'github', label: 'GitHub', color: 'bg-purple-600/20 text-purple-400 border-purple-500/40', badge: 'bg-purple-600 text-white' },
  direct: { id: 'direct', label: 'Közvetlen / Egyéb', color: 'bg-slate-600/20 text-slate-300 border-slate-500/40', badge: 'bg-slate-600 text-white' }
};

// Ismert nyomkövető és forrás paraméterek listája, amelyeket eltávolítunk
const TRACKING_PARAMS_EXACT = new Set([
  'fbclid', 'gclid', 'dclid', 'gbraid', 'wbraid', 'msclkid', 'twclid',
  'igshid', 'igsh', 'ttclid', 'li_fat_id', 'mc_cid', 'mc_eid',
  'oly_enc_id', 'oly_anon_id', '_hsenc', '_hsmi', 'hsCtaTracking',
  'vero_id', 'vero_conv', 'mkt_tok', 'rb_clickid', 's_kwcid',
  'wickedid', 'yclid', '_openstat', 'si', 'feature', 'ref', 'ref_src',
  'ref_url', 'source', 's', 'spm', 'scm', 'aff_platform', 'aff_trace_key',
  'share_id', 'is_from_webapp', 'sender_device', 'ibr', 'at_medium', 'at_campaign'
]);

const TRACKING_PREFIXES = ['utm_', 'hsa_', 'mtm_', 'pk_', 'piwik_', 'gad_', '__'];

// Teszt / Demó piszkos URL-ek a gyors kipróbáláshoz
const SAMPLE_DIRTY_URLS = [
  {
    label: 'Facebook átirányítás + fbclid',
    rawUrl: 'https://l.facebook.com/l.php?u=https%3A%2F%2Ftelex.hu%2Ftech%2F2026%2F10%2F25%2Fmesterseges-intelligencia-ujdonsagok%3Ffbclid%3DIwAR3x9KpL2mN8qR5vT1wZ_pelda_koveto_kod_998877%26utm_source%3Dfacebook%26utm_medium%3Dsocial&h=AT2abc123def456',
    suggestedTitle: 'Telex Tech: Mesterséges intelligencia újdonságok',
    suggestedTags: ['tech', 'ai', 'cikk'],
    notes: 'Facebook csoportban osztották meg, érdekes elemzés.'
  },
  {
    label: 'Google Kereső / Ads (gclid)',
    rawUrl: 'https://www.google.com/url?q=https://react.dev/learn/synchronizing-with-effects%3Fgclid%3DCj0KCQjwpompBhDZARIsAFD_Fp9_google_ads_tracking_id%26utm_source%3Dgoogle%26utm_campaign%3Ddev_search&sa=U&ved=2ahUKEwj_pelda',
    suggestedTitle: 'React Dokumentáció – Synchronizing with Effects',
    suggestedTags: ['fejlesztés', 'react', 'dokumentáció'],
    notes: 'Google keresésből mentett hivatalos React leírás.'
  },
  {
    label: 'YouTube megosztási link (si követővel)',
    rawUrl: 'https://youtu.be/dQw4w9WgXcQ?si=9X8y7Z6w5V4u3T2s&feature=shared&utm_source=youtube',
    suggestedTitle: 'YouTube Videó – Kedvenc előadás',
    suggestedTags: ['videó', 'zene', 'inspiráció'],
    notes: 'Mobilon kimásolt YouTube megosztási link.'
  },
  {
    label: 'Instagram Story link (igshid)',
    rawUrl: 'https://designmilk.com/minimalist-workspace-ideas-for-developers/?igshid=MzRlODBiNWFlZA==&utm_source=ig_web_button_share_sheet',
    suggestedTitle: 'Minimalista munkaállomás ötletek fejlesztőknek',
    suggestedTags: ['design', 'setup', 'inspiráció'],
    notes: 'Instagram sztoriból mentett lakberendezési ötlet.'
  },
  {
    label: 'Hírlevél link (Mailchimp + UTM)',
    rawUrl: 'https://news.ycombinator.com/item?id=41928374&utm_source=newsletter&utm_medium=email&utm_campaign=weekly_digest_2026&mc_cid=88a99b11c2&mc_eid=dd44ee55ff',
    suggestedTitle: 'Hacker News: Heti legjobb tech beszélgetés',
    suggestedTags: ['hírlevél', 'hackernews', 'olvasandó'],
    notes: 'Vasárnapi tech hírlevélből kimásolva.'
  }
];

// ==========================================
// 3. OKOS URL ELEMZŐ, FORRÁS-KISZEDŐ ÉS TISZTÍTÓ MOTOR
// ==========================================
function analyzeAndCleanUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return null;
  }

  let trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Ha nincs protokoll, pótoljuk
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return {
      isValid: false,
      originalUrl: rawInput,
      cleanUrl: rawInput,
      source: 'direct',
      detectionReason: 'Érvénytelen URL formátum',
      removedParams: [],
      unwrappedFrom: null,
      domain: '',
      suggestedTitle: ''
    };
  }

  let detectedSource = null;
  let detectionReason = '';
  let unwrappedFrom = null;
  const removedParams = [];

  const initialHost = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // 1. LÉPÉS: Átirányító (Redirect Wrapper) URL-ek felismerése és kicsomagolása
  // Pl. l.facebook.com/l.php?u=..., google.com/url?q=..., youtube.com/redirect?q=...
  if (
    initialHost === 'l.facebook.com' ||
    initialHost === 'lm.facebook.com' ||
    initialHost === 'l.messenger.com'
  ) {
    const target = parsed.searchParams.get('u');
    detectedSource = 'facebook';
    detectionReason = `Facebook átirányító (${initialHost})`;
    if (target) {
      try {
        unwrappedFrom = initialHost;
        removedParams.push(`átirányítás (${initialHost})`);
        parsed = new URL(target);
      } catch (_) {}
    }
  } else if (
    (initialHost.includes('google.') && parsed.pathname === '/url')
  ) {
    const target = parsed.searchParams.get('q') || parsed.searchParams.get('url');
    detectedSource = 'google';
    detectionReason = `Google átirányító (${initialHost}/url)`;
    if (target) {
      try {
        unwrappedFrom = `${initialHost}/url`;
        removedParams.push('átirányítás (google.com/url)');
        parsed = new URL(target);
      } catch (_) {}
    }
  } else if (
    initialHost.includes('youtube.com') && parsed.pathname === '/redirect'
  ) {
    const target = parsed.searchParams.get('q');
    detectedSource = 'youtube';
    detectionReason = 'YouTube átirányító link';
    if (target) {
      try {
        unwrappedFrom = 'youtube.com/redirect';
        removedParams.push('átirányítás (youtube.com/redirect)');
        parsed = new URL(target);
      } catch (_) {}
    }
  } else if (initialHost === 'l.instagram.com') {
    const target = parsed.searchParams.get('u');
    detectedSource = 'instagram';
    detectionReason = 'Instagram átirányító (l.instagram.com)';
    if (target) {
      try {
        unwrappedFrom = 'l.instagram.com';
        removedParams.push('átirányítás (l.instagram.com)');
        parsed = new URL(target);
      } catch (_) {}
    }
  }

  // 2. LÉPÉS: Paraméterek vizsgálata a Forrás (Honnan jött a link?) azonosításához, MIELŐTT törölnénk őket!
  const params = parsed.searchParams;
  const utmSource = (params.get('utm_source') || params.get('source') || params.get('ref_src') || '').toLowerCase();
  const utmMedium = (params.get('utm_medium') || '').toLowerCase();

  if (!detectedSource) {
    if (params.has('fbclid') || utmSource.includes('facebook') || utmSource === 'fb' || utmSource === 'meta') {
      detectedSource = 'facebook';
      detectionReason = params.has('fbclid') ? 'fbclid követő paraméter' : `utm_source=${utmSource}`;
    } else if (params.has('gclid') || params.has('dclid') || params.has('gbraid') || utmSource.includes('google') || utmSource === 'adwords') {
      detectedSource = 'google';
      detectionReason = params.has('gclid') ? 'gclid (Google Ads/Kereső) azonosító' : `utm_source=${utmSource}`;
    } else if (params.has('igshid') || params.has('igsh') || utmSource.includes('instagram') || utmSource.includes('ig_')) {
      detectedSource = 'instagram';
      detectionReason = params.has('igshid') || params.has('igsh') ? 'Instagram megosztás azonosító (igshid)' : `utm_source=${utmSource}`;
    } else if (params.has('ttclid') || utmSource.includes('tiktok') || params.get(' sender_device')) {
      detectedSource = 'tiktok';
      detectionReason = params.has('ttclid') ? 'ttclid (TikTok) azonosító' : 'TikTok megosztási paraméter';
    } else if (params.has('twclid') || utmSource.includes('twitter') || utmSource === 'x') {
      detectedSource = 'twitter';
      detectionReason = params.has('twclid') ? 'twclid (X/Twitter) azonosító' : `utm_source=${utmSource}`;
    } else if (params.has('li_fat_id') || utmSource.includes('linkedin')) {
      detectedSource = 'linkedin';
      detectionReason = params.has('li_fat_id') ? 'li_fat_id (LinkedIn) azonosító' : `utm_source=${utmSource}`;
    } else if (utmSource.includes('reddit') || params.has('share_id')) {
      detectedSource = 'reddit';
      detectionReason = 'Reddit megosztási paraméter';
    } else if (
      params.has('mc_cid') ||
      params.has('mc_eid') ||
      params.has('_hsenc') ||
      params.has('mkt_tok') ||
      utmMedium === 'email' ||
      utmMedium === 'newsletter' ||
      utmSource.includes('newsletter') ||
      utmSource.includes('substack') ||
      utmSource.includes('mailchimp')
    ) {
      detectedSource = 'newsletter';
      detectionReason = params.has('mc_cid') ? 'Mailchimp hírlevél kód (mc_cid)' : 'Email / Hírlevél paraméter';
    } else if (utmSource.includes('youtube') || (params.has('si') && (parsed.hostname.includes('youtube') || parsed.hostname.includes('youtu.be')))) {
      detectedSource = 'youtube';
      detectionReason = 'YouTube megosztási azonosító (?si=...)';
    }
  }

  // 3. LÉPÉS: Ha paraméterből nem derült ki külső forrás, nézzük meg magát a cél-domaint
  const finalHost = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (!detectedSource) {
    if (finalHost.includes('facebook.com') || finalHost.includes('fb.watch')) {
      detectedSource = 'facebook';
      detectionReason = 'Facebook domain';
    } else if (finalHost.includes('youtube.com') || finalHost.includes('youtu.be')) {
      detectedSource = 'youtube';
      detectionReason = 'YouTube domain';
    } else if (finalHost.includes('instagram.com')) {
      detectedSource = 'instagram';
      detectionReason = 'Instagram domain';
    } else if (finalHost.includes('tiktok.com')) {
      detectedSource = 'tiktok';
      detectionReason = 'TikTok domain';
    } else if (finalHost.includes('twitter.com') || finalHost === 'x.com') {
      detectedSource = 'twitter';
      detectionReason = 'X / Twitter domain';
    } else if (finalHost.includes('linkedin.com')) {
      detectedSource = 'linkedin';
      detectionReason = 'LinkedIn domain';
    } else if (finalHost.includes('reddit.com')) {
      detectedSource = 'reddit';
      detectionReason = 'Reddit domain';
    } else if (finalHost.includes('github.com')) {
      detectedSource = 'github';
      detectionReason = 'GitHub domain';
    } else if (finalHost.includes('google.')) {
      detectedSource = 'google';
      detectionReason = 'Google domain';
    } else {
      detectedSource = 'direct';
      detectionReason = 'Közvetlen webcím';
    }
  }

  // 4. LÉPÉS: Követő paraméterek (fbclid, gclid, utm_*, stb.) kiszedése az URL-ből
  // Megjegyzés: YouTube-nál a ?v= és ?t= paramétereket MEGTARTJUK, csak a ?si= és ?feature=shared jellegűeket töröljük!
  const keysToDelete = [];
  for (const key of parsed.searchParams.keys()) {
    const lowerKey = key.toLowerCase();
    const isExactMatch = TRACKING_PARAMS_EXACT.has(lowerKey);
    const isPrefixMatch = TRACKING_PREFIXES.some((prefix) => lowerKey.startsWith(prefix));

    if (isExactMatch || isPrefixMatch) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => {
    removedParams.push(key);
    parsed.searchParams.delete(key);
  });

  // YouTube rövidített linkek (youtu.be/VIDEO_ID) szépítése vagy megtartása tisztán
  let cleanUrl = parsed.toString();
  // Ha csak egy felesleges '?' maradt a végén, a URL.toString() alapból leveszi

  // 5. LÉPÉS: Automatikus cím javaslat generálása az URL-ből
  let suggestedTitle = finalHost.replace(/\.(com|hu|org|net|io|dev)$/i, '');
  suggestedTitle = suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1);

  const pathSegments = parsed.pathname
    .split('/')
    .filter((seg) => seg && seg.length > 1 && !/^\d+$/.test(seg));

  if (pathSegments.length > 0) {
    const lastSeg = decodeURIComponent(pathSegments[pathSegments.length - 1])
      .replace(/\.(html|php|htm|aspx)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (lastSeg.length > 2) {
      const formattedSeg = lastSeg.charAt(0).toUpperCase() + lastSeg.slice(1);
      suggestedTitle = `${suggestedTitle} – ${formattedSeg}`;
    }
  }

  const charsSaved = Math.max(0, rawInput.trim().length - cleanUrl.length);

  return {
    isValid: true,
    originalUrl: rawInput.trim(),
    cleanUrl,
    source: detectedSource,
    detectionReason,
    removedParams,
    unwrappedFrom,
    domain: finalHost,
    suggestedTitle,
    charsSaved
  };
}

// ==========================================
// 4. FORRÁS IKON SEGÉDKOMPONENS
// ==========================================
function SourceIcon({ source, className = 'w-4 h-4' }) {
  switch (source) {
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      );
    case 'google':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
      );
    case 'youtube':
      return <Video className={className} />;
    case 'instagram':
      return <Sparkles className={className} />;
    case 'tiktok':
      return <Zap className={className} />;
    case 'twitter':
      return <MessageSquare className={className} />;
    case 'linkedin':
      return <Layers className={className} />;
    case 'reddit':
      return <MessageSquare className={className} />;
    case 'newsletter':
      return <Mail className={className} />;
    case 'github':
      return <Terminal className={className} />;
    default:
      return <Globe className={className} />;
  }
}

// ==========================================
// 5. FŐ ALKALMAZÁS KOMPONENS
// ==========================================
export default function App() {
  // Auth & Firestore állapotok
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Navigáció / Nézetek ('bookmarks' | 'cleaner' | 'plugin')
  const [activeTab, setActiveTab] = useState('bookmarks');

  // Új URL / Tisztító űrlap állapotok
  const [rawUrlInput, setRawUrlInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [sourceOverride, setSourceOverride] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isFavoriteInput, setIsFavoriteInput] = useState(false);
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);

  // Szűrés és keresés
  const [selectedSource, setSelectedSource] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'favorites' | 'unread' | 'cleaned'
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Szerkesztő és Röntgen (Inspect) modálok
  const [inspectBookmark, setInspectBookmark] = useState(null);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Értesítő (Toast) segédfüggvény
  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  // 1. Firebase Auth Inicializálás (RULE 3 szerint)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth hiba:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Firestore Adatok szinkronizálása (RULE 1, 2, 3 szerint)
  useEffect(() => {
    if (!user) return;

    const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'bookmarks');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        // Memóriában történő rendezés (legújabb elöl)
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setBookmarks(items);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore olvasási hiba:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // URL paraméterből érkező gyorsmentés kezelése (pl. Bookmarklet vagy iOS Rövidítés hívásakor)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedUrl = params.get('add_url') || params.get('url');
      if (sharedUrl) {
        setRawUrlInput(sharedUrl);
        setShowAdvancedAdd(true);
        showNotification('URL átvéve a megosztásból és megtisztítva!', 'info');
      }
    } catch (_) {}
  }, []);

  // Aktuálisan beírt URL valós idejű elemzése
  const urlAnalysis = useMemo(() => {
    return analyzeAndCleanUrl(rawUrlInput);
  }, [rawUrlInput]);

  // Ha változik az elemzett URL, frissítjük az alapértelmezett forrást
  useEffect(() => {
    if (urlAnalysis && urlAnalysis.isValid) {
      setSourceOverride(urlAnalysis.source);
    } else {
      setSourceOverride('');
    }
  }, [urlAnalysis?.source, urlAnalysis?.cleanUrl]);

  // Vágólapról történő beillesztés
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setRawUrlInput(text.trim());
        showNotification('URL beillesztve és megtisztítva a vágólapról!');
      } else {
        showNotification('A vágólap üres. Kattints egy teszt URL-re vagy illeszd be (Ctrl+V)!', 'info');
      }
    } catch (err) {
      // Iframe jogosultsági korlát esetén barátságos visszajelzés
      showNotification('Használd a Ctrl+V / Hosszú érintés beillesztést, vagy válassz a lenti teszt linkek közül!', 'info');
    }
  };

  // Szöveg másolása a vágólapra
  const copyToClipboard = (text, id = 'main', customMsg = 'Tiszta URL a vágólapra másolva!') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      showNotification(customMsg);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      showNotification('Nem sikerült a másolás', 'error');
    }
  };

  // Könyvjelző mentése Firestore-ba
  const handleSaveBookmark = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      showNotification('Kérlek várj a csatlakozásra...', 'error');
      return;
    }
    if (!urlAnalysis || !urlAnalysis.isValid) {
      showNotification('Kérlek adj meg egy érvényes webcímet (URL)!', 'error');
      return;
    }

    const finalSource = sourceOverride || urlAnalysis.source || 'direct';
    const finalTitle = customTitle.trim() || urlAnalysis.suggestedTitle || urlAnalysis.domain;
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const newBookmark = {
      cleanUrl: urlAnalysis.cleanUrl,
      originalUrl: urlAnalysis.originalUrl,
      title: finalTitle,
      domain: urlAnalysis.domain,
      source: finalSource,
      detectionReason: urlAnalysis.detectionReason,
      removedParams: urlAnalysis.removedParams || [],
      unwrappedFrom: urlAnalysis.unwrappedFrom || null,
      charsSaved: urlAnalysis.charsSaved || 0,
      tags: parsedTags.length > 0 ? parsedTags : [finalSource],
      notes: notesInput.trim(),
      isFavorite: isFavoriteInput,
      isRead: false,
      createdAt: Date.now()
    };

    try {
      const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'bookmarks');
      await addDoc(colRef, newBookmark);

      // Űrlap ürítése
      setRawUrlInput('');
      setCustomTitle('');
      setTagsInput('');
      setNotesInput('');
      setIsFavoriteInput(false);
      setShowAdvancedAdd(false);

      showNotification(`Mentve! Forrás: ${SOURCES[finalSource]?.label || finalSource} (${urlAnalysis.removedParams.length} követő eltávolítva)`);
    } catch (err) {
      console.error('Mentési hiba:', err);
      showNotification('Hiba történt a mentés során.', 'error');
    }
  };

  // Demó könyvjelzők betöltése 1 kattintással
  const handleLoadDemoBookmarks = async () => {
    if (!user) return;
    try {
      const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'bookmarks');
      let now = Date.now();
      for (const sample of SAMPLE_DIRTY_URLS) {
        const analysis = analyzeAndCleanUrl(sample.rawUrl);
        if (analysis && analysis.isValid) {
          await addDoc(colRef, {
            cleanUrl: analysis.cleanUrl,
            originalUrl: analysis.originalUrl,
            title: sample.suggestedTitle,
            domain: analysis.domain,
            source: analysis.source,
            detectionReason: analysis.detectionReason,
            removedParams: analysis.removedParams,
            unwrappedFrom: analysis.unwrappedFrom,
            charsSaved: analysis.charsSaved,
            tags: sample.suggestedTags,
            notes: sample.notes,
            isFavorite: analysis.source === 'facebook' || analysis.source === 'google',
            isRead: false,
            createdAt: now
          });
          now -= 60000;
        }
      }
      showNotification('5 db piszkos teszt URL megtisztítva és elmentve!');
    } catch (err) {
      console.error(err);
      showNotification('Nem sikerült a demó adatok betöltése.', 'error');
    }
  };

  // Könyvjelző módosítása (Kedvenc, Olvasott, Szerkesztés)
  const handleToggleFavorite = async (bm) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'bookmarks', bm.id);
    await updateDoc(docRef, { isFavorite: !bm.isFavorite });
  };

  const handleToggleRead = async (bm) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'bookmarks', bm.id);
    await updateDoc(docRef, { isRead: !bm.isRead });
  };

  const handleDeleteBookmark = async (id) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'bookmarks', id);
    await deleteDoc(docRef);
    showNotification('Könyvjelző törölve.', 'info');
  };

  const handleUpdateBookmark = async (e) => {
    e.preventDefault();
    if (!user || !editingBookmark) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'bookmarks', editingBookmark.id);
    const updatedTags = typeof editingBookmark.tagsString === 'string'
      ? editingBookmark.tagsString.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : editingBookmark.tags || [];

    await updateDoc(docRef, {
      title: editingBookmark.title.trim() || editingBookmark.domain,
      cleanUrl: editingBookmark.cleanUrl.trim(),
      source: editingBookmark.source,
      tags: updatedTags,
      notes: editingBookmark.notes || ''
    });
    setEditingBookmark(null);
    showNotification('Könyvjelző frissítve!');
  };

  // JSON Exportálás
  const handleExportJson = () => {
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleanmark-konyvjelzok-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Könyvjelzők sikeresen exportálva!');
  };

  // Statisztikák és Forrás számlálók
  const stats = useMemo(() => {
    const sourceCounts = { all: bookmarks.length };
    let totalTrackersRemoved = 0;
    let totalCharsSaved = 0;
    const tagSet = new Set();

    bookmarks.forEach((bm) => {
      const s = bm.source || 'direct';
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
      totalTrackersRemoved += (bm.removedParams?.length || 0);
      totalCharsSaved += (bm.charsSaved || 0);
      (bm.tags || []).forEach((t) => tagSet.add(t));
    });

    return {
      sourceCounts,
      totalTrackersRemoved,
      totalCharsSaved,
      allTags: Array.from(tagSet)
    };
  }, [bookmarks]);

  // Szűrt könyvjelzők
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bm) => {
      if (selectedSource !== 'all' && bm.source !== selectedSource) return false;
      if (statusFilter === 'favorites' && !bm.isFavorite) return false;
      if (statusFilter === 'unread' && bm.isRead) return false;
      if (statusFilter === 'cleaned' && (!bm.removedParams || bm.removedParams.length === 0)) return false;
      if (selectedTag && !(bm.tags || []).includes(selectedTag)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (bm.title || '').toLowerCase().includes(q);
        const inUrl = (bm.cleanUrl || '').toLowerCase().includes(q);
        const inNotes = (bm.notes || '').toLowerCase().includes(q);
        const inSource = (SOURCES[bm.source]?.label || '').toLowerCase().includes(q);
        const inTags = (bm.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inUrl && !inNotes && !inSource && !inTags) return false;
      }

      return true;
    });
  }, [bookmarks, selectedSource, statusFilter, selectedTag, searchQuery]);

  // Chrome Extension Manifest V3 generált kódok
  const chromeManifestCode = `{
  "manifest_version": 3,
  "name": "CleanMark – URL Tisztító & Forrás Kiszedő",
  "version": "1.0.0",
  "description": "Kiszedi az URL forrását (Facebook, Google, stb.) és eltávolítja a követő paramétereket (fbclid, gclid, utm_*).",
  "permissions": ["activeTab", "clipboardWrite", "storage"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "URL Tisztítása és Mentése"
  }
}`;

  const chromePopupHtmlCode = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <style>
    body { width: 340px; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; margin: 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; background: #2563eb; color: #fff; margin-bottom: 10px; }
    .box { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; word-break: break-all; font-size: 12px; color: #38bdf8; margin-bottom: 12px; }
    button { width: 100%; padding: 10px; border: none; border-radius: 8px; background: #10b981; color: #022c22; font-weight: 700; cursor: pointer; margin-bottom: 8px; }
    button.secondary { background: #334155; color: #f8fafc; }
    .removed { font-size: 11px; color: #f43f5e; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div id="sourceBadge" class="badge">Forrás elemzése...</div>
  <div id="removedInfo" class="removed"></div>
  <div id="cleanUrlBox" class="box">...</div>
  <button id="copyBtn">Tiszta URL Másolása</button>
  <script src="popup.js"></script>
</body>
</html>`;

  const chromePopupJsCode = `const TRACKERS = ['fbclid','gclid','dclid','msclkid','twclid','igshid','igsh','ttclid','mc_cid','mc_eid','si','feature','ref','ref_src'];

function cleanAndDetect(rawUrl) {
  let u = new URL(rawUrl);
  let source = 'Közvetlen / Web';
  const removed = [];

  if (u.hostname.includes('l.facebook.com') && u.searchParams.get('u')) {
    source = 'Facebook';
    removed.push('l.facebook.com átirányítás');
    u = new URL(u.searchParams.get('u'));
  } else if (u.hostname.includes('google.') && u.pathname === '/url' && u.searchParams.get('q')) {
    source = 'Google';
    removed.push('google.com/url átirányítás');
    u = new URL(u.searchParams.get('q'));
  }

  const utmSource = (u.searchParams.get('utm_source') || '').toLowerCase();
  if (u.searchParams.has('fbclid') || utmSource.includes('facebook')) source = 'Facebook';
  else if (u.searchParams.has('gclid') || utmSource.includes('google')) source = 'Google';
  else if (u.searchParams.has('igshid') || utmSource.includes('instagram')) source = 'Instagram';
  else if (u.searchParams.has('si') && u.hostname.includes('youtu')) source = 'YouTube';

  for (const key of Array.from(u.searchParams.keys())) {
    if (TRACKERS.includes(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
      removed.push(key);
      u.searchParams.delete(key);
    }
  }
  return { cleanUrl: u.toString(), source, removed };
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentUrl = tabs[0]?.url || '';
  const res = cleanAndDetect(currentUrl);
  document.getElementById('sourceBadge').textContent = 'Forrás: ' + res.source;
  document.getElementById('removedInfo').textContent = res.removed.length
    ? 'Eltávolítva: ' + res.removed.join(', ')
    : 'Nincs követő paraméter az URL-ben';
  document.getElementById('cleanUrlBox').textContent = res.cleanUrl;

  document.getElementById('copyBtn').onclick = () => {
    navigator.clipboard.writeText(res.cleanUrl);
    document.getElementById('copyBtn').textContent = 'Másolva a vágólapra!';
  };
});`;

  const bookmarkletCode = `javascript:(function(){const u=new URL(window.location.href);const t=['fbclid','gclid','dclid','msclkid','igshid','igsh','ttclid','mc_cid','mc_eid','si','feature','ref'];let s='Web';if(u.searchParams.has('fbclid')||(u.searchParams.get('utm_source')||'').includes('facebook'))s='Facebook';else if(u.searchParams.has('gclid')||(u.searchParams.get('utm_source')||'').includes('google'))s='Google';const r=[];for(const k of Array.from(u.searchParams.keys())){if(t.includes(k.toLowerCase())||k.toLowerCase().startsWith('utm_')){r.push(k);u.searchParams.delete(k);}}window.history.replaceState({},'',u.toString());navigator.clipboard.writeText(u.toString());alert('CleanMark | Forrás: '+s+'\\nEltávolítva: '+(r.join(', ')||'0 követő')+'\\nTiszta URL a vágólapra másolva:\\n'+u.toString());})();`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 pb-20 md:pb-8">
      {/* ÉRTESÍTŐ TOAST */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : toast.type === 'info'
                ? 'bg-sky-950/90 border-sky-500/50 text-sky-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* FEJLÉC / NAVBAR */}
      <header className="sticky top-0 z-30 bg-slate-900/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  CleanMark
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Forrás-Kiszedő & Tisztító
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                 Automatikus Facebook / Google forrás felismerés és követőkód-mentes könyvjelzők
              </p>
            </div>
          </div>

          {/* Asztali navigáció */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'bookmarks'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Könyvjelzők</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-950/30">
                {bookmarks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cleaner')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'cleaner'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">URL Labor</span>
              <span className="sm:hidden">Tisztító</span>
            </button>

            <button
              onClick={() => setActiveTab('plugin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'plugin'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/70 text-cyan-300 border border-cyan-500/30 hover:bg-slate-800'
              }`}
            >
              <Puzzle className="w-4 h-4" />
              <span>Chrome Plugin & Mobil</span>
            </button>
          </div>
        </div>
      </header>

      {/* FŐ TARTALOM */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* ============================================================
            KÖZPONTI SMART URL BEILLESZTŐ, FORRÁS-KISZEDŐ & TISZTÍTÓ PANEL
           ============================================================ */}
        {activeTab !== 'plugin' && (
          <section className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm sm:text-base font-semibold text-white">
                  Okos URL Beillesztés – Forrás Azonosítás & Követőkód Eltávolítás
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Beillesztés vágólapról
                </button>
                {bookmarks.length === 0 && (
                  <button
                    type="button"
                    onClick={handleLoadDemoBookmarks}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    5 db Demó könyvjelző betöltése
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveBookmark} className="space-y-4">
              {/* Fő URL beviteli mező */}
              <div className="relative flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Link2 className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={rawUrlInput}
                    onChange={(e) => setRawUrlInput(e.target.value)}
                    placeholder="Illeszd be a másolt linket (pl. l.facebook.com/...?fbclid=... vagy google.com/url?gclid=...)"
                    className="w-full pl-11 pr-10 py-3.5 bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                  {rawUrlInput && (
                    <button
                      type="button"
                      onClick={() => setRawUrlInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                      title="Mező törlése"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedAdd(!showAdvancedAdd)}
                    className={`px-3.5 py-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                      showAdvancedAdd
                        ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                    title="Cím, címkék és megjegyzés megadása"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden md:inline">Részletek</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!urlAnalysis || !urlAnalysis.isValid}
                    className="flex-1 sm:flex-initial px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tisztítás & Mentés</span>
                  </button>
                </div>
              </div>

              {/* TESZT PISZKOS URL GOMBOK (1 kattintásos bemutatóhoz) */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] font-medium text-slate-400">
                  Próbáld ki egy piszkos linkkel:
                </span>
                {SAMPLE_DIRTY_URLS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRawUrlInput(sample.rawUrl);
                      setCustomTitle(sample.suggestedTitle);
                      setTagsInput(sample.suggestedTags.join(', '));
                      setNotesInput(sample.notes);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    {sample.label}
                  </button>
                ))}
              </div>

              {/* VALÓS IDEJŰ URL RÖNTGEN ÉS FORRÁS EREDMÉNY KÁRTYA */}
              {urlAnalysis && urlAnalysis.isValid && (
                <div className="mt-4 bg-slate-950/90 border border-emerald-500/30 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    {/* 1. Kinyert Forrás (Honnan származik a link?) */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-400 font-medium">
                        Felismert forrás:
                      </span>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                          SOURCES[sourceOverride || urlAnalysis.source]?.color ||
                          SOURCES.direct.color
                        }`}
                      >
                        <SourceIcon
                          source={sourceOverride || urlAnalysis.source}
                          className="w-3.5 h-3.5"
                        />
                        <span>
                          {SOURCES[sourceOverride || urlAnalysis.source]?.label || 'Közvetlen'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                        Ok: <strong className="text-slate-200">{urlAnalysis.detectionReason}</strong>
                      </span>
                    </div>

                    {/* Forrás kézi felülbírálása, ha a felhasználó más kategóriába tenné */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Forrás módosítása:</label>
                      <select
                        value={sourceOverride || urlAnalysis.source}
                        onChange={(e) => setSourceOverride(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                      >
                        {Object.values(SOURCES)
                          .filter((s) => s.id !== 'all')
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* 2. Eltávolított követőkódok és átirányítások */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
                    <div className="lg:col-span-2 space-y-1.5">
                      <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Tisztított, követőkód-mentes URL:</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all">
                        {urlAnalysis.cleanUrl}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-2 bg-slate-900/70 p-3 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Kigyomlált elemek:</span>
                        <span className="text-xs font-bold text-rose-400">
                          {urlAnalysis.removedParams.length} db ({urlAnalysis.charsSaved} karakter)
                        </span>
                      </div>

                      {urlAnalysis.removedParams.length > 0 ? (
                        <div className="flex flex-wrap gap-1 my-1">
                          {urlAnalysis.removedParams.map((param, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 line-through"
                            >
                              {param}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400 py-1">
                          ✓ Ez az URL már eleve tiszta volt!
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => copyToClipboard(urlAnalysis.cleanUrl, 'preview')}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 border border-slate-700 transition"
                      >
                        {copiedId === 'preview' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Tiszta URL másolva!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span>Csak a tiszta URL másolása</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Kinyitható extra mezők: Cím, Címkék, Megjegyzés */}
              {(showAdvancedAdd || (urlAnalysis && urlAnalysis.isValid)) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Könyvjelző címe (automatikus, ha üres)
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={urlAnalysis?.suggestedTitle || 'Pl. Hasznos cikk címe'}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Címkék (vesszővel elválasztva)
                    </label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="pl. tech, recept, olvasandó"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Saját megjegyzés (miből / miért mentetted?)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        placeholder="Pl. Péter küldte Messengeren..."
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setIsFavoriteInput(!isFavoriteInput)}
                        className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1 transition ${
                          isFavoriteInput
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                        title="Megjelölés kedvencként"
                      >
                        <Star className={`w-4 h-4 ${isFavoriteInput ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </section>
        )}

        {/* ============================================================
            1. FÜL: KÖNYVJELZŐK KEZELÉSE ÉS FORRÁS SZERINTI SZŰRÉS
           ============================================================ */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-5">
            {/* STATISZTIKA ÉS GYORSFORRÁS SÁV */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Mentett linkek</p>
                  <p className="text-xl font-bold text-white">{bookmarks.length} db</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                  <Bookmark className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Kiszedett követők</p>
                  <p className="text-xl font-bold text-rose-400">
                    {stats.totalTrackersRemoved} db
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Facebook + Google</p>
                  <p className="text-xl font-bold text-sky-400">
                    {(stats.sourceCounts.facebook || 0) + (stats.sourceCounts.google || 0)} db
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Filter className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Levágott szemét</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {stats.totalCharsSaved} kar.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* FORRÁS (HONNAN JÖTT?) VÁLASZTÓ SÁV */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {Object.values(SOURCES).map((src) => {
                    const count = stats.sourceCounts[src.id] || 0;
                    if (src.id !== 'all' && src.id !== 'facebook' && src.id !== 'google' && src.id !== 'youtube' && src.id !== 'instagram' && count === 0) {
                      return null;
                    }
                    const isSelected = selectedSource === src.id;
                    return (
                      <button
                        key={src.id}
                        onClick={() => setSelectedSource(src.id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition ${
                          isSelected
                            ? `${src.badge} border-transparent shadow-md`
                            : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {src.id !== 'all' && <SourceIcon source={src.id} className="w-3.5 h-3.5" />}
                        <span>{src.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            isSelected ? 'bg-black/25 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Állapot szűrők és kereső */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Keresés cím, domain, forrás..."
                      className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Másodlagos szűrők: Kedvencek, Olvasandó, Címkék */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'Minden elem' },
                    { id: 'favorites', label: '★ Kedvencek' },
                    { id: 'unread', label: 'Olvasandó' },
                    { id: 'cleaned', label: '🛡️ Követőtől tisztított' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        statusFilter === st.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {stats.allTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    {stats.allTags.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition ${
                          selectedTag === tag
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KÖNYVJELZŐ KÁRTYÁK RÁCSA */}
            {loading ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                Könyvjelzők szinkronizálása...
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-emerald-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-semibold text-white">
                    {bookmarks.length === 0
                      ? 'Még nincs elmentett könyvjelződ'
                      : 'Nincs a szűrésnek megfelelő találat'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {bookmarks.length === 0
                      ? 'Illessz be fent egy Facebook vagy Google linket, vagy töltsd be az 5 db valós demó URL-t egyetlen kattintással!'
                      : 'Próbáld meg módosítani a kiválasztott forrás szűrőt vagy a keresőszót.'}
                  </p>
                </div>
                {bookmarks.length === 0 && (
                  <button
                    onClick={handleLoadDemoBookmarks}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    Demó URL-ek betöltése és tisztítása most
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookmarks.map((bm) => {
                  const srcInfo = SOURCES[bm.source] || SOURCES.direct;
                  const removedCount = bm.removedParams?.length || 0;

                  return (
                    <article
                      key={bm.id}
                      className={`group bg-slate-900/80 hover:bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between transition-all shadow-lg ${
                        bm.isFavorite
                          ? 'border-amber-500/40'
                          : 'border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Felső sor: Forrás badge + Követő pajzs + Kedvenc */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${srcInfo.color}`}
                            >
                              <SourceIcon source={bm.source} className="w-3 h-3" />
                              <span>Forrás: {srcInfo.label}</span>
                            </span>

                            {removedCount > 0 && (
                              <button
                                onClick={() => setInspectBookmark(bm)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
                                title="Kattints az eredeti vs. tisztított URL összehasonlításához"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>-{removedCount} követő</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleRead(bm)}
                              className={`p-1.5 rounded-lg transition ${
                                bm.isRead
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                              title={bm.isRead ? 'Olvasottnak jelölve' : 'Megjelölés olvasottként'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleFavorite(bm)}
                              className={`p-1.5 rounded-lg transition ${
                                bm.isFavorite
                                  ? 'text-amber-400 bg-amber-500/10'
                                  : 'text-slate-500 hover:text-amber-300'
                              }`}
                              title="Kedvenc"
                            >
                              <Star
                                className={`w-4 h-4 ${bm.isFavorite ? 'fill-amber-400' : ''}`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Cím és Domain */}
                        <div>
                          <a
                            href={bm.cleanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-bold text-white hover:text-emerald-400 transition line-clamp-2 leading-snug"
                          >
                            {bm.title}
                          </a>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate font-medium text-slate-300">
                              {bm.domain}
                            </span>
                            {bm.unwrappedFrom && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                                Kicsomagolva: {bm.unwrappedFrom}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tiszta URL doboz */}
                        <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800/80 font-mono text-[11px] text-emerald-300/90 truncate">
                          {bm.cleanUrl}
                        </div>

                        {/* Eltávolított paraméterek jelzése, ha voltak */}
                        {removedCount > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-500">Kiszedve:</span>
                            {bm.removedParams.slice(0, 4).map((p, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300/90 border border-rose-500/20 line-through"
                              >
                                {p}
                              </span>
                            ))}
                            {bm.removedParams.length > 4 && (
                              <span className="text-[10px] text-slate-500">
                                +{bm.removedParams.length - 4} további
                              </span>
                            )}
                          </div>
                        )}

                        {/* Megjegyzés és Címkék */}
                        {bm.notes && (
                          <p className="text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-800/60 line-clamp-2">
                            {bm.notes}
                          </p>
                        )}

                        {bm.tags && bm.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {bm.tags.map((tag, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 hover:text-white transition"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Alsó műveleti gombok */}
                      <div className="flex items-center justify-between gap-2 pt-3 mt-4 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyToClipboard(bm.cleanUrl, bm.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              copiedId === bm.id
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {copiedId === bm.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Másolva!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Tiszta URL</span>
                              </>
                            )}
                          </button>

                          <a
                            href={bm.cleanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition"
                            title="Megnyitás új lapon"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Megnyitás</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setInspectBookmark(bm)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                            title="URL Röntgen (Eredeti vs. Tiszta URL)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setEditingBookmark({
                                ...bm,
                                tagsString: (bm.tags || []).join(', ')
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Szerkesztés"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBookmark(bm.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Törlés"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            2. FÜL: URL LABOR (TÖMEGES VAGY RÉSZLETES ELEMZŐ)
           ============================================================ */}
        {activeTab === 'cleaner' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Hogyan működik a CleanMark Forrás-Kiszedő motor?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Amikor kimásolsz egy linket Facebookról, Google-ből, Instagramról vagy hírlevélből, a szolgáltatók átirányító burkolókat és egyedi követő azonosítókat csatolnak hozzá. A CleanMark két dolgot tesz egyszerre:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400">
                  1. Átirányítás kicsomagolása
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Kibontja a valódi cél-URL-t
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ha a link <code className="text-rose-300">l.facebook.com/l.php?u=...</code> vagy <code className="text-rose-300">google.com/url?q=...</code> formátumú, a motor automatikusan kiszedi belőle a ténylegesen hivatkozott weboldalt.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400">
                  2. Forrás azonosítása
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Megjegyzi, honnan szerezted a linket
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A törlés előtt megvizsgálja a <code className="text-amber-300">fbclid</code>, <code className="text-amber-300">gclid</code>, <code className="text-amber-300">igshid</code>, <code className="text-amber-300">si</code> és <code className="text-amber-300">utm_source</code> paramétereket, és automatikusan felcímkézi a könyvjelzőt (pl. <strong>Facebook</strong>, <strong>Google</strong>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  3. Követőkódok lenyesése
                </span>
                <h3 className="text-sm font-semibold text-white">
                  100%-ig tiszta, megosztható URL
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Több mint 35 féle nyomkövető paramétert (<code className="text-emerald-300">fbclid, gclid, utm_*, mc_eid, _hsenc...</code>) eltávolít, miközben a működéshez szükséges paramétereket (pl. YouTube <code className="text-emerald-300">?v=</code>) érintetlenül hagyja.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            3. FÜL: CHROME BŐVÍTMÉNY (MANIFEST V3) ÉS ANDROID / iOS INTEGRÁCIÓ
           ============================================================ */}
        {activeTab === 'plugin' && (
          <div className="space-y-6">
            {/* Fejléc ismertető */}
            <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/50 border border-cyan-500/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Puzzle className="w-3.5 h-3.5" />
                    Cross-Platform Telepítő Központ
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Használd Desktop Chrome Pluginként, Androidon és iOS-en!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Mivel kérted, hogy működjön <strong>asztali Chrome bővítményként</strong>, valamint <strong>Android és iOS mobilokon</strong> is, itt megtalálod a kész, azonnal használható megoldásokat mindhárom platformra.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    Könyvjelzők Exportálása (JSON)
                  </button>
                </div>
              </div>
            </div>

            {/* 1. OPCIÓ: UNIVERZÁLIS 1-KATTINTÁSOS BOOKMARKLET (Desktop + Mobil) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    1. Leggyorsabb megoldás (Telepítés nélkül – Chrome, Safari, Mobil)
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Okos Könyvjelzőgomb (Bookmarklet)
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Húzd fel az alábbi zöld gombot az asztali Chrome könyvjelzősávjára, vagy másold ki a kódját mobilon! Amikor bármilyen oldalon rákattintasz, azonnal kiszedi az URL-ből a <code className="text-slate-200">fbclid / gclid / utm_*</code> szemetet, kiírja a forrást, és a vágólapodra másolja a tiszta címet.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={bookmarkletCode}
                    onClick={(e) => {
                      e.preventDefault();
                      copyToClipboard(
                        bookmarkletCode,
                        'bookmarklet',
                        'Bookmarklet kód másolva! Hozz létre egy könyvjelzőt és illeszd be URL-ként.'
                      );
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 cursor-grab active:cursor-grabbing"
                    title="Húzd a könyvjelzősávra, vagy kattints a kód másolásához!"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>🧹 CleanMark Tisztító</span>
                  </a>
                </div>
              </div>
            </div>

            {/* 2. OPCIÓ: MOBIL (ANDROID & iOS) BEÁLLÍTÁS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">
                    Android (Chrome) Telepítés
                  </h3>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Nyisd meg ezt az alkalmazást Androidon a <strong>Chrome</strong> böngészőben.
                  </li>
                  <li>
                    Koppints a jobb felső sarokban a <strong>három pontra (⋮)</strong>, majd válaszd a <strong>„Hozzáadás a kezdőképernyőhöz”</strong> (Telepítés alkalmazásként) opciót.
                  </li>
                  <li>
                    Amikor a Facebook vagy Google appban kimásolsz egy linket, nyisd meg az ikont, és bökj a <strong>„Beillesztés vágólapról”</strong> gombra – az app azonnal kiszedi a forrást és elmenti a tiszta URL-t!
                  </li>
                </ol>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-sky-400">
                  <Share2 className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">
                    iOS (iPhone / iPad Safari & Rövidítések)
                  </h3>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Safariban koppints középen alul a <strong>Megosztás (Share)</strong> ikonra, majd válaszd a <strong>„Kezdőképernyőhöz adás”</strong> lehetőséget – így önálló iOS appként fut.
                  </li>
                  <li>
                    <strong>Extra tipp (iOS Megosztás menü):</strong> Az Apple <em>Rövidítések (Shortcuts)</em> appban felvehetsz egy „URL megnyitása” műveletet, amely a <code className="text-sky-300">?add_url=[Vágólap]</code> paraméterrel nyitja meg ezt az oldalt, így 1 érintéssel átveszi és megtisztítja a linket!
                  </li>
                </ol>
              </div>
            </div>

            {/* 3. OPCIÓ: CHROME BŐVÍTMÉNY (MANIFEST V3) KÓDGENERÁTOR */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  2. Asztali Google Chrome Plugin (Manifest V3)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Saját Chrome Bővítmény telepítése 1 perc alatt
                </h3>
                <p className="text-xs text-slate-400">
                  Mentsd el az alábbi 3 fájlt egy mappába a gépeden, majd a Chrome-ban nyisd meg a <code className="text-cyan-300">chrome://extensions</code> oldalt, kapcsold be jobb felül a <strong>Fejlesztői módot (Developer mode)</strong>, és kattints a <strong>„Kicsomagolt bővítmény betöltése” (Load unpacked)</strong> gombra!
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Fájl 1: manifest.json */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      1. manifest.json
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(chromeManifestCode, 'manifest', 'manifest.json vágólapra másolva!')
                      }
                      className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Másolás
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 p-2 bg-slate-900/70 rounded-lg">
                    {chromeManifestCode}
                  </pre>
                </div>

                {/* Fájl 2: popup.html */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      2. popup.html
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(chromePopupHtmlCode, 'popuphtml', 'popup.html vágólapra másolva!')
                      }
                      className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Másolás
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 p-2 bg-slate-900/70 rounded-lg">
                    {chromePopupHtmlCode}
                  </pre>
                </div>

                {/* Fájl 3: popup.js */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      3. popup.js
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(chromePopupJsCode, 'popupjs', 'popup.js vágólapra másolva!')
                      }
                      className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Másolás
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 p-2 bg-slate-900/70 rounded-lg">
                    {chromePopupJsCode}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================
          MODÁL 1: URL RÖNTGEN (EREDETI VS. TISZTÍTOTT URL ÖSSZEHASONLÍTÁS)
         ============================================================ */}
      {inspectBookmark && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  URL Röntgen – Forrás és Tisztítás Részletei
                </h3>
              </div>
              <button
                onClick={() => setInspectBookmark(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Azonosított forrás:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <SourceIcon source={inspectBookmark.source} className="w-4 h-4 text-emerald-400" />
                  {SOURCES[inspectBookmark.source]?.label || inspectBookmark.source}
                  {inspectBookmark.detectionReason && (
                    <span className="text-slate-400 font-normal">
                      ({inspectBookmark.detectionReason})
                    </span>
                  )}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-rose-400 font-semibold">
                  Eredeti (piszkos / másolt) URL:
                </span>
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 font-mono text-[11px] text-rose-200 break-all">
                  {inspectBookmark.originalUrl || inspectBookmark.cleanUrl}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-emerald-400 font-semibold">
                  Tisztított, elmentett URL:
                </span>
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 font-mono text-[11px] text-emerald-300 break-all">
                  {inspectBookmark.cleanUrl}
                </div>
              </div>

              {inspectBookmark.removedParams?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-slate-400">Eltávolított követő paraméterek:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectBookmark.removedParams.map((p, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => copyToClipboard(inspectBookmark.cleanUrl, 'modal')}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Tiszta URL másolása
              </button>
              <button
                onClick={() => setInspectBookmark(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODÁL 2: KÖNYVJELZŐ SZERKESZTÉSE
         ============================================================ */}
      {editingBookmark && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateBookmark}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Könyvjelző szerkesztése</h3>
              <button
                type="button"
                onClick={() => setEditingBookmark(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Cím</label>
                <input
                  type="text"
                  value={editingBookmark.title}
                  onChange={(e) =>
                    setEditingBookmark({ ...editingBookmark, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tisztított URL</label>
                <input
                  type="text"
                  value={editingBookmark.cleanUrl}
                  onChange={(e) =>
                    setEditingBookmark({ ...editingBookmark, cleanUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Forrás (Honnan jött?)</label>
                  <select
                    value={editingBookmark.source}
                    onChange={(e) =>
                      setEditingBookmark({ ...editingBookmark, source: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {Object.values(SOURCES)
                      .filter((s) => s.id !== 'all')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Címkék (vesszővel)</label>
                  <input
                    type="text"
                    value={editingBookmark.tagsString}
                    onChange={(e) =>
                      setEditingBookmark({ ...editingBookmark, tagsString: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Saját megjegyzés</label>
                <textarea
                  rows={2}
                  value={editingBookmark.notes || ''}
                  onChange={(e) =>
                    setEditingBookmark({ ...editingBookmark, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBookmark(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Mégse
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Mentés
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MOBIL ALSÓ GYORSNAVIGÁCIÓ (Android / iOS hüvelykujj-barát elérés) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs ${
            activeTab === 'bookmarks' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span>Könyvjelzők</span>
        </button>

        <button
          onClick={handlePasteFromClipboard}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>Beillesztés</span>
        </button>

        <button
          onClick={() => setActiveTab('plugin')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs ${
            activeTab === 'plugin' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Puzzle className="w-5 h-5" />
          <span>Plugin & Mobil</span>
        </button>
      </nav>
    </div>
  );
}