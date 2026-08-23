import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatCurrency, formatBookingNumber } from '../../utils/helpers';
import * as Icons from 'lucide-react';

export const BookingsView = () => {
  const {
    bookings,
    team,
    currentUser,
    setSelectedBooking,
    setIsBookingFormOpen,
    setIsBookingDetailOpen,
    userRole,
    updateBooking,
    deleteBooking,
    addBooking,
    freelancers,
    companies,
    setCompanies,
    updateFreelancer,
    checkTravelTimeBuffer,
    privacyMode,
    waitlist = [],
    addToWaitlist,
    removeFromWaitlist,
    quotations = [],
    addQuotation,
    convertQuoteToBooking
  } = useApp();

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'statements' | 'collaborations'
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter States
  const [searchFilter, setSearchFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'week' | 'upcoming' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل'); // 'الكل' or specific status
  const [financialFilter, setFinancialFilter] = useState('all'); // 'all' | 'unpaid' | 'partial' | 'no_price'
  const [viewStyle, setViewStyle] = useState('list'); // 'list' | 'calendar'
  
  // Inline Calendar States
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());

  // Side Drawer & Dropdown states
  const [drawerBooking, setDrawerBooking] = useState(null);
  const [isDrawerEditing, setIsDrawerEditing] = useState(false);
  const [drawerEditData, setDrawerEditData] = useState({});
  const [activeMenuId, setActiveMenuId] = useState(null);
  const dropdownRef = useRef(null);

  // WhatsApp context menu triggers on long press
  const [activeLongPressBookingId, setActiveLongPressBookingId] = useState(null);

  // WhatsApp templating inside Side Panel
  const [activeWhatsAppEntity, setActiveWhatsAppEntity] = useState(null); // 'client' | 'freelancer' | 'company'
  const [selectedTemplate, setSelectedTemplate] = useState('ready');
  const [messageText, setMessageText] = useState('');
  const [phoneOverride, setPhoneOverride] = useState('');

  // Status Colors Mapping
  const statuses = [
    { label: 'الكل', color: 'var(--text-muted)' },
    { label: 'مؤكد', color: '#10b981' },
    { label: 'بانتظار التأكيد', color: '#f59e0b' },
    { label: 'جاري التنفيذ', color: '#3b82f6' },
    { label: 'مكتمل', color: '#64748b' },
    { label: 'ملغي', color: '#ef4444' }
  ];

  const getStatusColor = (st) => {
    switch (st) {
      case 'مؤكد': return '#10b981';
      case 'جاري التنفيذ': return '#3b82f6';
      case 'بانتظار التأكيد': return '#f59e0b';
      case 'ملغي': return '#ef4444';
      case 'مكتمل': return '#64748b';
      default: return '#3b82f6';
    }
  };

  const handleQuickAddPrice = (b) => {
    const priceStr = prompt('أدخل السعر / قيمة الاتفاق بالريال (أرقام إنجليزية فقط):', b.totalPrice !== null ? b.totalPrice : '');
    if (priceStr === null) return; // cancel click
    
    const priceVal = priceStr.trim() === '' ? null : Number(priceStr.replace(/[^0-9.]/g, ''));
    if (updateBooking) {
      updateBooking(b.id, {
        totalPrice: priceVal,
        remainingAmount: priceVal !== null ? Math.max(0, priceVal - (b.paidAmount || 0)) : null,
        paymentStatus: priceVal === null ? 'لم يحدد بعد' : ((priceVal - (b.paidAmount || 0)) <= 0 ? 'مدفوع' : ((b.paidAmount || 0) > 0 ? 'جزئي' : 'غير مدفوع')),
        financialStatus: priceVal === null ? 'no_price' : 'price_set'
      });
      
      // Update local drawer state if active
      if (drawerBooking && drawerBooking.id === b.id) {
        setDrawerBooking(prev => ({
          ...prev,
          totalPrice: priceVal,
          remainingAmount: priceVal !== null ? Math.max(0, priceVal - (b.paidAmount || 0)) : null,
          paymentStatus: priceVal === null ? 'لم يحدد بعد' : ((priceVal - (b.paidAmount || 0)) <= 0 ? 'مدفوع' : ((b.paidAmount || 0) > 0 ? 'جزئي' : 'غير مدفوع')),
          financialStatus: priceVal === null ? 'no_price' : 'price_set'
        }));
      }
      
      alert('تم تحديث السعر والموقف المالي للحجز بنجاح! 💰');
    }
  };

  const renderFinancialStatusIcon = (b) => {
    let fStatus = b.financialStatus;
    if (!fStatus) {
      if (b.totalPrice === null || b.totalPrice === undefined || b.totalPrice === '') {
        fStatus = 'no_price';
      } else if ((b.paidAmount || 0) >= b.totalPrice && b.totalPrice > 0) {
        fStatus = 'settled';
      } else if (b.invoiceNumber || b.invoiceId) {
        fStatus = 'invoice_added';
      } else if ((b.paidAmount || 0) < b.totalPrice && (b.paidAmount || 0) > 0) {
        fStatus = 'due';
      } else {
        fStatus = 'price_set';
      }
    }

    const handleClickBadge = (e) => {
      e.stopPropagation();
      if (fStatus === 'no_price') {
        handleQuickAddPrice(b);
      } else {
        setSelectedBooking(b);
        setIsBookingDetailOpen(true);
      }
    };

    switch (fStatus) {
      case 'no_price':
        return (
          <span 
            onClick={handleClickBadge}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 900, backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)', cursor: 'pointer' }}
            title="بدون سعر - اضغط لإضافة السعر"
          >
            <Icons.AlertCircle size={12} />
            <span>⚠️ بدون سعر</span>
          </span>
        );
      case 'settled':
        return (
          <span 
            onClick={handleClickBadge}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 900, backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)', cursor: 'pointer' }}
            title="تمت التسوية"
          >
            <Icons.CheckCircle2 size={12} />
            <span>تمت التسوية</span>
          </span>
        );
      case 'invoice_added':
        return (
          <span 
            onClick={handleClickBadge}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 900, backgroundColor: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.15)', cursor: 'pointer' }}
            title="فاتورة مضافة"
          >
            <Icons.FileText size={12} />
            <span>فاتورة مضافة</span>
          </span>
        );
      case 'due':
        return (
          <span 
            onClick={handleClickBadge}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 900, backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)', cursor: 'pointer' }}
            title="مستحق"
          >
            <Icons.Clock size={12} />
            <span>مستحق</span>
          </span>
        );
      case 'price_set':
      default:
        return (
          <span 
            onClick={handleClickBadge}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '50px', fontSize: '0.68rem', fontWeight: 900, backgroundColor: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.15)', cursor: 'pointer' }}
            title="السعر محدد"
          >
            <Icons.Coins size={12} />
            <span>السعر محدد</span>
          </span>
        );
    }
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const isEmployee = userRole === 'employee' || userRole === 'photographer';

  const isBookingOnDate = (booking, dateStr) => {
    if (!booking) return false;
    const start = booking.startDate || booking.date;
    const end = booking.endDate || booking.date || start;
    return dateStr >= start && dateStr <= end;
  };

  const getDayLabel = (dateStr) => {
    if (!dateStr) return null;
    const cleanDate = dateStr.split(' ')[0];
    if (cleanDate === todayStr) {
      return { text: 'اليوم', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().substring(0, 10);
    if (cleanDate === tomorrowStr) {
      return { text: 'غداً', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' };
    }
    return null;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getEntityName = (b) => {
    if (!b) return '-';
    if (b.bookingType === 'freelancer') {
      return b.freelancerName || 'مصور فريلانسر';
    }
    if (b.bookingType === 'company' || b.bookingType === 'partnership') {
      return b.companyName || 'شركة شريكة';
    }
    return b.clientName || '-';
  };

  const getEntityTypeLabel = (b) => {
    if (!b) return 'عميل';
    if (b.bookingType === 'freelancer') return '👤 فريلانسر';
    if (b.bookingType === 'company') return '🏢 شركة';
    if (b.bookingType === 'partnership') return '🤝 شراكة';
    return '👥 عميل';
  };

  const getLastActionText = (b) => {
    if (b.confirmationLogs && b.confirmationLogs.length > 0) {
      return b.confirmationLogs[0].text;
    }
    if (b.status === 'بانتظار التأكيد') return 'بانتظار التأكيد';
    if (b.status === 'مؤكد') return 'تم تأكيد الموعد';
    if (b.status === 'جاري التنفيذ') return 'جاري تصوير الفعالية';
    if (b.status === 'مكتمل') return 'تم إكمال الخدمة بنجاح';
    return 'لم يسجل أي إجراء تواصل';
  };

  // WhatsApp templates builder inside side panel
  useEffect(() => {
    if (activeWhatsAppEntity && drawerBooking) {
      let phone = '';
      if (activeWhatsAppEntity === 'client') phone = drawerBooking.clientPhone;
      else if (activeWhatsAppEntity === 'freelancer') phone = drawerBooking.freelancerPhone;
      else if (activeWhatsAppEntity === 'company') phone = drawerBooking.contactPhone;
      
      setPhoneOverride(phone || '');
      setMessageText(getTemplateText(selectedTemplate, drawerBooking, activeWhatsAppEntity));
    }
  }, [activeWhatsAppEntity, selectedTemplate, drawerBooking]);

  const getTemplateText = (key, b, entity) => {
    const partnerName = b.bookingType === 'freelancer' ? (b.freelancerName || 'المصور') : (b.companyName || 'الشركة');
    const clientName = b.clientName || 'العميل';
    const bookingDateStr = b.date || b.startDate || '-';
    const bookingTimeStr = b.isAllDay ? 'طوال اليوم' : (b.startTime || '16:00');
    const locationStr = b.location || 'موقع التصوير';

    let base = '';
    switch (key) {
      case 'ready':
        base = `السلام عليكم، يعطيكم العافية 🌷\nأود أن أؤكد لكم أنني جاهز بإذن الله لموعدنا غداً، ومؤكد حضوري معكم.\nإذا كان هناك أي تحديث أو شيء مطلوب مني قبل الموعد، أرجو إبلاغي.\nبالتوفيق ونلتقي على الموعد 🤍`;
        break;
      case 'confirm':
        base = `السلام عليكم 🌷\nتذكير بموعدنا غداً بإذن الله.\nأنا جاهز ومؤكد حضوري معكم، وأحببت أن أتأكد أن الموعد ما زال مؤكداً من جهتكم أيضاً.\nإذا كان هناك أي تغيير أو تحديث أرجو إبلاغي الله يعافيكم. 🤍`;
        break;
      case 'go_with':
        base = `السلام عليكم، يعطيكم العافية 🌷\nأؤكد لكم أنني جاهز وبإذن الله سأكون معكم في موعد التصوير المجدول.\nالموعد مؤكد من جهتي، وإذا كان هناك أي تغيير أو تفاصيل جديدة قبل الموعد بلغوني.\nنشوفكم على خير 🤍`;
        break;
      case 'remind':
        base = `السلام عليكم 🌷\nتذكير بموعد التصوير المقرر غداً بإذن الله.\nنشوفكم على خير وفي الموعد المحدد 🤍`;
        break;
      case 'quick':
        base = `السلام عليكم، أنا جاهز ومؤكد حضوري معكم غداً بإذن الله. إذا كان هناك أي تحديث بلغوني، ونراكم على الموعد 🤍`;
        break;
      default:
        base = `السلام عليكم 🌷`;
    }

    let details = `\n\n📌 بيانات التغطية:`;
    if (b.bookingType === 'freelancer' || b.bookingType === 'company') {
      details += `\n- الجهة: ${partnerName}`;
      if (b.clientName) details += `\n- العميل المرتبط: ${clientName}`;
    } else {
      details += `\n- العميل: ${clientName}`;
    }
    details += `\n- التاريخ: ${bookingDateStr}`;
    details += `\n- الوقت: ${bookingTimeStr}`;
    if (locationStr && locationStr !== 'موقع استوديو ستار ميديا') {
      details += `\n- الموقع: 📍 ${locationStr}`;
    }

    return `${base}${details}`;
  };

  const getTemplateLabel = (key) => {
    switch (key) {
      case 'ready': return 'أنا جاهز';
      case 'confirm': return 'تأكيد الموعد';
      case 'go_with': return 'سأذهب معكم';
      case 'remind': return 'تذكير بالموعد';
      case 'quick': return 'رسالة سريعة';
      default: return 'رسالة مخصصة';
    }
  };

  const handleSendWhatsAppFromPanel = () => {
    if (!phoneOverride.trim()) {
      alert('الرجاء إدخال رقم جوال صحيح أولاً!');
      return;
    }
    const cleanPhone = phoneOverride.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone.replace(/^0/, '')}`;
    const encoded = encodeURIComponent(messageText);

    // Save transaction log back
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newLog = {
      date: dateStr,
      text: `تم إرسال «${getTemplateLabel(selectedTemplate)}» إلى ${activeWhatsAppEntity === 'client' ? 'العميل' : 'المتعاون'} عبر واتساب.`
    };
    const logs = [newLog, ...(drawerBooking.confirmationLogs || [])];
    
    let newReadiness = drawerBooking.readinessStatus || 'لم يتم التأكيد';
    if (selectedTemplate === 'ready') newReadiness = 'أرسلت تأكيدي';
    else if (selectedTemplate === 'confirm') newReadiness = 'بانتظار رد الطرف الآخر';

    if (updateBooking) {
      updateBooking(drawerBooking.id, {
        confirmationLogs: logs,
        readinessStatus: newReadiness,
        ...(activeWhatsAppEntity === 'client' ? { clientPhone: phoneOverride } : (activeWhatsAppEntity === 'freelancer' ? { freelancerPhone: phoneOverride } : { contactPhone: phoneOverride }))
      });
    }

    window.open(`https://wa.me/${targetPhone}?text=${encoded}`, '_blank');
    setActiveWhatsAppEntity(null);
  };

  // WhatsApp quick single click sender helper
  const handleSendWhatsAppDirect = (b, templateKey = 'ready') => {
    setActiveLongPressBookingId(null);
    const phone = b.bookingType === 'freelancer'
      ? b.freelancerPhone
      : (b.bookingType === 'company' || b.bookingType === 'partnership' ? b.contactPhone : b.clientPhone);
    
    if (!phone) return;

    const message = getTemplateText(templateKey, b, b.bookingType === 'freelancer' ? 'freelancer' : (b.bookingType === 'company' ? 'company' : 'client'));
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone.replace(/^0/, '')}`;
    const encoded = encodeURIComponent(message);

    const now = new Date();
    const dateLogStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newLog = {
      date: dateLogStr,
      text: `تم إرسال «${getTemplateLabel(templateKey)}» عبر واتساب سريع.`
    };
    const logs = [newLog, ...(b.confirmationLogs || [])];

    let newReadiness = b.readinessStatus || 'لم يتم التأكيد';
    if (templateKey === 'ready') newReadiness = 'أرسلت تأكيدي';
    else if (templateKey === 'confirm') newReadiness = 'بانتظار رد الطرف الآخر';

    if (updateBooking) {
      updateBooking(b.id, {
        confirmationLogs: logs,
        readinessStatus: newReadiness
      });
    }

    window.open(`https://wa.me/${targetPhone}?text=${encoded}`, '_blank');
  };

  // Event handlers builder to distinguish single click vs long press
  const createWhatsAppHandlers = (booking) => {
    let pressTimer;
    let isLongPress = false;

    const startPress = (e) => {
      e.stopPropagation();
      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        setActiveLongPressBookingId(booking.id);
      }, 500); // Firing at 500ms
    };

    const endPress = (e) => {
      e.stopPropagation();
      clearTimeout(pressTimer);
      if (!isLongPress) {
        // Direct default click -> opens WhatsApp instantly with default template
        const phone = booking.bookingType === 'freelancer'
          ? booking.freelancerPhone
          : (booking.bookingType === 'company' || booking.bookingType === 'partnership' ? booking.contactPhone : booking.clientPhone);
        
        if (phone) {
          handleSendWhatsAppDirect(booking, 'ready');
        }
      }
    };

    return {
      onMouseDown: startPress,
      onMouseUp: endPress,
      onMouseLeave: () => clearTimeout(pressTimer),
      onTouchStart: startPress,
      onTouchEnd: endPress
    };
  };

  // Dynamic filter logic
  const filteredBookings = bookings ? bookings.filter(b => {
    if (isEmployee) {
      if (!currentUser || !currentUser.id) return false;
      const teamAssigned = b.teamMemberIds || [];
      const isDirectlyAssigned = teamAssigned.includes(currentUser.id) || b.assignedTo === currentUser.id || b.assignedTo === currentUser.name;
      if (!isDirectlyAssigned) return false;
    }

    // Advanced search filter (Requirement 6)
    if (searchFilter) {
      const q = searchFilter.toLowerCase().trim();
      const matchNo = b.bookingNumber?.toLowerCase().includes(q) || formatBookingNumber(b.bookingNumber).includes(q);
      const matchClient = b.clientName?.toLowerCase().includes(q);
      const matchPhone = (b.clientPhone || b.freelancerPhone || b.contactPhone)?.includes(q);
      const matchCompany = b.companyName?.toLowerCase().includes(q);
      const matchFreelancer = b.freelancerName?.toLowerCase().includes(q);
      const matchPhotographer = b.assignedPhotographer?.toLowerCase().includes(q);
      const matchLocation = b.location?.toLowerCase().includes(q);
      const matchCategory = b.category?.toLowerCase().includes(q) || b.title?.toLowerCase().includes(q);
      
      if (!matchNo && !matchClient && !matchPhone && !matchCompany && !matchFreelancer && !matchPhotographer && !matchLocation && !matchCategory) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'الكل' && b.status !== statusFilter) return false;

    // Financial filter (Requirement 10)
    if (financialFilter === 'unpaid') {
      if (b.totalPrice === null || b.totalPrice === undefined) return false;
      if (b.paidAmount > 0) return false;
    } else if (financialFilter === 'partial') {
      if (b.totalPrice === null || b.totalPrice === undefined) return false;
      if (b.paidAmount <= 0 || b.paidAmount >= b.totalPrice) return false;
    } else if (financialFilter === 'no_price') {
      if (b.totalPrice !== null && b.totalPrice !== undefined && b.totalPrice > 0) return false;
    }

    // Time filter (Requirement 5)
    const bStart = b.startDate || b.date;
    const bEnd = b.endDate || b.date || bStart;

    if (timeFilter === 'today') {
      return isBookingOnDate(b, todayStr);
    } else if (timeFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().substring(0, 10);
      return isBookingOnDate(b, tomorrowStr);
    } else if (timeFilter === 'week') {
      const today = new Date();
      const first = today.getDate() - today.getDay();
      const last = first + 6;
      const startOfWeek = new Date(today.setDate(first)).toISOString().substring(0, 10);
      const endOfWeek = new Date(today.setDate(last)).toISOString().substring(0, 10);
      return bStart >= startOfWeek && bStart <= endOfWeek;
    } else if (timeFilter === 'upcoming') {
      return bStart >= todayStr && b.status !== 'ملغي' && b.status !== 'مكتمل';
    } else if (timeFilter === 'custom') {
      if (customStart && bEnd < customStart) return false;
      if (customEnd && bStart > customEnd) return false;
    }

    return true;
  }) : [];

  // Metrics cards calculations
  const totalCount = filteredBookings.length;
  const todayCount = filteredBookings.filter(b => isBookingOnDate(b, todayStr)).length;
  const upcomingCount = filteredBookings.filter(b => {
    const bStart = b.startDate || b.date;
    return bStart >= todayStr && b.status !== 'ملغي' && b.status !== 'مكتمل';
  }).length;
  const completedCount = filteredBookings.filter(b => b.status === 'مكتمل').length;
  const totalOutstanding = filteredBookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

  const handleConfirmBooking = (id) => {
    if (updateBooking) updateBooking(id, { status: 'مؤكد' });
    setActiveMenuId(null);
    if (drawerBooking && drawerBooking.id === id) {
      setDrawerBooking(prev => ({ ...prev, status: 'مؤكد' }));
    }
  };

  const handleCancelBooking = (id) => {
    if (updateBooking) updateBooking(id, { status: 'ملغي' });
    setActiveMenuId(null);
    if (drawerBooking && drawerBooking.id === id) {
      setDrawerBooking(prev => ({ ...prev, status: 'ملغي' }));
    }
  };

  const handleCompleteBooking = (id) => {
    if (updateBooking) updateBooking(id, { status: 'مكتمل' });
    setActiveMenuId(null);
    if (drawerBooking && drawerBooking.id === id) {
      setDrawerBooking(prev => ({ ...prev, status: 'مكتمل' }));
    }
  };

  const handleDuplicateBooking = (b) => {
    if (addBooking) {
      const duplicated = {
        ...b,
        id: undefined,
        bookingNumber: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${b.title} (نسخة مُكررة)`,
        date: todayStr,
        startDate: todayStr,
        endDate: todayStr,
        status: 'بانتظار التأكيد'
      };
      addBooking(duplicated);
      alert('تم تكرار الحجز بنجاح بنسخة قيد التأكيد! 📅 يمكنك تعديل التاريخ الآن.');
    }
    setActiveMenuId(null);
  };

  const handleStartDrawerEdit = () => {
    setDrawerEditData({ ...drawerBooking });
    setIsDrawerEditing(true);
  };

  const handleSaveDrawerEdit = () => {
    if (updateBooking) {
      updateBooking(drawerBooking.id, drawerEditData);
    }
    setDrawerBooking({ ...drawerEditData });
    setIsDrawerEditing(false);
  };

  // Calendar setup
  const monthsNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const startOffset = new Date(calendarYear, calendarMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push({ isEmpty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayBookings = filteredBookings.filter(b => isBookingOnDate(b, dateStr));
    calendarDays.push({ isEmpty: false, dayNum: d, dateStr, dayBookings });
  }

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', position: 'relative', direction: 'rtl' }}>
      
      {/* 0. Main Tabs Bar */}
      <div className="card no-print" style={{ padding: '6px', display: 'flex', gap: '6px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
        <button
          onClick={() => setActiveTab('bookings')}
          style={{
            flex: 1,
            padding: '11px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: activeTab === 'bookings' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'bookings' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Icons.Calendar size={15} />
          <span>📅 الحجوزات اليومية والجدولة</span>
        </button>
        <button
          onClick={() => setActiveTab('statements')}
          style={{
            flex: 1,
            padding: '11px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: activeTab === 'statements' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'statements' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Icons.FileText size={15} />
          <span>📊 كشوفات الحسابات الشهرية</span>
        </button>
        <button
          onClick={() => setActiveTab('collaborations')}
          style={{
            flex: 1,
            padding: '11px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: activeTab === 'collaborations' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'collaborations' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Icons.Handshake size={15} />
          <span>🤝 سجل التعاون والشراكات</span>
        </button>
        <button
          onClick={() => setActiveTab('waitlist')}
          style={{
            flex: 1,
            padding: '11px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: activeTab === 'waitlist' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'waitlist' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Icons.Clock size={15} />
          <span>⏳ قائمة الانتظار</span>
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          style={{
            flex: 1,
            padding: '11px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: activeTab === 'quotations' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'quotations' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Icons.FileText size={15} />
          <span>📄 عروض الأسعار</span>
        </button>
      </div>

      {activeTab === 'bookings' && (
        <>
          {/* 1. Revamped Filter Bar */}
          <div className="card" style={{ padding: isMobile ? '12px' : '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {isMobile && userRole === 'admin' && (
              <button
                onClick={() => setIsBookingFormOpen && setIsBookingFormOpen(true)}
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: '12px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Icons.Plus size={18} strokeWidth={2.5} />
                <span>+ إنشاء حجز جديد</span>
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Icons.Search size={16} style={{ position: 'absolute', right: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="رقم الحجز، عميل، جوال، مصور، فريلانسر، موقع..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    style={{ paddingRight: '36px', borderRadius: '50px', fontSize: '0.82rem', height: '38px' }}
                  />
                </div>

                <select
                  value={timeFilter}
                  onChange={e => setTimeFilter(e.target.value)}
                  className="form-control"
                  style={{ width: '135px', height: '38px', borderRadius: '50px', fontSize: '0.8rem', padding: '0 10px' }}
                >
                  <option value="all">كل الفترات</option>
                  <option value="today">اليوم</option>
                  <option value="tomorrow">غداً</option>
                  <option value="week">هذا الأسبوع</option>
                  <option value="upcoming">القادمة</option>
                  <option value="custom">فترة مخصصة</option>
                </select>
              </div>

              {/* Financial Filter Dropdown */}
              <select
                value={financialFilter}
                onChange={e => setFinancialFilter(e.target.value)}
                className="form-control"
                style={{ width: '150px', height: '38px', borderRadius: '50px', fontSize: '0.8rem', padding: '0 10px' }}
              >
                <option value="all">كل الحالات المالية</option>
                <option value="unpaid">غير مدفوعة ❌</option>
                <option value="partial">مدفوعة جزئياً 🟡</option>
                <option value="no_price">بدون سعر ⚠️</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setViewStyle('list')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: viewStyle === 'list' ? 'var(--bg-card)' : 'transparent',
                      color: viewStyle === 'list' ? 'var(--primary-color)' : 'var(--text-muted)',
                      fontWeight: viewStyle === 'list' ? 800 : 500,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icons.List size={14} />
                    <span>قائمة</span>
                  </button>
                  <button
                    onClick={() => setViewStyle('calendar')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: viewStyle === 'calendar' ? 'var(--bg-card)' : 'transparent',
                      color: viewStyle === 'calendar' ? 'var(--primary-color)' : 'var(--text-muted)',
                      fontWeight: viewStyle === 'calendar' ? 800 : 500,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icons.Calendar size={14} />
                    <span>تقويم</span>
                  </button>
                </div>

                {!isMobile && userRole === 'admin' && (
                  <button
                    onClick={() => setIsBookingFormOpen && setIsBookingFormOpen(true)}
                    className="btn btn-primary"
                    style={{ borderRadius: '50px', height: '38px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Icons.Plus size={16} strokeWidth={2.5} />
                    <span>حجز جديد</span>
                  </button>
                )}
              </div>
            </div>

            {timeFilter === 'custom' && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>من:</span>
                <input type="date" className="form-control" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ width: '135px', height: '32px', fontSize: '0.78rem' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>إلى:</span>
                <input type="date" className="form-control" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ width: '135px', height: '32px', fontSize: '0.78rem' }} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              {statuses.map(st => (
                <button
                  key={st.label}
                  onClick={() => setStatusFilter(st.label)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '50px',
                    border: statusFilter === st.label ? 'none' : '1px solid var(--border-color)',
                    backgroundColor: statusFilter === st.label ? (st.label === 'الكل' ? 'var(--primary-color)' : `${st.color}15`) : 'transparent',
                    color: statusFilter === st.label ? (st.label === 'الكل' ? '#ffffff' : st.color) : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st.label !== 'الكل' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: st.color }} />}
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Premium Stat Cards (Requirement 11) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '4px solid var(--primary-color)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>إجمالي الحجوزات</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0 }}>{totalCount}</h3>
            </div>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '4px solid #3b82f6' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>حجوزات اليوم</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0, color: '#3b82f6' }}>{todayCount}</h3>
            </div>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '4px solid #8b5cf6' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>الجلسات القادمة</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0, color: '#8b5cf6' }}>{upcomingCount}</h3>
            </div>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '4px solid #10b981' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>المكتملة</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0, color: '#10b981' }}>{completedCount}</h3>
            </div>
            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '4px solid #ef4444' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>المستحقات المتبقية</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 950, margin: 0, color: '#ef4444' }}>{formatCurrency(totalOutstanding)}</h3>
            </div>
          </div>

          {/* 3. Bookings View revamping */}
          {viewStyle === 'list' ? (
            isMobile ? (
              /* Mobile card view (Requirement 13) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredBookings.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد حجوزات تطابق المعايير</div>
                ) : (
                  filteredBookings.map(b => {
                    const dayLabel = getDayLabel(b.date || b.startDate);
                    const phone = b.bookingType === 'freelancer' ? b.freelancerPhone : (b.bookingType === 'company' || b.bookingType === 'partnership' ? b.contactPhone : b.clientPhone);
                    const whatsappHandlers = createWhatsAppHandlers(b);

                    return (
                      <div
                        key={b.id}
                        className="card"
                        onClick={() => setDrawerBooking(b)}
                        style={{
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          border: drawerBooking?.id === b.id ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                          borderRight: `5px solid ${getStatusColor(b.status)}`,
                          backgroundColor: drawerBooking?.id === b.id ? 'rgba(99, 102, 241, 0.04)' : (dayLabel ? dayLabel.bg : 'var(--bg-card)'),
                          boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{formatBookingNumber(b.bookingNumber)}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {dayLabel && (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 900, backgroundColor: dayLabel.color, color: '#ffffff' }}>
                                {dayLabel.text}
                              </span>
                            )}
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 800, backgroundColor: `${getStatusColor(b.status)}15`, color: getStatusColor(b.status) }}>{b.status || 'مؤكد'}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === b.id ? null : b.id);
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            >
                              <Icons.MoreVertical size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Avatar + WhatsApp + Name Flow */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          {/* Avatar */}
                          <span style={{ fontSize: '1.1rem', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {b.bookingType === 'freelancer' ? '👤' : (b.bookingType === 'company' || b.bookingType === 'partnership' ? '🏢' : '👤')}
                          </span>

                          {/* Quick WhatsApp button container */}
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            {phone ? (
                              <button
                                {...whatsappHandlers}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  backgroundColor: '#25D366',
                                  color: '#ffffff',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                                title="إرسال واتساب سريع (اضغط مطولاً للخيارات)"
                              >
                                <Icons.MessageSquare size={13} fill="#ffffff" stroke="none" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDrawerBooking(b);
                                  setIsDrawerEditing(true);
                                }}
                                style={{ fontSize: '0.64rem', color: 'var(--primary-color)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '2px 4px', fontWeight: 800 }}
                              >
                                + إضافة رقم
                              </button>
                            )}

                            {/* Long Press Template dropdown */}
                            {activeLongPressBookingId === b.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '28px',
                                  right: '0',
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  zIndex: 200,
                                  minWidth: '150px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  padding: '4px 0'
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <div style={{ padding: '6px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontWeight: 800 }}>اختر قالب الرسالة:</div>
                                <button onClick={() => handleSendWhatsAppDirect(b, 'ready')} style={dropdownItemStyle}>✅ أنا جاهز</button>
                                <button onClick={() => handleSendWhatsAppDirect(b, 'confirm')} style={dropdownItemStyle}>🤝 تأكيد الموعد</button>
                                <button onClick={() => handleSendWhatsAppDirect(b, 'remind')} style={dropdownItemStyle}>🔔 تذكير بالموعد</button>
                                <button onClick={() => handleSendWhatsAppDirect(b, 'quick')} style={dropdownItemStyle}>⚡ رسالة سريعة</button>
                                <button
                                  onClick={() => {
                                    setActiveLongPressBookingId(null);
                                    setDrawerBooking(b);
                                    setActiveWhatsAppEntity(b.bookingType === 'freelancer' ? 'freelancer' : (b.bookingType === 'company' || b.bookingType === 'partnership' ? 'company' : 'client'));
                                  }}
                                  style={{ ...dropdownItemStyle, borderTop: '1px dashed var(--border-color)' }}
                                >
                                  ✏️ رسالة مخصصة...
                                </button>
                                <button onClick={() => setActiveLongPressBookingId(null)} style={{ ...dropdownItemStyle, color: '#ef4444' }}>إغلاق القائمة</button>
                              </div>
                            )}
                          </div>

                          <h4 style={{ fontSize: '0.88rem', fontWeight: 900, margin: 0, color: 'var(--text-main)', marginRight: '6px' }}>{getEntityName(b)}</h4>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <div>📅 التاريخ والوقت: <strong>{b.date} ({b.startTime || '16:00'})</strong></div>
                          <div>📷 نوع التصوير: <strong>{b.title}</strong></div>
                          <div>📍 الموقع: <strong>{b.location}</strong></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getLastActionText(b)}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDrawerBooking(b);
                                setActiveWhatsAppEntity('client');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', height: '26px', fontSize: '0.7rem', color: '#10b981', borderColor: '#10b981' }}
                            >
                              واتساب 💬
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDrawerBooking(b);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 8px', height: '26px', fontSize: '0.7rem' }}
                            >
                              تفاصيل
                            </button>
                          </div>
                        </div>
                        {activeMenuId === b.id && renderQuickMenu(b)}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Desktop revamping: Flex rows as distinct cards (Requirement 1, 2) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Custom Table Header */}
                <div style={{ display: 'flex', padding: '12px 16px', fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ width: '12%' }}>رقم الحجز</div>
                  <div style={{ width: '20%' }}>الجهة / العميل</div>
                  <div style={{ width: '18%' }}>الفعالية / التصنيف</div>
                  <div style={{ width: '16%' }}>التاريخ والوقت</div>
                  <div style={{ width: '12%' }}>الموقع</div>
                  <div style={{ width: '12%' }}>المبلغ والمالية</div>
                  <div style={{ width: '10%' }}>الحالة</div>
                  <div style={{ width: '10%', textAlign: 'center' }}>الإجراءات</div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد حجوزات تطابق المعايير</div>
                ) : (
                  filteredBookings.map(b => {
                    const dayLabel = getDayLabel(b.date || b.startDate);
                    const isSelected = drawerBooking?.id === b.id;
                    const phone = b.bookingType === 'freelancer' ? b.freelancerPhone : (b.bookingType === 'company' || b.bookingType === 'partnership' ? b.contactPhone : b.clientPhone);
                    const whatsappHandlers = createWhatsAppHandlers(b);

                    return (
                      <div
                        key={b.id}
                        onClick={() => setDrawerBooking(b)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.04)' : (dayLabel ? dayLabel.bg : 'var(--bg-card)'),
                          border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                          borderRight: `5px solid ${getStatusColor(b.status)}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                        }}
                      >
                        {/* 1. BK No. */}
                        <div style={{ width: '12%', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{formatBookingNumber(b.bookingNumber)}</span>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>{getLastActionText(b)}</span>
                        </div>
                        {/* 2. Client Avatar + WhatsApp + Name RTL Layout */}
                        <div style={{ width: '20%', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                          {/* Avatar */}
                          <span style={{ fontSize: '1.2rem', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {b.bookingType === 'freelancer' ? '👤' : (b.bookingType === 'company' || b.bookingType === 'partnership' ? '🏢' : '👤')}
                          </span>

                          {/* Quick WhatsApp button container */}
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            {phone ? (
                              <button
                                {...whatsappHandlers}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: '#25D366',
                                  color: '#ffffff',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)',
                                  cursor: 'pointer',
                                  padding: 0,
                                  transition: 'transform 0.1s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                title="إرسال واتساب سريع (اضغط مطولاً للخيارات)"
                              >
                                <Icons.MessageSquare size={12} fill="#ffffff" stroke="none" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDrawerBooking(b);
                                  setIsDrawerEditing(true);
                                }}
                                style={{ fontSize: '0.64rem', color: 'var(--primary-color)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '2px 4px', fontWeight: 800 }}
                              >
                                + إضافة رقم
                              </button>
                            )}

                            {/* Long Press Template dropdown */}
                            {activeLongPressBookingId === b.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '28px',
                                  right: '0',
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  zIndex: 200,
                                  minWidth: '150px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  padding: '4px 0'
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <div style={{ padding: '6px 10px', fontSize: '0.68rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontWeight: 800 }}>اختر قالب الرسالة:</div>
                                <button onClick={() => handleSendWhatsAppDirect(b, 'ready')} style={dropdownItemStyle}>✅ أنا جاهز</button>
                                <button onClick={() => handleSendWhatsAppDirect(b, 'confirm')} style={dropdownItemStyle}>🤝 تأكيد الموعد</button>
                                <button onClick={() => handleSendWhatsAppDirect(b, 'remind')} style={dropdownItemStyle}>🔔 تذكير بالموعد</button>
                                <button onClick={() => handleSendWhatsAppDirect(b, 'quick')} style={dropdownItemStyle}>⚡ رسالة سريعة</button>
                                <button
                                  onClick={() => {
                                    setActiveLongPressBookingId(null);
                                    setDrawerBooking(b);
                                    setActiveWhatsAppEntity(b.bookingType === 'freelancer' ? 'freelancer' : (b.bookingType === 'company' || b.bookingType === 'partnership' ? 'company' : 'client'));
                                  }}
                                  style={{ ...dropdownItemStyle, borderTop: '1px dashed var(--border-color)' }}
                                >
                                  ✏️ رسالة مخصصة...
                                </button>
                                <button onClick={() => setActiveLongPressBookingId(null)} style={{ ...dropdownItemStyle, color: '#ef4444' }}>إغلاق القائمة</button>
                              </div>
                            )}
                          </div>

                          {/* Client name / label text */}
                          <div style={{ display: 'flex', flexDirection: 'column' }} onClick={() => setDrawerBooking(b)}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{getEntityName(b)}</span>
                            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{getEntityTypeLabel(b)}</span>
                          </div>
                        </div>

                        {/* 3. Category */}
                        <div style={{ width: '18%', fontSize: '0.8rem', fontWeight: 700 }}>{b.title}</div>

                        {/* 4. Timing */}
                        <div style={{ width: '16%', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>📅 {b.date}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>🕐 {b.isAllDay ? 'طوال اليوم' : (b.startTime || '16:00')}</span>
                        </div>

                        {/* 5. Location */}
                        <div style={{ width: '12%', fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {b.location}</div>

                        {/* 6. Finance */}
                        <div style={{ width: '12%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>
                            {b.totalPrice === null ? <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>السعر غير محدد</span> : formatCurrency(b.totalPrice)}
                          </span>
                          <div style={{ display: 'flex' }}>
                            {renderFinancialStatusIcon(b)}
                          </div>
                        </div>

                        {/* 7. Status badge */}
                        <div style={{ width: '10%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {dayLabel && (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.64rem', fontWeight: 900, backgroundColor: dayLabel.color, color: '#ffffff' }}>
                                {dayLabel.text}
                              </span>
                            )}
                            <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, backgroundColor: `${getStatusColor(b.status)}15`, color: getStatusColor(b.status) }}>{b.status || 'مؤكد'}</span>
                          </div>
                        </div>

                        {/* 8. Quick Actions Menu */}
                        <div style={{ width: '10%', textAlign: 'center', position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === b.id ? null : b.id);
                            }}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                          >
                            <Icons.MoreVertical size={14} />
                          </button>
                          {activeMenuId === b.id && renderQuickMenu(b)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )
          ) : (
            /* Calendar view style */
            <div className="card" style={{ padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 900, margin: 0 }}>
                  {monthsNames[calendarMonth]} <span>{calendarYear}</span>
                </h4>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button onClick={handlePrevMonth} className="btn btn-secondary btn-icon" style={{ width: '28px', height: '28px', padding: 0 }}><Icons.ChevronRight size={14} /></button>
                  <button onClick={handleNextMonth} className="btn btn-secondary btn-icon" style={{ width: '28px', height: '28px', padding: 0 }}><Icons.ChevronLeft size={14} /></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 800, fontSize: '0.72rem', color: 'var(--text-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)', gap: '4px' }}>
                {daysOfWeek.map(d => <div key={d}>{d.slice(0, 3)}</div>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginTop: '6px' }}>
                {calendarDays.map((day, idx) => {
                  if (day.isEmpty) {
                    return <div key={`cal-empty-${idx}`} style={{ aspectRatio: '1/1', opacity: 0.1 }} />;
                  }

                  const dayBookings = day.dayBookings;
                  const hasBookings = dayBookings.length > 0;
                  const isToday = day.dateStr === todayStr;
                  const hasNoPrice = dayBookings.some(b => b.financialStatus === 'no_price' || b.totalPrice === null || b.totalPrice === undefined || b.totalPrice === '');

                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => {
                        if (hasBookings) {
                          setDrawerBooking(dayBookings[0]);
                        }
                      }}
                      style={{
                        aspectRatio: '1/1',
                        borderRadius: '8px',
                        backgroundColor: isToday ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-main)',
                        border: isToday ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px',
                        cursor: hasBookings ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>{day.dayNum}</span>
                        {hasNoPrice && (
                          <span style={{ fontSize: '0.62rem', color: '#ef4444', lineHeight: 1 }} title="يوجد حجز بدون سعر">⚠️</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', width: '100%' }}>
                        {dayBookings.slice(0, 3).map(b => (
                          <span key={b.id} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: getStatusColor(b.status) }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'statements' && <MonthlyStatementsView />}
      {activeTab === 'collaborations' && <CooperationLogView />}
      {activeTab === 'waitlist' && <WaitlistView />}
      {activeTab === 'quotations' && <QuotationsView />}

      {/* 4. Revamped Side Panel for quick details (Requirement 3, 4, 10) */}
      {drawerBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'flex-start'
          }}
          onClick={() => { setIsDrawerEditing(false); setDrawerBooking(null); setActiveWhatsAppEntity(null); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              backgroundColor: 'var(--bg-card)',
              borderRight: '1px solid var(--border-color)',
              boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              boxSizing: 'border-box',
              overflowY: 'auto',
              gap: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatBookingNumber(drawerBooking.bookingNumber)}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 950, margin: '2px 0 0 0' }}>لوحة التفاصيل السريعة</h3>
              </div>
              <button onClick={() => { setIsDrawerEditing(false); setDrawerBooking(null); setActiveWhatsAppEntity(null); }} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.X size={16} />
              </button>
            </div>

            {isDrawerEditing ? (
              /* Inline editor */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>عنوان الفعالية</label>
                  <input type="text" className="form-control" value={drawerEditData.title || ''} onChange={e => setDrawerEditData({ ...drawerEditData, title: e.target.value })} />
                </div>
                {drawerBooking.bookingType === 'freelancer' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>اسم المصور الفريلانسر</label>
                    <input type="text" className="form-control" value={drawerEditData.freelancerName || ''} onChange={e => setDrawerEditData({ ...drawerEditData, freelancerName: e.target.value })} />
                  </div>
                ) : (drawerBooking.bookingType === 'company' || drawerBooking.bookingType === 'partnership') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>اسم الشركة الشريكة</label>
                    <input type="text" className="form-control" value={drawerEditData.companyName || ''} onChange={e => setDrawerEditData({ ...drawerEditData, companyName: e.target.value })} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>اسم العميل</label>
                    <input type="text" className="form-control" value={drawerEditData.clientName || ''} onChange={e => setDrawerEditData({ ...drawerEditData, clientName: e.target.value })} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>التاريخ</label>
                  <input type="date" className="form-control" value={drawerEditData.date || ''} onChange={e => setDrawerEditData({ ...drawerEditData, date: e.target.value, startDate: e.target.value, endDate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={handleSaveDrawerEdit} className="btn btn-primary" style={{ flex: 1 }}>حفظ</button>
                  <button onClick={() => setIsDrawerEditing(false)} className="btn btn-secondary" style={{ flex: 1 }}>إلغاء</button>
                </div>
              </div>
            ) : (
              /* Display mode details */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                
                {/* Big Details View button */}
                <button
                  onClick={() => {
                    setSelectedBooking(drawerBooking);
                    setIsBookingDetailOpen(true);
                    setDrawerBooking(null);
                  }}
                  className="btn btn-primary"
                  style={{ height: '38px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '8px', width: '100%' }}
                >
                  <Icons.Eye size={14} />
                  <span>فتح شاشة التفاصيل الكاملة 👁️</span>
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: `${getStatusColor(drawerBooking.status)}10`, borderRight: `4px solid ${getStatusColor(drawerBooking.status)}` }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: getStatusColor(drawerBooking.status) }}>
                      حالة الجلسة: {drawerBooking.status || 'مؤكد'}
                    </span>
                  </div>
                  <div>
                    {renderFinancialStatusIcon(drawerBooking)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
                  {/* Locked padlock indicator */}
                  {drawerBooking.status === 'مؤكد' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--status-danger)', fontWeight: 800, padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                      <Icons.Lock size={14} />
                      <span>حجز مؤكد ومقفل أمنياً (تعديله يتطلب حذر) 🔒</span>
                    </div>
                  )}

                  {/* Travel Buffer Warning Widget */}
                  {(() => {
                    const assignedTeam = drawerBooking.teamAssigned || drawerBooking.teamMemberIds || [];
                    const warnings = checkTravelTimeBuffer(drawerBooking.date, drawerBooking.location, assignedTeam, drawerBooking.id);
                    if (warnings.length > 0) {
                      return (
                        <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icons.Car size={16} color="var(--status-danger)" />
                          <div style={{ fontSize: '0.76rem', color: 'var(--status-danger)', fontWeight: 800 }}>
                            تحذير: المصور {warnings[0].memberName} لديه تغطية أخرى اليوم في موقع مختلف!
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>مسمى الجلسة والتغطية:</span>
                    <strong style={{ fontSize: '0.88rem' }}>{drawerBooking.title}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>الجهة والعميل:</span>
                    <p style={{ fontWeight: 800, margin: '2px 0 0 0' }}>
                      {getEntityTypeLabel(drawerBooking)}: <strong>{getEntityName(drawerBooking)}</strong>
                    </p>
                  </div>
                  
                  {/* Phone rendering & triggers */}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>رقم الجوال للتواصل:</span>
                    <p style={{ fontWeight: 800, margin: '2px 0 0 0' }} dir="ltr">
                      {privacyMode ? '******' : (drawerBooking.bookingType === 'freelancer' ? (drawerBooking.freelancerPhone || '-') : ((drawerBooking.bookingType === 'company' || drawerBooking.bookingType === 'partnership') ? (drawerBooking.contactPhone || '-') : (drawerBooking.clientPhone || '-')))}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>الموعد والتوقيت:</span>
                    <p style={{ fontWeight: 800, margin: '2px 0 0 0' }}>📅 {drawerBooking.date} ({drawerBooking.startTime || '16:00'})</p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>موقع التصوير:</span>
                    <p style={{ fontWeight: 800, margin: '2px 0 0 0' }}>📍 {drawerBooking.location}</p>
                  </div>

                  {/* Financial view in side panel (Requirement 10) */}
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>موقف الاتفاق المالي:</span>
                    {privacyMode ? (
                      <strong style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>[ وضع الخصوصية مفعل ] 🔒</strong>
                    ) : drawerBooking.totalPrice === null ? (
                      <strong style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>السعر غير محدد ⚠️</strong>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px', textAlign: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>الإجمالي:</span>
                          <strong style={{ display: 'block', fontSize: '0.8rem' }}>{formatCurrency(drawerBooking.totalPrice)}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>المدفوع:</span>
                          <strong style={{ display: 'block', fontSize: '0.8rem', color: '#10b981' }}>{formatCurrency(drawerBooking.paidAmount || 0)}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>المتبقي:</span>
                          <strong style={{ display: 'block', fontSize: '0.8rem', color: '#ef4444' }}>{formatCurrency(drawerBooking.remainingAmount || 0)}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {drawerBooking.optionalNote && (
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>الملاحظات والتعليمات:</span>
                      <p style={{ margin: '2px 0 0 0', fontStyle: 'italic' }}>
                        {privacyMode ? '***' : `"${drawerBooking.optionalNote}"`}
                      </p>
                    </div>
                  )}

                  {/* Checklist per Booking Widget */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>📋 قائمة التحقق للمهمة:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {drawerBooking.checklist && drawerBooking.checklist.map((item, cIdx) => (
                        <label key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={item.done} 
                            onChange={() => {
                              const updatedChecklist = [...(drawerBooking.checklist || [])];
                              updatedChecklist[cIdx].done = !updatedChecklist[cIdx].done;
                              const updated = { ...drawerBooking, checklist: updatedChecklist };
                              updateBooking(drawerBooking.id, updated);
                              setDrawerBooking(updated);
                            }} 
                          />
                          <span style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'var(--text-main)' }}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* changeLogs Timeline */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>⏱️ سجل تعديل الحالة والتعديلات:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', paddingLeft: '4px' }}>
                      {drawerBooking.changeLogs && drawerBooking.changeLogs.map((log, lIdx) => (
                        <div key={lIdx} style={{ fontSize: '0.7rem', padding: '6px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.66rem' }}>
                            <span>{log.timestamp}</span>
                            <strong>{log.userName}</strong>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontWeight: 700 }}>{log.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* WhatsApp template menu triggers inside side panel (Requirement 4) */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>مراسلة الأطراف سريعا عبر واتساب:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      onClick={() => setActiveWhatsAppEntity('client')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', height: '30px', color: '#10b981', borderColor: '#10b981' }}
                    >
                      💬 راسل العميل
                    </button>
                    {drawerBooking.freelancerName && (
                      <button
                        onClick={() => setActiveWhatsAppEntity('freelancer')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', height: '30px', color: '#3b82f6', borderColor: '#3b82f6' }}
                      >
                        💬 المصور الفريلانسر
                      </button>
                    )}
                    {drawerBooking.companyName && (drawerBooking.bookingType === 'company' || drawerBooking.bookingType === 'partnership') && (
                      <button
                        onClick={() => setActiveWhatsAppEntity('company')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', height: '30px', color: '#f59e0b', borderColor: '#f59e0b' }}
                      >
                        💬 راسل الشركة
                      </button>
                    )}
                  </div>

                  {activeWhatsAppEntity && (
                    /* Inline templates drawer inside Side Panel */
                    <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 900 }}>صياغة تذكير الواتساب:</span>
                        <button onClick={() => setActiveWhatsAppEntity(null)} style={{ background: 'transparent', border: 'none', fontSize: '0.7rem', color: '#ef4444', cursor: 'pointer' }}>إلغاء</button>
                      </div>

                      <select
                        className="form-control"
                        value={selectedTemplate}
                        onChange={e => setSelectedTemplate(e.target.value)}
                        style={{ fontSize: '0.72rem', height: '28px' }}
                      >
                        <option value="ready">✅ أنا جاهز</option>
                        <option value="confirm">🤝 تأكيد الموعد</option>
                        {((drawerBooking.bookingType === 'freelancer' || drawerBooking.bookingType === 'company') && (
                          <option value="go_with">📷 سأذهب معكم</option>
                        ))}
                        <option value="remind">🔔 تذكير بالموعد</option>
                        <option value="quick">⚡ رسالة سريعة</option>
                      </select>

                      <input
                        type="text"
                        className="form-control"
                        dir="ltr"
                        value={phoneOverride}
                        onChange={e => setPhoneOverride(e.target.value)}
                        placeholder="رقم جوال المستلم"
                        style={{ height: '28px', fontSize: '0.74rem' }}
                      />

                      <textarea
                        className="form-control"
                        rows={5}
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        style={{ fontSize: '0.74rem', padding: '6px' }}
                      />

                      <button onClick={handleSendWhatsAppFromPanel} className="btn btn-success btn-sm" style={{ width: '100%', height: '30px' }}>
                        إرسال واتساب 💬
                      </button>
                    </div>
                  )}
                </div>

                {/* General action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={handleStartDrawerEdit} className="btn btn-secondary btn-sm" style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800 }}>✏️ تعديل الحجز</button>
                    <button onClick={() => handleConfirmBooking(drawerBooking.id)} className="btn btn-secondary btn-sm" style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800, color: '#10b981', borderColor: '#10b981' }}>✅ تأكيد</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={() => handleCompleteBooking(drawerBooking.id)} className="btn btn-secondary btn-sm" style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800, color: '#8b5cf6', borderColor: '#8b5cf6' }}>إكمال الجلسة</button>
                    <button onClick={() => handleCancelBooking(drawerBooking.id)} className="btn btn-secondary btn-sm" style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', borderColor: '#ef4444' }}>إلغاء الحجز</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function renderQuickMenu(b) {
    return (
      <div
        ref={dropdownRef}
        style={{
          position: 'absolute',
          left: '10px',
          top: '32px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
          zIndex: 100,
          minWidth: '170px',
          display: 'flex',
          flexDirection: 'column',
          padding: '4px 0'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => {
          setSelectedBooking(b);
          setIsBookingDetailOpen(true);
          setActiveMenuId(null);
        }} style={dropdownItemStyle}>
          <Icons.Eye size={13} color="var(--primary-color)" />
          <span>👁️ التفاصيل الكاملة</span>
        </button>
        <button onClick={() => handleConfirmBooking(b.id)} style={dropdownItemStyle}>
          <Icons.CheckCircle2 size={13} color="#10b981" />
          <span>تأكيد الحجز</span>
        </button>
        <button onClick={() => handleCompleteBooking(b.id)} style={dropdownItemStyle}>
          <Icons.CheckSquare size={13} color="#64748b" />
          <span>إكمال الجلسة</span>
        </button>
        <button onClick={() => {
          handleQuickAddPrice(b);
          setActiveMenuId(null);
        }} style={dropdownItemStyle}>
          <Icons.Coins size={13} color="var(--primary-color)" />
          <span>{b.totalPrice === null || b.totalPrice === undefined || b.totalPrice === '' ? '💰 إضافة السعر' : '✏️ تعديل السعر'}</span>
        </button>
        <div style={{ padding: '4px 10px', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>تعيين الموظف:</span>
          <select
            className="form-control"
            onChange={e => handleChangePhotographer(b.id, e.target.value)}
            value={b.teamMemberIds?.[0] || ''}
            style={{ fontSize: '0.72rem', height: '28px', padding: '2px 4px' }}
          >
            <option value="">غير معين</option>
            {team && team.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div style={{ padding: '4px 10px', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>تغيير التاريخ:</span>
          <input type="date" className="form-control" onChange={e => handleChangeDate(b.id, e.target.value)} style={{ fontSize: '0.68rem', height: '24px', padding: '2px' }} />
        </div>
        <button onClick={() => handleAddDay(b)} style={dropdownItemStyle}>
          <Icons.Calendar size={13} color="var(--primary-color)" />
          <span>إضافة يوم للجدول</span>
        </button>
        <button onClick={() => handleSendDetails(b)} style={dropdownItemStyle}>
          <Icons.Share2 size={13} color="#3b82f6" />
          <span>نسخ تفاصيل الحجز</span>
        </button>
        <button onClick={() => handleDuplicateBooking(b)} style={dropdownItemStyle}>
          <Icons.Copy size={13} color="var(--secondary-color)" />
          <span>تكرار الحجز</span>
        </button>
        <button onClick={() => handleCancelBooking(b.id)} style={{ ...dropdownItemStyle, color: '#ef4444' }}>
          <Icons.XCircle size={13} color="#ef4444" />
          <span>إلغاء الحجز</span>
        </button>
      </div>
    );
  }

  const handleChangePhotographer = (id, memberId) => {
    if (updateBooking) {
      updateBooking(id, { teamMemberIds: memberId ? [Number(memberId)] : [] });
    }
    setActiveMenuId(null);
    if (drawerBooking && drawerBooking.id === id) {
      setDrawerBooking(prev => ({ ...prev, teamMemberIds: memberId ? [Number(memberId)] : [] }));
    }
  };

  const handleChangeDate = (id, newDate) => {
    if (!newDate) return;
    if (updateBooking) {
      updateBooking(id, { date: newDate, startDate: newDate, endDate: newDate });
    }
    setActiveMenuId(null);
    if (drawerBooking && drawerBooking.id === id) {
      setDrawerBooking(prev => ({ ...prev, date: newDate, startDate: newDate, endDate: newDate }));
    }
  };

  const handleAddDay = (booking) => {
    const currentEnd = booking.endDate || booking.date || booking.startDate;
    const dateObj = new Date(currentEnd);
    dateObj.setDate(dateObj.getDate() + 1);
    const newEndStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    
    if (updateBooking) {
      updateBooking(booking.id, { endDate: newEndStr });
    }
    setActiveMenuId(null);
    if (drawerBooking && drawerBooking.id === booking.id) {
      setDrawerBooking(prev => ({ ...prev, endDate: newEndStr }));
    }
  };

  const handleSendDetails = (b) => {
    const text = `تنبيه حجز تصوير استوديو ستار ميديا 📷\n\n- رقم الحجز: ${formatBookingNumber(b.bookingNumber)}\n- الفعالية: ${b.title}\n- الجهة: ${getEntityName(b)} (${getEntityTypeLabel(b)})\n- التاريخ: ${b.date}\n- الموقع: ${b.location}\n- الحالة: ${b.status || 'مؤكد'}\n\nيرجى الاستعداد والتجهيز.`;
    navigator.clipboard.writeText(text);
    alert('تم نسخ تفاصيل الجلسة إلى الحافظة لإرسالها للفريق!');
    setActiveMenuId(null);
  };
};

// -------------------------------------------------------------
// Sub-View: MonthlyStatementsView
// -------------------------------------------------------------
const MonthlyStatementsView = () => {
  const { bookings, freelancers, companies, setCompanies, updateBooking } = useApp();
  const [entityType, setEntityType] = useState('freelancer'); // 'freelancer' | 'company'
  const [selectedId, setSelectedId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editedPrices, setEditedPrices] = useState({});
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('غير مسدد');
  const [globalDailyRate, setGlobalDailyRate] = useState('');

  // Prefill daily rate if all tasks share the same price
  useEffect(() => {
    if (entityType === 'freelancer' && statementBookings.length > 0) {
      const firstPrice = statementBookings[0].totalPrice;
      const allSame = statementBookings.every(b => b.totalPrice === firstPrice);
      if (allSame && firstPrice !== null) {
        setGlobalDailyRate(String(firstPrice));
      } else {
        setGlobalDailyRate('');
      }
    } else {
      setGlobalDailyRate('');
    }
  }, [selectedId, selectedMonth, entityType]);

  const handleUpdateGlobalDailyRate = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setGlobalDailyRate(val);
    if (val !== '') {
      const updated = {};
      statementBookings.forEach(b => {
        updated[b.id] = val;
      });
      setEditedPrices(prev => ({ ...prev, ...updated }));
    }
  };

  const [monthlyStatements, setMonthlyStatements] = useState(() => {
    try {
      const stored = localStorage.getItem('star_media_monthly_statements');
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  });

  useEffect(() => {
    if (entityType === 'freelancer' && freelancers && freelancers.length > 0) {
      setSelectedId(String(freelancers[0].id));
    } else if (entityType === 'company' && companies && companies.length > 0) {
      setSelectedId(String(companies[0].id));
    } else {
      setSelectedId('');
    }
    setEditedPrices({});
  }, [entityType, freelancers, companies]);

  useEffect(() => {
    if (!selectedId) return;
    const statementKey = `${entityType}-${selectedId}-${selectedMonth}`;
    const stmt = monthlyStatements.find(s => s.key === statementKey);
    if (stmt) {
      setPaidAmount(String(stmt.paidAmount));
      setPaymentStatus(stmt.status);
    } else {
      setPaidAmount('');
      setPaymentStatus('غير مسدد');
    }
  }, [selectedId, selectedMonth, entityType, monthlyStatements]);

  const selectedEntity = entityType === 'freelancer'
    ? freelancers?.find(f => f.id === Number(selectedId))
    : companies?.find(c => c.id === Number(selectedId));

  const statementBookings = bookings ? bookings.filter(b => {
    const dateStr = b.startDate || b.date;
    if (!dateStr || !dateStr.startsWith(selectedMonth)) return false;
    
    if (entityType === 'freelancer') {
      return b.bookingType === 'freelancer' && (Number(b.freelancerId) === Number(selectedId) || b.freelancerName === selectedEntity?.name);
    } else {
      return (b.bookingType === 'company' || b.bookingType === 'partnership') && (Number(b.companyId) === Number(selectedId) || b.companyName === selectedEntity?.name);
    }
  }) : [];

  const totalTasks = statementBookings.length;
  const calculatedTotal = statementBookings.reduce((sum, b) => {
    const priceVal = editedPrices[b.id] !== undefined
      ? (editedPrices[b.id] === '' ? 0 : Number(editedPrices[b.id]))
      : (b.totalPrice || 0);
    return sum + priceVal;
  }, 0);

  const remainingAmount = calculatedTotal - Number(paidAmount || 0);

  const getStatusColor = (st) => {
    switch (st) {
      case 'مؤكد': return '#10b981';
      case 'جاري التنفيذ': return '#3b82f6';
      case 'بانتظار التأكيد': return '#f59e0b';
      case 'ملغي': return '#ef4444';
      case 'مكتمل': return '#64748b';
      default: return '#3b82f6';
    }
  };

  const handleSaveStatement = () => {
    if (!selectedId || !selectedEntity) return;

    let remainingPaidToDistribute = Number(paidAmount || 0);
    statementBookings.forEach(b => {
      const priceVal = editedPrices[b.id] !== undefined
        ? (editedPrices[b.id] === '' ? null : Number(editedPrices[b.id]))
        : b.totalPrice;
      
      let allocatedPaid = 0;
      if (priceVal !== null) {
        allocatedPaid = Math.min(priceVal, remainingPaidToDistribute);
        remainingPaidToDistribute -= allocatedPaid;
      }

      if (updateBooking) {
        updateBooking(b.id, {
          totalPrice: priceVal,
          paidAmount: allocatedPaid,
          remainingAmount: priceVal !== null ? priceVal - allocatedPaid : null
        });
      }
    });

    const statementKey = `${entityType}-${selectedId}-${selectedMonth}`;
    const newStatement = {
      key: statementKey,
      entityType,
      entityId: selectedId,
      entityName: selectedEntity.name,
      month: selectedMonth,
      totalAmount: calculatedTotal,
      paidAmount: Number(paidAmount || 0),
      status: paymentStatus,
      updatedAt: new Date().toISOString()
    };

    const updatedStatements = [newStatement, ...monthlyStatements.filter(s => s.key !== statementKey)];
    setMonthlyStatements(updatedStatements);
    localStorage.setItem('star_media_monthly_statements', JSON.stringify(updatedStatements));

    alert('تم حفظ كشف الحساب وتحديث المبالغ المالية للمهام بنجاح! 💾');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        @media print {
          body { background: #ffffff !important; color: #000000 !important; }
          .no-print { display: none !important; }
          .print-header { display: block !important; margin-bottom: 20px; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; background: transparent !important; }
          table { border: 1px solid #ccc !important; }
          th, td { border-bottom: 1px solid #ccc !important; }
        }
      `}</style>

      <div className="card no-print" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Sliders size={18} />
          <span>تحديد خيارات كشف الحساب</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800 }}>نوع الجهة:</label>
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setEntityType('freelancer')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: entityType === 'freelancer' ? 'var(--primary-color)' : 'transparent',
                  color: entityType === 'freelancer' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                👤 مصور فريلانسر
              </button>
              <button
                type="button"
                onClick={() => setEntityType('company')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: entityType === 'company' ? 'var(--primary-color)' : 'transparent',
                  color: entityType === 'company' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                🏢 شركة تصوير
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800 }}>الاسم المحدد:</label>
            <select
              className="form-control"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{ height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
            >
              <option value="">-- اختر من القائمة --</option>
              {entityType === 'freelancer'
                ? freelancers?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)
                : companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              }
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800 }}>تحديد الشهر:</label>
            <input
              type="month"
              className="form-control"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
            />
          </div>
        </div>
      </div>

      {selectedEntity ? (
        <div id="printable-statement" className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', borderRadius: '16px' }}>
          <div className="print-header" style={{ display: 'none', textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '12px' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.5rem', fontWeight: 950 }}>استوديو ستار ميديا Star Media</h2>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#666' }}>كشف حساب شهري مجمع</h3>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>كشف حساب الطرف:</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 950 }}>{selectedEntity.name}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                📱 الجوال: <strong dir="ltr">{selectedEntity.phone || selectedEntity.contactPhone || '-'}</strong> | 📧 البريد: {selectedEntity.email || selectedEntity.companyEmail || '-'}
              </p>
            </div>

            <div style={{ textAlign: 'left', minWidth: '120px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الشهر المالي:</span>
              <h4 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 900 }} dir="ltr">{selectedMonth}</h4>
            </div>
          </div>

          {entityType === 'freelancer' && (
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>📅 إجمالي أيام العمل:</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 950 }}>{totalTasks} يوم عمل</h4>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>💵 تعديل سعر اليوم للكل:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <input
                    type="text"
                    className="form-control en-digits"
                    dir="ltr"
                    placeholder="سعر اليوم الافتراضي"
                    value={globalDailyRate}
                    onChange={handleUpdateGlobalDailyRate}
                    style={{ height: '34px', width: '120px', fontSize: '0.8rem', fontWeight: 'bold' }}
                  />
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>ريال / يوم</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>💰 إجمالي المستحقات المالي:</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 950, color: 'var(--status-success)' }}>
                  {formatCurrency(calculatedTotal)}
                </h4>
              </div>
            </div>
          )}

          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 900 }}>📋 تفاصيل المهام المنفذة خلال الشهر</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                    <th style={{ padding: '10px 12px' }}>رقم المهمة</th>
                    <th style={{ padding: '10px 12px' }}>العنوان / الوصف</th>
                    <th style={{ padding: '10px 12px' }}>التاريخ</th>
                    <th style={{ padding: '10px 12px' }}>الموقع</th>
                    <th style={{ padding: '10px 12px' }}>الحالة</th>
                    <th style={{ padding: '10px 12px', width: '130px' }} className="no-print">تعديل السعر</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>السعر</th>
                  </tr>
                </thead>
                <tbody>
                  {statementBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        لا توجد مهام مسجلة لهذا الطرف في هذا الشهر.
                      </td>
                    </tr>
                  ) : (
                    statementBookings.map(b => {
                      const currentPrice = editedPrices[b.id] !== undefined
                        ? (editedPrices[b.id] === '' ? null : Number(editedPrices[b.id]))
                        : b.totalPrice;

                      return (
                        <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 12px' }}><strong>{formatBookingNumber(b.bookingNumber)}</strong></td>
                          <td style={{ padding: '10px 12px' }}>{b.title}</td>
                          <td style={{ padding: '10px 12px' }}>{b.date}</td>
                          <td style={{ padding: '10px 12px' }}>{b.location}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 800, backgroundColor: `${getStatusColor(b.status)}15`, color: getStatusColor(b.status) }}>
                              {b.status || 'مؤكد'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }} className="no-print">
                            <input
                              type="text"
                              className="form-control"
                              dir="ltr"
                              placeholder="غير محدد"
                              value={editedPrices[b.id] !== undefined ? editedPrices[b.id] : (b.totalPrice !== null ? b.totalPrice : '')}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setEditedPrices(prev => ({ ...prev, [b.id]: val }));
                              }}
                              style={{ width: '100px', height: '28px', fontSize: '0.78rem', padding: '4px 6px' }}
                            />
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800 }}>
                            {formatCurrency(currentPrice)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {statementBookings.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h5 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900 }}>الملخص المالي للمستند</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>إجمالي عدد المهام:</span>
                  <strong>{totalTasks} مهام</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>المستحقات الإجمالية للشهر:</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{formatCurrency(calculatedTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>المتبقي المستحق للطرف:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#ef4444' }}>{formatCurrency(remainingAmount)}</strong>
                </div>
              </div>

              <div className="no-print" style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.12)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h5 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900, color: '#065f46' }}>تسوية الحساب وصرف الدفعات</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>المبلغ المدفوع (ريال):</label>
                  <input
                    type="text"
                    className="form-control"
                    dir="ltr"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPaidAmount(val);
                    }}
                    style={{ height: '32px', fontSize: '0.82rem', fontWeight: 800 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>حالة التسوية المعتمدة:</label>
                  <select
                    className="form-control"
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value)}
                    style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px' }}
                  >
                    <option value="غير مسدد">❌ غير مسدد</option>
                    <option value="جزئي">🟡 دفعة جزئية</option>
                    <option value="مسدد">✅ مسدد بالكامل</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Printer size={16} />
              <span>طباعة كشف الحساب</span>
            </button>
            {statementBookings.length > 0 && (
              <button onClick={handleSaveStatement} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Save size={16} />
                <span>حفظ الكشف وتحديث الحساب المالي</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          ⚠️ يرجى تحديد الطرف (الفريلانسر أو الشركة الشريكة) لعرض وحساب المستحقات الشهرية.
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Sub-View: CooperationLogView
// -------------------------------------------------------------
const CooperationLogView = () => {
  const { bookings, freelancers, companies, setCompanies, updateFreelancer, setIsBookingFormOpen } = useApp();
  const [entityType, setEntityType] = useState('freelancer'); // 'freelancer' | 'company'
  const [selectedId, setSelectedId] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' | 'completed' | 'upcoming' | 'payments'
  const [entityNotes, setEntityNotes] = useState('');

  const [monthlyStatements, setMonthlyStatements] = useState(() => {
    try {
      const stored = localStorage.getItem('star_media_monthly_statements');
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  });

  useEffect(() => {
    if (entityType === 'freelancer' && freelancers && freelancers.length > 0) {
      setSelectedId(String(freelancers[0].id));
    } else if (entityType === 'company' && companies && companies.length > 0) {
      setSelectedId(String(companies[0].id));
    } else {
      setSelectedId('');
    }
  }, [entityType, freelancers, companies]);

  const selectedEntity = entityType === 'freelancer'
    ? freelancers?.find(f => f.id === Number(selectedId))
    : companies?.find(c => c.id === Number(selectedId));

  useEffect(() => {
    if (selectedEntity) {
      setEntityNotes(selectedEntity.notes || '');
    }
  }, [selectedEntity]);

  const handleUpdateNotes = () => {
    if (!selectedEntity) return;
    if (entityType === 'freelancer') {
      if (updateFreelancer) {
        updateFreelancer(selectedEntity.id, { notes: entityNotes });
      }
    } else {
      if (setCompanies) {
        setCompanies(prev => prev.map(c => c.id === selectedEntity.id ? { ...c, notes: entityNotes } : c));
      }
    }
    alert('تم حفظ تقييم وملاحظات الطرف بنجاح! 📝');
  };

  const handleCreatePrefilledBooking = () => {
    if (!selectedEntity) return;
    window.prefilledEntity = {
      type: entityType,
      id: selectedEntity.id,
      name: selectedEntity.name,
      phone: selectedEntity.phone || selectedEntity.contactPhone || '',
      email: selectedEntity.email || selectedEntity.companyEmail || '',
      monthlyAccount: selectedEntity.monthlyAccount || false
    };
    if (setIsBookingFormOpen) {
      setIsBookingFormOpen(true);
    }
  };

  const entityBookings = bookings ? bookings.filter(b => {
    if (entityType === 'freelancer') {
      return b.bookingType === 'freelancer' && (Number(b.freelancerId) === Number(selectedId) || b.freelancerName === selectedEntity?.name);
    } else {
      return (b.bookingType === 'company' || b.bookingType === 'partnership') && (Number(b.companyId) === Number(selectedId) || b.companyName === selectedEntity?.name);
    }
  }) : [];

  const todayStr = new Date().toISOString().substring(0, 10);
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = String(new Date().getFullYear());

  const completedBookings = entityBookings.filter(b => b.status === 'مكتمل');
  const upcomingBookings = entityBookings.filter(b => b.status !== 'ملغي' && b.status !== 'مكتمل' && (b.startDate || b.date) >= todayStr);

  const totalAllTimePrice = entityBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalPaid = entityBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const totalRemaining = totalAllTimePrice - totalPaid;

  const thisMonthBookingsCount = entityBookings.filter(b => (b.startDate || b.date).startsWith(currentMonthStr)).length;
  const thisYearBookingsCount = entityBookings.filter(b => (b.startDate || b.date).startsWith(currentYearStr)).length;

  const lastBooking = [...entityBookings].sort((a, b) => (b.startDate || b.date).localeCompare(a.startDate || a.date))[0];
  const statementHistory = monthlyStatements.filter(s => s.entityType === entityType && String(s.entityId) === String(selectedId));

  const getStatusColor = (st) => {
    switch (st) {
      case 'مؤكد': return '#10b981';
      case 'جاري التنفيذ': return '#3b82f6';
      case 'بانتظار التأكيد': return '#f59e0b';
      case 'ملغي': return '#ef4444';
      case 'مكتمل': return '#64748b';
      default: return '#3b82f6';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
          <select
            className="form-control"
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            style={{ width: '130px', height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
          >
            <option value="freelancer">👤 مصور فريلانسر</option>
            <option value="company">🏢 شركة شريكة</option>
          </select>

          <select
            className="form-control"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{ flex: 1, height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
          >
            <option value="">-- اختر الاسم --</option>
            {entityType === 'freelancer'
              ? freelancers?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)
              : companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
            }
          </select>
        </div>

        {selectedEntity && (
          <button onClick={handleCreatePrefilledBooking} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', height: '38px' }}>
            <Icons.Plus size={16} strokeWidth={2.5} />
            <span>+ إضافة مهمة جديدة</span>
          </button>
        )}
      </div>

      {selectedEntity ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  {entityType === 'freelancer' ? '👤' : '🏢'}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950 }}>{selectedEntity.name}</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }} dir="ltr">{selectedEntity.phone || selectedEntity.contactPhone || '-'}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800 }}>التقييم العام والملاحظات الخاصة بالتعامل:</span>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="اكتب هنا ملاحظات تقييم الأداء، دقة المواعيد، الجودة الفنية..."
                    value={entityNotes}
                    onChange={e => setEntityNotes(e.target.value)}
                    style={{ fontSize: '0.76rem', borderRadius: '8px', padding: '8px' }}
                  />
                </div>
                <button onClick={handleUpdateNotes} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-end', height: '28px', fontSize: '0.74rem' }}>
                  حفظ التقييم والملاحظات
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-muted)' }}>📊 الإحصائيات التراكمية</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>إجمالي المهام:</span>
                  <h5 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 950 }}>{entityBookings.length}</h5>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>مهام this_month:</span>
                  <h5 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 950, color: 'var(--primary-color)' }}>{thisMonthBookingsCount}</h5>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>إجمالي المستحقات:</span>
                  <h5 style={{ margin: '4px 0 0 0', fontSize: '0.94rem', fontWeight: 950, color: '#10b981' }}>{formatCurrency(totalAllTimePrice)}</h5>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>إجمالي المتبقي:</span>
                  <h5 style={{ margin: '4px 0 0 0', fontSize: '0.94rem', fontWeight: 950, color: '#ef4444' }}>{formatCurrency(totalRemaining)}</h5>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderRadius: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-muted)' }}>📅 آخر فعالية تم تنفيذها</h4>
              {lastBooking ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.84rem' }}>{lastBooking.title}</strong>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.64rem', fontWeight: 800, backgroundColor: `${getStatusColor(lastBooking.status)}15`, color: getStatusColor(lastBooking.status) }}>
                      {lastBooking.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    <div>التاريخ: <strong>{lastBooking.date}</strong></div>
                    <div>الموقع: <strong>📍 {lastBooking.location}</strong></div>
                    <div>الاتفاق المالي: <strong>{formatCurrency(lastBooking.totalPrice)}</strong></div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 'auto 0' }}>لا يوجد سجل فعاليات سابقة</p>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '12px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
              <button
                onClick={() => setActiveSubTab('summary')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '6px 12px',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  color: activeSubTab === 'summary' ? 'var(--primary-color)' : 'var(--text-muted)',
                  borderBottom: activeSubTab === 'summary' ? '2px solid var(--primary-color)' : 'none',
                  cursor: 'pointer'
                }}
              >
                📋 سجل المهام المنفذة
              </button>
              <button
                onClick={() => setActiveSubTab('upcoming')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '6px 12px',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  color: activeSubTab === 'upcoming' ? 'var(--primary-color)' : 'var(--text-muted)',
                  borderBottom: activeSubTab === 'upcoming' ? '2px solid var(--primary-color)' : 'none',
                  cursor: 'pointer'
                }}
              >
                📅 المهام القادمة
              </button>
              <button
                onClick={() => setActiveSubTab('payments')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '6px 12px',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  color: activeSubTab === 'payments' ? 'var(--primary-color)' : 'var(--text-muted)',
                  borderBottom: activeSubTab === 'payments' ? '2px solid var(--primary-color)' : 'none',
                  cursor: 'pointer'
                }}
              >
                💰 كشوفات الحسابات والمدفوعات
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              {activeSubTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {completedBookings.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px' }}>لا توجد مهام منتهية حتى الآن</p>
                  ) : (
                    completedBookings.map(b => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', fontSize: '0.8rem' }}>
                        <div>
                          <strong>{b.title}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{b.date} | 📍 {b.location}</div>
                        </div>
                        <strong style={{ fontSize: '0.86rem' }}>{formatCurrency(b.totalPrice)}</strong>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSubTab === 'upcoming' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {upcomingBookings.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px' }}>لا توجد مهام قادمة مجدولة</p>
                  ) : (
                    upcomingBookings.map(b => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', fontSize: '0.8rem' }}>
                        <div>
                          <strong>{b.title}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{b.date} | 🕐 {b.startTime} - {b.endTime} | 📍 {b.location}</div>
                        </div>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--primary-color)' }}>{formatCurrency(b.totalPrice)}</strong>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSubTab === 'payments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {statementHistory.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px' }}>لم يتم إصدار أي كشوفات تسوية شهرية بعد</p>
                  ) : (
                    statementHistory.map(s => (
                      <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.82rem' }}>كشف شهر: {s.month}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>إجمالي المستحقات: {formatCurrency(s.totalAmount)} | المدفوع: {formatCurrency(s.paidAmount)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.64rem', fontWeight: 800, backgroundColor: s.status === 'مسدد' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: s.status === 'مسدد' ? '#10b981' : '#ef4444' }}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          ⚠️ يرجى تحديد الاسم لاستعراض سجل التعاون الكامل والتقارير الفنية.
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Sub-View: WaitlistView
// -------------------------------------------------------------
const WaitlistView = () => {
  const { waitlist = [], addToWaitlist, removeFromWaitlist, addBooking } = useApp();
  const todayStr = new Date().toISOString().substring(0, 10);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 950, margin: 0 }}>⏳ قائمة انتظار العملاء لتأكيد الحجوزات</h3>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>إدارة الحجوزات المجدولة غير المؤكدة أو العملاء على قائمة الانتظار للمواعيد المزدحمة.</p>
        </div>
        <button 
          onClick={() => {
            const clientName = prompt('اسم العميل:');
            const phone = prompt('رقم الجوال للعميل:');
            const date = prompt('التاريخ المطلوب للتصوير (مثال: 2026-08-22):', todayStr);
            if (clientName && phone) {
              addToWaitlist({ clientName, phone, date });
            }
          }}
          className="btn btn-primary btn-sm"
        >
          ➕ إضافة عميل للانتظار
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        {waitlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Icons.Clock size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p style={{ fontSize: '0.8rem' }}>قائمة الانتظار خالية حالياً.</p>
          </div>
        ) : (
          waitlist.map(w => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-main)', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 900, margin: 0 }}>{w.clientName}</h4>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  📞 {w.phone} | 📅 {w.date}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    addBooking({
                      clientName: w.clientName,
                      clientPhone: w.phone,
                      date: w.date,
                      title: 'حجز مؤكد من قائمة الانتظار',
                      status: 'مؤكد',
                      location: 'موقع استوديو ستار ميديا',
                      bookingType: 'client'
                    });
                    removeFromWaitlist(w.id);
                  }}
                  className="btn btn-success btn-sm"
                  style={{ fontSize: '0.74rem', padding: '6px 12px', borderRadius: '6px' }}
                >
                  تأكيد حجز ✓
                </button>
                <button 
                  onClick={() => removeFromWaitlist(w.id)} 
                  className="btn btn-danger btn-sm"
                  style={{ fontSize: '0.74rem', padding: '6px 12px', borderRadius: '6px' }}
                >
                  إزالة
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Sub-View: QuotationsView
// -------------------------------------------------------------
const QuotationsView = () => {
  const { quotations = [], addQuotation, convertQuoteToBooking } = useApp();
  const todayStr = new Date().toISOString().substring(0, 10);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 950, margin: 0 }}>📄 عروض الأسعار والتقديرات المالية المقترحة</h3>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>إدارة ومتابعة عروض الأسعار المقدمة للعملاء وتحويلها المباشر لحجوزات مؤكدة.</p>
        </div>
        <button 
          onClick={() => {
            const clientName = prompt('اسم العميل المقترح:');
            const totalPrice = prompt('القيمة الإجمالية المقترحة لعرض السعر (ريال):');
            const description = prompt('تفاصيل باقة التصوير المقترحة:');
            if (clientName && totalPrice) {
              addQuotation({ clientName, totalPrice: Number(totalPrice), description, date: todayStr });
            }
          }}
          className="btn btn-primary btn-sm"
        >
          ➕ إنشاء عرض سعر جديد
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        {quotations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Icons.FileText size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p style={{ fontSize: '0.8rem' }}>لا توجد عروض أسعار مسجلة.</p>
          </div>
        ) : (
          quotations.map(q => (
            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-main)', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 900, margin: 0 }}>{q.clientName}</h4>
                  <span className="badge badge-secondary" style={{ fontSize: '0.66rem' }}>{q.quoteNumber}</span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>{q.status}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{q.description || 'باقة تصوير مخصصة'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 900, color: 'var(--primary-color)', fontSize: '0.88rem' }}>{formatCurrency(q.totalPrice)}</span>
                {q.status === 'بانتظار العميل' && (
                  <button 
                    onClick={() => convertQuoteToBooking(q.id)}
                    className="btn btn-success btn-sm"
                    style={{ fontSize: '0.74rem', padding: '6px 12px', borderRadius: '6px' }}
                  >
                    قبول وتحويل لحجز ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};;

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '8px 12px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'right',
  fontSize: '0.76rem',
  fontWeight: 800,
  color: 'var(--text-main)',
  boxSizing: 'border-box'
};

export default BookingsView;
