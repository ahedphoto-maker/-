import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Topbar } from './components/Layout/Topbar';
import { BottomNavbar } from './components/Layout/BottomNavbar';
import { UserMenuModal } from './components/Layout/UserMenuModal';
import { NotificationOverlayModal } from './components/Notifications/NotificationOverlayModal';
import { GlobalSearchModal } from './components/Common/GlobalSearchModal';
import { DashboardView } from './components/Dashboard/DashboardView';
import { FullCalendarView } from './components/Calendar/FullCalendarView';
import { BookingsView } from './components/Bookings/BookingsView';
import { BookingDetailModal } from './components/Bookings/BookingDetailModal';
import { BookingFormModal } from './components/Bookings/BookingFormModal';
import { TasksView } from './components/Tasks/TasksView';
import { PhotographerPortal } from './components/EmployeeView/PhotographerPortal';
import { ClientsView } from './components/Clients/ClientsView';
import { CompaniesView } from './components/Companies/CompaniesView';
import { ProjectsView } from './components/Projects/ProjectsView';
import { TeamView } from './components/Team/TeamView';
import { EquipmentView } from './components/Equipment/EquipmentView';
import { FinancialsView } from './components/Financials/FinancialsView';
import { NotificationsView } from './components/Notifications/NotificationsView';
import { AuditLogsView } from './components/AuditLogs/AuditLogsView';
import { SettingsView } from './components/Settings/SettingsView';
import { OperationsCenter } from './components/Operations/OperationsCenter';
import { ContractsView } from './components/Contracts/ContractsView';
import { TeamAchievements } from './components/Achievements/TeamAchievements';
import { LensFlowAI } from './components/AI/LensFlowAI';
import { BookingsMap } from './components/Map/BookingsMap';
import { LoginScreen } from './components/Auth/LoginScreen';
import { ClientPortalView } from './components/ClientPortal/ClientPortalView';
import * as Icons from 'lucide-react';

import { useRoute, navigateTo } from './routes/Router';

