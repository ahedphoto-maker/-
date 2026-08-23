import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { formatBookingNumber } from '../../utils/helpers';

export const BookingFormModal = () => {
  const {
    isBookingFormOpen,
    setIsBookingFormOpen,
    selectedDateForBooking,
    addBooking,
    clients,
    freelancers,
    companies,
    setSelectedBooking,
    setIsBookingDetailOpen
  } = useApp();

  const [bookingType, setBookingType] = useState('client'); // 'client' | 'freelancer' | 'company' | 'partnership'
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [category, setCategory] = useState('تصوير مناسبة');
  const [startTime, setStartTime] = useState('16:00');
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedBooking, setSavedBooking] = useState(null);

  // New States for Financials
  const [totalPrice, setTotalPrice] = useState(''); // Client price / Company price / Partnership price
  const [invoiceNumber, setInvoiceNumber] = useState(''); // Client / Company invoice
  const [invoiceStatus, setInvoiceStatus] = useState('غير مسدد'); // Company invoice status
  const [partnershipPercentage, setPartnershipPercentage] = useState(''); // Partnership percentage

  // New States for Freelancer
  const [freelancerMode, setFreelancerMode] = useState('scattered'); // 'scattered' | 'consecutive'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [workingDaysCount, setWorkingDaysCount] = useState(1);
  const [scatteredDates, setScatteredDates] = useState(['']); // array of scattered dates

  const dropdownRef = useRef(null);

  // Initialize form defaults when opened
  useEffect(() => {
    if (isBookingFormOpen) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      
      const hour = today.getHours();
      setStartTime(`${String(hour).padStart(2, '0')}:00`);
      setBookingDate(selectedDateForBooking || todayStr);
      setCategory('تصوير مناسبة');
      setSavedBooking(null);

      // Financials reset
      setTotalPrice('');
      setInvoiceNumber('');
      setInvoiceStatus('غير مسدد');
      setPartnershipPercentage('');

      // Freelancer reset
      setFreelancerMode('scattered');
      setStartDate(selectedDateForBooking || todayStr);
      setEndDate(selectedDateForBooking || todayStr);
      setDailyRate('');
      setWorkingDaysCount(1);
      setScatteredDates([selectedDateForBooking || todayStr]);

      // Support Cooperation Log prefilled redirect
      if (window.prefilledEntity) {
        const ent = window.prefilledEntity;
        setBookingType(ent.type);
        setEntitySearch(ent.name);
        setSelectedEntity({
          id: ent.id,
          name: ent.name,
          phone: ent.phone,
          email: ent.email,
          monthlyAccount: ent.monthlyAccount
        });
        window.prefilledEntity = null; // consume it
      } else {
        setBookingType('client');
        setEntitySearch('');
        setSelectedEntity(null);
      }
    }
  }, [isBookingFormOpen, selectedDateForBooking]);

  // Auto calculate consecutive days
  useEffect(() => {
    if (bookingType === 'freelancer' && freelancerMode === 'consecutive') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setWorkingDaysCount(diffDays > 0 ? diffDays : 1);
      } else {
        setWorkingDaysCount(1);
      }
    }
  }, [startDate, endDate, bookingType, freelancerMode]);

  // Auto calculate scattered days
  useEffect(() => {
    if (bookingType === 'freelancer' && freelancerMode === 'scattered') {
      const validDates = scatteredDates.filter(d => d);
      setWorkingDaysCount(validDates.length > 0 ? validDates.length : 1);
    }
  }, [scatteredDates, bookingType, freelancerMode]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!isBookingFormOpen) return null;

  const handleEntitySearchChange = (val) => {
    setEntitySearch(val);
    setSelectedEntity(null);
    setShowSuggestions(true);
  };

  const getSuggestions = () => {
    const q = entitySearch.toLowerCase().trim();
    if (!q) return [];
    
    if (bookingType === 'client') {
      return (clients || []).filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 5);
    }
    if (bookingType === 'freelancer') {
      return (freelancers || []).filter(f => f.name?.toLowerCase().includes(q) || f.phone?.includes(q)).slice(0, 5);
    }
    if (bookingType === 'company' || bookingType === 'partnership') {
      return (companies || []).filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 5);
    }
    return [];
  };

  const handleSelectEntity = (ent) => {
    setSelectedEntity(ent);
    setEntitySearch(ent.name);
    setShowSuggestions(false);
  };

  const handleSave = () => {
    const name = entitySearch.trim();
    if (!name) return;

    // Auto title generation
    const bookingTitle = `${category} - ${name}`;

    // Construct primary record
    const bookingData = {
      bookingType,
      title: bookingTitle,
      category,
      startTime: startTime || '16:00',
      endTime: '20:00',
      isAllDay: true,
      location: 'موقع استوديو ستار ميديا',
      deposit: null,
      paidAmount: 0,
      status: 'مؤكد',
      teamMemberIds: [],
      equipmentIds: []
    };

    // Populate entity metadata
    if (selectedEntity) {
      if (bookingType === 'client') {
        bookingData.clientId = selectedEntity.id;
        bookingData.clientName = selectedEntity.name;
        bookingData.clientPhone = selectedEntity.phone || '';
        bookingData.clientEmail = selectedEntity.email || '';
        bookingData.companyName = selectedEntity.companyName || '';
      } else if (bookingType === 'freelancer') {
        bookingData.freelancerId = selectedEntity.id;
        bookingData.freelancerName = selectedEntity.name;
        bookingData.freelancerPhone = selectedEntity.phone || '';
        bookingData.freelancerEmail = selectedEntity.email || '';
        bookingData.isMonthlyAccount = selectedEntity.monthlyAccount || false;
      } else if (bookingType === 'company' || bookingType === 'partnership') {
        bookingData.companyId = selectedEntity.id;
        bookingData.companyName = selectedEntity.name;
        bookingData.contactPerson = selectedEntity.contactPerson || '';
        bookingData.contactPhone = selectedEntity.phone || '';
        bookingData.companyEmail = selectedEntity.email || '';
      }
    } else {
      // New custom name creation
      if (bookingType === 'client') {
        bookingData.clientName = name;
      } else if (bookingType === 'freelancer') {
        bookingData.freelancerName = name;
        bookingData.isMonthlyAccount = false;
      } else if (bookingType === 'company' || bookingType === 'partnership') {
        bookingData.companyName = name;
      }
    }

    // Populate Financial fields depending on bookingType
    if (bookingType === 'client') {
      bookingData.date = bookingDate;
      bookingData.startDate = bookingDate;
      bookingData.endDate = bookingDate;
      bookingData.totalPrice = totalPrice !== '' ? Number(totalPrice) : null;
      bookingData.invoiceNumber = invoiceNumber || '';
      bookingData.remainingAmount = bookingData.totalPrice;
    } else if (bookingType === 'company') {
      bookingData.date = bookingDate;
      bookingData.startDate = bookingDate;
      bookingData.endDate = bookingDate;
      bookingData.totalPrice = totalPrice !== '' ? Number(totalPrice) : null;
      bookingData.invoiceNumber = invoiceNumber || '';
      bookingData.paymentStatus = invoiceStatus || 'غير مسدد';
      bookingData.remainingAmount = bookingData.totalPrice;
    } else if (bookingType === 'partnership') {
      bookingData.date = bookingDate;
      bookingData.startDate = bookingDate;
      bookingData.endDate = bookingDate;
      bookingData.totalPrice = totalPrice !== '' ? Number(totalPrice) : null;
      bookingData.partnershipPercentage = partnershipPercentage !== '' ? Number(partnershipPercentage) : null;
      bookingData.remainingAmount = bookingData.totalPrice;
    } else if (bookingType === 'freelancer') {
      bookingData.dailyRate = dailyRate !== '' ? Number(dailyRate) : null;
      bookingData.workingDaysCount = workingDaysCount;
      bookingData.freelancerMode = freelancerMode;

      // Handle consecutive vs scattered dates
      const dates = [];
      if (freelancerMode === 'consecutive') {
        if (startDate && endDate) {
          let curr = new Date(startDate);
          const end = new Date(endDate);
          while (curr <= end) {
            dates.push(curr.toISOString().substring(0, 10));
            curr.setDate(curr.getDate() + 1);
          }
        } else {
          dates.push(bookingDate);
        }
      } else {
        // Scattered dates
        scatteredDates.filter(d => d).forEach(d => dates.push(d));
        if (dates.length === 0) dates.push(bookingDate);
      }

      bookingData.bookingDates = dates;
      bookingData.date = dates[0] || bookingDate;
      bookingData.startDate = dates[0] || bookingDate;
      bookingData.endDate = dates[dates.length - 1] || bookingDate;
      bookingData.totalPrice = dailyRate !== '' ? Number(dailyRate) : null; // Each split day gets dailyRate as price
      bookingData.remainingAmount = bookingData.totalPrice;
    }

    if (addBooking) {
      const created = addBooking(bookingData);
      setSavedBooking(created);
    }
  };

  const categories = [
    'تصوير مناسبة',
    'زفاف',
    'مؤتمر',
    'فعالية',
    'عقار',
    'جلسة تصوير',
    'أخرى'
  ];

  const calculatedTotalDue = (Number(dailyRate) || 0) * workingDaysCount;

  // Render Success view screen
  if (savedBooking) {
    return (
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
        <div className="modal-content" style={{ width: '90%', maxWidth: '380px', backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Icons.CheckCircle2 size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 6px 0', color: 'var(--text-main)' }}>تم إنشاء الحجز بنجاح ✓</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              رقم الحجز المرجعي: <strong>{formatBookingNumber(savedBooking.bookingNumber)}</strong>
            </p>
            <p style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
              {savedBooking.title}
            </p>
            {bookingType === 'freelancer' && (
              <p style={{ fontSize: '0.76rem', color: 'var(--status-success)', fontWeight: 800, marginTop: '4px' }}>
                جدولة {workingDaysCount} يوم عمل بإجمالي مستحق: {calculatedTotalDue.toLocaleString('en-US')} ريال.
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={() => {
                setSelectedBooking(savedBooking);
                setIsBookingDetailOpen(true);
                setIsBookingFormOpen(false);
                setSavedBooking(null);
              }}
              className="btn btn-primary"
              style={{ flex: 1, height: '40px', fontWeight: 900, fontSize: '0.82rem' }}
            >
              <span>فتح الحجز 👁️</span>
            </button>
            <button
              onClick={() => {
                setIsBookingFormOpen(false);
                setSavedBooking(null);
              }}
              className="btn btn-secondary"
              style={{ flex: 1, height: '40px', fontWeight: 900, fontSize: '0.82rem' }}
            >
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getThemeColor = () => {
    switch (bookingType) {
      case 'freelancer': return 'var(--status-success)';
      case 'company': return 'var(--status-warning)';
      case 'partnership': return 'var(--status-info)';
      default: return 'var(--primary-color)';
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsBookingFormOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '450px',
          width: '90%',
          backgroundColor: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Zap size={18} style={{ color: getThemeColor() }} />
            <span>+ حجز سريع للخضوع للجدولة</span>
          </h3>
          <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsBookingFormOpen(false)}>
            <Icons.X size={18} />
          </button>
        </div>

        {/* 1. Entity type tab selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>تصنيف الحجز والتعامل:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', backgroundColor: 'var(--bg-main)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setBookingType('client')}
              style={{
                padding: '8px 4px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: bookingType === 'client' ? 'var(--primary-color)' : 'transparent',
                color: bookingType === 'client' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              📷 عميل
            </button>
            <button
              type="button"
              onClick={() => setBookingType('freelancer')}
              style={{
                padding: '8px 4px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: bookingType === 'freelancer' ? 'var(--status-success)' : 'transparent',
                color: bookingType === 'freelancer' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              👤 فريلانسر
            </button>
            <button
              type="button"
              onClick={() => setBookingType('company')}
              style={{
                padding: '8px 4px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: bookingType === 'company' ? 'var(--status-warning)' : 'transparent',
                color: bookingType === 'company' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              🏢 شركة
            </button>
          </div>
        </div>

        {/* 2. Name search & Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }} ref={dropdownRef}>
          <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            {bookingType === 'client' ? 'اسم العميل / الجهة:' : bookingType === 'freelancer' ? 'اسم المصور الفريلانسر:' : bookingType === 'company' ? 'اسم الشركة الشريكة:' : 'اسم الشريك / الجهة:'}
          </label>
          
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder={bookingType === 'client' ? "ابحث أو اكتب اسم العميل..." : bookingType === 'freelancer' ? "ابحث أو اكتب اسم المصور..." : "ابحث أو اكتب اسم الشركة..."}
              value={entitySearch}
              onChange={e => handleEntitySearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', paddingLeft: '32px' }}
            />
            {entitySearch && (
              <button
                type="button"
                onClick={() => { setEntitySearch(''); setSelectedEntity(null); }}
                style={{ position: 'absolute', left: '10px', top: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Icons.X size={16} />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && getSuggestions().length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                marginTop: '4px',
                zIndex: 1000,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '4px 0'
              }}
            >
              {getSuggestions().map(ent => (
                <div
                  key={ent.id}
                  onClick={() => handleSelectEntity(ent)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    borderBottom: '1px solid var(--bg-main)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <strong style={{ color: 'var(--text-main)' }}>{ent.name}</strong>
                  {ent.phone && <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }} className="en-digits" dir="ltr">{ent.phone}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Date selection (only shown for non-freelancer types) */}
        {bookingType !== 'freelancer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>تاريخ التغطية / الحجز:</label>
            <input
              type="date"
              className="form-control"
              value={bookingDate}
              onChange={e => setBookingDate(e.target.value)}
              style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'right' }}
            />
          </div>
        )}

        {/* 4. Category dropdown (for all except freelancer) */}
        {bookingType !== 'freelancer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>نوع الحجز / التغطية:</label>
            <select
              className="form-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', padding: '0 10px' }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* ─── DYNAMIC FINANCIAL & SPECIFIC FIELDS ─── */}
        
        {/* A. CLIENT FIELDS */}
        {bookingType === 'client' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                السعر / قيمة الفاتورة:
              </label>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <input
                  type="text"
                  className="form-control en-digits"
                  placeholder="0 (اختياري)"
                  value={totalPrice}
                  onChange={e => setTotalPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  style={{ 
                    height: '40px', 
                    borderTopRightRadius: '10px', 
                    borderBottomRightRadius: '10px',
                    borderTopLeftRadius: '0px', 
                    borderBottomLeftRadius: '0px', 
                    fontSize: '0.86rem', 
                    textAlign: 'left', 
                    direction: 'ltr',
                    flex: 1,
                    borderLeft: 'none'
                  }}
                />
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: 'var(--bg-main)', 
                  border: '1px solid var(--border-color)', 
                  borderTopLeftRadius: '10px', 
                  borderBottomLeftRadius: '10px', 
                  borderTopRightRadius: '0px', 
                  borderBottomRightRadius: '0px', 
                  padding: '0 12px', 
                  fontSize: '0.76rem', 
                  color: 'var(--text-muted)', 
                  fontWeight: 900,
                  userSelect: 'none'
                }}>
                  ريال سعودي
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                رقم الفاتورة:
              </label>
              <input
                type="text"
                className="form-control en-digits"
                placeholder="INV-xxxx"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'left', direction: 'ltr' }}
              />
            </div>
          </div>
        )}

        {/* B. FREELANCER FIELDS */}
        {bookingType === 'freelancer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
            
            {/* Mode selection: Scattered vs Consecutive */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>نوع جدولة العمل للفريلانسر:</label>
              <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setFreelancerMode('scattered')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: freelancerMode === 'scattered' ? 'var(--status-success)' : 'transparent',
                    color: freelancerMode === 'scattered' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  📆 أيام متفرقة
                </button>
                <button
                  type="button"
                  onClick={() => setFreelancerMode('consecutive')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: freelancerMode === 'consecutive' ? 'var(--status-success)' : 'transparent',
                    color: freelancerMode === 'consecutive' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  📅 أيام متتالية
                </button>
              </div>
            </div>

            {/* Daily Rate Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                سعر اليوم:
              </label>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <input
                  type="text"
                  className="form-control en-digits"
                  placeholder="0 (اختياري)"
                  value={dailyRate}
                  onChange={e => setDailyRate(e.target.value.replace(/[^0-9.]/g, ''))}
                  style={{ 
                    height: '40px', 
                    borderTopRightRadius: '10px', 
                    borderBottomRightRadius: '10px',
                    borderTopLeftRadius: '0px', 
                    borderBottomLeftRadius: '0px', 
                    fontSize: '0.86rem', 
                    textAlign: 'left', 
                    direction: 'ltr',
                    flex: 1,
                    borderLeft: 'none'
                  }}
                />
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: 'var(--bg-main)', 
                  border: '1px solid var(--border-color)', 
                  borderTopLeftRadius: '10px', 
                  borderBottomLeftRadius: '10px', 
                  borderTopRightRadius: '0px', 
                  borderBottomRightRadius: '0px', 
                  padding: '0 12px', 
                  fontSize: '0.76rem', 
                  color: 'var(--text-muted)', 
                  fontWeight: 900,
                  userSelect: 'none'
                }}>
                  ريال / يوم
                </span>
              </div>
            </div>

            {/* Consecutive mode dates */}
            {freelancerMode === 'consecutive' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>تاريخ البداية:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'right' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>تاريخ النهاية:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'right' }}
                  />
                </div>
              </div>
            )}

            {/* Scattered mode dates */}
            {freelancerMode === 'scattered' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)' }}>تواريخ أيام العمل المتفرقة:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', paddingRight: '2px' }}>
                  {scatteredDates.map((dateVal, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="date"
                        className="form-control"
                        value={dateVal}
                        onChange={e => {
                          const newDates = [...scatteredDates];
                          newDates[idx] = e.target.value;
                          setScatteredDates(newDates);
                        }}
                        style={{ height: '36px', borderRadius: '8px', fontSize: '0.82rem', flex: 1, textAlign: 'right' }}
                      />
                      {scatteredDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setScatteredDates(scatteredDates.filter((_, i) => i !== idx))}
                          className="btn btn-icon btn-secondary"
                          style={{ width: '36px', height: '36px', padding: 0, color: 'var(--status-danger)' }}
                        >
                          <Icons.Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setScatteredDates([...scatteredDates, ''])}
                  className="btn btn-secondary btn-sm"
                  style={{ height: '30px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', borderStyle: 'dashed' }}
                >
                  <Icons.Plus size={14} />
                  <span>إضافة تاريخ عمل آخر</span>
                </button>
              </div>
            )}

            {/* Total due summary card */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>إجمالي عدد الأيام:</span>
                <strong style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>{workingDaysCount} يوم عمل</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>إجمالي المستحق (ريال سعودي):</span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--status-success)' }} className="en-digits">
                  {calculatedTotalDue.toLocaleString('en-US')} ريال
                </strong>
              </div>
            </div>

          </div>
        )}

        {/* C. COMPANY FIELDS */}
        {bookingType === 'company' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  قيمة الاتفاق المالي:
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <input
                    type="text"
                    className="form-control en-digits"
                    placeholder="0 (اختياري)"
                    value={totalPrice}
                    onChange={e => setTotalPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                    style={{ 
                      height: '40px', 
                      borderTopRightRadius: '10px', 
                      borderBottomRightRadius: '10px',
                      borderTopLeftRadius: '0px', 
                      borderBottomLeftRadius: '0px', 
                      fontSize: '0.86rem', 
                      textAlign: 'left', 
                      direction: 'ltr',
                      flex: 1,
                      borderLeft: 'none'
                    }}
                  />
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)', 
                    borderTopLeftRadius: '10px', 
                    borderBottomLeftRadius: '10px', 
                    borderTopRightRadius: '0px', 
                    borderBottomRightRadius: '0px', 
                    padding: '0 12px', 
                    fontSize: '0.76rem', 
                    color: 'var(--text-muted)', 
                    fontWeight: 900,
                    userSelect: 'none'
                  }}>
                    ريال سعودي
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>رقم الفاتورة:</label>
                <input
                  type="text"
                  className="form-control en-digits"
                  placeholder="INV-xxxx"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  style={{ height: '40px', borderRadius: '10px', fontSize: '0.86rem', textAlign: 'left', direction: 'ltr' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)' }}>حالة الفاتورة:</label>
              <select
                className="form-control"
                value={invoiceStatus}
                onChange={e => setInvoiceStatus(e.target.value)}
                style={{ height: '40px', borderRadius: '10px', fontSize: '0.84rem', padding: '0 10px' }}
              >
                <option value="غير مسدد">❌ غير مسددة</option>
                <option value="جزئي">🟡 مدفوعة جزئياً</option>
                <option value="مسدد">✅ مدفوعة بالكامل</option>
              </select>
            </div>
          </div>
        )}



        {/* 5. Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!entitySearch.trim()}
          className="btn btn-primary"
          style={{
            height: '46px',
            borderRadius: '10px',
            fontSize: '0.94rem',
            fontWeight: 950,
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: entitySearch.trim() ? 'pointer' : 'not-allowed',
            opacity: entitySearch.trim() ? 1 : 0.6,
            backgroundColor: getThemeColor(),
            borderColor: getThemeColor()
          }}
        >
          <Icons.Save size={18} />
          <span>حفظ وتأكيد الحجز 💾</span>
        </button>

      </div>
    </div>
  );
};

export default BookingFormModal;
