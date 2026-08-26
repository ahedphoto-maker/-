import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import * as Icons from 'lucide-react';
import { navigateTo } from '../../routes/Router';
import { formatBookingNumber, formatTime12h } from '../../utils/helpers';

export const FullCalendarView = () => {
  const { bookings, setSelectedBooking, setIsBookingDetailOpen, setIsBookingFormOpen, openBookingFormWithDate } = useApp();

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const parseQueryFromHash = () => {
    const hash = window.location.hash;
    const parts = hash.split('?');
    const queryPart = parts[1] || '';
    const params = {};
    if (queryPart) {
      queryPart.split('&').forEach(pair => {
        const [key, val] = pair.split('=');
        if (key) params[key] = decodeURIComponent(val || '');
      });
    }
    return params;
  };

  const queryParams = parseQueryFromHash();

  const [currentYear, setCurrentYear] = useState(() => {
    const y = parseInt(queryParams.year, 10);
    return y >= 2026 && y <= 2050 ? y : 2026;
  });

  const [monthIndex, setMonthIndex] = useState(() => {
    const m = parseInt(queryParams.month, 10);
    return m >= 0 && m <= 11 ? m : new Date().getMonth();
  });

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedDateStr, setSelectedDateStr] = useState(() => getTodayDateStr());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'

  useEffect(() => {
    navigateTo(`/admin/calendar?year=${currentYear}&month=${monthIndex}`);
  }, [currentYear, monthIndex]);

  useEffect(() => {
    const handleHashChange = () => {
      const q = parseQueryFromHash();
      const y = parseInt(q.year, 10);
      const m = parseInt(q.month, 10);
      if (y >= 2026 && y <= 2050) setCurrentYear(y);
      if (m >= 0 && m <= 11) setMonthIndex(m);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const monthsNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const getDayLabel = (day) => {
    if (!isMobile) return day;
    switch (day) {
      case 'الأحد': return 'أحد';
      case 'الإثنين': return 'إثن';
      case 'الثلاثاء': return 'ثلا';
      case 'الأربعاء': return 'أرب';
      case 'الخميس': return 'خمي';
      case 'الجمعة': return 'جمع';
      case 'السبت': return 'سبت';
      default: return day;
    }
  };

  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      if (currentYear > 2026) {
        setCurrentYear(currentYear - 1);
        setMonthIndex(11);
      }
    } else {
      setMonthIndex(monthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      if (currentYear < 2050) {
        setCurrentYear(currentYear + 1);
        setMonthIndex(0);
      }
    } else {
      setMonthIndex(monthIndex + 1);
    }
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value, 10);
    if (year >= 2026 && year <= 2050) {
      setCurrentYear(year);
      setMonthIndex(0);
    }
  };

  const isBookingOnDate = (booking, dateStr) => {
    if (!booking) return false;
    const start = booking.startDate || booking.date;
    const end = booking.endDate || booking.date || start;
    return dateStr >= start && dateStr <= end;
  };

  const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
  const startOffset = new Date(currentYear, monthIndex, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push({ isEmpty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayBookings = (bookings || []).filter(b => isBookingOnDate(b, dateStr));
    calendarDays.push({
      isEmpty: false,
      dayNum: d,
      dateStr,
      dayBookings
    });
  }

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'تصوير حفلات': return '#10b981';
      case 'تصوير منتج': return '#8b5cf6';
      case 'تصوير عقار': return '#06b6d4';
      case 'مؤتمر': return '#f59e0b';
      case 'تصوير إعلاني': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getBookingBarStyle = (b, dateStr) => {
    const color = getCategoryColor(b.category);
    const start = b.startDate || b.date;
    const end = b.endDate || b.date || start;
    
    const isStart = dateStr === start;
    const isEnd = dateStr === end;
    const isMulti = start !== end;
    
    if (!isMulti) {
      return {
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: `${color}15`,
        borderRight: `2px solid ${color}`,
        fontSize: '0.68rem',
        fontWeight: 700,
        color: color,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        width: '100%',
        boxSizing: 'border-box'
      };
    }
    
    return {
      padding: '2px 6px',
      backgroundColor: `${color}15`,
      borderRight: isStart ? `3.5px solid ${color}` : 'none',
      borderLeft: isEnd ? `3.5px solid ${color}` : 'none',
      borderRadius: isStart ? '0 4px 4px 0' : (isEnd ? '4px 0 0 4px' : '0'),
      fontSize: '0.68rem',
      fontWeight: 700,
      color: color,
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      width: '100%',
      boxSizing: 'border-box',
      margin: '1px 0'
    };
  };

  const handleDaySelect = (day) => {
    if (!day.isEmpty) {
      setSelectedDateStr(day.dateStr);
    }
  };

  const selectedDayBookings = (bookings || []).filter(b => isBookingOnDate(b, selectedDateStr));

  const getWeekDays = () => {
    const list = [];
    const baseDate = new Date(selectedDateStr);
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + i);
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      const dayBookings = (bookings || []).filter(b => isBookingOnDate(b, dateStr));
      list.push({
        dateStr,
        dayNum: targetDate.getDate(),
        dayName: daysOfWeek[targetDate.getDay()],
        dayBookings
      });
    }
    return list;
  };

  const hoursOfDay = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Calendar Navigation */}
      <div className="card" style={{ padding: isMobile ? '12px' : '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, minWidth: isMobile ? 'auto' : '140px' }}>
              {monthsNames[monthIndex]} <span lang="en">{currentYear}</span>
            </h2>

            <div style={{ display: 'flex', gap: '2px' }}>
              <button onClick={handlePrevMonth} className="btn btn-secondary btn-icon" title="الشهر السابق" style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.ChevronRight size={16} strokeWidth={2.2} />
              </button>
              <button onClick={handleNextMonth} className="btn btn-secondary btn-icon" title="الشهر التالي" style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.ChevronLeft size={16} strokeWidth={2.2} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-main)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <Icons.CalendarDays size={12} color="var(--text-muted)" />
              <select
                value={currentYear}
                onChange={handleYearChange}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: 0
                }}
              >
                {Array.from({ length: 25 }, (_, i) => 2026 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-color)' }}>
              {['month', 'week', 'day'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: isMobile ? '4px 8px' : '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: viewMode === mode ? 'var(--bg-card)' : 'transparent',
                    color: viewMode === mode ? 'var(--primary-color)' : 'var(--text-muted)',
                    fontWeight: viewMode === mode ? 800 : 500,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {mode === 'month' ? 'شهر' : mode === 'week' ? 'أسبوع' : 'يوم'}
                </button>
              ))}
            </div>

            <button onClick={() => openBookingFormWithDate && openBookingFormWithDate(selectedDateStr)} className="btn btn-primary btn-sm" style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>
              <Icons.Plus size={14} strokeWidth={2.5} />
              <span>{isMobile ? 'حجز' : 'حجز جديد'}</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.72rem', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#10b981' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} /> حفلات</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#8b5cf6' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} /> منتجات</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#06b6d4' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06b6d4' }} /> عقارات</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#f59e0b' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> مؤتمرات</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#ef4444' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> إعلاني</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', width: '100%' }}>
        
        {/* Calendar Grid Box */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}>
          
          {/* VIEW: MONTH */}
          {viewMode === 'month' && (
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  backgroundColor: 'var(--border-color)',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: isMobile ? '0.72rem' : '0.82rem',
                  color: 'var(--text-muted)',
                  padding: isMobile ? '8px 0' : '10px 0',
                  gap: '1px'
                }}
              >
                {daysOfWeek.map(day => (
                  <div key={day}>{getDayLabel(day)}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--border-color)', width: '100%' }}>
                {calendarDays.map((day, idx) => {
                  if (day.isEmpty) {
                    return <div key={`empty-${idx}`} style={{ backgroundColor: 'var(--bg-main)', aspectRatio: isMobile ? '1 / 1' : '1.45 / 1' }} />;
                  }

                  const isSelected = day.dateStr === selectedDateStr;
                  const isToday = day.dateStr === getTodayDateStr();

                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => handleDaySelect(day)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : (isToday ? 'rgba(6, 182, 212, 0.04)' : 'var(--bg-card)'),
                        border: isSelected ? '2px solid var(--primary-color)' : 'none',
                        aspectRatio: isMobile ? '1 / 1' : '1.45 / 1',
                        padding: isMobile ? '4px' : '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                        position: 'relative',
                        minHeight: isMobile ? '42px' : 'auto'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span
                          style={{
                            fontSize: isMobile ? '0.75rem' : '0.88rem',
                            fontWeight: isToday || isSelected ? 900 : 500,
                            width: isMobile ? '20px' : '24px',
                            height: isMobile ? '20px' : '24px',
                            borderRadius: '50%',
                            backgroundColor: isToday ? 'var(--secondary-color)' : (isSelected ? 'var(--primary-color)' : 'transparent'),
                            color: isToday || isSelected ? '#ffffff' : 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {day.dayNum}
                        </span>

                        {!isMobile && day.dayBookings.length > 0 && (
                          <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                            {day.dayBookings.length}
                          </span>
                        )}
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'row' : 'column', 
                        gap: '2px', 
                        flexWrap: 'wrap',
                        justifyContent: isMobile ? 'center' : 'flex-start',
                        alignItems: 'center',
                        marginTop: '2px',
                        overflow: 'hidden',
                        width: '100%',
                        flex: 1
                      }}>
                        {isMobile ? (
                          day.dayBookings.slice(0, 3).map(b => (
                            <span 
                              key={b.id} 
                              style={{ 
                                width: '5px', 
                                height: '5px', 
                                borderRadius: '50%', 
                                backgroundColor: getCategoryColor(b.category),
                                display: 'inline-block',
                                flexShrink: 0
                              }} 
                              title={b.title}
                            />
                          ))
                        ) : (
                          <>
                            {day.dayBookings.slice(0, 2).map(b => (
                              <div
                                key={b.id}
                                style={getBookingBarStyle(b, day.dateStr)}
                                title={b.title}
                              >
                                {b.title}
                              </div>
                            ))}
                            {day.dayBookings.length > 2 && (
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', alignSelf: 'center' }}>+{day.dayBookings.length - 2} المزيد</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: WEEK */}
          {viewMode === 'week' && (
            <div style={{ padding: isMobile ? '10px' : '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                {getWeekDays().map((day) => (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: day.dateStr === selectedDateStr ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: day.dateStr === selectedDateStr ? 'rgba(99,102,241,0.03)' : 'var(--bg-card)',
                      minHeight: isMobile ? '120px' : '180px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{day.dayName}</span>
                      <span style={{ fontWeight: 950, color: 'var(--primary-color)', fontSize: '0.88rem' }}>{day.dayNum}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {day.dayBookings.length === 0 ? (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.6 }}>لا يوجد</span>
                      ) : (
                        day.dayBookings.map(b => (
                          <div
                            key={b.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); setIsBookingDetailOpen(true); }}
                            style={{
                              padding: '4px',
                              borderRadius: '4px',
                              backgroundColor: `${getCategoryColor(b.category)}12`,
                              borderRight: `2px solid ${getCategoryColor(b.category)}`,
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: getCategoryColor(b.category), whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>{b.title}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: DAY */}
          {viewMode === 'day' && (
            <div style={{ padding: isMobile ? '10px' : '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hoursOfDay.map(hour => {
                  const hourBookings = (bookings || []).filter(b => {
                    if (!isBookingOnDate(b, selectedDateStr)) return false;
                    if (b.startTime === 'صباحًا' || b.startTime === 'طوال اليوم') return hour === '09:00';
                    if (b.startTime === 'مساءً') return hour === '17:00';
                    return b.startTime === hour || (b.startTime && b.startTime.startsWith(hour.slice(0, 2)));
                  });
                  return (
                    <div key={hour} style={{ display: 'flex', gap: isMobile ? '8px' : '16px', alignItems: 'center', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                      <div style={{ width: '45px', fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.78rem', textAlign: 'center' }}>
                        {formatTime12h(hour)}
                      </div>
                      <div style={{ flex: 1, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {hourBookings.length === 0 ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.5 }}>متاح</span>
                        ) : (
                          hourBookings.map(b => (
                            <div
                              key={b.id}
                              onClick={() => { setSelectedBooking(b); setIsBookingDetailOpen(true); }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: `${getCategoryColor(b.category)}15`,
                                border: `1px solid ${getCategoryColor(b.category)}`,
                                color: getCategoryColor(b.category),
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                cursor: 'pointer'
                              }}
                            >
                              {b.title}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Day Bookings Detail Section */}
        <div className="card" style={{ padding: isMobile ? '12px' : '20px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: isMobile ? '0.88rem' : '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Icons.CalendarCheck size={16} color="var(--primary-color)" />
              <span>حجوزات يوم {selectedDateStr}</span>
            </h3>
            <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>{selectedDayBookings.length} حجوزات</span>
          </div>

          {selectedDayBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)' }}>
              <Icons.CalendarOff size={30} style={{ opacity: 0.3, marginBottom: '6px' }} />
              <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>لا توجد حجوزات مسجلة لهذا اليوم.</p>
              <button
                onClick={() => openBookingFormWithDate && openBookingFormWithDate(selectedDateStr)}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '10px', padding: '6px 12px', fontSize: '0.74rem' }}
              >
                + إضافة حجز لهذا اليوم
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', width: '100%' }}>
              {selectedDayBookings.map(b => (
                <div
                  key={b.id}
                  onClick={() => { setSelectedBooking(b); setIsBookingDetailOpen(true); }}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{b.bookingNumber ? formatBookingNumber(b.bookingNumber) : `#${b.id}`}</span>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)', margin: 0 }}>{b.title}</h4>
                    </div>
                    <span className="badge" style={{ backgroundColor: `${getCategoryColor(b.category)}15`, color: getCategoryColor(b.category), fontSize: '0.65rem', padding: '2px 6px' }}>
                      {b.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: 'var(--bg-main)', padding: '6px', borderRadius: '6px' }}>
                    <div>⏰ الوقت: <strong>{b.isAllDay ? 'طوال اليوم' : (b.startTime === 'صباحًا' || b.startTime === 'مساءً' ? b.startTime : `${b.startTime ? formatTime12h(b.startTime) : 'غير محدد'} - ${b.endTime ? formatTime12h(b.endTime) : 'غير محدد'}`)}{b.attendanceTime && ` (حضور: ${b.attendanceTime})`}</strong></div>
                    <div>👤 العميل: <strong>{b.clientName}</strong></div>
                    <div>📍 الموقع: <strong>{b.location || 'الاستوديو'}</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.7rem' }}>الحالة: <strong style={{ color: b.status === 'ملغي' ? 'var(--status-danger)' : 'var(--status-success)' }}>{b.status || 'مؤكد'}</strong></span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 700 }}>التفاصيل ➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FullCalendarView;
