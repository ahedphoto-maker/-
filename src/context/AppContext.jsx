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
import { triggerCelebration, toEnglishDigits, sanitizeObjectToEnglishDigits } from '../utils/helpers';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation & User Role State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeOverlay, setActiveOverlay] = useState('NONE');
  const [celebrationToast, setCelebrationToast] = useState(null);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState(() => {
    // Default logged in user for prototype demonstration
    return initialTeam[0] || {
      id: 1,
      name: 'عاهد العماري',
      role: 'مصور فريلانسر / منظم حجوزاتي العهد ستار 👑',
      email: 'ahdalamary@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      isSupervisor: true
    };
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
  }, []);

  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    setUserRole(null);
  }, []);

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

  // Core App Datasets in local state
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

  useEffect(() => { localStorage.setItem('star_media_team', JSON.stringify(team)); }, [team]);
  useEffect(() => { localStorage.setItem('star_media_clients', JSON.stringify(clients)); }, [clients]);
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

  // ─── LOCAL STATE CRUD ACTIONS ───────────────────────────────────────────
  const addAuditLog = useCallback((action, details, icon = '📝') => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: currentUser?.name || 'زائر',
      userRole: userRole === 'admin' ? 'المشرف' : 'عضو فريق',
      action,
      details,
      icon
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser, userRole]);

  // Bookings CRUD
  const addBooking = useCallback((bookingData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(bookingData);
    
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
        locked: sanitizedData.status === 'مؤكد'
      };
    });

    if (!isOnline) {
      setPendingOfflineActions(prev => [...prev, { type: 'ADD_BOOKING', data: newBookings }]);
      setBookings(prev => [...newBookings, ...prev]);
      showCelebration('تم حفظ الحجز محلياً (وضع أوفلاين) 🔒');
    } else {
      setBookings(prev => [...newBookings, ...prev]);
      showCelebration('تم إنشاء الحجز وتزامنه بنجاح! 🎉');
    }
    
    if (newBookings.length === 1) {
      addAuditLog('إنشاء حجز', `تم إنشاء حجز جديد: ${newBookings[0].title}`, '📅');
    } else {
      addAuditLog('إنشاء حجوزات متكررة', `تم إنشاء عدد ${newBookings.length} حجوزات متكررة لـ ${newBookings[0].title}`, '📅');
    }
    return newBookings[0];
  }, [addAuditLog, isOnline, currentUser]);

  const updateBooking = useCallback((bookingId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);

    if (!isOnline) {
      setPendingOfflineActions(prev => [...prev, { type: 'UPDATE_BOOKING', bookingId, data: sanitizedFields }]);
      showCelebration('تم حفظ التعديل محلياً (وضع أوفلاين) 🔒');
    }

    setBookings(prev => prev.map(b => {
      if (b.id === Number(bookingId)) {
        const changes = [];
        if (sanitizedFields.date && sanitizedFields.date !== b.date) changes.push(`تغيير التاريخ من ${b.date} إلى ${sanitizedFields.date}`);
        if (sanitizedFields.status && sanitizedFields.status !== b.status) changes.push(`تغيير الحالة من ${b.status} إلى ${sanitizedFields.status}`);
        if (sanitizedFields.teamAssigned && JSON.stringify(sanitizedFields.teamAssigned) !== JSON.stringify(b.teamAssigned)) changes.push(`تعديل الفريق المكلف`);
        
        const newLogs = [...(b.changeLogs || [])];
        if (changes.length > 0) {
          newLogs.push({
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            userName: currentUser?.name || 'النظام',
            action: changes.join(' | ')
          });
        }

        const merged = {
          ...b,
          ...sanitizedFields,
          changeLogs: newLogs,
          locked: sanitizedFields.status === 'مؤكد' || b.status === 'مؤكد'
        };

        // Recalculate remaining amount and financialStatus if prices are updated
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

        return merged;
      }
      return b;
    }));
    addAuditLog('تحديث حجز', `تم تعديل تفاصيل الحجز رقم ${bookingId}`, '📅');
  }, [addAuditLog, isOnline, currentUser]);

  const deleteBooking = useCallback((bookingId) => {
    const target = bookings.find(b => b.id === Number(bookingId));
    if (target && target.status === 'مؤكد') {
      setBookings(prev => prev.map(b => b.id === Number(bookingId) ? { ...b, status: 'ملغي' } : b));
      addAuditLog('إلغاء حجز مؤكد', `تم إلغاء الحجز المؤكد رقم ${bookingId} بدلاً من حذفه بالكامل`, '⚠️');
      showCelebration('تم إلغاء الحجز المؤكد أمنياً 🔒');
      return;
    }

    if (!isOnline) {
      setPendingOfflineActions(prev => [...prev, { type: 'DELETE_BOOKING', bookingId }]);
    }
    setBookings(prev => prev.filter(b => b.id !== Number(bookingId)));
    addAuditLog('حذف حجز', `تم إزالة الحجز رقم ${bookingId}`, '❌');
  }, [addAuditLog, isOnline, bookings]);

  // Tasks CRUD
  const addTask = useCallback((taskData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(taskData);
    const newTask = {
      ...sanitizedData,
      id: Date.now(),
      progress: 0,
      checklist: (sanitizedData.checklist || []).map(text => ({ text, done: false }))
    };
    setTasks(prev => [newTask, ...prev]);
    addAuditLog('إسناد مهمة', `تم إسناد مهمة جديدة: ${newTask.title}`, '🎯');
  }, [addAuditLog]);

  const updateTask = useCallback((taskId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    setTasks(prev => prev.map(t => t.id === Number(taskId) ? { ...t, ...sanitizedFields } : t));
    addAuditLog('تحديث مهمة', `تم تعديل تفاصيل المهمة رقم ${taskId}`, '✓');
  }, [addAuditLog]);

  const deleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(t => t.id !== Number(taskId)));
    addAuditLog('حذف مهمة', `تم إزالة المهمة رقم ${taskId}`, '🗑️');
  }, [addAuditLog]);

  const completeTask = useCallback((taskId) => {
    const task = tasks.find(t => t.id === Number(taskId));
    if (!task) return;

    setTasks(prev => prev.map(t => t.id === Number(taskId) ? { ...t, status: 'مكتملة', progress: 100 } : t));
    
    const earnedPoints = task.points || 10;
    setTeam(prev => prev.map(m => m.id === task.assigneeId ? { ...m, points: (m.points || 0) + earnedPoints, tasksCompleted: (m.tasksCompleted || 0) + 1 } : m));

    showCelebration(`أحسنت يا ${task.assigneeName}! تم إكمال المهمة بنجاح 🎉 (+${earnedPoints} نقطة إنجاز)`);
    addAuditLog('إكمال مهمة', `تم إنجاز المهمة: ${task.title} بواسطة ${task.assigneeName}`, '🎉');
  }, [tasks, addAuditLog]);

  const addNotification = useCallback((title, message, type = 'general') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: 'الآن',
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const checkInLocation = useCallback((taskId, checkInType, coords = '24.7136, 46.6753') => {
    setTasks(prev => prev.map(t => {
      if (t.id === Number(taskId)) {
        const now = new Date().toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
        const updatedTask = { ...t };
        if (checkInType === 'heading') {
          updatedTask.status = 'في الطريق';
          updatedTask.headingTime = now;
          addAuditLog('بدء التوجه للموقع', `المصور بدأ التوجه للمهمة: ${t.title}`, '📍');
          addNotification('بدء التوجه 📍', `${currentUser?.name} بدأ التوجه لموقع المهمة: ${t.title}`, 'task');
        } else if (checkInType === 'arrived') {
          updatedTask.status = 'وصلت';
          updatedTask.arrivalTime = now;
          updatedTask.coords = coords;
          addAuditLog('الوصول للموقع', `وصل المصور للموقع للمهمة: ${t.title} (إحداثيات: ${coords})`, '📍');
          addNotification('وصلت للموقع 📍', `وصل ${currentUser?.name} لموقع المهمة: ${t.title}`, 'task');
        }
        return updatedTask;
      }
      return t;
    }));
  }, [currentUser, addAuditLog, addNotification]);

  const updateTaskStatus = useCallback((taskId, status, progress) => {
    setTasks(prev => prev.map(t => t.id === Number(taskId) ? { ...t, status, progress } : t));
    addAuditLog('تحديث حالة المهمة', `تم تغيير حالة المهمة #${taskId} إلى ${status}`, '✓');
  }, [addAuditLog]);

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
    setFiles(prev => [newFile, ...prev]);
  }, [currentUser]);

  const deleteFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== Number(fileId)));
  }, []);

  // Clients CRUD
  const addClient = useCallback((clientData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(clientData);
    const newClient = {
      ...sanitizedData,
      id: Date.now(),
      bookingsCount: 0,
      totalSpent: 0
    };
    setClients(prev => [newClient, ...prev]);
    addAuditLog('إضافة عميل', `تم تسجيل عميل جديد: ${newClient.name}`, '👤');
  }, [addAuditLog]);

  const updateClient = useCallback((clientId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    setClients(prev => prev.map(c => c.id === Number(clientId) ? { ...c, ...sanitizedFields } : c));
  }, []);

  // Freelancers CRUD
  const addFreelancer = useCallback((freelancerData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(freelancerData);
    const newFreelancer = {
      ...sanitizedData,
      id: Date.now(),
      bookingsCount: 0,
      totalSpent: 0
    };
    setFreelancers(prev => [newFreelancer, ...prev]);
    addAuditLog('إضافة مصور فريلانسر', `تم تسجيل مصور فريلانسر جديد: ${newFreelancer.name}`, '👤');
    return newFreelancer;
  }, [addAuditLog]);

  const updateFreelancer = useCallback((freelancerId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    setFreelancers(prev => prev.map(f => f.id === Number(freelancerId) ? { ...f, ...sanitizedFields } : f));
  }, []);

  // Equipment actions
  const updateEquipment = useCallback((equipmentId, updatedFields) => {
    setEquipment(prev => prev.map(e => e.id === Number(equipmentId) ? { ...e, ...updatedFields } : e));
  }, []);

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
    setTeam(prev => [...prev, newMember]);
    addAuditLog('إضافة موظف', `تم إضافة موظف جديد: ${newMember.name}`, '👥');
  }, [addAuditLog]);

  const updateTeamMember = useCallback((memberId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    setTeam(prev => prev.map(m => m.id === Number(memberId) ? { ...m, ...sanitizedFields } : m));
    addAuditLog('تحديث بيانات موظف', `تم تحديث بيانات الموظف #${memberId}`, '✏️');
  }, [addAuditLog]);

  const deleteTeamMember = useCallback((memberId) => {
    setTeam(prev => prev.filter(m => m.id !== Number(memberId)));
    addAuditLog('حذف موظف', `تم حذف الموظف #${memberId}`, '🗑️');
  }, [addAuditLog]);

  const toggleSupervisorRole = useCallback((memberId) => {
    setTeam(prev => prev.map(m => m.id === Number(memberId) ? { ...m, isSupervisor: !m.isSupervisor } : m));
    addAuditLog('تغيير صلاحيات الموظف', `تم تغيير صلاحيات الموظف #${memberId}`, '👑');
  }, [addAuditLog]);

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
    setContracts(prev => [newContract, ...prev]);
    addAuditLog('إنشاء عقد', `إنشاء العقد #${newContract.contractNumber} للحجز ${contractData.bookingTitle}`, '📄');
    addNotification('عقد جديد 📄', `تم إنشاء عقد جديد للحجز ${contractData.bookingTitle}`, 'booking');
  }, [contracts, addAuditLog, addNotification]);

  const signContract = useCallback((contractId, signatureData, signedByName) => {
    const sanitizedName = toEnglishDigits(signedByName);
    setContracts(prev => prev.map(c => {
      if (c.id === Number(contractId)) {
        addAuditLog('توقيع عقد', `تم توقيع العقد #${c.contractNumber} بواسطة ${sanitizedName}`, '✍️');
        addNotification('توقيع عقد ✍️', `تم توقيع العقد #${c.contractNumber} بنجاح!`, 'booking');
        return {
          ...c,
          status: 'تم التوقيع',
          signedByClient: sanitizedName,
          signedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          signatureData
        };
      }
      return c;
    }));
  }, [addAuditLog, addNotification]);

  // Invoices CRUD
  const addInvoice = useCallback((invoiceData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(invoiceData);
    const newInvoice = {
      ...sanitizedData,
      id: Date.now(),
      invoiceNumber: `INV-2026-${Math.floor(Math.random() * 900) + 100}`
    };
    setInvoices(prev => [newInvoice, ...prev]);
  }, []);

  const updateInvoice = useCallback((invoiceId, updatedFields) => {
    const sanitizedFields = sanitizeObjectToEnglishDigits(updatedFields);
    setInvoices(prev => prev.map(inv => inv.id === Number(invoiceId) ? { ...inv, ...sanitizedFields } : inv));
  }, []);

  const addPayment = useCallback((paymentData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(paymentData);
    const newPayment = {
      ...sanitizedData,
      id: Date.now()
    };
    setPayments(prev => [newPayment, ...prev]);
    addAuditLog('تسجيل دفعة', `تم تسجيل دفعة بقيمة ${sanitizedData.amount} ريال`, '💰');
    showCelebration('تم تسجيل الدفعة المالية بنجاح! 💰');
  }, [addAuditLog]);

  const addExpense = useCallback((expenseData) => {
    const sanitizedData = sanitizeObjectToEnglishDigits(expenseData);
    const newExpense = {
      ...sanitizedData,
      id: Date.now()
    };
    setExpenses(prev => [newExpense, ...prev]);
    addAuditLog('تسجيل مصروفات', `تم تسجيل مصروف بقيمة ${sanitizedData.amount} ريال`, '💸');
  }, [addAuditLog]);

  const updateSettings = useCallback((newSettings) => {
    const sanitizedSettings = sanitizeObjectToEnglishDigits(newSettings);
    setSettings(sanitizedSettings);
    addAuditLog('تعديل الإعدادات', 'تم تحديث إعدادات النظام والهوية البصرية', '⚙️');
  }, [addAuditLog]);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => prev.map(n => n.id === Number(notificationId) ? { ...n, read: true } : n));
  }, []);

  const handleNotificationClick = (notif) => {
    if (!notif) return;
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));

    const targetType = notif.entityType || (notif.type === 'booking' || notif.title.includes('حجز') ? 'booking' : notif.type === 'task' || notif.title.includes('مهمة') ? 'task' : notif.type === 'equipment' || notif.title.includes('معدة') ? 'equipment' : 'general');
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
      navigateTo('/admin/bookings');
    } else if (targetType === 'task') {
      setActiveTab('tasks');
      navigateTo('/admin/tasks');
    } else if (targetType === 'equipment') {
      setActiveTab('equipment');
      navigateTo('/admin/equipment');
    } else if (targetType === 'invoice') {
      setActiveTab('invoices');
      navigateTo('/admin/invoices');
    } else {
      setActiveTab('dashboard');
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const checkBookingConflicts = (date, startTime, endTime, assignedTeam = [], assignedEquipment = [], currentBookingId = null, endDate = null) => {
    const conflicts = { team: [], equipment: [] };
    if (!date || !startTime || !endTime) return conflicts;

    const toMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);
    const startDay = date;
    const endDay = endDate || date;

    bookings.forEach(b => {
      if (b.id === Number(currentBookingId)) return;
      
      const bStartDay = b.startDate || b.date;
      const bEndDay = b.endDate || b.date || bStartDay;

      // Check date overlap
      const hasDateOverlap = (startDay <= bEndDay && endDay >= bStartDay);
      if (!hasDateOverlap) return;

      const bStart = toMinutes(b.startTime || '00:00');
      const bEnd = toMinutes(b.endTime || '23:59');

      // Check time overlap
      const hasTimeOverlap = (newStart < bEnd && newEnd > bStart);

      if (hasTimeOverlap) {
        // Team conflict check
        const bTeam = b.teamMemberIds || b.teamAssigned || [];
        bTeam.forEach(tId => {
          if (assignedTeam.includes(tId)) {
            const member = team.find(t => t.id === tId);
            if (member && !conflicts.team.some(item => item.member.id === tId)) {
              conflicts.team.push({ member, booking: b });
            }
          }
        });

        // Equipment conflict check
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
    setWaitlist(prev => [...prev, newItem]);
    addAuditLog('إضافة لقائمة الانتظار', `تم إضافة ${newItem.clientName} إلى قائمة الانتظار لتاريخ ${newItem.date}`, '⏳');
    showCelebration('تمت الإضافة لقائمة الانتظار بنجاح! ⏳');
  }, [addAuditLog]);

  const removeFromWaitlist = useCallback((waitlistId) => {
    setWaitlist(prev => prev.filter(w => w.id !== Number(waitlistId)));
    addAuditLog('حذف من قائمة الانتظار', `إزالة طلب من قائمة الانتظار #${waitlistId}`, '🗑️');
  }, [addAuditLog]);

  const addQuotation = useCallback((quoteData) => {
    const newItem = {
      id: Date.now(),
      quoteNumber: `QT-2026-${Math.floor(Math.random() * 900) + 100}`,
      status: 'بانتظار العميل',
      ...quoteData
    };
    setQuotations(prev => [newItem, ...prev]);
    addAuditLog('إنشاء عرض سعر', `تم إنشاء عرض سعر جديد لـ ${quoteData.clientName}`, '📄');
    showCelebration('تم إنشاء عرض السعر بنجاح! 📄');
    return newItem;
  }, [addAuditLog]);

  const convertQuoteToBooking = useCallback((quoteId) => {
    const quote = quotations.find(q => q.id === Number(quoteId));
    if (!quote) return;

    setQuotations(prev => prev.map(q => q.id === Number(quoteId) ? { ...q, status: 'مقبول' } : q));

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
