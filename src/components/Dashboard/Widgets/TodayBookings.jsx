import React, { memo } from 'react';
import { StatusBadge } from '../../Common/StatusBadge';
import * as Icons from 'lucide-react';
import { formatTime12h } from '../../../utils/helpers';

export const TodayBookings = memo(({ todayBookings, onSelectBooking }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Calendar size={18} color="var(--primary-color)" />
          <span>حجوزات اليوم والتغطيات المباشرة 📅</span>
        </h3>
        <span className="badge badge-primary">{todayBookings.length} حجوزات</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {todayBookings.map((b) => (
          <div
            key={b.id}
            onClick={() => onSelectBooking(b)}
            style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{b.title}</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                👤 {b.clientName} | 📍 {b.location || 'الرياض'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <StatusBadge status={b.status} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                ⏰ {b.isAllDay ? 'طوال اليوم' : (b.startTime === 'صباحًا' || b.startTime === 'مساءً' ? b.startTime : `${formatTime12h(b.startTime)} - ${formatTime12h(b.endTime)}`)}{b.attendanceTime && ` (حضور: ${b.attendanceTime})`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

TodayBookings.displayName = 'TodayBookings';
export default TodayBookings;
