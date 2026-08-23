import React from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';

export const NotificationOverlayModal = ({ isOpen, onClose }) => {
  const { notifications, handleNotificationClick, markAllNotificationsAsRead } = useApp();

  if (!isOpen) return null;

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 800, // Matching var(--z-modal-backdrop) / var(--z-drawer)
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 16px 16px 16px'
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '100%',
          maxHeight: '80vh',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          zIndex: 900,
          animation: 'scaleUp 0.2s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-main)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.BellRing size={18} color="var(--primary-color)" />
            <h3 style={{ fontSize: '0.96rem', fontWeight: 900, margin: 0 }}>التنبيهات والإشعارات الحية</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--primary-color)',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  cursor: 'pointer'
                }}
                title="تحديد جميع التنبيهات كـ مقروءة"
              >
                <Icons.CheckCheck size={14} />
                <span>قراءة الكل</span>
              </button>
            )}
            {unreadCount > 0 && <span className="badge badge-info">{unreadCount} جديد</span>}
            <button
              onClick={onClose}
              className="btn btn-icon btn-secondary"
              style={{ width: '32px', height: '32px', padding: 0 }}
            >
              <Icons.X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '6px 0' }}>
          {(!notifications || notifications.length === 0) ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Icons.CheckCircle2 size={32} color="var(--status-success)" style={{ marginBottom: '8px' }} />
              <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>جميع الإشعارات مقروءة ✨</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  handleNotificationClick(n);
                  onClose();
                }}
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                  transition: 'background-color 0.15s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.read ? 'transparent' : 'var(--primary-color)', marginTop: '6px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.84rem', margin: 0, color: 'var(--text-main)' }}>{n.title}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>{n.time || 'الآن'}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationOverlayModal;
