import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatCurrency, formatBookingNumber, formatTime12h } from '../../utils/helpers';
import * as Icons from 'lucide-react';

export const DashboardView = () => {
  const {
    currentUser,
    userRole,
    bookings = [],
    tasks = [],
    projects = [],
    invoices = [],
    clients = [],
    setSelectedBooking,
    setIsBookingDetailOpen,
    setActiveTab,
    checkTravelTimeBuffer,
    privacyMode,
    togglePrivacyMode,
    setIsBookingFormOpen,
    settings
  } = useApp();

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [schedulerTab, setSchedulerTab] = useState('today');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get Riyadh local dates to prevent timezone mismatches
  const getRiyadhDateStr = (offsetDays = 0) => {
    const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
    if (offsetDays !== 0) {
      date.setDate(date.getDate() + offsetDays);
    }
    return date.toISOString().substring(0, 10);
  };

  const todayStr = getRiyadhDateStr(0);
  const tomorrowStr = getRiyadhDateStr(1);
  
  // Bookings Scheduled for Today
  const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== 'ملغي');
  const sortedTodayBookings = [...todayBookings].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  
  // Tasks Scheduled for Today
  const todayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));
  const pendingTodayTasks = todayTasks.filter(t => t.status !== 'مكتملة');

  // Tomorrow's bookings and tasks
  const tomorrowBookings = bookings.filter(b => b.date === tomorrowStr && b.status !== 'ملغي');
  const sortedTomorrowBookings = [...tomorrowBookings].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const tomorrowTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(tomorrowStr));
  const pendingTomorrowTasks = tomorrowTasks.filter(t => t.status !== 'مكتملة');

  // Stats Calculations
  const totalBookingsCount = bookings.filter(b => b.status !== 'ملغي').length;
  const activeProjectsCount = projects.filter(p => p.status === 'قيد التنفيذ').length;
  const totalRevenue = bookings
    .filter(b => b.status !== 'ملغي')
    .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const upcomingBookingsCount = bookings.filter(b => b.date > todayStr && b.status !== 'ملغي').length;

  // Assistant Widget Alerts & Warnings
  // 1. Unconfirmed Booking
  const unconfirmedBookings = bookings.filter(b => b.status === 'بانتظار التأكيد' || b.readinessStatus === 'لم يتم التأكيد');
  
  // 2. Unpaid Invoices
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'مدفوعة' && inv.status !== 'مدفوع');

  // 3. Inactive Clients (no deals in 6 months)
  const inactiveClients = clients.filter(c => {
    const clientBookings = bookings.filter(b => b.clientName === c.name || b.clientId === c.id);
    if (clientBookings.length === 0) return true;
    const sorted = [...clientBookings].sort((a, b) => (b.date || b.startDate).localeCompare(a.date || a.startDate));
    const lastDate = new Date(sorted[0].date || sorted[0].startDate);
    const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 180;
  });

  // 4. Short Travel Buffer Warnings
  const travelWarnings = [];
  const processedTeamMembers = new Set();
  todayBookings.forEach(b => {
    const members = b.teamAssigned || b.teamMemberIds || [];
    members.forEach(mId => {
      if (!processedTeamMembers.has(mId)) {
        const warnings = checkTravelTimeBuffer(b.date, b.location, [mId], b.id);
        if (warnings.length > 0) {
          travelWarnings.push(...warnings);
        }
        processedTeamMembers.add(mId);
      }
    });
  });

  // Upcoming Bookings list
  const upcomingBookings = bookings
    .filter(b => b.date > todayStr && b.status !== 'ملغي')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // WhatsApp click helper
  const triggerWhatsApp = (phone, text) => {
    if (!phone) {
      alert('الرجاء إضافة رقم جوال للعميل أولاً!');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone.replace(/^0/, '')}`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const hasCover = !!settings?.companyIdentity?.coverPic;
  const assistantBg = hasCover 
    ? `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.9)), url(${settings.companyIdentity.coverPic}) center/cover no-repeat`
    : 'linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%)';
  const assistantTextMain = hasCover ? '#ffffff' : 'var(--text-main)';
  const assistantTextMuted = hasCover ? '#cbd5e1' : 'var(--text-muted)';
  const assistantBorder = hasCover ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--border-color)';
  const assistantBorderRight = hasCover ? '5px solid var(--secondary-color)' : '5px solid var(--primary-color)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl', paddingBottom: '30px' }}>
      
      {/* 🌟 ASSISTANT WIDGET: صباح الخير 👋 */}
      <div 
        style={{
          background: assistantBg,
          borderRight: assistantBorderRight,
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--card-shadow)',
          border: assistantBorder,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          color: assistantTextMain
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: hasCover ? '2px solid rgba(255,255,255,0.3)' : 'none', boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)' }}>
              {settings?.companyIdentity?.logo ? (
                <img src={settings.companyIdentity.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Icons.Sparkles size={20} color="var(--primary-color)" />
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: assistantTextMain, margin: 0 }}>
                صباح الخير، {currentUser?.name ? currentUser.name.split(' ')[0] : 'عاهد'} 👋
              </h1>
              <p style={{ color: assistantTextMuted, fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                لديك اليوم <strong style={{ color: hasCover ? 'var(--secondary-color)' : 'var(--primary-color)' }}>{todayBookings.length} حجوزات تصوير</strong> و <strong style={{ color: 'var(--status-warning)' }}>{pendingTodayTasks.length} مهام معلقة</strong> تحتاج متابعة.
              </p>
            </div>
          </div>
          <span className="badge badge-info en-digits" style={{ backgroundColor: hasCover ? 'rgba(255,255,255,0.1)' : 'var(--primary-light)', color: hasCover ? '#ffffff' : 'var(--primary-color)', border: hasCover ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-color)', padding: '5px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>
            {todayStr}
          </span>
        </div>

        {/* Action Alerts List inside assistant */}
        {(unconfirmedBookings.length > 0 || travelWarnings.length > 0 || unpaidInvoices.length > 0 || inactiveClients.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '4px' }}>
            
            {/* Alert: Unconfirmed Booking */}
            {unconfirmedBookings.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.AlertCircle size={15} color="#fbbf24" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>حجز بانتظار التأكيد</span>
                </div>
                <button 
                  onClick={() => {
                    const b = unconfirmedBookings[0];
                    triggerWhatsApp(b.clientPhone, `السلام عليكم، للتذكير بموعد التصوير المقرّر وبانتظار تأكيدكم النهائي. شكراً 🌸`);
                  }}
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.72rem', padding: '4px 10px', minHeight: 'auto', borderRadius: '50px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}
                >
                  تأكيد واتساب
                </button>
              </div>
            )}

            {/* Alert: Travel Buffer Conflict */}
            {travelWarnings.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.Car size={15} color="#fca5a5" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fca5a5' }}>وقت التنقل قصير 🚗</span>
                </div>
                <button 
                  onClick={() => setActiveTab('operations')}
                  className="btn btn-sm" 
                  style={{ fontSize: '0.72rem', padding: '4px 10px', minHeight: 'auto', borderRadius: '50px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
                >
                  فحص المسار
                </button>
              </div>
            )}

            {/* Alert: Unpaid Invoices */}
            {unpaidInvoices.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.Coins size={15} color="#818cf8" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>فاتورة مستحقة للتحصيل</span>
                </div>
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.72rem', padding: '4px 10px', minHeight: 'auto', borderRadius: '50px', color: '#818cf8', backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                >
                  تحصيل الآن
                </button>
              </div>
            )}

            {/* Alert: Inactive Clients */}
            {inactiveClients.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.UserMinus size={15} color="#34d399" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>عميل يحتاج تنشيط</span>
                </div>
                <button 
                  onClick={() => {
                    const c = inactiveClients[0];
                    triggerWhatsApp(c.phone, `مرحباً ${c.name}، نأمل أن تكونوا بخير. اشتقنا للعمل معكم في استوديو العهد ستار. يسعدنا تقديم عرض خاص لجلستكم القادمة 🌸`);
                  }}
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.72rem', padding: '4px 10px', minHeight: 'auto', borderRadius: '50px', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                >
                  متابعة العميل
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 🌟 STATS GRID SECTION */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile 
            ? (userRole === 'admin' ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)') 
            : (userRole === 'admin' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)'), 
          gap: '12px',
          width: '100%'
        }}
      >
        {/* Stat 1: Revenue (Admin Only) */}
        {userRole === 'admin' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.03) 0%, var(--bg-card) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: isMobile ? '12px' : '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--card-shadow)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(244, 63, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icons.Coins size={20} color="#f43f5e" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>الإيرادات</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePrivacyMode();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                    outline: 'none',
                    margin: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                  title={privacyMode ? "إظهار المبالغ" : "إخفاء المبالغ"}
                >
                  {privacyMode ? <Icons.EyeOff size={13} /> : <Icons.Eye size={13} />}
                </button>
              </div>
              <strong className="en-digits" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>
                {privacyMode ? '••••••' : formatCurrency(totalRevenue).replace(' ريال', '')}
                <span style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginRight: '4px' }}>ريال</span>
              </strong>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>إجمالي الدخل</span>
            </div>
          </div>
        )}
 
        {/* Stat 2: Bookings */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: isMobile ? '12px' : '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--card-shadow)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.CalendarCheck size={20} color="#818cf8" />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>الحجوزات</span>
            <strong className="en-digits" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {totalBookingsCount}
            </strong>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>{upcomingBookingsCount} جلسة قادمة</span>
          </div>
        </div>

        {/* Stat 3: Projects */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: isMobile ? '12px' : '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--card-shadow)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Briefcase size={20} color="#34d399" />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>المشاريع</span>
            <strong className="en-digits" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {activeProjectsCount}
            </strong>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>مشاريع قيد العمل</span>
          </div>
        </div>

        {/* Stat 4: Tasks */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: isMobile ? '12px' : '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--card-shadow)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.CheckSquare size={20} color="#fbbf24" />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>المهام اليومية</span>
            <strong className="en-digits" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {pendingTodayTasks.length}
            </strong>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>مهام معلقة اليوم</span>
          </div>
        </div>
      </div>

      {/* ⚡ QUICK ACTIONS SECTION: قسم الإجراءات السريعة الأنيق */}
      <div 
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <h3 style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Zap size={16} color="var(--primary-color)" />
          <span>إجراءات سريعة</span>
        </h3>
        
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
            gap: '10px' 
          }}
        >
          {/* Action 1: Add Booking */}
          <div
            onClick={() => setIsBookingFormOpen(true)}
            className="card-interactive"
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)' }}>
              <Icons.PlusCircle size={18} color="#818cf8" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>حجز جديد</span>
          </div>

          {/* Action 2: Add Task */}
          <div
            onClick={() => setActiveTab('tasks')}
            className="card-interactive"
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)' }}>
              <Icons.CheckSquare size={18} color="#fbbf24" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>جدولة مهمة</span>
          </div>

          {/* Action 3: Add Client */}
          <div
            onClick={() => setActiveTab('clients')}
            className="card-interactive"
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>
              <Icons.UserPlus size={18} color="#34d399" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>إضافة عميل</span>
          </div>

          {/* Action 4: Financials */}
          <div
            onClick={() => setActiveTab('invoices')}
            className="card-interactive"
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)' }}>
              <Icons.FileText size={18} color="#22d3ee" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>المالية والتقارير</span>
          </div>
        </div>
      </div>

      {/* 🌟 INTEGRATED SCHEDULER WIDGET: اليوم وغدًا */}
      <div 
        style={{ 
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.CalendarCheck size={18} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>جدول الحجوزات والمهام اليومية</h3>
          </div>
          
          {/* Segmented Tab Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setSchedulerTab('today')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: schedulerTab === 'today' ? 'var(--bg-card)' : 'transparent',
                color: schedulerTab === 'today' ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: schedulerTab === 'today' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              اليوم ({todayStr})
            </button>
            <button
              onClick={() => setSchedulerTab('tomorrow')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: schedulerTab === 'tomorrow' ? 'var(--bg-card)' : 'transparent',
                color: schedulerTab === 'tomorrow' ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: schedulerTab === 'tomorrow' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              غداً ({tomorrowStr})
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        {schedulerTab === 'today' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Stats Pill Summary */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary en-digits" style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 800 }}>
                {sortedTodayBookings.length} حجوزات اليوم
              </span>
              <span className="badge badge-info en-digits" style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                {pendingTodayTasks.length} مهام معلقة اليوم
              </span>
            </div>

            {/* Bookings Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Clock size={15} color="var(--primary-color)" />
                <span>الخط الزمني للحجوزات</span>
              </h4>

              {sortedTodayBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Icons.CalendarX size={28} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>لا توجد حجوزات مجدولة لليوم.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingRight: '20px', borderRight: '2px solid var(--border-color)', marginTop: '4px' }}>
                  {sortedTodayBookings.map((b) => {
                    const remaining = b.remainingAmount !== undefined ? b.remainingAmount : (b.totalPrice || 0) - (b.paidAmount || 0);
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBooking(b);
                          setIsBookingDetailOpen(true);
                        }}
                        className="card-interactive"
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          padding: '14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-main)',
                          cursor: 'pointer',
                          boxShadow: 'none'
                        }}
                      >
                        {/* Connector dot */}
                        <div 
                          style={{
                            position: 'absolute',
                            right: '-28px',
                            top: '20px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-color)',
                            border: '3px solid var(--bg-card)',
                            boxShadow: '0 0 0 3px var(--primary-light)',
                            zIndex: 2
                          }}
                        />

                        {/* Booking Meta Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="en-digits" style={{ fontWeight: 900, color: 'var(--primary-color)', fontSize: '0.84rem' }}>
                              ⏰ {b.isAllDay ? 'طوال اليوم' : (b.startTime === 'صباحًا' || b.startTime === 'مساءً' ? b.startTime : `${formatTime12h(b.startTime)} - ${formatTime12h(b.endTime)}`)}{b.attendanceTime && ` (حضور: ${b.attendanceTime})`}
                            </span>
                            <span className="badge en-digits" style={{ fontSize: '0.68rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>#{b.bookingNumber}</span>
                            <StatusBadge status={b.status} />
                            {b.source && (
                              <span className="badge en-digits" style={{ fontSize: '0.68rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', border: '1px solid var(--border-color)' }}>
                                🔌 {b.source}
                              </span>
                            )}
                          </div>
                          {userRole === 'admin' && b.totalPrice !== null && !privacyMode && (
                            <span className="en-digits" style={{ fontSize: '0.78rem', fontWeight: 800, color: remaining > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                              {remaining > 0 ? `متبقي: ${formatCurrency(remaining).replace(' ريال', '')} ريال` : 'مدفوع بالكامل'}
                            </span>
                          )}
                        </div>

                        {/* Title and details */}
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 900, margin: '2px 0', color: 'var(--text-main)' }}>{b.title}</h4>
                          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.User size={13} color="#818cf8" />
                              <span>العميل: <strong>{b.clientName}</strong></span>
                            </span>
                            {b.companyName && b.companyName !== '-' && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.Building size={13} color="#a855f7" />
                                <span>الجهة: <strong>{b.companyName}</strong></span>
                              </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.MapPin size={13} color="#fbbf24" />
                              <span>الموقع: <strong>{b.location || 'الرياض'}</strong></span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.CheckSquare size={15} color="var(--status-warning)" />
                <span>المهام المرتبطة باليوم</span>
              </h4>

              {todayTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderRadius: '12px', fontSize: '0.8rem' }}>
                  لا توجد مهام عمل مجدولة لليوم.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {todayTasks.map(t => (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>{t.title}</span>
                        <span className="badge" style={{
                          fontSize: '0.68rem',
                          backgroundColor: t.priority === 'عالية جداً' || t.priority === 'عالية' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                          color: t.priority === 'عالية جداً' || t.priority === 'عالية' ? 'var(--status-danger)' : 'var(--status-warning)',
                          border: 'none'
                        }}>
                          {t.priority}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>👤 المكلف: {t.assigneeName}</span>
                        <span className="en-digits">⏰ {t.dueDate?.split(' ')[1] || 'طوال اليوم'}</span>
                      </div>
                      {/* Completion Progress Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '10px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                          <div style={{ width: `${t.progress || 0}%`, height: '100%', backgroundColor: t.progress === 100 ? 'var(--status-success)' : 'var(--primary-color)', borderRadius: '10px' }} />
                        </div>
                        <span className="en-digits" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>{t.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tomorrow Stats summary */}
            <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Sparkles size={16} color="var(--primary-color)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  غداً لديك <strong style={{ color: 'var(--primary-color)' }} className="en-digits">{tomorrowBookings.length}</strong> حجوزات و <strong style={{ color: 'var(--status-warning)' }} className="en-digits">{pendingTomorrowTasks.length}</strong> مهام معلقة
                </span>
              </div>
              {tomorrowBookings.length > 0 && (
                <span className="badge badge-success" style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  حجوزات قادمة نشطة 🚀
                </span>
              )}
            </div>

            {/* Bookings Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Clock size={15} color="var(--primary-color)" />
                <span>الخط الزمني لحجوزات الغد</span>
              </h4>

              {sortedTomorrowBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Icons.CalendarX size={28} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>لا توجد حجوزات مجدولة للغد.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingRight: '20px', borderRight: '2px solid var(--border-color)', marginTop: '4px' }}>
                  {sortedTomorrowBookings.map((b) => {
                    const remaining = b.remainingAmount !== undefined ? b.remainingAmount : (b.totalPrice || 0) - (b.paidAmount || 0);
                    // Highlight important tomorrow bookings (e.g. high value or morning starts)
                    const isImportant = b.totalPrice >= 10000 || (b.startTime && b.startTime < '12:00');

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBooking(b);
                          setIsBookingDetailOpen(true);
                        }}
                        className="card-interactive"
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          padding: '14px',
                          borderRadius: '12px',
                          border: isImportant ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                          backgroundColor: isImportant ? 'rgba(99, 102, 241, 0.02)' : 'var(--bg-main)',
                          cursor: 'pointer',
                          boxShadow: isImportant ? '0 4px 12px rgba(99, 102, 241, 0.05)' : 'none'
                        }}
                      >
                        {/* Connector dot */}
                        <div 
                          style={{
                            position: 'absolute',
                            right: '-28px',
                            top: '20px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: isImportant ? 'var(--secondary-color)' : 'var(--primary-color)',
                            border: '3px solid var(--bg-card)',
                            boxShadow: '0 0 0 3px var(--primary-light)',
                            zIndex: 2
                          }}
                        />

                        {isImportant && (
                          <div style={{ position: 'absolute', left: '14px', top: '14px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-color)', fontSize: '0.68rem', fontWeight: 800 }}>
                            <Icons.Award size={12} />
                            <span>حجز هام 🌟</span>
                          </div>
                        )}

                        {/* Booking Meta Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="en-digits" style={{ fontWeight: 900, color: 'var(--primary-color)', fontSize: '0.84rem' }}>
                              ⏰ {b.isAllDay ? 'طوال اليوم' : (b.startTime === 'صباحًا' || b.startTime === 'مساءً' ? b.startTime : `${formatTime12h(b.startTime)} - ${formatTime12h(b.endTime)}`)}{b.attendanceTime && ` (حضور: ${b.attendanceTime})`}
                            </span>
                            <span className="badge en-digits" style={{ fontSize: '0.68rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>#{b.bookingNumber}</span>
                            <StatusBadge status={b.status} />
                            {b.source && (
                              <span className="badge en-digits" style={{ fontSize: '0.68rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', border: '1px solid var(--border-color)' }}>
                                🔌 {b.source}
                              </span>
                            )}
                          </div>
                          {userRole === 'admin' && b.totalPrice !== null && !privacyMode && (
                            <span className="en-digits" style={{ fontSize: '0.78rem', fontWeight: 800, color: remaining > 0 ? 'var(--status-danger)' : 'var(--status-success)', marginRight: isImportant ? '80px' : '0' }}>
                              {remaining > 0 ? `متبقي: ${formatCurrency(remaining).replace(' ريال', '')} ريال` : 'مدفوع بالكامل'}
                            </span>
                          )}
                        </div>

                        {/* Title and details */}
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 900, margin: '2px 0', color: 'var(--text-main)' }}>{b.title}</h4>
                          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.User size={13} color="#818cf8" />
                              <span>العميل: <strong>{b.clientName}</strong></span>
                            </span>
                            {b.companyName && b.companyName !== '-' && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.Building size={13} color="#a855f7" />
                                <span>الجهة: <strong>{b.companyName}</strong></span>
                              </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.MapPin size={13} color="#fbbf24" />
                              <span>الموقع: <strong>{b.location || 'الرياض'}</strong></span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tomorrow Tasks Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.CheckSquare size={15} color="var(--status-warning)" />
                <span>المهام المجدولة للغد</span>
              </h4>

              {tomorrowTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderRadius: '12px', fontSize: '0.8rem' }}>
                  لا توجد مهام عمل مجدولة للغد.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {tomorrowTasks.map(t => (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>{t.title}</span>
                        <span className="badge" style={{
                          fontSize: '0.68rem',
                          backgroundColor: t.priority === 'عالية جداً' || t.priority === 'عالية' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                          color: t.priority === 'عالية جداً' || t.priority === 'عالية' ? 'var(--status-danger)' : 'var(--status-warning)',
                          border: 'none'
                        }}>
                          {t.priority}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>👤 المكلف: {t.assigneeName}</span>
                        <span className="en-digits">⏰ {t.dueDate?.split(' ')[1] || 'طوال اليوم'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '10px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                          <div style={{ width: `${t.progress || 0}%`, height: '100%', backgroundColor: t.progress === 100 ? 'var(--status-success)' : 'var(--primary-color)', borderRadius: '10px' }} />
                        </div>
                        <span className="en-digits" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>{t.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🌟 UPCOMING BOOKINGS SECTION: الحجوزات القادمة */}
      <div 
        style={{ 
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Calendar size={18} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>الحجوزات وجلسات التصوير القادمة</h3>
          </div>
          <span className="badge badge-info en-digits" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
            {upcomingBookingsCount} جلسة
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {upcomingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
              لا توجد جلسات قادمة حتّى الآن. قم بإضافة حجز جديد!
            </div>
          ) : (
            upcomingBookings.map((b, idx) => {
              const bookingNum = formatBookingNumber(b.bookingNumber);
              let formattedTime = b.isAllDay ? 'طوال اليوم' : formatTime12h(b.startTime || '16:00');
              if (b.attendanceTime) {
                formattedTime += ` (الحضور: ${b.attendanceTime})`;
              }
              const waText = `أهلاً ${b.clientName}، نود تذكيركم بموعد جلسة التصوير (${b.title}) بتاريخ ${b.date} الساعة ${formattedTime}. بانتظاركم في الموعد المحدّد 🌸`;
              
              return (
                <div 
                  key={b.id || idx} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-main)',
                    boxShadow: 'none',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{b.title}</h4>
                      <StatusBadge status={b.status} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      👤 العميل: <strong style={{ color: 'var(--text-main)' }}>{b.clientName}</strong> | 📅 الموعد: <strong className="en-digits" style={{ color: 'var(--status-warning)' }}>{b.date} ({b.isAllDay ? 'طوال اليوم' : formatTime12h(b.startTime || '16:00')}{b.attendanceTime && ` - الحضور: ${b.attendanceTime}`})</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      📍 الموقع: {b.location || 'غير محدد'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button 
                      onClick={() => triggerWhatsApp(b.clientPhone, waText)}
                      className="btn btn-secondary btn-sm" 
                      style={{ fontSize: '0.76rem', borderRadius: '50px', padding: '6px 12px', minHeight: '34px', borderColor: '#25d366', color: '#25d366', backgroundColor: 'rgba(37, 211, 102, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Icons.Phone size={13} />
                      <span>واتساب</span>
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedBooking(b);
                        setIsBookingDetailOpen(true);
                      }}
                      className="btn btn-secondary btn-sm" 
                      style={{ fontSize: '0.76rem', borderRadius: '50px', padding: '6px 12px', minHeight: '34px', color: 'var(--text-main)' }}
                    >
                      👁️ التفاصيل
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedBooking(b);
                        setActiveTab('invoices');
                      }}
                      className="btn btn-primary btn-sm" 
                      style={{ fontSize: '0.76rem', borderRadius: '50px', padding: '6px 12px', minHeight: '34px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', boxShadow: 'none' }}
                    >
                      🧾 الفاتورة
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardView;
