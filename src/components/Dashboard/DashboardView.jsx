import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatCurrency, formatBookingNumber } from '../../utils/helpers';
import * as Icons from 'lucide-react';

export const DashboardView = () => {
  const {
    currentUser,
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
    setIsBookingFormOpen
  } = useApp();

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const todayStr = new Date().toISOString().substring(0, 10);
  
  // Bookings Scheduled for Today
  const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== 'ملغي');
  
  // Tasks Scheduled for Today
  const todayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));
  const pendingTodayTasks = todayTasks.filter(t => t.status !== 'مكتملة');

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl', paddingBottom: '30px' }}>
      
      {/* 🌟 ASSISTANT WIDGET: صباح الخير 👋 */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(20, 27, 38, 0.8) 0%, rgba(11, 15, 23, 0.95) 100%)',
          borderRight: '5px solid #6366f1',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(139, 92, 246, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)' }}>
              <Icons.Sparkles size={20} color="#a78bfa" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>
                صباح الخير، {currentUser?.name ? currentUser.name.split(' ')[0] : 'عاهد'} 👋
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                لديك اليوم <strong style={{ color: '#818cf8' }}>{todayBookings.length} حجوزات تصوير</strong> و <strong style={{ color: '#fbbf24' }}>{pendingTodayTasks.length} مهام معلقة</strong> تحتاج متابعة.
              </p>
            </div>
          </div>
          <span className="badge badge-info en-digits" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '5px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>
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

      {/* 🌟 STATS GRID SECTION: إحصائيات شبكة 2×2 على الجوال */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
          gap: '12px',
          width: '100%'
        }}
      >
        {/* Stat 1: Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(20, 27, 38, 0.75) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.18)',
          borderRadius: '16px',
          padding: isMobile ? '12px' : '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(244, 63, 94, 0.03)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(244, 63, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Coins size={20} color="#f43f5e" />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block' }}>الإيرادات</span>
            <strong className="en-digits" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: '#f1f5f9' }}>
              {privacyMode ? '••••' : formatCurrency(totalRevenue).replace(' ريال', '')}
            </strong>
            <span style={{ fontSize: '0.64rem', color: '#64748b', display: 'block', marginTop: '1px' }}>إجمالي الدخل</span>
          </div>
        </div>

        {/* Stat 2: Bookings */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(20, 27, 38, 0.75) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.18)',
          borderRadius: '16px',
          padding: isMobile ? '12px' : '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.03)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.CalendarCheck size={20} color="#818cf8" />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block' }}>الحجوزات</span>
            <strong className="en-digits" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: '#f1f5f9' }}>
              {totalBookingsCount}
            </strong>
            <span style={{ fontSize: '0.64rem', color: '#64748b', display: 'block', marginTop: '1px' }}>{upcomingBookingsCount} جلسة قادمة</span>
          </div>
        </div>

        {/* Stat 3: Projects */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 27, 38, 0.75) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.18)',
          borderRadius: '16px',
          padding: isMobile ? '12px' : '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.03)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Briefcase size={20} color="#34d399" />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block' }}>المشاريع</span>
            <strong className="en-digits" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: '#f1f5f9' }}>
              {activeProjectsCount}
            </strong>
            <span style={{ fontSize: '0.64rem', color: '#64748b', display: 'block', marginTop: '1px' }}>مشاريع قيد العمل</span>
          </div>
        </div>

        {/* Stat 4: Tasks */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(20, 27, 38, 0.75) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.18)',
          borderRadius: '16px',
          padding: isMobile ? '12px' : '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.03)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.CheckSquare size={20} color="#fbbf24" />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block' }}>المهام اليومية</span>
            <strong className="en-digits" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 900, color: '#f1f5f9' }}>
              {pendingTodayTasks.length}
            </strong>
            <span style={{ fontSize: '0.64rem', color: '#64748b', display: 'block', marginTop: '1px' }}>مهام معلقة اليوم</span>
          </div>
        </div>
      </div>

      {/* ⚡ QUICK ACTIONS SECTION: قسم الإجراءات السريعة الأنيق */}
      <div 
        style={{
          background: 'rgba(20, 27, 38, 0.7)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
        }}
      >
        <h3 style={{ fontSize: '0.98rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Zap size={16} color="#6366f1" />
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
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
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
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0' }}>حجز جديد</span>
          </div>

          {/* Action 2: Add Task */}
          <div
            onClick={() => setActiveTab('tasks')}
            className="card-interactive"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
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
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0' }}>جدولة مهمة</span>
          </div>

          {/* Action 3: Add Client */}
          <div
            onClick={() => setActiveTab('clients')}
            className="card-interactive"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
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
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0' }}>إضافة عميل</span>
          </div>

          {/* Action 4: Financials */}
          <div
            onClick={() => setActiveTab('invoices')}
            className="card-interactive"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
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
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0' }}>المالية والتقارير</span>
          </div>
        </div>
      </div>

      {/* 🌟 TODAY'S TIMELINE SECTION: ماذا لدي اليوم؟ */}
      <div 
        style={{ 
          background: 'rgba(20, 27, 38, 0.7)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.CalendarCheck size={18} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 900, margin: 0, color: '#f1f5f9' }}>ماذا لدي اليوم؟ (الجدول والخط الزمني لليوم)</h3>
          </div>
          <span className="badge badge-info en-digits" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
            {todayBookings.length} تغطيات
          </span>
        </div>

        {todayBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Icons.Calendar size={36} style={{ opacity: 0.3, color: '#94a3b8' }} />
            <p style={{ fontSize: '0.86rem', margin: 0 }}>لا توجد حجوزات أو جلسات تصوير مسجلة اليوم.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingRight: '22px', borderRight: '2px solid rgba(139, 92, 246, 0.15)', marginTop: '8px' }}>
            {todayBookings.map((b, idx) => {
              const bookingNum = formatBookingNumber(b.bookingNumber);
              const remaining = b.remainingAmount !== undefined ? b.remainingAmount : (b.totalPrice || 0) - (b.paidAmount || 0);
              
              return (
                <div 
                  key={b.id || idx} 
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
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(139, 92, 246, 0.12)',
                    backgroundColor: 'rgba(20, 27, 38, 0.75)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, borderColor 0.2s ease',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* Connector node indicator */}
                  <div 
                    style={{
                      position: 'absolute',
                      right: '-30px',
                      top: '22px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#6366f1',
                      border: '3px solid #0b0f17',
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.25)',
                      zIndex: 2
                    }}
                  />

                  {/* Header info row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="en-digits" style={{ fontWeight: 900, color: '#818cf8', fontSize: '0.88rem' }}>
                        {b.startTime} - {b.endTime}
                      </span>
                      <span className="badge en-digits" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>#{bookingNum}</span>
                      <StatusBadge status={b.status} />
                      {b.readinessStatus && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{b.readinessStatus}</span>}
                    </div>
                    {b.totalPrice !== null && !privacyMode && (
                      <span className="en-digits" style={{ fontSize: '0.78rem', fontWeight: 800, color: remaining > 0 ? '#fca5a5' : '#34d399' }}>
                        {remaining > 0 ? `متبقي: ${formatCurrency(remaining).replace(' ريال', '')} ريال` : 'مدفوع بالكامل'}
                      </span>
                    )}
                  </div>

                  {/* Title and details */}
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 900, margin: '4px 0', color: '#f1f5f9' }}>{b.title}</h4>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.User size={13} color="#818cf8" />
                        <span>العميل: <strong>{b.clientName}</strong></span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.MapPin size={13} color="#fbbf24" />
                        <span>الموقع: <strong>{b.location}</strong></span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Camera size={13} color="#34d399" />
                        <span>المصور: <strong>{b.assignedPhotographer || 'غير معين'}</strong></span>
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌟 UPCOMING BOOKINGS SECTION: الحجوزات القادمة */}
      <div 
        style={{ 
          background: 'rgba(20, 27, 38, 0.7)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Calendar size={18} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 900, margin: 0, color: '#f1f5f9' }}>الحجوزات وجلسات التصوير القادمة</h3>
          </div>
          <span className="badge badge-info en-digits" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
            {upcomingBookingsCount} جلسة
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {upcomingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
              لا توجد جلسات قادمة حتّى الآن. قم بإضافة حجز جديد!
            </div>
          ) : (
            upcomingBookings.map((b, idx) => {
              const bookingNum = formatBookingNumber(b.bookingNumber);
              const waText = `أهلاً ${b.clientName}، نود تذكيركم بموعد جلسة التصوير (${b.title}) بتاريخ ${b.date} الساعة ${b.startTime || ''}. بانتظاركم في الموعد المحدّد 🌸`;
              
              return (
                <div 
                  key={b.id || idx} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                    backgroundColor: 'rgba(20, 27, 38, 0.75)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{b.title}</h4>
                      <StatusBadge status={b.status} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                      👤 العميل: <strong style={{ color: '#f1f5f9' }}>{b.clientName}</strong> | 📅 الموعد: <strong className="en-digits" style={{ color: '#fbbf24' }}>{b.date} ({b.startTime || ''})</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
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
                      style={{ fontSize: '0.76rem', borderRadius: '50px', padding: '6px 12px', minHeight: '34px', color: '#94a3b8' }}
                    >
                      👁️ التفاصيل
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedBooking(b);
                        setActiveTab('invoices');
                      }}
                      className="btn btn-primary btn-sm" 
                      style={{ fontSize: '0.76rem', borderRadius: '50px', padding: '6px 12px', minHeight: '34px', backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', boxShadow: 'none' }}
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
