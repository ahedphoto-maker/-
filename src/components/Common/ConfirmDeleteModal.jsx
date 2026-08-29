import React from 'react';
import * as Icons from 'lucide-react';

/**
 * ConfirmDeleteModal — نافذة تأكيد الحذف المركزية
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onConfirm: () => Promise<void>
 *  - title: string
 *  - description: string
 *  - itemDetails: { label, value }[]   ← تفاصيل العنصر (رقم الحجز، اسم العميل...)
 *  - warnings: string[]               ← تحذيرات (مثل: لديه 3 حجوزات مرتبطة)
 *  - confirmLabel: string             ← نص زر التأكيد (افتراضي: "حذف")
 *  - confirmVariant: 'danger'|'warning' ← لون التأكيد
 *  - isLoading: boolean
 *  - errorMsg: string
 */
export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الحذف',
  description,
  itemDetails = [],
  warnings = [],
  confirmLabel = 'حذف',
  confirmVariant = 'danger',
  isLoading = false,
  errorMsg = '',
  children
}) => {
  if (!isOpen) return null;

  const confirmBg = confirmVariant === 'warning'
    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)';

  const confirmHover = confirmVariant === 'warning' ? '#b45309' : '#b91c1c';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={!isLoading ? onClose : undefined}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9990,
          animation: 'fadeIn 0.18s ease'
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cdm-title"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: 'min(480px, calc(100vw - 32px))',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color)',
          direction: 'rtl',
          animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden'
        }}
      >
        {/* Header strip */}
        <div style={{
          background: confirmBg,
          padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icons.Trash2 size={20} color="#fff" />
          </div>
          <h2 id="cdm-title" style={{
            margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 800
          }}>
            {title}
          </h2>

          <button
            onClick={!isLoading ? onClose : undefined}
            disabled={isLoading}
            style={{
              marginRight: 'auto',
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          >
            <Icons.X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Description */}
          {description && (
            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {description}
            </p>
          )}

          {/* Item Details */}
          {itemDetails.length > 0 && (
            <div style={{
              backgroundColor: 'var(--bg-main)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              {itemDetails.map((d, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom: i < itemDetails.length - 1 ? '1px solid var(--border-color)' : 'none',
                  gap: '8px'
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{d.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'left', direction: 'ltr' }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                <Icons.AlertTriangle size={15} color="#f59e0b" />
                <span style={{ color: '#f59e0b', fontSize: '0.82rem', fontWeight: 700 }}>تحذير</span>
              </div>
              {warnings.map((w, i) => (
                <p key={i} style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Custom Content / Children */}
          {children}

          {/* Error */}
          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex', gap: '8px', alignItems: 'flex-start'
            }}>
              <Icons.AlertCircle size={15} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: '#ef4444', fontSize: '0.82rem' }}>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px 20px',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
          borderTop: '1px solid var(--border-color)'
        }}>
          {/* Cancel */}
          <button
            onClick={!isLoading ? onClose : undefined}
            disabled={isLoading}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              fontSize: '0.88rem', fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
          >
            إلغاء
          </button>

          {/* Confirm */}
          <button
            id="cdm-confirm-btn"
            onClick={!isLoading ? onConfirm : undefined}
            disabled={isLoading}
            style={{
              padding: '10px 24px', borderRadius: '10px',
              border: 'none',
              background: isLoading ? '#9ca3af' : confirmBg,
              color: '#fff',
              fontSize: '0.88rem', fontWeight: 800,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'all 0.15s',
              minWidth: '100px', justifyContent: 'center'
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.filter = 'brightness(0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
          >
            {isLoading ? (
              <>
                <span style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite'
                }} />
                جارٍ التنفيذ...
              </>
            ) : (
              <>
                <Icons.Trash2 size={14} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUpModal {
          from { opacity:0; transform: translate(-50%, calc(-50% + 24px)); }
          to   { opacity:1; transform: translate(-50%, -50%); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default ConfirmDeleteModal;
