import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatCurrency, formatBookingNumber, formatTime12h } from '../../utils/helpers';
import * as Icons from 'lucide-react';
import { ConfirmDeleteModal } from '../Common/ConfirmDeleteModal';

export const BookingDetailModal = () => {
  const {
    selectedBooking,
    isBookingDetailOpen,
    setIsBookingDetailOpen,
    bookings,
    team,
    equipment,
    updateBooking,
    setIsPaymentModalOpen,
    deleteBooking,
    userRole,
    currentUser
  } = useApp();

  const isSuper = userRole === 'admin' || 
                  (currentUser && (
                    currentUser.isSupervisor === true || 
                    currentUser.id === 1 || 
                    (currentUser.role && (currentUser.role.includes('مدير') || currentUser.role.includes('مشرف')))
                  ));

  // Local state for WhatsApp messages popup
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('ready');
  const [messageText, setMessageText] = useState('');
  const [phoneOverride, setPhoneOverride] = useState('');

  // Local state for delete confirmation
  const [localDeleteOpen, setLocalDeleteOpen] = useState(false);
  const [localDeleteLoading, setLocalDeleteLoading] = useState(false);
  const [localDeleteError, setLocalDeleteError] = useState('');

  // Settle active booking state from context to reflect changes instantly
  const currentBooking = bookings?.find(b => b.id === selectedBooking?.id) || selectedBooking;

  useEffect(() => {
    if (isMsgModalOpen && currentBooking) {
      setMessageText(getTemplateText(selectedTemplate, currentBooking));
      // Prefill phone
      const phone = currentBooking.bookingType === 'freelancer' 
        ? currentBooking.freelancerPhone 
        : (currentBooking.bookingType === 'company' || currentBooking.bookingType === 'partnership' ? currentBooking.contactPhone : currentBooking.clientPhone);
      setPhoneOverride(phone || '');
    }
  }, [isMsgModalOpen, selectedTemplate, currentBooking]);

  if (!isBookingDetailOpen || !currentBooking) return null;

  const assignedTeam = team ? team.filter(m => currentBooking.teamAssigned?.includes(m.id)) : [];
  const assignedEquipment = equipment ? equipment.filter(e => currentBooking.equipmentAssigned?.includes(e.id)) : [];

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'مؤكد': return '#10b981';
      case 'بانتظار التأكيد': return '#f59e0b';
      case 'جاري التنفيذ': return '#3b82f6';
      case 'مكتمل': return '#8b5cf6';
      case 'ملغي': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getTemplateText = (key, b) => {
    const partnerName = b.bookingType === 'freelancer' ? (b.freelancerName || 'المصور') : (b.companyName || 'الشركة');
    const clientName = b.clientName || 'العميل';
    
    const bookingDateStr = b.date || b.startDate || '-';
    const bookingTimeStr = b.isAllDay ? 'طوال اليوم' : formatTime12h(b.startTime || '16:00');
    const locationStr = b.location || 'موقع التصوير';

    let base = '';
    switch (key) {
      case 'ready':
        base = `السلام عليكم، يعطيكم العافية 🌷\nأود أن أؤكد لكم أنني جاهز بإذن الله لموعدنا غداً، ومؤكد حضوري معكم.\nإذا كان هناك أي تحديث أو شيء مطلوب مني قبل الموعد، أرجو إبلاغي.\nبالتوفيق ونلتقي على الموعد 🤍`;
        break;
      case 'confirm':
        base = `السلام عليكم 🌷\nتذكير بموعدنا غداً بإذن الله.\nأنا جاهز ومؤكد حضوري معكم، وأحببت أن أتأكد أن الموعد ما زال مؤكداً من جهتكم أيضاً.\nإذا كان هناك أي تغيير أو تحديث أرجو إبلاغي الله يعافيكم. 🤍`;
        break;
      case 'go_with':
        base = `السلام عليكم، يعطيكم العافية 🌷\nأؤكد لكم أنني جاهز وبإذن الله سأكون معكم في موعد التصوير المجدول.\nالموعد مؤكد من جهتي، وإذا كان هناك أي تغيير أو تفاصيل جديدة قبل الموعد بلغوني.\nنشوفكم على خير 🤍`;
        break;
      case 'remind':
        base = `السلام عليكم 🌷\nتذكير بموعد التصوير المقرر غداً بإذن الله.\nنشوفكم على خير وفي الموعد المحدد 🤍`;
        break;
      case 'quick':
        base = `السلام عليكم، أنا جاهز ومؤكد حضوري معكم غداً بإذن الله. إذا كان هناك أي تحديث بلغوني، ونراكم على الموعد 🤍`;
        break;
      default:
        base = `السلام عليكم 🌷`;
    }

    let details = `\n\n📌 بيانات التغطية:`;
    if (b.bookingType === 'freelancer' || b.bookingType === 'company') {
      details += `\n- الجهة: ${partnerName}`;
      if (b.clientName) details += `\n- العميل المرتبط: ${clientName}`;
    } else {
      details += `\n- العميل: ${clientName}`;
    }
    details += `\n- التاريخ: ${bookingDateStr}`;
    details += `\n- الوقت: ${bookingTimeStr}`;
    if (locationStr && locationStr !== 'موقع استوديو ستار ميديا') {
      details += `\n- الموقع: 📍 ${locationStr}`;
    }

    return `${base}${details}`;
  };

  const getTemplateLabel = (key) => {
    switch (key) {
      case 'ready': return 'أنا جاهز';
      case 'confirm': return 'تأكيد الموعد';
      case 'go_with': return 'سأذهب معكم';
      case 'remind': return 'تذكير بالموعد';
      case 'quick': return 'رسالة سريعة';
      default: return 'رسالة مخصصة';
    }
  };

  const handleSendWhatsApp = () => {
    if (!phoneOverride.trim()) {
      alert('الرجاء إدخال رقم جوال صحيح أولاً لإرسال الرسالة!');
      return;
    }

    const encodedText = encodeURIComponent(messageText);
    const cleanPhone = phoneOverride.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone.replace(/^0/, '')}`;
    
    // Log the transaction to history
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newLog = {
      date: dateStr,
      text: `تم إرسال «${getTemplateLabel(selectedTemplate)}» عبر واتساب.`
    };
    
    const logs = [newLog, ...(currentBooking.confirmationLogs || [])];
    
    // Auto status update based on templates
    let newReadiness = currentBooking.readinessStatus || 'لم يتم التأكيد';
    if (selectedTemplate === 'ready') newReadiness = 'أرسلت تأكيدي';
    else if (selectedTemplate === 'confirm') newReadiness = 'بانتظار رد الطرف الآخر';

    if (updateBooking) {
      updateBooking(currentBooking.id, {
        confirmationLogs: logs,
        readinessStatus: newReadiness,
        // Also save phone overrides back to booking object if changed
        ...(currentBooking.bookingType === 'freelancer' ? { freelancerPhone: phoneOverride } : (currentBooking.bookingType === 'company' || currentBooking.bookingType === 'partnership' ? { contactPhone: phoneOverride } : { clientPhone: phoneOverride }))
      });
    }

    window.open(`https://wa.me/${targetPhone}?text=${encodedText}`, '_blank');
    setIsMsgModalOpen(false);
  };

  const handleDeleteBookingClick = () => {
    setLocalDeleteError('');
    setLocalDeleteOpen(true);
  };

  const handleDeleteBookingConfirm = async () => {
    if (!currentBooking) return;
    setLocalDeleteLoading(true);
    setLocalDeleteError('');
    try {
      await Promise.resolve(deleteBooking(currentBooking.id));
      setLocalDeleteOpen(false);
      setIsBookingDetailOpen(false);
    } catch (err) {
      setLocalDeleteError('فشل الحذف. يرجى المحاولة مرة أخرى.');
    } finally {
      setLocalDeleteLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsBookingDetailOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '750px', width: '90%', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>{currentBooking.title}</h3>
              <StatusBadge status={currentBooking.status} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              رقم الحجز: {formatBookingNumber(currentBooking.bookingNumber)} | تصنيف التغطية: {currentBooking.category}
            </p>
          </div>
          <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsBookingDetailOpen(false)}>
            <Icons.X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Readiness Status Selector (Requirement 9) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>🚦 حالة تأكيد وجاهزية المهمة:</span>
            <select
              value={currentBooking.readinessStatus || 'لم يتم التأكيد'}
              onChange={e => {
                if (updateBooking) {
                  updateBooking(currentBooking.id, { readinessStatus: e.target.value });
                }
              }}
              className="form-control"
              style={{
                height: '32px',
                fontSize: '0.78rem',
                padding: '0 8px',
                borderRadius: '8px',
                width: '190px',
                fontWeight: 800,
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}
            >
              <option value="لم يتم التأكيد">🔴 لم يتم التأكيد</option>
              <option value="أرسلت تأكيدي">🟡 أرسلت تأكيدي</option>
              <option value="بانتظار رد الطرف الآخر">🔵 بانتظار رد الطرف الآخر</option>
              <option value="تم تأكيد الطرفين">🟢 تم تأكيد الطرفين</option>
              <option value="يحتاج متابعة">🟠 يحتاج متابعة</option>
              <option value="تم تغيير الموعد">🟣 تم تغيير الموعد</option>
            </select>
          </div>

          {/* Entity Details (Client / Freelancer / Company) */}
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
            {currentBooking.bookingType === 'freelancer' ? (
              <>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '10px', color: '#10b981', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.UserCheck size={16} />
                  <span>👤 بيانات المصور الفريلانسر</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>اسم المصور: </span><strong>{currentBooking.freelancerName}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>رقم الجوال: </span><strong dir="ltr">{currentBooking.freelancerPhone || '-'}</strong></div>
                  {currentBooking.freelancerEmail && <div><span style={{ color: 'var(--text-muted)' }}>البريد الإلكتروني: </span><strong>{currentBooking.freelancerEmail}</strong></div>}
                  <div><span style={{ color: 'var(--text-muted)' }}>نوع المهمة: </span><strong>{currentBooking.taskType || currentBooking.category}</strong></div>
                  {currentBooking.clientName && <div><span style={{ color: 'var(--text-muted)' }}>العميل المرتبط: </span><strong>{currentBooking.clientName}</strong></div>}
                  <div><span style={{ color: 'var(--text-muted)' }}>حساب شهري: </span><strong>{currentBooking.isMonthlyAccount ? 'نعم' : 'لا'}</strong></div>
                </div>
              </>
            ) : currentBooking.bookingType === 'company' || currentBooking.bookingType === 'partnership' ? (
              <>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '10px', color: '#f59e0b', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Building size={16} />
                  <span>🏢 بيانات الشركة الشريكة</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>اسم الشركة: </span><strong>{currentBooking.companyName}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>مسؤول التواصل: </span><strong>{currentBooking.contactPerson || '-'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>جوال المسؤول: </span><strong dir="ltr">{currentBooking.contactPhone || '-'}</strong></div>
                  {currentBooking.companyEmail && <div><span style={{ color: 'var(--text-muted)' }}>بريد الشركة: </span><strong>{currentBooking.companyEmail}</strong></div>}
                  <div><span style={{ color: 'var(--text-muted)' }}>نوع التغطية: </span><strong>{currentBooking.coverageType || '-'}</strong></div>
                  {currentBooking.assignedPhotographer && <div><span style={{ color: 'var(--text-muted)' }}>المصور المسؤول: </span><strong>{currentBooking.assignedPhotographer}</strong></div>}
                </div>
              </>
            ) : (
              <>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '10px', color: 'var(--primary-color)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.User size={16} />
                  <span>👤 بيانات العميل</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>اسم العميل: </span><strong>{currentBooking.clientName}</strong></div>
                  {currentBooking.companyName && currentBooking.companyName !== '-' && <div><span style={{ color: 'var(--text-muted)' }}>الشركة: </span><strong>{currentBooking.companyName}</strong></div>}
                  <div><span style={{ color: 'var(--text-muted)' }}>رقم الجوال: </span><strong dir="ltr">{currentBooking.clientPhone || '-'}</strong></div>
                  {currentBooking.clientEmail && <div><span style={{ color: 'var(--text-muted)' }}>البريد الإلكتروني: </span><strong>{currentBooking.clientEmail}</strong></div>}
                </div>
              </>
            )}
          </div>

          {/* Shooting Location and Timing */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>التاريخ والوقت</p>
              <p style={{ fontWeight: 800, marginTop: '6px', margin: '6px 0 0 0' }}>📅 {currentBooking.date || currentBooking.startDate}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', margin: '4px 0 0 0' }}>
                🕐 {currentBooking.isAllDay ? 'طوال اليوم (مهمة ممتدة)' : `توقيت التغطية: ${currentBooking.startTime === 'صباحًا' || currentBooking.startTime === 'مساءً' ? currentBooking.startTime : formatTime12h(currentBooking.startTime)}`}
                {currentBooking.attendanceTime && ` | وقت الحضور: ${currentBooking.attendanceTime}`}
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>الموقع والنطاق</p>
              <p style={{ fontWeight: 800, marginTop: '6px', margin: '6px 0 0 0' }}>📍 {currentBooking.location}</p>
              {currentBooking.googleMapsUrl && (
                <a
                  href={currentBooking.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.76rem', color: 'var(--primary-color)', fontWeight: 800, marginTop: '4px', display: 'inline-block' }}
                >
                  فتح في خرائط جوجل Google Maps ↗
                </a>
              )}
            </div>
          </div>

          {/* Crew Assigned Section */}
          {assignedTeam.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '10px', margin: '0 0 10px 0' }}>
                👥 الفريق المكلف ({assignedTeam.length} أعضاء)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {assignedTeam.map(member => (
                  <div
                    key={member.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: 'var(--bg-main)'
                    }}
                  >
                    <img
                      src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                      alt={member.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <p style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0 }}>{member.name}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{member.role ? member.role.split('/')[0] : 'مصور'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Equipment Section */}
          {assignedEquipment.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '10px', margin: '0 0 10px 0' }}>
                📷 المعدات المطلوبة والعهدة المحجوزة ({assignedEquipment.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {assignedEquipment.map(eq => (
                  <span
                    key={eq.id}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '50px',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.76rem',
                      fontWeight: 800
                    }}
                  >
                    📷 {eq.name} ({eq.category})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cameraman Specs / Technical Instructions */}
          {(currentBooking.cameraNeeded || currentBooking.lensNeeded || currentBooking.lightingNeeded || currentBooking.freelancerInstructions || currentBooking.optionalNote) && (
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '10px', color: 'var(--text-main)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Info size={16} />
                <span>🛠️ المتطلبات الفنية والتعليمات التشغيلية للمصور</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.8rem' }}>
                {currentBooking.cameraNeeded && <div><span style={{ color: 'var(--text-muted)' }}>الكاميرا المطلوبة: </span><strong>{currentBooking.cameraNeeded}</strong></div>}
                {currentBooking.lensNeeded && <div><span style={{ color: 'var(--text-muted)' }}>العدسات المطلوبة: </span><strong>{currentBooking.lensNeeded}</strong></div>}
                {currentBooking.lightingNeeded && <div><span style={{ color: 'var(--text-muted)' }}>الإضاءة والمثبتات: </span><strong>{currentBooking.lightingNeeded}</strong></div>}
                {currentBooking.peopleCount && <div><span style={{ color: 'var(--text-muted)' }}>عدد الأشخاص: </span><strong>{currentBooking.peopleCount}</strong></div>}
                {currentBooking.freelancerInstructions && <div style={{ gridColumn: 'span 2', marginTop: '6px' }}><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>تعليمات وتنبيهات التشغيل:</span><p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', whiteSpace: 'pre-line' }}>{currentBooking.freelancerInstructions}</p></div>}
                {currentBooking.optionalNote && <div style={{ gridColumn: 'span 2', marginTop: '4px' }}><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>ملاحظات تشغيلية إضافية:</span><p style={{ margin: '2px 0 0 0', fontStyle: 'italic', fontSize: '0.78rem' }}>"{currentBooking.optionalNote}"</p></div>}
              </div>
            </div>
          )}

          {/* Confirmation log list timeline (Requirement 8) */}
          {currentBooking.confirmationLogs && currentBooking.confirmationLogs.length > 0 && (
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 950, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Clock size={16} style={{ color: 'var(--primary-color)' }} />
                <span>💬 سجل إشعارات وتأكيدات الجاهزية</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {currentBooking.confirmationLogs.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '5px' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{log.text}</span>
                    <span style={{ color: 'var(--text-muted)' }}>📅 {log.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Breakdown Section */}
          {isSuper && (
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '10px', color: '#065f46', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Coins size={16} />
                <span>💰 البيانات والاتفاق المالي للحجز</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>طريقة المحاسبة:</span>
                  <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                    {currentBooking.pricingType === 'monthly' || currentBooking.isMonthlyAccount ? 'حساب شهري تجميعي' : (currentBooking.pricingType === 'none' ? 'غير حدد حالياً' : 'لكل مهمة')}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المبلغ الإجمالي:</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0 0' }}>{formatCurrency(currentBooking.totalPrice)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المدفوع:</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', margin: '4px 0 0 0' }}>{formatCurrency(currentBooking.paidAmount || 0)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>المتبقي للتحصيل:</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', margin: '4px 0 0 0' }}>{currentBooking.totalPrice === null ? 'السعر غير محدد' : formatCurrency(currentBooking.remainingAmount || 0)}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '10px', borderTop: '1px dashed rgba(16, 185, 129, 0.2)', paddingTop: '10px' }}>
                {currentBooking.bookingType === 'freelancer' && (
                  <>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>نوع الحساب:</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>فريلانسر (يومية)</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>سعر اليوم المحدّد:</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                        {currentBooking.totalPrice ? formatCurrency(currentBooking.totalPrice) : 'غير محدد'}
                      </p>
                    </div>
                  </>
                )}
                {currentBooking.bookingType === 'company' && (
                  <>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>رقم الفاتورة:</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>{currentBooking.invoiceNumber || 'غير متاح'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>حالة الفاتورة:</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>{currentBooking.invoiceStatus || 'غير متاح'}</p>
                    </div>
                  </>
                )}
                {currentBooking.bookingType === 'partnership' && (
                  <>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>نوع الاتفاق:</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>شراكة استراتيجية</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>قيمة أو نسبة الشراكة:</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                        {currentBooking.totalPrice ? formatCurrency(currentBooking.totalPrice) : 'غير محدد'}
                      </p>
                    </div>
                  </>
                )}
                {(!currentBooking.bookingType || currentBooking.bookingType === 'client') && (
                  <>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>رقم الفاتورة:</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>{currentBooking.invoiceNumber || 'لا توجد فاتورة'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>حالة التسوية:</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                        {currentBooking.financialStatus === 'settled' ? 'تمت التسوية بالكامل' : 'معلّق / مستحق'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
          
          {userRole === 'admin' && (
            <button
              onClick={handleDeleteBookingClick}
              className="btn btn-secondary"
              style={{
                marginRight: 'auto',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
            >
              <Icons.Trash2 size={16} />
              <span>حذف الحجز نهائياً</span>
            </button>
          )}

          {/* WhatsApp templates modal trigger button */}
          <button onClick={() => setIsMsgModalOpen(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', borderColor: '#10b981' }}>
            <Icons.MessageSquare size={16} />
            <span>تذكير ورسالة واتساب 💬</span>
          </button>

          <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Printer size={16} />
            <span>طباعة الحجز</span>
          </button>

          {isSuper && currentBooking.totalPrice !== null && currentBooking.remainingAmount > 0 && (
            <button
              onClick={() => {
                if (setIsPaymentModalOpen) setIsPaymentModalOpen(true);
                setIsBookingDetailOpen(false);
              }}
              className="btn btn-success"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icons.CreditCard size={16} />
              <span>إضافة دفعة 💰</span>
            </button>
          )}

          <button
            onClick={() => {
              if (updateBooking) {
                updateBooking(currentBooking.id, { status: currentBooking.status === 'مؤكد' ? 'مكتمل' : 'مؤكد' });
              }
              setIsBookingDetailOpen(false);
            }}
            className="btn btn-primary"
          >
            <span>{currentBooking.status === 'مؤكد' ? 'تعديل إلى مكتمل ✓' : 'إعادة تعيين كمؤكد'}</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Message Template Preview Modal Overlay (Requirements 5, 7) */}
      {isMsgModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '520px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h4 style={{ margin: 0, fontWeight: 950, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.MessageCircle size={18} color="#10b981" />
                <span>إعداد وإرسال رسالة تذكير الواتساب</span>
              </h4>
              <button onClick={() => setIsMsgModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Icons.X size={18} /></button>
            </div>

            {/* Template select buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 800 }}>اختر قالب الرسالة:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button type="button" className={`btn btn-sm ${selectedTemplate === 'ready' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedTemplate('ready')} style={{ fontSize: '0.74rem', height: '28px', padding: '0 10px' }}>✅ أنا جاهز</button>
                <button type="button" className={`btn btn-sm ${selectedTemplate === 'confirm' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedTemplate('confirm')} style={{ fontSize: '0.74rem', height: '28px', padding: '0 10px' }}>🤝 تأكيد الموعد</button>
                
                {/* Condition: Show "I'll go with you" if freelancer/company task */}
                {(currentBooking.bookingType === 'freelancer' || currentBooking.bookingType === 'company') && (
                  <button type="button" className={`btn btn-sm ${selectedTemplate === 'go_with' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedTemplate('go_with')} style={{ fontSize: '0.74rem', height: '28px', padding: '0 10px' }}>📷 سأذهب معكم</button>
                )}
                
                <button type="button" className={`btn btn-sm ${selectedTemplate === 'remind' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedTemplate('remind')} style={{ fontSize: '0.74rem', height: '28px', padding: '0 10px' }}>🔔 تذكير بالموعد</button>
                <button type="button" className={`btn btn-sm ${selectedTemplate === 'quick' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedTemplate('quick')} style={{ fontSize: '0.74rem', height: '28px', padding: '0 10px' }}>⚡ رسالة سريعة</button>
              </div>
            </div>

            {/* Target Phone number input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>رقم جوال المستلم (واتساب):</label>
              <input
                type="text"
                className="form-control"
                dir="ltr"
                placeholder="أدخل رقم الجوال 05xxxxxxx"
                value={phoneOverride}
                onChange={e => setPhoneOverride(e.target.value)}
                style={{ height: '34px', fontSize: '0.8rem', fontWeight: 'bold' }}
              />
            </div>

            {/* Textarea editor (Requirement 7) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>معاينة النص وتعديله:</label>
              <textarea
                className="form-control"
                rows={7}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                style={{ fontSize: '0.78rem', borderRadius: '8px', padding: '8px', whiteSpace: 'pre-wrap' }}
                placeholder="اكتب رسالتك المخصصة هنا..."
              />
            </div>

            {/* Send WhatsApp action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button onClick={() => setIsMsgModalOpen(false)} className="btn btn-secondary btn-sm">إلغاء</button>
              <button onClick={handleSendWhatsApp} className="btn btn-success btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icons.MessageSquare size={14} />
                <span>إرسال عبر واتساب 💬</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {localDeleteOpen && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => { setLocalDeleteOpen(false); setLocalDeleteError(''); }}
          onConfirm={handleDeleteBookingConfirm}
          title={currentBooking.status === 'مؤكد' ? 'إلغاء الحجز المؤكد' : 'حذف الحجز'}
          description={currentBooking.status === 'مؤكد'
            ? `الحجز بحالة “مؤكد”. سيتم تحويله إلى “ملغي” بدلاً من حذفه نهائياً للحفاظ على السجلات.`
            : `هل أنت متأكد من حذف هذا الحجز بشكل نهائي؟`
          }
          itemDetails={[
            { label: 'رقم الحجز', value: formatBookingNumber(currentBooking.bookingNumber) },
            { label: 'اسم العميل', value: currentBooking.clientName || currentBooking.companyName || currentBooking.freelancerName || '-' },
            { label: 'التاريخ', value: currentBooking.date || currentBooking.startDate || '-' },
            { label: 'الحالة الحالية', value: currentBooking.status || '-' },
          ]}
          warnings={currentBooking.status === 'مؤكد'
            ? ['تحويل إلى ملغي: لن يتم حذف بيانات الحجز من السجل ولكن ستتغيّر حالته إلى “ملغي”.']
            : []
          }
          confirmLabel={currentBooking.status === 'مؤكد' ? 'تحويل إلى ملغي' : 'حذف الحجز'}
          confirmVariant={currentBooking.status === 'مؤكد' ? 'warning' : 'danger'}
          isLoading={localDeleteLoading}
          errorMsg={localDeleteError}
        />
      )}
    </div>
  );
};

export default BookingDetailModal;
