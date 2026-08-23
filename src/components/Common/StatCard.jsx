import React from 'react';

export const StatCard = ({ title, value, change, icon: Icon, color = 'var(--primary-color)' }) => {
  const resolveColor = (c) => {
    switch (c) {
      case 'primary': return '#6366f1'; // Hex equivalent of var(--primary-color)
      case 'secondary': return '#06b6d4'; // var(--secondary-color)
      case 'success': return '#10b981'; // var(--status-success)
      case 'warning': return '#f59e0b'; // var(--status-warning)
      case 'danger': return '#ef4444'; // var(--status-danger)
      case 'info': return '#3b82f6'; // var(--status-info)
      case 'purple': return '#8b5cf6'; // var(--status-purple)
      default: return c.startsWith('var(') ? '#6366f1' : c;
    }
  };

  const actualColor = resolveColor(color);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{title}</span>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: `${actualColor}15`,
            color: actualColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${actualColor}20`
          }}
        >
          {Icon && <Icon size={22} strokeWidth={2.5} />}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
        <h3 className="stat-card-value" style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{value}</h3>
        {change && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: change.startsWith('+') ? 'var(--status-success)' : 'var(--status-danger)',
              backgroundColor: change.startsWith('+') ? '#d1fae5' : '#fee2e2',
              padding: '2px 8px',
              borderRadius: '12px'
            }}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
