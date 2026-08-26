import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatCurrency, formatBookingNumber, formatTime12h } from '../../utils/helpers';
import * as Icons from 'lucide-react';

export const ClientPortalView = ({ bookingId }) => {
  const { bookings, invoices, payments, files } = useApp();

  // Find booking by ID or use default active booking
  const targetBooking = (bookings && bookings.find(b => String(b.id) === String(bookingId))) || (bookings && bookings[0]) || {
    id: 1,
    bookingNumber: 'BK-2026-00101',
    title: 'تصوير حفل زفاف آل مشخص',
    clientName: 'الشيخ جابر السليمان',
    clientType: 'company',
    date: '2026-08-25',
    startTime: '16:00',
    endTime: '23:00',
    location: 'فندق الريتز كارلتون، قاعة الملكي، الرياض',
    googleMapsUrl: 'https://maps.google.com',
    status: 'مؤكد',
    paymentStatus: 'جزئي',
    totalPrice: 12500,
    deposit: 5000,
    paidAmount: 5000,
    remainingAmount: 7500,
    category: 'تصوير حفلات ومناسبات'
  };

  const clientInvoice = (invoices && invoices.find(inv => String(inv.bookingId) === String(targetBooking.id))) || {
    invoiceNumber: 'INV-2026-001',
    total: targetBooking.totalPrice || 12500,
    paid: targetBooking.deposit || 5000,
    status: targetBooking.paymentStatus || 'جزئي'
  };

  const clientFiles = files ? files.filter(f => String(f.bookingId) === String(targetBooking.id)) : [];

  // Timeline Steps
  const timelineSteps = [
    { label: 'حجز الموعد', done: true, icon: Icons.CalendarCheck, date: '15 أغسطس' },
    { label: 'تأكيد الجلسة', done: true, icon: Icons.CheckCircle, date: '16 أغسطس' },
    { label: 'دفع العربون', done: (targetBooking.deposit > 0 || targetBooking.paidAmount > 0), icon: Icons.CreditCard, date: '16 أغسطس' },
    { label: 'التنفيذ الميداني', done: (targetBooking.status === 'جاري التنفيذ' || targetBooking.status === 'مكتمل'), icon: Icons.Camera, date: targetBooking.date || targetBooking.startDate },
    { label: 'التسليم والتصفية', done: (targetBooking.status === 'مكتمل'), icon: Icons.Package, date: 'قيد الإجراء' }
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Brand Header */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '24px',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
          }}>
            <Icons.Camera size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>بوابة العملاء — ستار ميديا Production</h1>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              متابعة تفاصيل الجلسة، الخط الزمني، الفاتورة والملفات المتاحة للتحميل
            </p>
          </div>
        </div>
        <span className="badge badge-purple" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          رقم الحجز: {formatBookingNumber(targetBooking.bookingNumber)}
        </span>
      </div>

      {/* Booking Details Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              {targetBooking.title}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              العميل: <strong>{targetBooking.clientName}</strong> | التصنيف: {targetBooking.category || 'تصوير مناسبات'}
            </p>
          </div>
          <StatusBadge status={targetBooking.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.86rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem', marginBottom: '2px' }}>📅 تاريخ ووقت التغطية:</span>
            <strong style={{ fontFamily: 'Inter, sans-serif' }}>
              {targetBooking.startDate || targetBooking.date} ({targetBooking.isAllDay ? 'طوال اليوم' : (targetBooking.startTime === 'صباحًا' || targetBooking.startTime === 'مساءً' ? targetBooking.startTime : `${formatTime12h(targetBooking.startTime)} - ${formatTime12h(targetBooking.endTime)}`)}{targetBooking.attendanceTime && ` (حضور: ${targetBooking.attendanceTime})`})
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem', marginBottom: '2px' }}>📍 موقع التصوير:</span>
            <strong>{targetBooking.location}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.76rem', marginBottom: '2px' }}>🗺️ التوجيه الميداني:</span>
            <a 
              href={targetBooking.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(targetBooking.location)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', height: '32px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
            >
              <Icons.MapPin size={14} color="var(--primary-color)" />
              <span>فتح في الخرائط</span>
            </a>
          </div>
        </div>
      </div>

      {/* Visual Timeline Steps */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
          ⏱️ الخط الزمني لتنفيذ الجلسة (Client Timeline)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {timelineSteps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <div 
                key={idx}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: step.done ? '1px solid #10b981' : '1px solid var(--border-color)',
                  backgroundColor: step.done ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  textAlign: 'center',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: step.done ? '#10b981' : 'var(--border-color)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComp size={18} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: step.done ? '#10b981' : 'var(--text-main)' }}>
                  {step.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{step.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial & Invoice Summary */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
            💳 الفاتورة والمدفوعات
          </h3>
          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{clientInvoice.invoiceNumber}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>إجمالي المبلغ</span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-color)', margin: '4px 0 0 0', fontFamily: 'Inter, sans-serif' }}>
              {formatCurrency(targetBooking.totalPrice || 12500)}
            </h4>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontSize: '0.74rem', color: '#10b981' }}>المبلغ المدفوع (العربون)</span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981', margin: '4px 0 0 0', fontFamily: 'Inter, sans-serif' }}>
              {formatCurrency(targetBooking.deposit || 5000)}
            </h4>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <span style={{ fontSize: '0.74rem', color: '#f59e0b' }}>المبلغ المتبقي</span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b', margin: '4px 0 0 0', fontFamily: 'Inter, sans-serif' }}>
              {formatCurrency((targetBooking.totalPrice || 12500) - (targetBooking.deposit || 5000))}
            </h4>
          </div>
        </div>
      </div>

      {/* Delivered Files & Gallery Downloads */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
          📁 الملفات والألبومات المسلمة
        </h3>

        {clientFiles.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem', backgroundColor: 'var(--bg-main)', borderRadius: '10px', margin: 0 }}>
            جاري العمل على معالجة وتحديد الصور والألبومات. ستظهر روابط التحميل هنا فور جاهزيتها.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {clientFiles.map(file => (
              <div 
                key={file.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icons.FileCheck size={20} color="var(--primary-color)" />
                  <div>
                    <strong style={{ fontSize: '0.86rem' }}>{file.name}</strong>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>الحجم: {file.size || '45 MB'}</span>
                  </div>
                </div>
                <a 
                  href={file.url || '#'}
                  download
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.78rem', height: '32px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
                >
                  <Icons.Download size={14} />
                  <span>تحميل</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Support Contact */}
      <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        هل لديك أي استفسار أو طلب خاص للجلسة؟ تواصل معنا مباشرة عبر استوديو ستار ميديا Production.
      </div>
    </div>
  );
};

export default ClientPortalView;
