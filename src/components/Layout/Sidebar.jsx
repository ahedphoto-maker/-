import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { navigateTo } from '../../routes/Router';
import * as Icons from 'lucide-react';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, userRole, currentUser, logoutUser, setActiveOverlay, settings } = useApp();

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 992);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock background body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobile, isMobileOpen]);

  // Dynamic Lucide Icon resolver
  const getMenuIcon = (id) => {
    switch (id) {
      case 'dashboard': return <Icons.LayoutDashboard size={18} />;
      case 'operations': return <Icons.Sliders size={18} />;
      case 'calendar': return <Icons.Calendar size={18} />;
      case 'bookings': return <Icons.BookOpen size={18} />;
      case 'tasks': return <Icons.CheckSquare size={18} />;
      case 'projects': return <Icons.FolderKanban size={18} />;
      case 'clients': return <Icons.Users size={18} />;
      case 'companies': return <Icons.Building size={18} />;
      case 'team': return <Icons.UserCheck size={18} />;
      case 'achievements': return <Icons.Award size={18} />;
      case 'equipment': return <Icons.Camera size={18} />;
      case 'contracts': return <Icons.FileText size={18} />;
      case 'map': return <Icons.MapPin size={18} />;
      case 'invoices': return <Icons.CreditCard size={18} />;
      case 'reports': return <Icons.BarChart2 size={18} />;
      case 'notifications': return <Icons.Bell size={18} />;
      case 'ai': return <Icons.Sparkles size={18} />;
      case 'auditLogs': return <Icons.Clock size={18} />;
      case 'settings': return <Icons.Settings size={18} />;
      default: return <Icons.Circle size={18} />;
    }
  };

  const adminGroups = [
    {
      title: 'التشغيل والعمليات',
      items: [
        { id: 'dashboard', label: 'لوحة التحكم' },
        { id: 'operations', label: 'غرفة العمليات' },
        { id: 'bookings', label: 'الحجوزات' },
        { id: 'calendar', label: 'التقويم' },
        { id: 'tasks', label: 'المهام الميدانية' }
      ]
    },
    {
      title: 'الفريق والموارد',
      items: [
        { id: 'team', label: 'فريق العمل' },
        { id: 'projects', label: 'المشاريع' },
        { id: 'equipment', label: 'معداتي' },
        { id: 'clients', label: 'العملاء' },
        { id: 'companies', label: 'الشركات' }
      ]
    },
    {
      title: 'المالية والعقود',
      items: [
        { id: 'invoices', label: 'الفواتير والمالية' },
        { id: 'contracts', label: 'العقود الإلكترونية' },
        { id: 'map', label: 'خريطة الحجوزات' }
      ]
    },
    {
      title: 'النظام والتقارير',
      items: [
        { id: 'notifications', label: 'مركز الإشعارات' },
        { id: 'ai', label: 'LensFlow AI' },
        { id: 'auditLogs', label: 'سجل النشاطات' },
        { id: 'settings', label: 'الإعدادات والنسخ' }
      ]
    }
  ];

  const employeeGroups = [
    {
      title: 'بوابة الموظف والمصور',
      items: [
        { id: 'dashboard', label: 'لوحة التحكم' },
        { id: 'tasks', label: 'مهامي الميدانية' },
        { id: 'bookings', label: 'حجوزاتي' },
        { id: 'calendar', label: 'التقويم' }
      ]
    }
  ];

  const navigationGroups = (userRole === 'employee' || userRole === 'photographer') ? employeeGroups : adminGroups;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 600, // Matching mobile z-drawer
            touchAction: 'none'
          }}
          onClick={() => setActiveOverlay('NONE')}
        />
      )}

      <aside
        id="app-mobile-sidebar"
        aria-label="القائمة الجانبية للنظام"
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: '#0f172a',
          color: '#94a3b8',
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          zIndex: isMobile ? 650 : 'var(--z-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isMobile && !isMobileOpen ? 'translateX(100%)' : 'translateX(0)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isMobileOpen ? '-8px 0 30px rgba(0,0,0,0.3)' : 'none',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            {settings?.companyIdentity?.logo ? (
              <img
                src={settings.companyIdentity.logo}
                alt="Logo"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.35)',
                  fontWeight: 900,
                  flexShrink: 0
                }}
              >
                <Icons.Camera size={20} />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: '1.02rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.2px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={settings?.companyIdentity?.name || 'العهد ستار 🌟'}>
                {settings?.companyIdentity?.name || 'العهد ستار 🌟'}
              </h1>
              <p style={{ fontSize: '0.66rem', color: '#94a3b8', margin: '1px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={settings?.companyIdentity?.description || 'عاهد العماري | منصة الحجوزات'}>
                {settings?.companyIdentity?.description || 'عاهد العماري | منصة الحجوزات'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveOverlay('NONE')}
            aria-label="إغلاق القائمة"
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              color: '#94a3b8',
              backgroundColor: 'transparent',
              display: isMobile ? 'flex' : 'none',
              cursor: 'pointer'
            }}
          >
            <Icons.X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav
          aria-label="روابط التنقل"
          style={{
            flex: 1,
            padding: '14px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {navigationGroups.map((grp, gIdx) => (
            <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ padding: '4px 10px', fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {grp.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {grp.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={item.label}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (userRole === 'employee' || userRole === 'photographer') {
                          navigateTo(`/employee/${item.id}`);
                        } else {
                          navigateTo(`/admin/${item.id}`);
                        }
                        setActiveOverlay('NONE');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        height: '38px',
                        borderRadius: '8px',
                        color: isActive ? '#ffffff' : '#94a3b8',
                        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                        border: 'none',
                        fontWeight: isActive ? 800 : 500,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'right',
                        width: '100%',
                        position: 'relative'
                      }}
                    >
                      {isActive && (
                        <span style={{ position: 'absolute', right: 0, top: '6px', bottom: '6px', width: '4px', borderRadius: '4px', backgroundColor: '#6366f1' }} />
                      )}
                      <span style={{ color: isActive ? '#6366f1' : '#94a3b8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', flexShrink: 0 }}>
                        {getMenuIcon(item.id)}
                      </span>
                      <span style={{ flex: 1, whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'right', lineHeight: 1.35 }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={currentUser?.name || ''}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--primary-color)',
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'normal', wordBreak: 'break-word', margin: 0, lineHeight: 1.3 }}>
                {currentUser?.name || 'عاهد العماري'}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'normal', wordBreak: 'break-word', margin: '1px 0 0 0' }}>
                {(userRole === 'employee' || userRole === 'photographer') ? 'مصور ميداني' : 'مشرف النظام'}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="تسجيل الخروج"
            onClick={() => {
              if (logoutUser) logoutUser();
              navigateTo('/login');
            }}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            title="تسجيل الخروج"
          >
            <Icons.LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
