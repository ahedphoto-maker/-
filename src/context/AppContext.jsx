import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialTeam,
  initialClients,
  initialCompanies,
  initialEquipment,
  initialProjects,
  initialTasks,
  initialInvoices,
  initialPayments,
  initialExpenses,
  initialAuditLogs,
  initialNotifications,
  defaultSettings,
  initialContracts,
  initialFiles,
  initialCustomRoles,
  initialBookings
} from '../data/mockData';
import { triggerCelebration, toEnglishDigits, sanitizeObjectToEnglishDigits, parseTime12hTo24h } from '../utils/helpers';
import { db, auth } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { registerDeviceToken, unregisterDeviceToken, triggerNotificationEvent } from '../utils/fcm';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation & User Role State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeOverlay, setActiveOverlay] = useState('NONE');
  const [celebrationToast, setCelebrationToast] = useState(null);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('star_media_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const deriveUserRole = (user) => {
    if (!user || !user.id) return null;
    const email = (user.email || '').toLowerCase().trim();
    const role = (user.role || '').toLowerCase();
    
    if (user.id === 1 || user.isSupervisor || email === 'ahdalamary@gmail.com' || email === 'ahed@lensflow.sa' || email === 'admin@lensflow.sa' || role.includes('مدير') || role.includes('مشرف')) {
      return 'admin';
    }
    return 'employee';
  };

  const [userRole, setUserRole] = useState(() => deriveUserRole(currentUser));

  useEffect(() => {
    setUserRole(deriveUserRole(currentUser));
  }, [currentUser]);

  const loginUser = useCallback((userRecord) => {
    if (!userRecord) return;
    setCurrentUser(userRecord);
    setUserRole(deriveUserRole(userRecord));
    localStorage.setItem('star_media_current_user', JSON.stringify(userRecord));
    registerDeviceToken(userRecord).catch(err => console.warn('Error registering device token on login:', err));
  }, []);

  const logoutUser = useCallback(() => {
    if (currentUser) {
      unregisterDeviceToken(currentUser).catch(err => console.warn('Error unregistering device token on logout:', err));
    }
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('star_media_current_user');
    auth.signOut().catch(err => console.error("Firebase SignOut error:", err));
  }, [currentUser]);

  const [searchQuery, setSearchQuery] = useState('');

  const getStoredState = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      const parsed = stored ? JSON.parse(stored) : defaultValue;
      return sanitizeObjectToEnglishDigits(parsed);
    } catch (e) {
      return sanitizeObjectToEnglishDigits(defaultValue);
    }
  };

  // Core App Datasets initialized from localStorage cache (fast startup fallback)
  const [team, setTeam] = useState(() => getStoredState('star_media_team', initialTeam));
  const [clients, setClients] = useState(() => getStoredState('star_media_clients', initialClients));
  const [companies, setCompanies] = useState(() => getStoredState('star_media_companies', initialCompanies));
  const [freelancers, setFreelancers] = useState(() => getStoredState('star_media_freelancers', [
    { id: 901, name: 'أحمد السلمي', phone: '0542223333', email: 'ahmed.salmi@example.com', notes: 'مصور درون وفيديو خارجي', monthlyAccount: true, rating: { commitment: 5, quality: 4, cooperation: 5, speed: 4 } },
    { id: 902, name: 'سعد العتيبي', phone: '0559876543', email: 'saad.otb@example.com', notes: 'مصور فوتوغرافي محترف', monthlyAccount: false, rating: { commitment: 4, quality: 5, cooperation: 4, speed: 4 } },
    { id: 903, name: 'رائد الحارثي', phone: '0564445555', email: 'raed.harbi@example.com', notes: 'متخصص تغطيات مؤتمرات', monthlyAccount: true, rating: { commitment: 5, quality: 5, cooperation: 4, speed: 5 } }
  ]));
  const [equipment, setEquipment] = useState(() => getStoredState('star_media_equipment', initialEquipment));
  const [bookings, setBookings] = useState(() => getStoredState('star_media_bookings', initialBookings));
  const [projects, setProjects] = useState(() => getStoredState('star_media_projects', initialProjects));
  const [tasks, setTasks] = useState(() => getStoredState('star_media_tasks', initialTasks));
  const [invoices, setInvoices] = useState(() => getStoredState('star_media_invoices', initialInvoices));
  const [payments, setPayments] = useState(() => getStoredState('star_media_payments', initialPayments));
  const [expenses, setExpenses] = useState(() => getStoredState('star_media_expenses', initialExpenses));
  const [auditLogs, setAuditLogs] = useState(() => getStoredState('star_media_auditLogs', initialAuditLogs));
  const [notifications, setNotifications] = useState(() => getStoredState('star_media_notifications', initialNotifications));
  const [settings, setSettings] = useState(() => getStoredState('star_media_settings', defaultSettings));
  const [contracts, setContracts] = useState(() => getStoredState('star_media_contracts', initialContracts));
  const [files, setFiles] = useState(() => getStoredState('star_media_files', initialFiles));
  const [customRoles, setCustomRoles] = useState(() => getStoredState('star_media_customRoles', initialCustomRoles));

  // New States for Comprehensive Upgrades
  const [quotations, setQuotations] = useState(() => getStoredState('star_media_quotations', [
    { id: 8001, quoteNumber: 'QT-2026-001', clientName: 'شركة الإبداع للفعاليات', date: '2026-08-20', totalPrice: 5000, description: 'عرض سعر لتصوير فيديو دعائي مدته دقيقة بدقة 4K', status: 'بانتظار العميل' },
    { id: 8002, quoteNumber: 'QT-2026-002', clientName: 'متجر بيت ستايل', date: '2026-08-22', totalPrice: 3200, description: 'عرض سعر لتغطية موقع معرض الرياض الرئيسي', status: 'مقبول' }
  ]));
  const [waitlist, setWaitlist] = useState(() => getStoredState('star_media_waitlist', [
    { id: 7001, clientName: 'صالون ستايل النسائي', date: '2026-08-12', phone: '0551234567', notes: 'يرغب بالتصوير مساءً' }
  ]));
  const [privacyMode, setPrivacyMode] = useState(() => getStoredState('star_media_privacyMode', false));
  const [isOnline, setIsOnline] = useState(() => getStoredState('star_media_isOnline', true));
  const [pendingOfflineActions, setPendingOfflineActions] = useState(() => getStoredState('star_media_pendingOfflineActions', []));

  const [isDbReady, setIsDbReady] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  // Persistent & Robust Firebase Authentication state listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        console.log("Firebase Auth active user email:", user.email);
        setIsDbReady(true);
        // Sync React state if needed (e.g. after page reload)
        if (!currentUser || currentUser.email !== user.email) {
          const matched = team.find(m => m.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim());
          if (matched) {
            console.log("Syncing currentUser state from Firebase session:", matched.name);
            setCurrentUser(matched);
            setUserRole(deriveUserRole(matched));
            localStorage.setItem('star_media_current_user', JSON.stringify(matched));
          }
        }
      } else {
        console.log("No logged-in user in Firebase, checking current user local state...");
        if (currentUser && currentUser.email) {
          console.log("Locally logged in, leaving database ready for auth flow.");
          setIsDbReady(true);
        } else {
          try {
            const userCredential = await signInAnonymously(auth);
            console.log("Authenticated anonymously with Firebase:", userCredential.user.uid);
            setIsDbReady(true);
          } catch (err) {
            console.error("Anonymous authentication failed:", err);
            setIsDbReady(true);
          }
        }
      }
    });
    return () => unsubAuth();
  }, [currentUser, team]);

  // Real-time Firestore synchronization & automatic seeding
  useEffect(() => {
    if (!isDbReady) return;
    const collectionsToSync = [
      { name: 'team', stateSetter: setTeam, initialData: initialTeam },
      { name: 'clients', stateSetter: setClients, initialData: initialClients },
      { name: 'companies', stateSetter: setCompanies, initialData: initialCompanies },
      { name: 'freelancers', stateSetter: setFreelancers, initialData: [
        { id: 901, name: 'أحمد السلمي', phone: '0542223333', email: 'ahmed.salmi@example.com', notes: 'مصور درون وفيديو خارجي', monthlyAccount: true, rating: { commitment: 5, quality: 4, cooperation: 5, speed: 4 } },
        { id: 902, name: 'سعد العتيبي', phone: '0559876543', email: 'saad.otb@example.com', notes: 'مصور فوتوغرافي محترف', monthlyAccount: false, rating: { commitment: 4, quality: 5, cooperation: 4, speed: 4 } },
        { id: 903, name: 'رائد الحارثي', phone: '0564445555', email: 'raed.harbi@example.com', notes: 'متخصص تغطيات مؤتمرات', monthlyAccount: true, rating: { commitment: 5, quality: 5, cooperation: 4, speed: 5 } }
      ] },
      { name: 'equipment', stateSetter: setEquipment, initialData: initialEquipment },
      { name: 'bookings', stateSetter: setBookings, initialData: initialBookings },
      { name: 'projects', stateSetter: setProjects, initialData: initialProjects },
      { name: 'tasks', stateSetter: setTasks, initialData: initialTasks },
      { name: 'invoices', stateSetter: setInvoices, initialData: initialInvoices },
      { name: 'payments', stateSetter: setPayments, initialData: initialPayments },
      { name: 'expenses', stateSetter: setExpenses, initialData: initialExpenses },
      { name: 'auditLogs', stateSetter: setAuditLogs, initialData: initialAuditLogs },
      { name: 'notifications', stateSetter: setNotifications, initialData: initialNotifications },
      { name: 'contracts', stateSetter: setContracts, initialData: initialContracts },
      { name: 'files', stateSetter: setFiles, initialData: initialFiles },
      { name: 'customRoles', stateSetter: setCustomRoles, initialData: initialCustomRoles },
      { name: 'quotations', stateSetter: setQuotations, initialData: [
        { id: 8001, quoteNumber: 'QT-2026-001', clientName: 'شركة الإبداع للفعاليات', date: '2026-08-20', totalPrice: 5000, description: 'عرض سعر لتصوير فيديو دعائي مدته دقيقة بدقة 4K', status: 'بانتظار العميل' },
        { id: 8002, quoteNumber: 'QT-2026-002', clientName: 'متجر بيت ستايل', date: '2026-08-22', totalPrice: 3200, description: 'عرض سعر لتغطية موقع معرض الرياض الرئيسي', status: 'مقبول' }
      ] },
      { name: 'waitlist', stateSetter: setWaitlist, initialData: [
        { id: 7001, clientName: 'صالون ستايل النسائي', date: '2026-08-12', phone: '0551234567', notes: 'يرغب بالتصوير مساءً' }
      ] }
    ];

    const unsubscribes = collectionsToSync.map(({ name, stateSetter, initialData }) => {
      return onSnapshot(
        collection(db, name),
        (snapshot) => {
          const docs = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            docs.push({ 
              ...data, 
              id: Number(docSnap.id) || docSnap.id 
            });
          });
          
          if (docs.length > 0) {
            if (name === 'bookings') {
              docs.sort((a, b) => b.id - a.id);
              setIsLoadingBookings(false);
            } else if (name === 'auditLogs') {
              docs.sort((a, b) => b.id - a.id);
            } else if (name === 'notifications') {
              docs.sort((a, b) => b.id - a.id);
            }
            stateSetter(docs);
          } else {
            const isFromCache = snapshot.metadata.fromCache;
            if (!isFromCache && navigator.onLine) {
              console.log(`Firestore collection '${name}' is empty on server, seeding...`);
              const batch = writeBatch(db);
              initialData.forEach(item => {
                const docRef = doc(collection(db, name), String(item.id));
                batch.set(docRef, item);
              });
              batch.commit()
                .then(() => {
                  if (name === 'bookings') setIsLoadingBookings(false);
                })
                .catch(err => console.error(`Error seeding ${name}:`, err));
            } else {
              console.log(`Collection '${name}' returned empty from cache/offline. Keeping cached state.`);
              if (name === 'bookings') setIsLoadingBookings(false);
            }
          }
        },
        (error) => {
          console.warn(`Firestore listener handled gracefully for collection '${name}':`, error?.message || error);
          if (name === 'bookings') setIsLoadingBookings(false);
        }
      );
    });

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'defaultConfig'),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        } else {
          setDoc(doc(db, 'settings', 'defaultConfig'), defaultSettings).catch(err => console.warn('Error setting defaultConfig:', err));
        }
      },
      (error) => {
        console.warn('Firestore listener handled gracefully for [settings]:', error?.message || error);
      }
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
      unsubSettings();
    };
  }, [isDbReady]);

  // Dynamic CSS variables injector for branding colors
  useEffect(() => {
    if (settings) {
      const identity = settings.companyIdentity || {};
      const primaryColor = identity.primaryColor || settings.appearance?.primaryColor || '#6366f1';
      const buttonColor = identity.buttonColor || settings.appearance?.primaryHover || '#4f46e5';
      
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--primary-hover', buttonColor);
      document.documentElement.style.setProperty('--bg-sidebar-active', `${primaryColor}2e`);
      
      const fontFamily = settings.appearance?.fontFamily || 'Cairo';
      document.documentElement.style.setProperty('--font-family', `'${fontFamily}', 'Inter', sans-serif`);
    }
  }, [settings]);

  // Write changes to localStorage as a redundant secondary cache
  useEffect(() => { localStorage.setItem('star_media_team', JSON.stringify(team)); }, [team]);
  useEffect(() => { localStorage.setItem('star_media_clients', JSON.stringify(clients)); }, [clients]);

  // Auto-register device FCM token when DB is ready and user is logged in
  useEffect(() => {
    if (isDbReady && currentUser && currentUser.id) {
      registerDeviceToken(currentUser).catch(err => console.warn('Error auto-registering device token:', err));
    }
  }, [isDbReady, currentUser]);
  useEffect(() => { localStorage.setItem('star_media_companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { localStorage.setItem('star_media_freelancers', JSON.stringify(freelancers)); }, [freelancers]);
  useEffect(() => { localStorage.setItem('star_media_equipment', JSON.stringify(equipment)); }, [equipment]);
  useEffect(() => { localStorage.setItem('star_media_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('star_media_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('star_media_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('star_media_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('star_media_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('star_media_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('star_media_auditLogs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('star_media_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('star_media_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('star_media_contracts', JSON.stringify(contracts)); }, [contracts]);
  useEffect(() => { localStorage.setItem('star_media_files', JSON.stringify(files)); }, [files]);
  useEffect(() => { localStorage.setItem('star_media_customRoles', JSON.stringify(customRoles)); }, [customRoles]);
  useEffect(() => { localStorage.setItem('star_media_quotations', JSON.stringify(quotations)); }, [quotations]);
  useEffect(() => { localStorage.setItem('star_media_waitlist', JSON.stringify(waitlist)); }, [waitlist]);
  useEffect(() => { localStorage.setItem('star_media_privacyMode', JSON.stringify(privacyMode)); }, [privacyMode]);
  useEffect(() => { localStorage.setItem('star_media_isOnline', JSON.stringify(isOnline)); }, [isOnline]);
  useEffect(() => { localStorage.setItem('star_media_pendingOfflineActions', JSON.stringify(pendingOfflineActions)); }, [pendingOfflineActions]);

  // Modal Control States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState('');

  // Overlay state utilities
  const isSearchModalOpen = activeOverlay === 'SEARCH';
  const setIsSearchModalOpen = (open) => setActiveOverlay(open ? 'SEARCH' : 'NONE');

  const isBookingDetailOpen = activeOverlay === 'BOOKING_DETAIL';
  const setIsBookingDetailOpen = (open) => setActiveOverlay(open ? 'BOOKING_DETAIL' : 'NONE');

  const isBookingFormOpen = activeOverlay === 'BOOKING';
  const setIsBookingFormOpen = (open) => setActiveOverlay(open ? 'BOOKING' : 'NONE');

  const isPaymentModalOpen = activeOverlay === 'PAYMENT';
  const setIsPaymentModalOpen = (open) => setActiveOverlay(open ? 'PAYMENT' : 'NONE');

  const showCelebration = (message) => {
    setCelebrationToast(message);
    triggerCelebration();
    setTimeout(() => {
      setCelebrationToast(null);
    }, 4000);
  };

  // Helper to open booking form with prefilled date
  const openBookingFormWithDate = (dateStr) => {
    setSelectedDateForBooking(dateStr || '');
    setActiveOverlay('BOOKING');
  };

  // ─── FIRESTORE OP DEBUG TRACER ───────────────────────────────────────────────
  const logFirestoreOp = useCallback(async (opName, collectionName, docId, actionFn) => {
    const projectId = db?.app?.options?.projectId || 'al-ahad-app-2026';
    const activeUid = auth?.currentUser?.uid || 'no-auth-uid';
    const role = userRole || 'no-role';

    console.log(`[FIRESTORE OP BEFORE] Op: ${opName} | Collection: ${collectionName} | DocID: ${docId} | UID: ${activeUid} | Role: ${role} | ProjectID: ${projectId}`);
    try {
      const res = await actionFn();
      console.log(`[FIRESTORE OP SUCCESS] Op: ${opName} | Collection: ${collectionName} | DocID: ${docId} | UID: ${activeUid} | Role: ${role} | ProjectID: ${projectId}`);
      return res;
    } catch (err) {
      console.error(`[FIRESTORE OP ERROR] Op: ${opName} | Collection: ${collectionName} | DocID: ${docId} | UID: ${activeUid} | Role: ${role} | ProjectID: ${projectId} | Code: ${err?.code} | Message: ${err?.message}`, err);
      throw err;
    }
  }, [userRole]);

  // ─── CLOUD FIRESTORE CRUD ACTIONS ───────────────────────────────────────────
  const addAuditLog = useCallback((action, details, icon = '📝') => {
    const activeUid = auth.currentUser?.uid || null;
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: currentUser?.name || 'زائر',
      userRole: userRole === 'admin' ? 'المشرف' : 'عضو فريق',
      action,
      details,
      icon,
      userId: activeUid
    };
    logFirestoreOp('setDoc', 'auditLogs', String(newLog.id), () => setDoc(doc(db, 'auditLogs', String(newLog.id)), newLog)).catch(err => {
      console.warn("Firestore error adding audit log [collection: auditLogs]:", err?.message || err);
    });
  }, [currentUser, userRole, logFirestoreOp]);

  // Bookings CRUD
  const addBooking = useCallback((bookingData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(bookingData);
    const activeUid = auth.currentUser?.uid || 'anonymous';
    
    let targetDates = [];
    if (sanitizedData.bookingDates && Array.isArray(sanitizedData.bookingDates) && sanitizedData.bookingDates.length > 0) {
      targetDates = sanitizedData.bookingDates;
    } else if (sanitizedData.recurringType && sanitizedData.recurringType !== 'none') {
      const count = Number(sanitizedData.recurringCount || 1);
      const start = new Date(sanitizedData.date || new Date().toISOString().substring(0, 10));
      for (let i = 0; i < count; i++) {
        const d = new Date(start);
        if (sanitizedData.recurringType === 'weekly') {
          d.setDate(start.getDate() + (i * 7));
        } else if (sanitizedData.recurringType === 'monthly') {
          d.setMonth(start.getMonth() + i);
        } else if (sanitizedData.recurringType === 'daily') {
          d.setDate(start.getDate() + i);
        }
        targetDates.push(d.toISOString().substring(0, 10));
      }
    } else {
      targetDates = [sanitizedData.date || new Date().toISOString().substring(0, 10)];
    }

    const defaultChecklist = [
      { text: 'تأكيد العميل', done: false },
      { text: 'تأكيد المصور', done: false },
      { text: 'تجهيز المهمة', done: false },
      { text: 'الوصول للموقع', done: false },
      { text: 'بدء التصوير', done: false },
      { text: 'انتهاء التصوير', done: false },
      { text: 'تسليم العمل', done: false },
      { text: 'إصدار الفاتورة', done: false },
      { text: 'استلام المبلغ', done: false }
    ];

    const newBookings = targetDates.map((dateStr, index) => {
      const bPrice = sanitizedData.totalPrice !== undefined && sanitizedData.totalPrice !== '' && sanitizedData.totalPrice !== null ? Number(sanitizedData.totalPrice) : null;
      const bDeposit = sanitizedData.deposit !== undefined && sanitizedData.deposit !== '' && sanitizedData.deposit !== null ? Number(sanitizedData.deposit) : null;
      const bPaid = sanitizedData.paidAmount !== undefined && sanitizedData.paidAmount !== '' && sanitizedData.paidAmount !== null ? Number(sanitizedData.paidAmount) : (bDeposit || 0);
      const bRemaining = bPrice !== null ? Math.max(0, bPrice - bPaid) : null;

      let fStatus = sanitizedData.financialStatus;
      if (!fStatus) {
        if (bPrice === null || bPrice === undefined || bPrice === '') {
          fStatus = 'no_price';
        } else if (bPaid >= bPrice && bPrice > 0) {
          fStatus = 'settled';
        } else if (sanitizedData.invoiceNumber) {
          fStatus = 'invoice_added';
        } else if (bPaid < bPrice) {
          fStatus = 'due';
        } else {
          fStatus = 'price_set';
        }
      }

      const isMobileDevice = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const bookingSource = `${userRole === 'admin' ? 'المشرف' : 'الموظف'} (${isMobileDevice ? 'جوال' : 'ويب'})`;

      return {
        ...sanitizedData,
        id: Date.now() + index,
        bookingNumber: `BK-2026-${Math.floor(Math.random() * 900) + 100}`,
        date: dateStr,
        startDate: dateStr,
        endDate: dateStr,
        totalPrice: bPrice,
        deposit: bDeposit,
        paidAmount: bPaid,
        remainingAmount: bRemaining,
        status: sanitizedData.status || 'مؤكد',
        paymentStatus: bPrice === null ? 'لم يحدد بعد' : (bRemaining === 0 ? 'مدفوع' : (bPaid > 0 ? 'جزئي' : 'غير مدفوع')),
        financialStatus: fStatus,
        checklist: sanitizedData.checklist || defaultChecklist,
        changeLogs: [
          { timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), userName: currentUser?.name || 'النظام', action: 'إنشاء الحجز' }
        ],
        locked: sanitizedData.status === 'مؤكد',
        userId: activeUid,
        ownerId: activeUid,
        creatorId: activeUid,
        uid: activeUid,
        role: userRole || 'employee',
        source: sanitizedData.source || bookingSource
      };
    });

    // Persist to Firestore and wait for execution (single source of truth)
    const promises = newBookings.map(booking => {
      return logFirestoreOp('setDoc', 'bookings', String(booking.id), () => setDoc(doc(db, 'bookings', String(booking.id)), booking));
    });

    Promise.all(promises)
      .then(() => {
        console.log("Firestore bookings insert succeeded.");
        showCelebration('تم إنشاء الحجز وتزامنه بنجاح! 🎉');
        newBookings.forEach(booking => {
          triggerNotificationEvent('booking_created', booking, currentUser);
        });
      })
      .catch(err => {
        console.error(`Firestore write error [collection: bookings]:`, err);
      });

    if (newBookings.length === 1) {
      addAuditLog('إنشاء حجز', `تم إنشاء حجز جديد: ${newBookings[0].title}`, '📅');
    } else {
      addAuditLog('إنشاء حجوزات متكررة', `تم إنشاء عدد ${newBookings.length} حجوزات متكررة لـ ${newBookings[0].title}`, '📅');
    }
    return newBookings[0];
  }, [addAuditLog, currentUser, userRole, logFirestoreOp]);

  const updateBooking = useCallback((bookingId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    const target = bookings.find(b => b.id === Number(bookingId));
    if (!target) return;

    const changes = [];
    if (sanitizedFields.date && sanitizedFields.date !== target.date) changes.push(`تغيير التاريخ من ${target.date} إلى ${sanitizedFields.date}`);
    if (sanitizedFields.status && sanitizedFields.status !== target.status) changes.push(`تغيير الحالة من ${target.status} إلى ${sanitizedFields.status}`);
    if (sanitizedFields.teamAssigned && JSON.stringify(sanitizedFields.teamAssigned) !== JSON.stringify(target.teamAssigned)) changes.push(`تعديل الفريق المكلف`);
    
    const newLogs = [...(target.changeLogs || [])];
    if (changes.length > 0) {
      newLogs.push({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userName: currentUser?.name || 'النظام',
        action: changes.join(' | ')
      });
    }

    const merged = {
      ...target,
      ...sanitizedFields,
      changeLogs: newLogs,
      locked: sanitizedFields.status === 'مؤكد' || target.status === 'مؤكد'
    };

    const price = merged.totalPrice;
    const paid = merged.paidAmount || 0;
    const inv = merged.invoiceNumber || merged.invoiceId;

    if (sanitizedFields.financialStatus === undefined) {
      if (price === null || price === undefined || price === '') {
        merged.financialStatus = 'no_price';
      } else if (paid >= price && price > 0) {
        merged.financialStatus = 'settled';
      } else if (inv) {
        merged.financialStatus = 'invoice_added';
      } else if (paid < price) {
        merged.financialStatus = 'due';
      } else {
        merged.financialStatus = 'price_set';
      }
    }

    logFirestoreOp('setDoc', 'bookings', String(bookingId), () => setDoc(doc(db, 'bookings', String(bookingId)), merged))
      .then(() => {
        if (changes.length > 0) {
          triggerNotificationEvent('booking_updated', merged, currentUser);
        }
      })
      .catch(err => {
        console.error(`Firestore write error [collection: bookings, action: update, doc: ${bookingId}]:`, err);
      });
    addAuditLog('تحديث حجز', `تم تعديل تفاصيل الحجز رقم ${bookingId}`, '📅');
  }, [addAuditLog, bookings, currentUser, logFirestoreOp]);

  const deleteBooking = useCallback((bookingId) => {
    const target = bookings.find(b => b.id === Number(bookingId));
    if (!target) return;

    if (target.status === 'مؤكد') {
      const updated = { ...target, status: 'ملغي' };
      logFirestoreOp('setDoc', 'bookings', String(bookingId), () => setDoc(doc(db, 'bookings', String(bookingId)), updated))
        .then(() => {
          triggerNotificationEvent('booking_cancelled', updated, currentUser);
        })
        .catch(err => {
          console.error(`Firestore write error [collection: bookings, action: cancel, doc: ${bookingId}]:`, err);
        });
      addAuditLog('إلغاء حجز مؤكد', `تم إلغاء الحجز المؤكد رقم ${bookingId} بدلاً من حذفه بالكامل`, '⚠️');
      showCelebration('تم إلغاء الحجز المؤكد أمنياً 🔒');
      return;
    }

    logFirestoreOp('deleteDoc', 'bookings', String(bookingId), () => deleteDoc(doc(db, 'bookings', String(bookingId))))
      .then(() => {
        triggerNotificationEvent('booking_deleted', target, currentUser);
      })
      .catch(err => {
        console.error(`Firestore delete error [collection: bookings, doc: ${bookingId}]:`, err);
      });
    addAuditLog('حذف حجز', `تم إزالة الحجز رقم ${bookingId}`, '❌');
  }, [addAuditLog, bookings, currentUser, logFirestoreOp]);

  // Tasks CRUD
  const addTask = useCallback((taskData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(taskData);
    const newTask = {
      ...sanitizedData,
      id: Date.now(),
      progress: 0,
      checklist: (sanitizedData.checklist || []).map(text => ({ text, done: false }))
    };
    logFirestoreOp('setDoc', 'tasks', String(newTask.id), () => setDoc(doc(db, 'tasks', String(newTask.id)), newTask)).catch(err => console.warn('addTask error:', err));
    addAuditLog('إسناد مهمة', `تم إسناد مهمة جديدة: ${newTask.title}`, '🎯');
  }, [addAuditLog, logFirestoreOp]);

  const updateTask = useCallback((taskId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    const target = tasks.find(t => t.id === Number(taskId));
    if (target) {
      const merged = { ...target, ...sanitizedFields };
      logFirestoreOp('setDoc', 'tasks', String(taskId), () => setDoc(doc(db, 'tasks', String(taskId)), merged)).catch(err => console.warn('updateTask error:', err));
      addAuditLog('تحديث مهمة', `تم تعديل تفاصيل المهمة رقم ${taskId}`, '✓');
    }
  }, [addAuditLog, tasks, logFirestoreOp]);

  const deleteTask = useCallback((taskId) => {
    logFirestoreOp('deleteDoc', 'tasks', String(taskId), () => deleteDoc(doc(db, 'tasks', String(taskId)))).catch(err => console.warn('deleteTask error:', err));
    addAuditLog('حذف مهمة', `تم إزالة المهمة رقم ${taskId}`, '🗑️');
  }, [addAuditLog, logFirestoreOp]);

  const completeTask = useCallback((taskId) => {
    const task = tasks.find(t => t.id === Number(taskId));
    if (!task) return;

    const updatedTask = { ...task, status: 'مكتملة', progress: 100 };
    logFirestoreOp('setDoc', 'tasks', String(taskId), () => setDoc(doc(db, 'tasks', String(taskId)), updatedTask)).catch(err => console.warn('completeTask error:', err));
    
    const earnedPoints = task.points || 10;
    const member = team.find(m => m.id === task.assigneeId);
    if (member) {
      const updatedMember = { ...member, points: (member.points || 0) + earnedPoints, tasksCompleted: (member.tasksCompleted || 0) + 1 };
      logFirestoreOp('setDoc', 'team', String(member.id), () => setDoc(doc(db, 'team', String(member.id)), updatedMember)).catch(err => console.warn('completeTask member update error:', err));
    }

    showCelebration(`أحسنت يا ${task.assigneeName}! تم إكمال المهمة بنجاح 🎉 (+${earnedPoints} نقطة إنجاز)`);
    addAuditLog('إكمال مهمة', `تم إنجاز المهمة: ${task.title} بواسطة ${task.assigneeName}`, '🎉');
  }, [tasks, team, addAuditLog, logFirestoreOp]);

  const addNotification = useCallback((title, message, type = 'general') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: 'الآن',
      read: false,
      type
    };
    logFirestoreOp('setDoc', 'notifications', String(newNotif.id), () => setDoc(doc(db, 'notifications', String(newNotif.id)), newNotif)).catch(err => console.warn('addNotification error:', err));
  }, [logFirestoreOp]);

  const checkInLocation = useCallback((taskId, checkInType, coords = '24.7136, 46.6753') => {
    const t = tasks.find(task => task.id === Number(taskId));
    if (!t) return;
    
    const now = new Date().toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
    const updatedTask = { ...t };
    
    if (checkInType === 'heading') {
      updatedTask.status = 'في الطريق';
      updatedTask.headingTime = now;
      logFirestoreOp('setDoc', 'tasks', String(taskId), () => setDoc(doc(db, 'tasks', String(taskId)), updatedTask)).catch(err => console.warn('checkInLocation error:', err));
      addAuditLog('بدء التوجه للموقع', `المصور بدأ التوجه للمهمة: ${t.title}`, '📍');
      addNotification('بدء التوجه 📍', `${currentUser?.name} بدأ التوجه لموقع المهمة: ${t.title}`, 'task');
    } else if (checkInType === 'arrived') {
      updatedTask.status = 'وصلت';
      updatedTask.arrivalTime = now;
      updatedTask.coords = coords;
      logFirestoreOp('setDoc', 'tasks', String(taskId), () => setDoc(doc(db, 'tasks', String(taskId)), updatedTask)).catch(err => console.warn('checkInLocation error:', err));
      addAuditLog('الوصول للموقع', `وصل المصور للموقع للمهمة: ${t.title} (إحداثيات: ${coords})`, '📍');
      addNotification('وصلت للموقع 📍', `وصل ${currentUser?.name} لموقع المهمة: ${t.title}`, 'task');
    }
  }, [currentUser, tasks, addAuditLog, addNotification, logFirestoreOp]);

  const updateTaskStatus = useCallback((taskId, status, progress) => {
    const target = tasks.find(t => t.id === Number(taskId));
    if (target) {
      const merged = { ...target, status, progress };
      logFirestoreOp('setDoc', 'tasks', String(taskId), () => setDoc(doc(db, 'tasks', String(taskId)), merged)).catch(err => console.warn('updateTaskStatus error:', err));
      addAuditLog('تحديث حالة المهمة', `تم تغيير حالة المهمة #${taskId} إلى ${status}`, '✓');
    }
  }, [addAuditLog, tasks, logFirestoreOp]);

  const updateUserProfile = useCallback((profileData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(profileData);
    setCurrentUser(prev => prev ? { ...prev, ...sanitizedData } : null);
    addAuditLog('تحديث الملف الشخصي', 'تم تعديل بيانات الملف الشخصي للموظف', '👤');
  }, [addAuditLog]);

  const addFile = useCallback((fileData) => {
    const newFile = {
      id: Date.now(),
      ...fileData,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      uploadedBy: currentUser?.name || 'موظف'
    };
    logFirestoreOp('setDoc', 'files', String(newFile.id), () => setDoc(doc(db, 'files', String(newFile.id)), newFile)).catch(err => console.warn('addFile error:', err));
  }, [currentUser, logFirestoreOp]);

  const deleteFile = useCallback((fileId) => {
    logFirestoreOp('deleteDoc', 'files', String(fileId), () => deleteDoc(doc(db, 'files', String(fileId)))).catch(err => console.warn('deleteFile error:', err));
  }, [logFirestoreOp]);

  // Clients CRUD
  const addClient = useCallback((clientData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(clientData);
    const newClient = {
      ...sanitizedData,
      id: Date.now(),
      bookingsCount: 0,
      totalSpent: 0
    };
    logFirestoreOp('setDoc', 'clients', String(newClient.id), () => setDoc(doc(db, 'clients', String(newClient.id)), newClient))
      .then(() => {
        triggerNotificationEvent('client_created', newClient, currentUser);
      })
      .catch(err => console.warn('addClient error:', err));
    addAuditLog('إضافة عميل', `تم تسجيل عميل جديد: ${newClient.name}`, '👤');
  }, [addAuditLog, currentUser, logFirestoreOp]);

  const updateClient = useCallback((clientId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    const target = clients.find(c => c.id === Number(clientId));
    if (target) {
      const merged = { ...target, ...sanitizedFields };
      logFirestoreOp('setDoc', 'clients', String(clientId), () => setDoc(doc(db, 'clients', String(clientId)), merged)).catch(err => console.warn('updateClient error:', err));
    }
  }, [clients, logFirestoreOp]);

  // Freelancers CRUD
  const addFreelancer = useCallback((freelancerData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(freelancerData);
    const newFreelancer = {
      ...sanitizedData,
      id: Date.now(),
      bookingsCount: 0,
      totalSpent: 0
    };
    logFirestoreOp('setDoc', 'freelancers', String(newFreelancer.id), () => setDoc(doc(db, 'freelancers', String(newFreelancer.id)), newFreelancer)).catch(err => console.warn('addFreelancer error:', err));
    addAuditLog('إضافة مصور فريلانسر', `تم تسجيل مصور فريلانسر جديد: ${newFreelancer.name}`, '👤');
    return newFreelancer;
  }, [addAuditLog, logFirestoreOp]);

  const updateFreelancer = useCallback((freelancerId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    const target = freelancers.find(f => f.id === Number(freelancerId));
    if (target) {
      const merged = { ...target, ...sanitizedFields };
      logFirestoreOp('setDoc', 'freelancers', String(freelancerId), () => setDoc(doc(db, 'freelancers', String(freelancerId)), merged)).catch(err => console.warn('updateFreelancer error:', err));
    }
  }, [freelancers, logFirestoreOp]);

  // Equipment actions
  const updateEquipment = useCallback((equipmentId, updatedFields) => {
    const target = equipment.find(e => e.id === Number(equipmentId));
    if (target) {
      const merged = { ...target, ...updatedFields };
      logFirestoreOp('setDoc', 'equipment', String(equipmentId), () => setDoc(doc(db, 'equipment', String(equipmentId)), merged)).catch(err => console.warn('updateEquipment error:', err));
    }
  }, [equipment, logFirestoreOp]);

  // Team CRUD
  const addTeamMember = useCallback((memberData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(memberData);
    const newMember = {
      ...sanitizedData,
      id: Date.now(),
      tasksCompleted: 0,
      completionRate: 100,
      points: 100,
      status: 'نشط'
    };
    logFirestoreOp('setDoc', 'team', String(newMember.id), () => setDoc(doc(db, 'team', String(newMember.id)), newMember)).catch(err => console.warn('addTeamMember error:', err));
    addAuditLog('إضافة موظف', `تم إضافة موظف جديد: ${newMember.name}`, '👥');
  }, [addAuditLog, logFirestoreOp]);

  const updateTeamMember = useCallback((memberId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    const target = team.find(m => m.id === Number(memberId));
    if (target) {
      const merged = { ...target, ...sanitizedFields };
      logFirestoreOp('setDoc', 'team', String(memberId), () => setDoc(doc(db, 'team', String(memberId)), merged)).catch(err => console.warn('updateTeamMember error:', err));
      addAuditLog('تحديث بيانات موظف', `تم تحديث بيانات الموظف #${memberId}`, '✏️');
    }
  }, [addAuditLog, team, logFirestoreOp]);

  const deleteTeamMember = useCallback((memberId) => {
    logFirestoreOp('deleteDoc', 'team', String(memberId), () => deleteDoc(doc(db, 'team', String(memberId)))).catch(err => console.warn('deleteTeamMember error:', err));
    addAuditLog('حذف موظف', `تم حذف الموظف #${memberId}`, '🗑️');
  }, [addAuditLog, logFirestoreOp]);

  const toggleSupervisorRole = useCallback((memberId) => {
    const target = team.find(m => m.id === Number(memberId));
    if (target) {
      const merged = { ...target, isSupervisor: !target.isSupervisor };
      logFirestoreOp('setDoc', 'team', String(memberId), () => setDoc(doc(db, 'team', String(memberId)), merged)).catch(err => console.warn('toggleSupervisorRole error:', err));
      addAuditLog('تغيير صلاحيات الموظف', `تم تغيير صلاحيات الموظف #${memberId}`, '👑');
    }
  }, [addAuditLog, team, logFirestoreOp]);

  // Contracts CRUD
  const addContract = useCallback((contractData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(contractData);
    const newId = 700 + contracts.length + 1;
    const newContract = {
      id: newId,
      contractNumber: `CTR-2026-${String(newId).padStart(3, '0')}`,
      status: 'بانتظار التوقيع',
      signedByClient: '',
      signedAt: '',
      signatureData: '',
      ...sanitizedData
    };
    logFirestoreOp('setDoc', 'contracts', String(newContract.id), () => setDoc(doc(db, 'contracts', String(newContract.id)), newContract)).catch(err => console.warn('addContract error:', err));
    addAuditLog('إنشاء عقد', `إنشاء العقد #${newContract.contractNumber} للحجز ${contractData.bookingTitle}`, '📄');
    addNotification('عقد جديد 📄', `تم إنشاء عقد جديد للحجز ${contractData.bookingTitle}`, 'booking');
  }, [contracts, addAuditLog, addNotification, logFirestoreOp]);

  const signContract = useCallback((contractId, signatureData, signedByName) => {
    const sanitizedName = toEnglishDigits(signedByName);
    const target = contracts.find(c => c.id === Number(contractId));
    if (target) {
      const merged = {
        ...target,
        status: 'تم التوقيع',
        signedByClient: sanitizedName,
        signedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        signatureData
      };
      logFirestoreOp('setDoc', 'contracts', String(contractId), () => setDoc(doc(db, 'contracts', String(contractId)), merged)).catch(err => console.warn('signContract error:', err));
      addAuditLog('توقيع عقد', `تم توقيع العقد #${target.contractNumber} بواسطة ${sanitizedName}`, '✍️');
      addNotification('توقيع عقد ✍️', `تم توقيع العقد #${target.contractNumber} بنجاح!`, 'booking');
    }
  }, [contracts, addAuditLog, addNotification, logFirestoreOp]);

  // Invoices CRUD
  const addInvoice = useCallback((invoiceData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(invoiceData);
    const newInvoice = {
      ...sanitizedData,
      id: Date.now(),
      invoiceNumber: `INV-2026-${Math.floor(Math.random() * 900) + 100}`
    };
    logFirestoreOp('setDoc', 'invoices', String(newInvoice.id), () => setDoc(doc(db, 'invoices', String(newInvoice.id)), newInvoice)).catch(err => console.warn('addInvoice error:', err));
  }, [logFirestoreOp]);

  const updateInvoice = useCallback((invoiceId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    const target = invoices.find(inv => inv.id === Number(invoiceId));
    if (target) {
      const merged = { ...target, ...sanitizedFields };
      logFirestoreOp('setDoc', 'invoices', String(invoiceId), () => setDoc(doc(db, 'invoices', String(invoiceId)), merged)).catch(err => console.warn('updateInvoice error:', err));
    }
  }, [invoices, logFirestoreOp]);

  const addPayment = useCallback((paymentData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(paymentData);
    const newPayment = {
      ...sanitizedData,
      id: Date.now()
    };
    logFirestoreOp('setDoc', 'payments', String(newPayment.id), () => setDoc(doc(db, 'payments', String(newPayment.id)), newPayment)).catch(err => console.warn('addPayment error:', err));
    addAuditLog('تسجيل دفعة', `تم تسجيل دفعة بقيمة ${sanitizedData.amount} ريال`, '💰');
    showCelebration('تم تسجيل الدفعة المالية بنجاح! 💰');
  }, [addAuditLog, logFirestoreOp]);

  const addExpense = useCallback((expenseData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(expenseData);
    const newExpense = {
      ...sanitizedData,
      id: Date.now()
    };
    logFirestoreOp('setDoc', 'expenses', String(newExpense.id), () => setDoc(doc(db, 'expenses', String(newExpense.id)), newExpense)).catch(err => console.warn('addExpense error:', err));
    addAuditLog('تسجيل مصروفات', `تم تسجيل مصروف بقيمة ${sanitizedData.amount} ريال`, '💸');
  }, [addAuditLog, logFirestoreOp]);

  const updateSettings = useCallback((newSettings) => {
    const sanitizedSettings = sanitizeObjectToEnglishDigits(newSettings);
    logFirestoreOp('setDoc', 'settings', 'defaultConfig', () => setDoc(doc(db, 'settings', 'defaultConfig'), sanitizedSettings)).catch(err => console.warn('updateSettings error:', err));
    addAuditLog('تعديل الإعدادات', 'تم تحديث إعدادات النظام والهوية البصرية', '⚙️');
  }, [addAuditLog, logFirestoreOp]);

  const markNotificationAsRead = useCallback((notificationId) => {
    const target = notifications.find(n => n.id === Number(notificationId));
    if (target) {
      logFirestoreOp('setDoc', 'notifications', String(notificationId), () => setDoc(doc(db, 'notifications', String(notificationId)), { ...target, read: true })).catch(err => console.warn('markNotificationAsRead error:', err));
    }
  }, [notifications, logFirestoreOp]);

  const handleNotificationClick = (notif) => {
    if (!notif) return;
    logFirestoreOp('setDoc', 'notifications', String(notif.id), () => setDoc(doc(db, 'notifications', String(notif.id)), { ...notif, read: true })).catch(err => console.warn('handleNotificationClick error:', err));

    const notifTitle = notif.title || '';
    const targetType = notif.entityType || (notif.type === 'booking' || notifTitle.includes('حجز') ? 'booking' : notif.type === 'task' || notifTitle.includes('مهمة') ? 'task' : notif.type === 'equipment' || notifTitle.includes('معدة') ? 'equipment' : 'general');
    const targetId = notif.entityId || notif.bookingId;

    if (targetType === 'booking') {
      setActiveTab('bookings');
      if (targetId) {
        const found = bookings.find(b => String(b.id) === String(targetId) || b.bookingNumber === targetId);
        if (found) {
          setSelectedBooking(found);
          setIsBookingDetailOpen(true);
        }
      }
    } else if (targetType === 'task') {
      setActiveTab('tasks');
    } else if (targetType === 'equipment') {
      setActiveTab('equipment');
    } else if (targetType === 'invoice') {
      setActiveTab('invoices');
    } else {
      setActiveTab('dashboard');
    }
  };

  const checkBookingConflicts = (date, startTime, endTime, assignedTeam = [], assignedEquipment = [], currentBookingId = null, endDate = null) => {
    const conflicts = { team: [], equipment: [] };
    if (!date || !startTime || !endTime) return conflicts;

    const toMinutes = (timeStr, isEnd = false) => {
      if (!timeStr) return 0;
      if (timeStr === 'صباحًا') {
        return isEnd ? 720 : 480;
      }
      if (timeStr === 'مساءً') {
        return isEnd ? 1020 : 780;
      }
      const time24 = parseTime12hTo24h(timeStr);
      const [h, m] = time24.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const newStart = toMinutes(startTime, false);
    const newEnd = toMinutes(endTime, true);
    const startDay = date;
    const endDay = endDate || date;

    bookings.forEach(b => {
      if (b.id === Number(currentBookingId)) return;
      
      const bStartDay = b.startDate || b.date;
      const bEndDay = b.endDate || b.date || bStartDay;

      const hasDateOverlap = (startDay <= bEndDay && endDay >= bStartDay);
      if (!hasDateOverlap) return;

      const bStart = toMinutes(b.startTime || '00:00', false);
      const bEnd = toMinutes(b.endTime || '23:59', true);

      const hasTimeOverlap = (newStart < bEnd && newEnd > bStart);

      if (hasTimeOverlap) {
        const bTeam = b.teamMemberIds || b.teamAssigned || [];
        bTeam.forEach(tId => {
          if (assignedTeam.includes(tId)) {
            const member = team.find(t => t.id === tId);
            if (member && !conflicts.team.some(item => item.member.id === tId)) {
              conflicts.team.push({ member, booking: b });
            }
          }
        });

        const bEquip = b.equipmentAssigned || [];
        bEquip.forEach(eId => {
          if (assignedEquipment.includes(eId)) {
            const eq = equipment.find(e => e.id === eId);
            if (eq && !conflicts.equipment.some(item => item.item.id === eId)) {
              conflicts.equipment.push({ item: eq, booking: b });
            }
          }
        });
      }
    });

    return conflicts;
  };

  const checkTravelTimeBuffer = (date, location, assignedTeam = [], currentBookingId = null) => {
    const warnings = [];
    if (!date || !location || !assignedTeam || assignedTeam.length === 0) return warnings;

    bookings.forEach(b => {
      if (b.id === Number(currentBookingId) || b.status === 'ملغي') return;
      
      const bDate = b.startDate || b.date;
      if (bDate === date && b.location !== location) {
        const bTeam = b.teamAssigned || b.teamMemberIds || [];
        bTeam.forEach(tId => {
          if (assignedTeam.includes(tId)) {
            const member = team.find(t => t.id === tId);
            if (member && !warnings.some(w => w.memberId === tId)) {
              warnings.push({
                memberId: tId,
                memberName: member.name,
                otherBooking: b
              });
            }
          }
        });
      }
    });
    return warnings;
  };

  const addToWaitlist = useCallback((item) => {
    const newItem = {
      id: Date.now(),
      ...item
    };
    setDoc(doc(db, 'waitlist', String(newItem.id)), newItem);
    addAuditLog('إضافة لقائمة الانتظار', `تم إضافة ${newItem.clientName} إلى قائمة الانتظار لتاريخ ${newItem.date}`, '⏳');
    showCelebration('تمت الإضافة لقائمة الانتظار بنجاح! ⏳');
  }, [addAuditLog]);

  const removeFromWaitlist = useCallback((waitlistId) => {
    deleteDoc(doc(db, 'waitlist', String(waitlistId)));
    addAuditLog('حذف من قائمة الانتظار', `إزالة طلب من قائمة الانتظار #${waitlistId}`, '🗑️');
  }, [addAuditLog]);

  const addQuotation = useCallback((quoteData) => {
    const newItem = {
      id: Date.now(),
      quoteNumber: `QT-2026-${Math.floor(Math.random() * 900) + 100}`,
      status: 'بانتظار العميل',
      ...quoteData
    };
    setDoc(doc(db, 'quotations', String(newItem.id)), newItem);
    addAuditLog('إنشاء عرض سعر', `تم إنشاء عرض سعر جديد لـ ${quoteData.clientName}`, '📄');
    showCelebration('تم إنشاء عرض السعر بنجاح! 📄');
    return newItem;
  }, [addAuditLog]);

  const convertQuoteToBooking = useCallback((quoteId) => {
    const quote = quotations.find(q => q.id === Number(quoteId));
    if (!quote) return;

    setDoc(doc(db, 'quotations', String(quoteId)), { ...quote, status: 'مقبول' });

    const booking = addBooking({
      clientName: quote.clientName,
      title: quote.description || `حجز من عرض السعر ${quote.quoteNumber}`,
      date: quote.date || new Date().toISOString().substring(0, 10),
      totalPrice: quote.totalPrice,
      status: 'مؤكد',
      location: quote.location || 'موقع استوديو ستار ميديا',
      bookingType: 'client'
    });

    addAuditLog('تحويل عرض سعر لحجز', `تم تحويل عرض السعر ${quote.quoteNumber} إلى حجز مؤكد`, '🔄');
    showCelebration('تم قبول وتحويل عرض السعر لحجز مؤكد بنجاح! 🎊');
    return booking;
  }, [quotations, addBooking, addAuditLog]);

  const markAllNotificationsAsRead = useCallback(() => {
    notifications.forEach(n => {
      if (!n.read) {
        logFirestoreOp('setDoc', 'notifications', String(n.id), () => setDoc(doc(db, 'notifications', String(n.id)), { ...n, read: true })).catch(err => console.warn('markAllNotificationsAsRead error:', err));
      }
    });
  }, [notifications, logFirestoreOp]);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode(prev => {
      const newVal = !prev;
      addAuditLog('تغيير وضع الخصوصية', `تم ${newVal ? 'تفعيل' : 'تعطيل'} وضع الخصوصية وإخفاء البيانات الحساسة`, '🔒');
      return newVal;
    });
  }, [addAuditLog]);

  const toggleOfflineMode = useCallback(() => {
    setIsOnline(prev => {
      const newVal = !prev;
      if (newVal) {
        showCelebration('النظام متصل الآن بالإنترنت (Online) 🌐');
      } else {
        showCelebration('النظام يعمل الآن بدون اتصال (Offline) 📶');
      }
      return newVal;
    });
  }, []);

  const syncOfflineData = useCallback(() => {
    if (pendingOfflineActions.length === 0) {
      showCelebration('لا توجد بيانات بانتظار المزامنة!');
      return;
    }
    setPendingOfflineActions([]);
    showCelebration('تمت مزامنة كافة البيانات المحلية بنجاح مع السيرفر وبدون تكرار! ⚡');
    addAuditLog('مزامنة البيانات', 'تمت مزامنة العمليات المحلية غير المتصلة بنجاح', '⚡');
  }, [pendingOfflineActions, addAuditLog]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeOverlay,
        setActiveOverlay,
        currentUser,
        setCurrentUser,
        userRole,
        setUserRole,
        loginUser,
        logoutUser,
        searchQuery,
        setSearchQuery,
        celebrationToast,
        setCelebrationToast,
        showCelebration,
        isLoadingBookings,
        
        team,
        setTeam,
        clients,
        setClients,
        companies,
        setCompanies,
        freelancers,
        setFreelancers,
        equipment,
        setEquipment,
        bookings,
        setBookings,
        projects,
        setProjects,
        tasks,
        setTasks,
        invoices,
        setInvoices,
        payments,
        setPayments,
        expenses,
        setExpenses,
        auditLogs,
        setAuditLogs,
        notifications,
        setNotifications,
        settings,
        setSettings,
        contracts,
        setContracts,
        files,
        setFiles,
        customRoles,
        setCustomRoles,

        quotations,
        setQuotations,
        waitlist,
        setWaitlist,
        privacyMode,
        togglePrivacyMode,
        isOnline,
        toggleOfflineMode,
        pendingOfflineActions,
        syncOfflineData,

        selectedBooking,
        setSelectedBooking,
        selectedDateForBooking,
        setSelectedDateForBooking,
        openBookingFormWithDate,
        
        isSearchModalOpen,
        setIsSearchModalOpen,
        isBookingDetailOpen,
        setIsBookingDetailOpen,
        isBookingFormOpen,
        setIsBookingFormOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,

        // CRUD Operations
        addBooking,
        updateBooking,
        deleteBooking,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        addClient,
        updateClient,
        addFreelancer,
        updateFreelancer,
        updateEquipment,
        addInvoice,
        updateInvoice,
        addPayment,
        addExpense,
        updateSettings,
        markNotificationAsRead,
        addAuditLog,
        handleNotificationClick,
        markAllNotificationsAsRead,
        checkBookingConflicts,
        checkTravelTimeBuffer,
        addToWaitlist,
        removeFromWaitlist,
        addQuotation,
        convertQuoteToBooking,
        addNotification,
        checkInLocation,
        updateTaskStatus,
        updateUserProfile,
        addFile,
        deleteFile,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        toggleSupervisorRole,
        addContract,
        signContract
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
