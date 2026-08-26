import React from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { formatCurrency, formatBookingNumber, formatTime12h, formatDateTime12h } from '../../utils/helpers';

export const OperationsCenter = () => {
  const { 
    bookings = [], 
    team = [], 
    tasks = [], 
    equipment = [], 
    contracts = [], 
    auditLogs = [], 
    invoices = [],
    setActiveTab, 
    updateBooking,
    setSelectedBooking,
    setIsBookingDetailOpen
  } = useApp();

  const todayStr = new Date().toISOString().substring(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().substring(0, 10);

  // WhatsApp click handler
  const handleWhatsApp = (phone, message) => {
    if (!phone) {
      alert('الرجاء إضافة رقم جوال لهذا العميل أولاً!');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone.replace(/^0/, '')}`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 1. 🔴 يحتاج إجراء (Needs Action)
  // Overdue tasks or bookings with past dates that are still unpaid or pending confirmation
  const needsActionItems = bookings.filter(b => 
    (b.date < todayStr && b.status === 'بانتظار التأكيد') ||
    (b.date <= todayStr && b.paymentStatus === 'غير مدفوع' && b.totalPrice > 0)
  ).concat(
    tasks.filter(t => t.status !== 'مكتملة' && t.dueDate && t.dueDate < todayStr)
  );

  // 2. 🟠 مواعيد خلال 24 ساعة (Bookings in next 24 hours)
  const bookingsNext24h = bookings.filter(b => 
    (b.date === todayStr || b.date === tomorrowStr) && b.status !== 'ملغي'
  );

  // 3. 🟢 الحجوزات المؤكدة (Confirmed bookings)
  const confirmedBookings = bookings.filter(b => b.status === 'مؤكد');

  // 4. 💬 رسائل تحتاج متابعة (Readiness states: 'يحتاج متابعة' or 'بانتظار الرد')
  const followUpComms = bookings.filter(b => 
    b.readinessStatus === 'يحتاج متابعة' || b.readinessStatus === 'بانتظار رد الطرف الآخر'
  );

  // 5. 💰 مبالغ مستحقة (Unpaid invoices or bookings)
  const outstandingInvoices = invoices.filter(inv => inv.status !== 'مدفوعة' && inv.status !== 'مدفوع');

  // 6. 📷 مهام اليوم (Today's tasks)
  const todayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr) && t.status !== 'مكتملة');

  // 7. ⚠️ حجوزات تحتاج تأكيد (Status: 'بانتظار التأكيد' or readinessStatus: 'لم يتم التأكيد')
  const pendingConfirmBookings = bookings.filter(b => 
    b.status === 'بانتظار التأكيد' || b.readinessStatus === 'لم يتم التأكيد'
  );

  // Photographer status helper
  const busyPhotographerIds = tasks
    ? tasks
        .filter(t => t.status === 'في الطريق' || t.status === 'وصلت' || t.status === 'قيد التنفيذ')
        .map(t => t.assigneeId)
    : [];

  const availablePhotographers = team.filter(m => !busyPhotographerIds.includes(m.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Banner */}
      <div 
        className="card" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '16px', 
          background: 'linear-gradient(135deg, var(--bg-sidebar) 0%, #1e293b 100%)', 
          color: '#ffffff', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: '50px', fontWeight: 700, color: 'var(--secondary-color)' }}>
            ⚡ مركز العمليات والتحكم الفوري
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, marginTop: '8px' }}>إدارة الحجوزات والاتصالات الميدانية الموحدة</h2>
          <p style={{ fontSize: '0.88rem', opacity: 0.8, marginTop: '4px' }}>لوحة قيادة ذكية لمتابعة حالة التغطيات الحية، تعارض المواعيد، وتذكيرات الواتساب السريعة.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <span className="dot dot-success" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
          <span style={{ fontWeight: 700 }}>النظام متصل ويراقب العمليات</span>
        </div>
      </div>

      {/* Unified Design Command Center Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>📍 ما يحتاج انتباهي الآن (مركز التنبيهات الذكي)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          
          {/* Card 1: 🔴 يحتاج إجراء */}
          <div className="card" style={{ borderRight: '5px solid var(--status-danger)', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--status-danger)' }}>
                  <Icons.AlertCircle size={18} />
                  <span>🔴 يحتاج إجراء فوري</span>
                </span>
                <span className="badge badge-danger" style={{ fontFamily: 'Inter' }}>{needsActionItems.length}</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {needsActionItems.slice(0, 2).map((item, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                    <strong>{item.title}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>
                      {item.clientName ? `العميل: ${item.clientName}` : `مسندة إلى: ${item.assigneeName}`}
                    </div>
                  </div>
                ))}
                {needsActionItems.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>لا توجد إجراءات معلقة حالياً.</p>}
              </div>
            </div>
            {needsActionItems.length > 0 && (
              <button onClick={() => setActiveTab('bookings')} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '6px' }}>
                عرض الحجوزات ❯
              </button>
            )}
          </div>

          {/* Card 2: 🟠 مواعيد خلال 24 ساعة */}
          <div className="card" style={{ borderRight: '5px solid var(--status-warning)', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--status-warning)' }}>
                  <Icons.Clock size={18} />
                  <span>🟠 مواعيد خلال 24 ساعة</span>
                </span>
                <span className="badge badge-warning" style={{ fontFamily: 'Inter' }}>{bookingsNext24h.length}</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bookingsNext24h.slice(0, 2).map((b, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{b.title}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>⏱️ {b.isAllDay ? 'طوال اليوم' : formatTime12h(b.startTime)} | 📍 {b.location}</div>
                    </div>
                    <button 
                      onClick={() => handleWhatsApp(b.clientPhone, `السلام عليكم ${b.clientName}، نؤكد موعد تصويرنا اليوم/غداً: ${b.title} الساعة ${b.isAllDay ? 'طوال اليوم' : formatTime12h(b.startTime)}. بالتوفيق 🌸`)}
                      className="btn btn-secondary btn-icon" 
                      style={{ width: '28px', height: '28px', color: '#10b981' }}
                    >
                      <Icons.MessageSquare size={14} />
                    </button>
                  </div>
                ))}
                {bookingsNext24h.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>لا توجد مواعيد مقررة في الـ 24 ساعة القادمة.</p>}
              </div>
            </div>
            {bookingsNext24h.length > 0 && (
              <button onClick={() => setActiveTab('calendar')} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '6px' }}>
                فتح التقويم ❯
              </button>
            )}
          </div>

          {/* Card 3: 🟢 الحجوزات المؤكدة */}
          <div className="card" style={{ borderRight: '5px solid var(--status-success)', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--status-success)' }}>
                  <Icons.CheckCircle size={18} />
                  <span>🟢 الحجوزات المؤكدة</span>
                </span>
                <span className="badge badge-success" style={{ fontFamily: 'Inter' }}>{confirmedBookings.length}</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {confirmedBookings.slice(0, 2).map((b, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                    <strong>{b.title}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>👤 {b.clientName} | 📅 {b.date}</div>
                  </div>
                ))}
                {confirmedBookings.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>لا توجد حجوزات مؤكدة حالياً.</p>}
              </div>
            </div>
            <button onClick={() => setActiveTab('bookings')} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '6px' }}>
              الذهاب لقائمة الحجوزات ❯
            </button>
          </div>

          {/* Card 4: 💬 رسائل تحتاج متابعة */}
          <div className="card" style={{ borderRight: '5px solid var(--primary-color)', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--primary-color)' }}>
                  <Icons.MessageCircle size={18} />
                  <span>💬 رسائل وجاهزية المتابعة</span>
                </span>
                <span className="badge badge-info" style={{ fontFamily: 'Inter' }}>{followUpComms.length}</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {followUpComms.slice(0, 2).map((b, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{b.title}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>الحالة: {b.readinessStatus}</div>
                    </div>
                    <button 
                      onClick={() => handleWhatsApp(b.clientPhone, `السلام عليكم ${b.clientName}، نود تذكيركم بموعدنا ومتابعة تفاصيل الجاهزية للتغطية. شكراً لكم 🌸`)}
                      className="btn btn-secondary btn-icon" 
                      style={{ width: '28px', height: '28px', color: 'var(--primary-color)' }}
                    >
                      <Icons.Send size={12} />
                    </button>
                  </div>
                ))}
                {followUpComms.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>لا توجد اتصالات معلقة.</p>}
              </div>
            </div>
            {followUpComms.length > 0 && (
              <button onClick={() => setActiveTab('bookings')} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '6px' }}>
                متابعة الحجوزات ❯
              </button>
            )}
          </div>

          {/* Card 5: 💰 مبالغ مستحقة */}
          <div className="card" style={{ borderRight: '5px solid #8b5cf6', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#8b5cf6' }}>
                  <Icons.Coins size={18} />
                  <span>💰 مبالغ مستحقة وفواتير</span>
                </span>
                <span className="badge badge-neutral" style={{ fontFamily: 'Inter' }}>{outstandingInvoices.length}</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {outstandingInvoices.slice(0, 2).map((inv, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{inv.invoiceNumber}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{inv.clientName}</div>
                    </div>
                    <span style={{ color: 'var(--status-danger)', fontWeight: 800, fontFamily: 'Inter' }}>
                      {formatCurrency(inv.total - (inv.paid || 0))}
                    </span>
                  </div>
                ))}
                {outstandingInvoices.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>لا توجد فواتير مستحقة.</p>}
              </div>
            </div>
            <button onClick={() => setActiveTab('invoices')} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '6px' }}>
              إدارة الفواتير والمالية ❯
            </button>
          </div>

          {/* Card 6: 📷 مهام اليوم */}
          <div className="card" style={{ borderRight: '5px solid var(--secondary-color)', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--secondary-color)' }}>
                  <Icons.Camera size={18} />
                  <span>📷 مهام اليوم الفعالة</span>
                </span>
                <span className="badge badge-info" style={{ fontFamily: 'Inter' }}>{todayTasks.length}</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayTasks.slice(0, 2).map((t, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                    <strong>{t.title}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>👤 المكلف: {t.assigneeName}</div>
                  </div>
                ))}
                {todayTasks.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>جميع مهام اليوم مكتملة أو غير مجدولة.</p>}
              </div>
            </div>
            <button onClick={() => setActiveTab('tasks')} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '6px' }}>
              المهام والتشغيل ❯
            </button>
          </div>

          {/* Card 7: ⚠️ حجوزات تحتاج تأكيد */}
          <div className="card" style={{ borderRight: '5px solid #ec4899', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#ec4899' }}>
                  <Icons.AlertTriangle size={18} />
                  <span>⚠️ حجوزات بانتظار التأكيد</span>
                </span>
                <span className="badge badge-neutral" style={{ fontFamily: 'Inter' }}>{pendingConfirmBookings.length}</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingConfirmBookings.slice(0, 2).map((b, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{b.title}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>📅 {b.date} | 👤 {b.clientName}</div>
                    </div>
                    <button 
                      onClick={() => handleWhatsApp(b.clientPhone, `السلام عليكم ${b.clientName}، نرجو تأكيد حجزكم وتغطيتنا المقررة بتاريخ ${b.date}. شكراً لكم 🌸`)}
                      className="btn btn-secondary btn-icon" 
                      style={{ width: '28px', height: '28px', color: '#ec4899' }}
                    >
                      <Icons.MessageSquare size={14} />
                    </button>
                  </div>
                ))}
                {pendingConfirmBookings.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>لا توجد حجوزات تحتاج لتأكيد.</p>}
              </div>
            </div>
            {pendingConfirmBookings.length > 0 && (
              <button onClick={() => setActiveTab('bookings')} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '6px' }}>
                مراجعة الحجوزات ❯
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Operations Dashboard Section */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1.8fr 1.2fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Live Timeline Activity Feed */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>⚡ الخط الزمني الميداني الحي (Live Timeline)</h3>
            <span className="badge badge-success">نشط</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingRight: '20px', borderRight: '2px dashed var(--border-color)' }}>
            {auditLogs && auditLogs.slice(0, 10).map((log, idx) => (
              <div key={log.id || idx} style={{ position: 'relative', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    position: 'absolute',
                    right: '-28px',
                    top: '4px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    border: '3px solid var(--bg-card)',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.15)',
                    zIndex: 2
                  }}
                />
                
                <div style={{ fontSize: '1.25rem' }}>{log.icon || '📝'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{log.action}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.timestamp ? formatTime12h(log.timestamp.substring(11, 16)) : ''}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', margin: '4px 0 0 0' }}>{log.details}</p>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span>بواسطة: <strong>{log.userName || 'موظف'}</strong></span>
                    <span>•</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.66rem' }}>{log.userRole || 'موظف'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Field Photographer Status Panel */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '16px', margin: 0 }}>👥 حالة فريق العمل بالميدان الآن</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {team && team.map(m => {
              const isBusy = busyPhotographerIds.includes(m.id);
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} alt={m.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{m.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>{m.role}</p>
                    </div>
                  </div>
                  <span className={`badge ${isBusy ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.66rem' }}>
                    {isBusy ? 'مشغول بالميدان 🎥' : 'متاح للتكليف ✓'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsCenter;
