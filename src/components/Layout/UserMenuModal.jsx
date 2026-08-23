import React from 'react';
import { useApp } from '../../context/AppContext';
import { navigateTo } from '../../routes/Router';
import * as Icons from 'lucide-react';

export const UserMenuModal = ({ isOpen, onClose }) => {
  const { currentUser, logoutUser, setActiveTab } = useApp();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* User Card Header */}
        <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt=""
            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)', margin: '0 auto 12px auto' }}
          />
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            {currentUser?.name || 'عاهد العماري'}
          </h3>
          <span className="badge badge-info" style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 800 }}>
            {currentUser?.role?.includes('المشرف') || currentUser?.isSupervisor ? 'مدير النظام' : 'عضو فريق'}
          </span>
        </div>

        {/* Menu Items */}
        <div style={{ padding: '8px' }}>
          <button
            onClick={() => {
              setActiveTab('settings');
              navigateTo('/admin/settings');
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'right',
              transition: 'background-color 0.2s'
            }}
            className="dropdown-item-btn"
          >
            <Icons.Settings size={16} color="var(--text-muted)" />
            <span>الإعدادات والنسخ</span>
          </button>

          <button
            onClick={() => {
              logoutUser();
              navigateTo('/login');
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--status-danger)',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'right',
              transition: 'background-color 0.2s'
            }}
            className="dropdown-item-btn"
          >
            <Icons.LogOut size={16} color="var(--status-danger)" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* Close Button */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.82rem', fontWeight: 800 }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserMenuModal;
