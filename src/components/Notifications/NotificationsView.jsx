import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';

export const NotificationsView = () => {
  const { notifications, handleNotificationClick, markAllNotificationsAsRead, currentUser } = useApp();

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  const [pushStatus, setPushStatus] = useState('default'); // 'granted' | 'denied' | 'default'
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [preferences, setPreferences] = useState({
    newBooking: true,
    editBooking: true,
    dateChange: true,
    assignTask: true,
    cancelBooking: true,
    reminder: true
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPushStatus(permission);
        if (permission === 'granted') {
          alert('✅ تم تفعيل إشعارات المتصفح بنجاح على هذا الجهاز!');
        } else {
          alert('⚠️ تم رفض إذن الإشعارات من إعدادات المتصفح. يرجى تفعيلها يدوياً.');
        }
      } else {
        alert('⚠️ المتصفح الحالي لا يدعم إشعارات النظام.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubscribing(false);
    }
  };

  const togglePref = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Native Web Push Status Card */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(67, 56, 202, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%)', 
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '20px',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: pushStatus === 'granted' ? '#10b981' : '#6366f1',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icons.Smartphone size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                📱 إشعارات النظام الأصلي على الجهاز (Push Notifications)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                تصلك التنبيهات على شاشة الجوال وقفل الشاشة حتى عندما يكون الموقع أو المتصفح مغلقاً.
              </p>
            </div>
          </div>

          <div>
            {pushStatus === 'granted' ? (
              <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Icons.CheckCircle size={16} /> مفروزة ومفعلة على هذا الجهاز
              </span>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={isSubscribing}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-color)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Icons.BellRing size={16} />
                {isSubscribing ? 'جاري التفعيل...' : 'تفعيل الإشعارات على الجوال الآن'}
              </button>
            )}
          </div>
        </div>

        {/* Preferences Grid */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { id: 'newBooking', label: '☑ حجز جديد' },
            { id: 'editBooking', label: '☑ تعديل حجز' },
            { id: 'dateChange', label: '☑ تغيير موعد' },
            { id: 'assignTask', label: '☑ تعيين مهمة مصور' },
            { id: 'cancelBooking', label: '☑ إلغاء حجز' },
            { id: 'reminder', label: '☑ تذكير قبل الجلسة' }
          ].map(pref => (
            <label key={pref.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer', margin: 0 }}>
              <input 
                type="checkbox" 
                checked={preferences[pref.id]} 
                onChange={() => togglePref(pref.id)} 
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
              />
              <span>{pref.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* In-App Notifications List */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>🔔 مركز الإشعارات والتنبيهات المباشرة</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>متابعة التنبيهات المباشرة للحجوزات، المهام المسندة، وتأكيدات العملاء</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadCount > 0 && markAllNotificationsAsRead && (
            <button
              onClick={markAllNotificationsAsRead}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                padding: '6px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--primary-color)',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                cursor: 'pointer'
              }}
            >
              <Icons.CheckCheck size={16} />
              <span>تحديد الكل كـ مقروء</span>
            </button>
          )}
          <span className="badge badge-info">{unreadCount} غير مقروء</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications && notifications.map(n => (
          <div
            key={n.id}
            className="card"
            onClick={() => handleNotificationClick && handleNotificationClick(n)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              cursor: 'pointer',
              borderRight: `4px solid ${n.read ? 'var(--border-color)' : 'var(--primary-color)'}`,
              backgroundColor: n.read ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.03)',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: n.read ? 'var(--border-color)' : 'rgba(99, 102, 241, 0.15)',
                  color: n.read ? 'var(--text-muted)' : 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icons.Bell size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{n.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.message}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsView;
