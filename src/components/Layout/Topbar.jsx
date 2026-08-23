import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';

export const Topbar = ({ onOpenMobileSidebar }) => {
  const {
    activeTab,
    notifications,
    setIsSearchModalOpen,
    setIsBookingFormOpen,
    userRole,
    currentUser,
    activeOverlay,
    setActiveOverlay
  } = useApp();

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('star_media_theme', 'light');
  }, []);

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  const pageTitles = {
    dashboard: 'لوحة التحكم الرئيسية',
    operations: 'غرفة العمليات المباشرة',
    calendar: 'جدول التقويم والتوقيت',
    bookings: 'إدارة الحجوزات والجلسات',
    tasks: 'إدارة المهام الميدانية',
    projects: 'إدارة المشاريع والأنشطة',
    clients: 'قاعدة بيانات العملاء',
    companies: 'شركات ووكالات التصوير',
    team: 'فريق التصوير والمساعدين',
    achievements: 'إنجازات وأوسمة الفريق',
    equipment: 'معداتي',
    contracts: 'العقود التوافقية والتوقيع',
    map: 'خريطة التغطيات الحية',
    invoices: 'الفواتير والمالية',
    reports: 'التقارير والإحصاءات',
    notifications: 'مركز الإشعارات والتنبيهات',
    ai: 'LensFlow AI Assistant',
    auditLogs: 'سجل النشاطات والأحداث',
    settings: 'الإعدادات والنسخ الاحتياطي'
  };

  return (
    <>
      <header
        style={{
          height: 'var(--topbar-height)',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          padding: isMobile ? '0 10px' : '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-header)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Right Section: Sidebar Toggle & Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: isMobile ? '1 1 auto' : '0 1 auto' }}>
          {isMobile && (
            <button
              onClick={onOpenMobileSidebar}
              className="btn btn-secondary btn-icon icon-button"
              style={{ flexShrink: 0, width: '38px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="القائمة"
            >
              <Icons.Menu size={20} />
            </button>
          )}

          <h2
            style={{
              fontSize: isMobile ? '0.92rem' : '1.15rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.3,
              margin: 0
            }}
          >
            {pageTitles[activeTab] || 'لوحة التحكم الرئيسية'}
          </h2>
        </div>

        {/* Left Section: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', flexShrink: 0 }}>
          
          {/* Mobile Search Button */}
          {isMobile && (
            <button
              onClick={() => setActiveOverlay('SEARCH')}
              className="btn btn-secondary btn-icon"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              aria-label="البحث السريع"
            >
              <Icons.Search size={18} />
            </button>
          )}

          {/* Desktop Search Bar */}
          {!isMobile && (
            <div
              onClick={() => setIsSearchModalOpen(true)}
              style={{
                width: '240px',
                padding: '6px 14px',
                borderRadius: '50px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#f8fafc',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <Icons.Search size={15} color="var(--text-muted)" />
              <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                ابحث عن حجز، عميل، مهمة...
              </span>
            </div>
          )}

          {/* Desktop Only New Booking Button */}
          {!isMobile && userRole === 'admin' && (
            <button
              onClick={() => setIsBookingFormOpen(true)}
              className="btn btn-primary"
              style={{
                borderRadius: '50px',
                padding: '8px 18px',
                fontSize: '0.84rem',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.28)',
                flexShrink: 0
              }}
            >
              <Icons.Plus size={15} strokeWidth={2.5} />
              <span>حجز جديد</span>
            </button>
          )}



          {/* Notifications Bell Icon Button (Mobile & Desktop) */}
          <button
            id="notif-bell-btn"
            onClick={() => setActiveOverlay('NOTIFICATIONS')}
            className="btn btn-secondary btn-icon icon-button"
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="الإشعارات"
          >
            <Icons.Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  insetInlineEnd: '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--status-danger)',
                  color: '#ffffff',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Button */}
          <button
            onClick={() => setActiveOverlay('USER_MENU')}
            aria-label="الملف الشخصي"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '0' : '4px 8px',
              borderRadius: '50px',
              backgroundColor: isMobile ? 'transparent' : 'var(--bg-main)',
              border: isMobile ? 'none' : '1px solid var(--border-color)',
              flexShrink: 0,
              cursor: 'pointer'
            }}
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt=""
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: isMobile ? '2px solid var(--primary-color)' : 'none'
              }}
            />
            {!isMobile && (
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {currentUser?.name || 'عاهد العماري'}
              </span>
            )}
          </button>

        </div>
      </header>
    </>
  );
};

export default Topbar;