const MainLayout = () => {
  const {
    activeTab,
    setActiveTab,
    celebrationToast,
    userRole,
    currentUser,
    loginUser,
    activeOverlay,
    setActiveOverlay
  } = useApp();
  const [routeInfo] = useRoute();

  const isMobileOpen = activeOverlay === 'MENU';
  const setIsMobileOpen = (open) => setActiveOverlay(open ? 'MENU' : 'NONE');

  // Unauthenticated Client Portal Route Guard (Clients do not require employee/admin login)
  if (routeInfo.primaryRoute === '/client' || routeInfo.primaryRoute === '/portal') {
    return <ClientPortalView bookingId={routeInfo.queryParams?.bookingId || routeInfo.subRoute} />;
  }

  // Authentication Guard
  const isAuthenticated = !!(currentUser && currentUser.id);

  useEffect(() => {
    const savedTheme = localStorage.getItem('star_media_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    if (routeInfo.subRoute && routeInfo.subRoute !== activeTab) {
      if (setActiveTab) setActiveTab(routeInfo.subRoute);
    }
    if (setActiveOverlay) setActiveOverlay('NONE');
  }, [routeInfo.subRoute, routeInfo.fullPath]);

  // Strict employee route security guard: redirect away from any non-employee paths
  useEffect(() => {
    if (isAuthenticated && (userRole === 'employee' || userRole === 'photographer') && routeInfo.primaryRoute !== '/employee') {
      navigateTo('/employee/dashboard');
    }
  }, [isAuthenticated, userRole, routeInfo.primaryRoute]);

  // Lock body scroll when overlay is active
  useEffect(() => {
    if (activeOverlay && activeOverlay !== 'NONE') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeOverlay]);

  // Back button interception to close active overlay
  useEffect(() => {
    if (activeOverlay !== 'NONE') {
      window.history.pushState({ isOverlay: true }, '');
    }
  }, [activeOverlay]);

  useEffect(() => {
    const handlePop = () => {
      if (activeOverlay !== 'NONE' && setActiveOverlay) {
        setActiveOverlay('NONE');
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [activeOverlay, setActiveOverlay]);

  // Unauthenticated Guard
  if (!isAuthenticated || routeInfo.primaryRoute === '/login') {
    return <LoginScreen onLogin={(user) => loginUser && loginUser(user)} />;
  }

  const renderContent = () => {
    // 1. Employee Portal view (Unconditionally force for employee roles)
    if (userRole === 'employee' || userRole === 'photographer') {
      return <PhotographerPortal activeSubTab={routeInfo.subRoute || activeTab} />;
    }

    // Admins can also preview the employee portal if they explicitly navigate to it
    if (routeInfo.primaryRoute === '/employee' || routeInfo.primaryRoute === '/team' || routeInfo.primaryRoute === '/photographers') {
      return <PhotographerPortal activeSubTab={routeInfo.subRoute || activeTab} />;
    }

    // 2. Admin Views
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'operations': return <OperationsCenter />;
      case 'calendar': return <FullCalendarView />;
      case 'bookings': return <BookingsView />;
      case 'projects': return <ProjectsView />;
      case 'tasks': return <TasksView />;
      case 'contracts': return <ContractsView />;
      case 'clients': return <ClientsView />;
      case 'companies': return <CompaniesView />;
      case 'team': return <TeamView />;
      case 'achievements': return <TeamAchievements />;
      case 'equipment': return <EquipmentView />;
      case 'map': return <BookingsMap />;
      case 'invoices':
      case 'reports': return <FinancialsView />;
      case 'notifications': return <NotificationsView />;
      case 'ai': return <LensFlowAI />;
      case 'auditLogs': return <AuditLogsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="main-wrapper">
        <Topbar onOpenMobileSidebar={() => setIsMobileOpen(true)} />
        <main className="content-area">
          {renderContent()}
        </main>
      </div>
      <BottomNavbar onOpenMobileSidebar={() => setIsMobileOpen(true)} />
      
      {/* Mutually Exclusive Overlays conditionally rendered and unmounted */}
      {activeOverlay === 'SEARCH' && <GlobalSearchModal />}
      {activeOverlay === 'BOOKING_DETAIL' && <BookingDetailModal />}
      {activeOverlay === 'BOOKING' && <BookingFormModal />}
      {activeOverlay === 'NOTIFICATIONS' && <NotificationOverlayModal isOpen={true} onClose={() => setActiveOverlay && setActiveOverlay('NONE')} />}
      {activeOverlay === 'USER_MENU' && <UserMenuModal isOpen={true} onClose={() => setActiveOverlay && setActiveOverlay('NONE')} />}
      
      {celebrationToast && (
        <div className="celebration-toast" style={{ position: 'fixed', bottom: '20px', left: '20px', backgroundColor: 'var(--primary-color)', color: '#ffffff', padding: '12px 24px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 99999, boxShadow: '0 4px 14px rgba(99,102,241,0.4)', animation: 'slideIn 0.3s ease' }}>
          <Icons.Sparkles size={24} />
          <span>{celebrationToast}</span>
        </div>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("LensFlow Silent Recovery:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', color: '#ff6b6b', backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
          <div style={{ maxWidth: '600px', backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', border: '1px solid #334155', textAlign: 'center' }}>
            <h2 style={{ color: '#f43f5e', marginBottom: '16px' }}>عذراً، حدث خطأ غير متوقع في واجهة النظام</h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '24px' }}>يواجه النظام صعوبة في تحميل هذه الصفحة. يمكنك محاولة إعادة تحميل الصفحة أو إعادة تعيين البيانات المخزنة مؤقتاً.</p>
            <pre style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', color: '#fda4af', direction: 'ltr', textAlign: 'left', overflow: 'auto', fontSize: '13px', border: '1px solid #475569', marginBottom: '24px', maxHeight: '200px' }}>
              {this.state.error ? this.state.error.toString() : 'Unknown Error'}
            </pre>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                إعادة تحميل الصفحة
              </button>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: '10px 20px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                إعادة تعيين البيانات الافتراضية
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
