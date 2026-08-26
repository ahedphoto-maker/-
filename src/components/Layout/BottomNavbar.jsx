import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { navigateTo } from '../../routes/Router';
import * as Icons from 'lucide-react';

export const BottomNavbar = ({ onOpenMobileSidebar }) => {
  const { activeTab, setActiveTab, userRole, notifications, setIsBookingFormOpen } = useApp();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMobile) return null;

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  const navItems = (userRole === 'employee' || userRole === 'photographer') ? [
    { id: 'dashboard', label: 'الرئيسية', icon: Icons.LayoutDashboard, route: '/employee/dashboard' },
    { id: 'bookings', label: 'الحجوزات', icon: Icons.CalendarCheck, route: '/employee/bookings' },
    { id: 'add_quick', label: 'حجز سريع', isCenterAdd: true },
    { id: 'calendar', label: 'التقويم', icon: Icons.Calendar, route: '/employee/calendar' },
    { id: 'menu', label: 'القائمة', icon: Icons.Menu, action: 'open_sidebar' }
  ] : [
    { id: 'dashboard', label: 'الرئيسية', icon: Icons.LayoutDashboard, route: '/admin/dashboard' },
    { id: 'bookings', label: 'الحجوزات', icon: Icons.CalendarCheck, route: '/admin/bookings' },
    { id: 'add_quick', label: 'حجز سريع', isCenterAdd: true },
    { id: 'calendar', label: 'التقويم', icon: Icons.Calendar, route: '/admin/calendar' },
    { id: 'menu', label: 'القائمة', icon: Icons.Menu, action: 'open_sidebar' }
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي للجوال"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        zIndex: 'var(--z-mobile-nav)',
        boxShadow: 'var(--card-shadow)',
        paddingTop: '6px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxSizing: 'border-box'
      }}
    >
      {navItems.map(item => {
        if (item.isCenterAdd) {
          return (
            <button
              key={item.id}
              type="button"
              aria-label="حجز سريع"
              onClick={() => {
                if (setIsBookingFormOpen) setIsBookingFormOpen(true);
              }}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: '4px solid var(--bg-card)',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.5), 0 0 12px rgba(139, 92, 246, 0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateY(-14px)',
                flexShrink: 0,
                transition: 'transform 0.2s ease, boxShadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-16px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.6), 0 0 16px rgba(139, 92, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-14px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.5), 0 0 12px rgba(139, 92, 246, 0.3)';
              }}
            >
              <Icons.Plus size={24} strokeWidth={3.5} />
            </button>
          );
        }

        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        const badgeValue = item.id === 'menu' ? unreadCount : 0;

        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => {
              if (item.action === 'open_sidebar') {
                if (onOpenMobileSidebar) onOpenMobileSidebar();
              } else {
                setActiveTab(item.id);
                navigateTo(item.route);
              }
            }}
            style={{
              flex: 1,
              height: '52px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              border: 'none',
              backgroundColor: 'transparent',
              color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer',
              position: 'relative',
              padding: '0'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              {badgeValue > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    insetInlineEnd: '-6px',
                    backgroundColor: 'var(--status-danger)',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {badgeValue}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 800 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavbar;
