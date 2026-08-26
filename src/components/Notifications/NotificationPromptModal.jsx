import React from 'react';
import { useApp } from '../../context/AppContext';
import { registerDeviceToken } from '../../utils/fcm';
import * as Icons from 'lucide-react';

export const NotificationPromptModal = () => {
  const { setActiveOverlay, currentUser } = useApp();

  const handleAccept = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Register device FCM token in Firestore
          await registerDeviceToken(currentUser);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      localStorage.setItem('star_media_notification_prompted', 'true');
      setActiveOverlay('NONE');
    }
  };

  const handleDecline = () => {
    localStorage.setItem('star_media_notification_prompted', 'true');
    setActiveOverlay('NONE');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      direction: 'rtl'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--bg-card, #1e293b)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '30px 24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        color: 'var(--text-main, #ffffff)',
        animation: 'scaleIn 0.3s ease-out'
      }}>
        {/* Animated Icon Container */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          color: 'var(--primary-color, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          position: 'relative'
        }}>
          <Icons.BellRing size={36} style={{ animation: 'swing 2s ease infinite' }} />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            border: '2px solid var(--bg-card, #1e293b)'
          }} />
        </div>

        {/* Text */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '10px' }}>🔔 تفعيل الإشعارات</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.6, marginBottom: '24px' }}>
          فعّل إشعارات الجوال والنظام لتصلك تحديثات الحجوزات والمهام الميدانية والعملاء فوراً وبشكل موثوق حتى عندما يكون التطبيق مغلقاً.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={handleAccept}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-color, #6366f1)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Icons.Check size={18} />
            <span>تفعيل الإشعارات الآن</span>
          </button>
          
          <button
            type="button"
            onClick={handleDecline}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: 'transparent',
              color: 'var(--text-muted, #94a3b8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            ليس الآن
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes swing {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(5deg); }
          40% { transform: rotate(-5deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationPromptModal;
