import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EquipmentView } from '../Equipment/EquipmentView';
import { navigateTo } from '../../routes/Router';
import * as Icons from 'lucide-react';

export const PhotographerPortal = ({ activeSubTab }) => {
  const {
    currentUser,
    updateUserProfile,
    tasks,
    completeTask,
    updateTaskStatus,
    bookings,
    addBooking,
    clients,
    addClient,
    team,
    equipment,
    checkInLocation,
    files,
    addFile,
    deleteFile,
    logoutUser,
    activeTab,
    setActiveTab
  } = useApp();

  const currentTab = activeSubTab || activeTab || 'dashboard';

  // Modal states
  const [taskDetailModal, setTaskDetailModal] = useState(null);
  const [calendarPeriod, setCalendarPeriod] = useState('daily');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  // Live Shooting Mode State
  const [isShootingMode, setIsShootingMode] = useState(false);
  const [shootingTask, setShootingTask] = useState(null);
  const [shootingSeconds, setShootingSeconds] = useState(0);

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isDamageReportOpen, setIsDamageReportOpen] = useState(false);

  const [clientForm, setClientForm] = useState({ name: '', phone: '', email: '', company: '', type: 'فرد', notes: '' });
  const [bookingForm, setBookingForm] = useState({
    clientName: '',
    type: 'تصوير مشروع',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    location: 'الرياض',
    totalPrice: 1500,
    notes: ''
  });
  const [damageReport, setDamageReport] = useState({ notes: '' });

  // Live Shooting Mode Timer
  useEffect(() => {
    let interval = null;
    if (isShootingMode) {
      interval = setInterval(() => {
        setShootingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isShootingMode]);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const safeUser = currentUser || {
    id: 1,
    name: 'عاهد العماري',
    role: 'مصور فريلانسر / منظم حجوزاتي العهد ستار 👑',
    phone: '+966 50 123 4567',
    email: 'ahdalamary@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  };

  const userNameFirstName = (safeUser.name || 'عاهد').split(' ')[0];

  // Filter tasks assigned to employee
  const myTasks = (tasks || []).filter(t => {
    if (!t) return false;
    const matchId = t.assigneeId === safeUser.id;
    const matchName = t.assigneeName ? t.assigneeName.includes(userNameFirstName) : false;
    return matchId || matchName;
  });

  const todayFocusTask = myTasks.find(t => t.status !== 'مكتملة') || myTasks[0];
  const focusBooking = todayFocusTask ? (bookings || []).find(b => b.id === todayFocusTask.bookingId) : null;

  const filteredTasks = myTasks.filter(t => {
    if (taskStatusFilter === 'new') return t.status === 'لم تبدأ';
    if (taskStatusFilter === 'active') return t.status === 'في الطريق' || t.status === 'وصلت' || t.status === 'قيد التنفيذ';
    if (taskStatusFilter === 'completed') return t.status === 'مكتملة';
    return true;
  });

  const completedCount = myTasks.filter(t => t.status === 'مكتملة').length;
  const totalTasksCount = myTasks.length;
  const completionPercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  const myBookings = (bookings || []).filter(b => {
    if (!b) return false;
    return (
      b.teamMemberIds?.includes(safeUser.id) ||
      myTasks.some(t => t.bookingId === b.id)
    );
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const calendarBookings = myBookings.filter(b => {
    if (calendarPeriod === 'daily') return b.date === todayStr;
    return true;
  });

  const handleStateTransition = (task, nextState) => {
    if (!task) return;
    if (nextState === 'في الطريق') {
      checkInLocation && checkInLocation(task.id, 'heading');
      updateTaskStatus && updateTaskStatus(task.id, 'في الطريق', 25);
    } else if (nextState === 'وصلت') {
      checkInLocation && checkInLocation(task.id, 'arrived');
      updateTaskStatus && updateTaskStatus(task.id, 'وصلت', 50);
    } else if (nextState === 'قيد التنفيذ') {
      updateTaskStatus && updateTaskStatus(task.id, 'قيد التنفيذ', 75);
    } else if (nextState === 'مكتملة') {
      completeTask && completeTask(task.id);
      if (isShootingMode && shootingTask?.id === task.id) {
        setIsShootingMode(false);
      }
    } else {
      updateTaskStatus && updateTaskStatus(task.id, nextState, 10);
    }

    if (taskDetailModal && taskDetailModal.id === task.id) {
      setTaskDetailModal({ ...taskDetailModal, status: nextState });
    }
  };

  const startShootingMode = (task) => {
    if (!task) return;
    setShootingTask(task);
    setShootingSeconds(0);
    setIsShootingMode(true);
    if (task.status !== 'قيد التنفيذ') {
      handleStateTransition(task, 'قيد التنفيذ');
    }
  };

  const handleTabChange = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    navigateTo(`/employee/${tabId}`);
  };

  const handleAddClientSubmit = (e) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.phone) {
      alert('الرجاء إدخال اسم العميل ورقم الجوال.');
      return;
    }
    addClient && addClient(clientForm);
    setIsAddClientOpen(false);
    setClientForm({ name: '', phone: '', email: '', company: '', type: 'فرد', notes: '' });
    alert('🎉 تم إضافة العميل وتزامنه بنجاح!');
  };

  const handleAddBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.clientName) {
      alert('الرجاء إدخال اسم العميل أو المشروع.');
      return;
    }
    addBooking && addBooking({
      clientName: bookingForm.clientName,
      title: `${bookingForm.type} — ${bookingForm.clientName}`,
      serviceType: bookingForm.type,
      date: bookingForm.date,
      time: bookingForm.time,
      location: bookingForm.location,
      totalPrice: Number(bookingForm.totalPrice) || 1500,
      notes: bookingForm.notes,
      teamMemberIds: [currentUser?.id || 1],
      createdBy: currentUser?.name || 'مصور الميدان'
    });
    setIsAddBookingOpen(false);
    setBookingForm({ clientName: '', type: 'تصوير مشروع', date: new Date().toISOString().split('T')[0], time: '16:00', location: 'الرياض', totalPrice: 1500, notes: '' });
    alert('📅 تم تسجيل الحجز وتزامنه فوراً مع السيرفر!');
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', padding: '0 8px 80px 8px', overflowX: 'hidden' }}>

      {/* 🌟 LIVE SHOOTING MODE OVERLAY 📸 */}
      {isShootingMode && shootingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0a0f1d',
          color: '#ffffff',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 20px',
          backdropFilter: 'blur(12px)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#f87171' }}>
                📸 وضع التصوير الميداني
              </span>
            </div>
            <button
              onClick={() => setIsShootingMode(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icons.X size={20} />
            </button>
          </div>

          {/* Center Timer & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', margin: 'auto 0' }}>
            <div style={{
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '2px solid rgba(99, 102, 241, 0.6)',
              borderRadius: '24px',
              padding: '20px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>⏱️ مدة التصوير الحالية:</span>
              <span style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'monospace', color: '#818cf8', marginTop: '4px' }}>
                {formatTimer(shootingSeconds)}
              </span>
            </div>

            <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800 }}>📌 المهمة الحالية</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '6px 0', color: '#ffffff' }}>{shootingTask.title}</h2>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>العميل: {focusBooking?.clientName || 'مشروع ميداني'}</p>
            </div>
          </div>

          {/* Operational Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <button
              onClick={() => {
                handleStateTransition(shootingTask, 'وصلت');
              }}
              style={{
                padding: '14px 8px',
                borderRadius: '14px',
                backgroundColor: shootingTask.status === 'وصلت' ? 'var(--status-warning)' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Icons.MapPin size={18} />
              <span>📍 وصلت</span>
            </button>
            <button
              onClick={() => {
                handleStateTransition(shootingTask, 'قيد التنفيذ');
              }}
              style={{
                padding: '14px 8px',
                borderRadius: '14px',
                backgroundColor: shootingTask.status === 'قيد التنفيذ' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Icons.Camera size={18} />
              <span>🎥 بدأت</span>
            </button>
            <button
              onClick={() => {
                handleStateTransition(shootingTask, 'مكتملة');
                setIsShootingMode(false);
              }}
              style={{
                padding: '14px 8px',
                borderRadius: '14px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Icons.CheckCircle size={18} />
              <span>✅ انتهيت</span>
            </button>
          </div>
        </div>
      )}

      {/* Back Button for Sub-Tabs */}
      {currentTab !== 'dashboard' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <button
            onClick={() => handleTabChange('dashboard')}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '20px', gap: '6px', fontWeight: 800, fontSize: '0.8rem' }}
          >
            <Icons.ArrowRight size={16} />
            <span>العودة للرئيسية 🏠</span>
          </button>
          <button
            onClick={() => {
              if (logoutUser) logoutUser();
              navigateTo('/login');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
              fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer'
            }}
          >
            <Icons.LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}

      {/* 🌟 VIEW 1: MAIN EMPLOYEE DASHBOARD */}
      {(currentTab === 'dashboard' || !currentTab) && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                ⚡ لوحة الموظف الميداني
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--primary-color)', fontWeight: 800 }}>
                مرحباً بك، {safeUser.name} 👋
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '12px'
            }}>
              {/* 1. 📋 مهامي */}
              <div
                onClick={() => handleTabChange('tasks')}
                style={{
                  padding: '16px 12px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.CheckSquare size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-main)' }}>📋 مهامي</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700 }}>{myTasks.length} مهام مسندة</div>
                </div>
              </div>

              {/* 2. 📅 التقويم */}
              <div
                onClick={() => handleTabChange('bookings')}
                style={{
                  padding: '16px 12px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.CalendarRange size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-main)' }}>📅 التقويم</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700 }}>الجدول وحجوزاتي</div>
                </div>
              </div>

              {/* 3. 📷 معداتي */}
              <div
                onClick={() => handleTabChange('equipment')}
                style={{
                  padding: '16px 12px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Camera size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-main)' }}>📷 معداتي</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700 }}>العهد والاستلام</div>
                </div>
              </div>

              {/* 4. 📊 إنجازاتي */}
              <div
                onClick={() => handleTabChange('achievements')}
                style={{
                  padding: '16px 12px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Award size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-main)' }}>📊 إنجازاتي</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700 }}>{completionPercent}% إتمام الكلي</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🌟 VIEW 2: TASKS TAB */}
      {currentTab === 'tasks' && (
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.CheckSquare size={20} color="var(--primary-color)" />
              <span>📋 قائمة المهام المسندة ({myTasks.length})</span>
            </h3>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'new', label: 'الجديدة' },
                { id: 'active', label: 'الحالية' },
                { id: 'completed', label: 'المكتملة' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTaskStatusFilter(f.id)}
                  className={`btn ${taskStatusFilter === f.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTasks.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد مهام تطابق هذا التصفية</p>
            ) : (
              filteredTasks.map(t => (
                <div key={t.id} style={{ padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 900, margin: 0 }}>{t.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>{t.description}</p>
                    </div>
                    <span className={`badge ${t.status === 'مكتملة' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📅 {t.dueDate || 'اليوم'}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setTaskDetailModal(t)}>
                      عرض المهمة ↗
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 🌟 VIEW 3: CALENDAR & BOOKINGS TAB */}
      {currentTab === 'bookings' && (
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.CalendarRange size={20} color="var(--primary-color)" />
              <span>📅 جدول الحجوزات والمهام</span>
            </h3>
            <span className="badge badge-info">{calendarBookings.length} تغطية</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {calendarBookings.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>لا توجد حجوزات مسندة في هذه الفترة</p>
            ) : (
              calendarBookings.map(b => (
                <div key={b.id} style={{ padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary-color)', fontWeight: 800 }}>{b.serviceType || 'تصوير مشروع'}</span>
                      <h4 style={{ fontSize: '0.94rem', fontWeight: 900, margin: '2px 0' }}>{b.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>العميل: {b.clientName}</p>
                    </div>
                    <span className="badge badge-info">{b.date}</span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>⏰ الموعد: <strong>{b.startTime || '16:00'} - {b.endTime || '20:00'}</strong></div>
                    <div>📍 الموقع: <strong>{b.location || 'الرياض'}</strong></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 🌟 VIEW 4: EQUIPMENT TAB */}
      {currentTab === 'equipment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Camera size={20} color="#8b5cf6" />
                <span>📷 العهد والمعدات المتاحة</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>تسجيل استلام وتسليم عهد التصوير</p>
            </div>

            <button
              onClick={() => setIsDamageReportOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 800, gap: '6px' }}
            >
              <Icons.AlertTriangle size={16} />
              <span>إبلاغ عن تلف عهدة</span>
            </button>
          </div>

          <EquipmentView />
        </div>
      )}

      {/* 🌟 VIEW 5: ACHIEVEMENTS TAB */}
      {currentTab === 'achievements' && (
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Icons.Award size={20} color="#14b8a6" />
            <span>📊 إنجازاتي وإحصائيات الأداء</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#ffffff', padding: '20px', borderRadius: '14px', border: 'none' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.9 }}>نسبة الإنجاز الكلية:</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, margin: '4px 0', color: '#ffffff' }}>{completionPercent}%</div>

              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${completionPercent}%`, height: '100%', backgroundColor: '#ffffff', transition: 'width 0.4s ease' }} />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '0.8rem', color: '#ffffff' }}>
                <div>📌 المهام المكتملة: <strong>{completedCount}</strong></div>
                <div>📋 إجمالي التكاليف: <strong>{totalTasksCount}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 DEDICATED TASK DETAIL MODAL */}
      {taskDetailModal && (
        <div className="modal-backdrop" onClick={() => setTaskDetailModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', borderRadius: '20px' }}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 800 }}>📌 تفاصيل المهمة الميدانية</span>
                <h3 className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 900, marginTop: '2px' }}>{taskDetailModal.title}</h3>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setTaskDetailModal(null)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                <div>👤 العميل: <strong>{focusBooking?.clientName || 'الاستوديو'}</strong></div>
                <div>🎥 نوع التصوير: <strong>{focusBooking?.serviceType || 'تصوير مشروع'}</strong></div>
                <div>⏰ التاريخ والوقت: <strong>{taskDetailModal.dueDate || 'اليوم'}</strong></div>
                <div>📍 الموقع: <strong>{focusBooking?.location || 'الرياض'}</strong></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--text-main)' }}>شريط حالة المهمة:</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { state: 'في الطريق', label: 'في الطريق' },
                    { state: 'وصلت', label: 'وصلت' },
                    { state: 'قيد التنفيذ', label: 'قيد التنفيذ' },
                    { state: 'مكتملة', label: 'مكتملة ✓' }
                  ].map(s => (
                    <button
                      key={s.state}
                      onClick={() => handleStateTransition(taskDetailModal, s.state)}
                      className={`btn ${taskDetailModal.status === s.state ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      style={{ flex: 1, fontSize: '0.72rem', padding: '6px 4px', minHeight: '38px' }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setTaskDetailModal(null);
                  startShootingMode(taskDetailModal);
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: 900, borderRadius: '12px', gap: '8px', fontSize: '0.9rem', backgroundColor: '#10b981', color: '#fff', border: 'none' }}
              >
                <Icons.Camera size={18} />
                <span>📸 بدء التصوير الميداني</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Popup */}
      {isActionSheetOpen && (
        <div className="modal-backdrop" onClick={() => setIsActionSheetOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px', borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>⚡ إضافة سريعة</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setIsActionSheetOpen(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsAddClientOpen(true);
                }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', gap: '10px', padding: '12px', fontWeight: 800, minHeight: '44px' }}
              >
                <Icons.UserPlus size={18} color="#f59e0b" />
                <span>إضافة عميل جديد</span>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsAddBookingOpen(true);
                }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', gap: '10px', padding: '12px', fontWeight: 800, minHeight: '44px' }}
              >
                <Icons.CalendarPlus size={18} color="#10b981" />
                <span>تسجيل حجز / مهمة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Damage Report Modal */}
      {isDamageReportOpen && (
        <div className="modal-backdrop" onClick={() => setIsDamageReportOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🚨 الإبلاغ عن تلف عهدة</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setIsDamageReportOpen(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea className="form-control" rows="3" placeholder="تفاصيل العيب أو التلف..." value={damageReport.notes} onChange={e => setDamageReport({ notes: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDamageReportOpen(false)}>إلغاء</button>
              <button className="btn btn-danger" onClick={() => { alert('🚨 تم إرسال البلاغ بنجاح للمشرف!'); setIsDamageReportOpen(false); }} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}>إرسال البلاغ</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditProfileOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ بيانات البروفايل الشخصي</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setIsEditProfileOpen(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">الاسم</label>
                <input type="text" className="form-control" value={safeUser.name} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">الوظيفة واللقب</label>
                <input type="text" className="form-control" value={safeUser.role} readOnly />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsEditProfileOpen(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddClientOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddClientOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">👥 إضافة عميل جديد</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setIsAddClientOpen(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddClientSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">الاسم *</label>
                  <input type="text" className="form-control" required value={clientForm.name} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الجوال *</label>
                  <input type="text" className="form-control" required value={clientForm.phone} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddClientOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ العميل</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {isAddBookingOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddBookingOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📅 تسجيل حجز / تغطية جديدة</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setIsAddBookingOpen(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddBookingSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">اسم العميل / المشروع *</label>
                  <input type="text" className="form-control" required value={bookingForm.clientName} onChange={e => setBookingForm({ ...bookingForm, clientName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع التغطية</label>
                  <select className="form-control" value={bookingForm.type} onChange={e => setBookingForm({ ...bookingForm, type: e.target.value })}>
                    <option value="تصوير مشروع">تصوير مشروع</option>
                    <option value="بورتريه">بورتريه</option>
                    <option value="فعالية">فعالية</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">التاريخ</label>
                    <input type="date" className="form-control" value={bookingForm.date} onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">التوقيت</label>
                    <input type="time" className="form-control" value={bookingForm.time} onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddBookingOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الحجز</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM NAVIGATION BAR FOR MOBILE */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        maxWidth: '480px',
        margin: '0 auto'
      }}>
        <div onClick={() => handleTabChange('dashboard')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', color: currentTab === 'dashboard' ? 'var(--primary-color)' : 'var(--text-muted)' }}>
          <Icons.Home size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>الرئيسية</span>
        </div>

        <div onClick={() => handleTabChange('tasks')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', color: currentTab === 'tasks' ? 'var(--primary-color)' : 'var(--text-muted)' }}>
          <Icons.CheckSquare size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>مهامي</span>
        </div>

        <div onClick={() => setIsActionSheetOpen(true)} style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(99, 102, 241, 0.4)', cursor: 'pointer', marginTop: '-24px', border: '4px solid var(--bg-card)' }}>
          <Icons.Plus size={22} />
        </div>

        <div onClick={() => handleTabChange('bookings')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', color: currentTab === 'bookings' ? 'var(--primary-color)' : 'var(--text-muted)' }}>
          <Icons.Calendar size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>التقويم</span>
        </div>

        <div onClick={() => setIsEditProfileOpen(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <Icons.User size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>الملف</span>
        </div>
      </div>
    </div>
  );
};

export default PhotographerPortal;
