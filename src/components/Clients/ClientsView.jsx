import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatBookingNumber } from '../../utils/helpers';
import * as Icons from 'lucide-react';

export const ClientsView = () => {
  const {
    clients,
    addClient,
    updateClient,
    bookings,
    invoices,
    payments,
    files,
    addFile,
    addInvoice,
    addPayment,
    setSelectedBooking,
    setIsBookingDetailOpen,
    setIsBookingFormOpen
  } = useApp();

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    type: 'فرد',
    contactPerson: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientProfile, setSelectedClientProfile] = useState(null);
  
  // Tab control in detailed profile
  const [crmTab, setCrmTab] = useState('overview'); // 'overview' | 'bookings' | 'invoices' | 'payments' | 'comms'
  
  // Communication note addition
  const [isAddCommOpen, setIsAddCommOpen] = useState(false);
  const [newCommText, setNewCommText] = useState('');

  // Quick invoice/payment form states
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    bookingId: '',
    subtotal: '',
    status: 'غير مدفوعة',
    description: ''
  });

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    invoiceNumber: '',
    amount: '',
    method: 'تحويل بنكي',
    notes: ''
  });

  // Statement dialog
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementPeriod, setStatementPeriod] = useState('all'); // 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Client notes input helper
  const [clientNotesEdit, setClientNotesEdit] = useState('');

  // Client files input helper
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('PDF');

  const todayStr = new Date().toISOString().substring(0, 10);

  useEffect(() => {
    if (selectedClientProfile) {
      setClientNotesEdit(selectedClientProfile.notes || '');
    }
  }, [selectedClientProfile]);

  const handleAddClientSubmit = (e) => {
    e.preventDefault();
    if (!newClient.name) return;
    if (addClient) {
      addClient({
        ...newClient,
        communicationLog: [],
        whatsapp: newClient.phone || ''
      });
    }
    setIsAddClientOpen(false);
    setNewClient({ name: '', type: 'فرد', contactPerson: '', phone: '', email: '', notes: '' });
  };

  const getFilteredClients = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clients || [];
    return (clients || []).filter(c => 
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.contactPerson?.toLowerCase().includes(q)
    );
  };

  // Resolve calculations dynamically for selected profile
  if (selectedClientProfile) {
    const clientBookings = (bookings || []).filter(b => 
      b.clientId === selectedClientProfile.id || 
      (b.bookingType === 'client' && b.clientName === selectedClientProfile.name)
    );

    const clientInvoices = (invoices || []).filter(inv => 
      inv.clientName === selectedClientProfile.name ||
      inv.clientEmail === selectedClientProfile.email
    );

    const clientPayments = (payments || []).filter(p => 
      p.clientName === selectedClientProfile.name
    );

    const clientFiles = (files || []).filter(f => 
      f.entityType === 'client' && Number(f.entityId) === Number(selectedClientProfile.id)
    );

    // Dynamic calculations
    const bookingsCount = clientBookings.length;
    const upcomingCount = clientBookings.filter(b => b.status !== 'ملغي' && b.status !== 'مكتمل' && (b.startDate || b.date) >= todayStr).length;
    const completedCount = clientBookings.filter(b => b.status === 'مكتمل').length;
    
    const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remainingBalance = totalInvoiced - totalPaid;

    const sortedAsc = [...clientBookings].sort((a, b) => (a.startDate || a.date).localeCompare(b.startDate || b.date));
    const firstDeal = sortedAsc[0] ? sortedAsc[0].date : '-';
    
    const sortedDesc = [...clientBookings].sort((a, b) => (b.startDate || b.date).localeCompare(a.startDate || a.date));
    const lastDeal = sortedDesc[0] ? sortedDesc[0].date : '-';

    const handleCopyPhone = () => {
      if (selectedClientProfile.phone) {
        navigator.clipboard.writeText(selectedClientProfile.phone);
        alert('تم نسخ رقم الجوال إلى الحافظة! 📋');
      }
    };

    const handleCreatePrefilledBooking = () => {
      window.prefilledEntity = {
        type: 'client',
        id: selectedClientProfile.id,
        name: selectedClientProfile.name,
        phone: selectedClientProfile.phone || '',
        email: selectedClientProfile.email || ''
      };
      if (setIsBookingFormOpen) {
        setIsBookingFormOpen(true);
      }
    };

    const handleAddInvoiceSubmit = (e) => {
      e.preventDefault();
      const amount = parseFloat(newInvoiceData.subtotal);
      if (isNaN(amount) || amount <= 0) return;

      if (addInvoice) {
        addInvoice({
          clientName: selectedClientProfile.name,
          clientEmail: selectedClientProfile.email || 'client@star-media.sa',
          bookingId: newInvoiceData.bookingId ? Number(newInvoiceData.bookingId) : null,
          issueDate: todayStr,
          dueDate: todayStr,
          subtotal: amount / 1.15,
          taxRate: 15,
          taxAmount: (amount * 0.15) / 1.15,
          total: amount,
          paid: newInvoiceData.status === 'مدفوعة' ? amount : 0,
          status: newInvoiceData.status,
          description: newInvoiceData.description || 'تغطية تصوير فوتوغرافي وفيديو'
        });
      }
      setIsAddInvoiceOpen(false);
      setNewInvoiceData({ bookingId: '', subtotal: '', status: 'غير مدفوعة', description: '' });
      alert('تم إنشاء الفاتورة وربطها بالعميل بنجاح! 🧾');
    };

    const handleAddPaymentSubmit = (e) => {
      e.preventDefault();
      const amount = parseFloat(newPaymentData.amount);
      if (isNaN(amount) || amount <= 0) return;

      if (addPayment) {
        addPayment({
          clientName: selectedClientProfile.name,
          invoiceNumber: newPaymentData.invoiceNumber || 'INV-FREE',
          amount: amount,
          date: todayStr,
          method: newPaymentData.method,
          notes: newPaymentData.notes || 'تسجيل دفعة يدوية'
        });
      }
      setIsAddPaymentOpen(false);
      setNewPaymentData({ invoiceNumber: '', amount: '', method: 'تحويل بنكي', notes: '' });
    };

    const handleAddCommNoteSubmit = () => {
      if (!newCommText.trim()) return;
      const now = new Date();
      const dateVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeVal = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newLog = {
        date: dateVal,
        time: timeVal,
        text: newCommText.trim()
      };

      const log = [newLog, ...(selectedClientProfile.communicationLog || [])];
      updateClient(selectedClientProfile.id, { communicationLog: log });
      setSelectedClientProfile(prev => ({ ...prev, communicationLog: log }));
      setNewCommText('');
      setIsAddCommOpen(false);
    };

    const handleNotesSave = () => {
      updateClient(selectedClientProfile.id, { notes: clientNotesEdit });
      setSelectedClientProfile(prev => ({ ...prev, notes: clientNotesEdit }));
      alert('تم حفظ التفضيلات وملاحظات العميل بنجاح! 📝');
    };

    const handleAddFileSubmit = (e) => {
      e.preventDefault();
      if (!newFileName.trim()) return;

      if (addFile) {
        addFile({
          entityType: 'client',
          entityId: selectedClientProfile.id,
          name: newFileName.trim(),
          size: '1.5 MB',
          category: newFileType,
          url: '#'
        });
      }
      setNewFileName('');
      alert('تم ربط المستند بملف العميل بنجاح! 📁');
    };

    // Calculate Period filters for statement
    const getPeriodBookings = () => {
      return clientBookings.filter(b => {
        const d = b.startDate || b.date;
        if (statementPeriod === 'this_month') {
          const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
          return d.startsWith(currentMonth);
        }
        if (statementPeriod === 'last_month') {
          const lm = new Date();
          lm.setMonth(lm.getMonth() - 1);
          const lastMonth = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`;
          return d.startsWith(lastMonth);
        }
        if (statementPeriod === 'this_year') {
          const currentYear = String(new Date().getFullYear());
          return d.startsWith(currentYear);
        }
        if (statementPeriod === 'custom') {
          if (customStart && d < customStart) return false;
          if (customEnd && d > customEnd) return false;
        }
        return true;
      });
    };

    const getPeriodInvoices = () => {
      return clientInvoices.filter(inv => {
        const d = inv.issueDate;
        if (statementPeriod === 'this_month') {
          const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
          return d.startsWith(currentMonth);
        }
        if (statementPeriod === 'last_month') {
          const lm = new Date();
          lm.setMonth(lm.getMonth() - 1);
          const lastMonth = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`;
          return d.startsWith(lastMonth);
        }
        if (statementPeriod === 'this_year') {
          const currentYear = String(new Date().getFullYear());
          return d.startsWith(currentYear);
        }
        if (statementPeriod === 'custom') {
          if (customStart && d < customStart) return false;
          if (customEnd && d > customEnd) return false;
        }
        return true;
      });
    };

    const getPeriodPayments = () => {
      return clientPayments.filter(p => {
        const d = p.date;
        if (statementPeriod === 'this_month') {
          const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
          return d.startsWith(currentMonth);
        }
        if (statementPeriod === 'last_month') {
          const lm = new Date();
          lm.setMonth(lm.getMonth() - 1);
          const lastMonth = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`;
          return d.startsWith(lastMonth);
        }
        if (statementPeriod === 'this_year') {
          const currentYear = String(new Date().getFullYear());
          return d.startsWith(currentYear);
        }
        if (statementPeriod === 'custom') {
          if (customStart && d < customStart) return false;
          if (customEnd && d > customEnd) return false;
        }
        return true;
      });
    };

    const handleSendStatementWhatsApp = () => {
      const pBookings = getPeriodBookings();
      const pInvoices = getPeriodInvoices();
      const pPayments = getPeriodPayments();

      const pTotalInvoiced = pInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const pTotalPaid = pPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const pRemaining = pTotalInvoiced - pTotalPaid;

      let msg = `مرحباً بك عميلنا العزيز ${selectedClientProfile.name} ✨\n`;
      msg += `إليك ملخص كشف الحساب المالي المنسق من استوديو ستار ميديا:\n\n`;
      msg += `📅 إجمالي حجوزات الفترة: ${pBookings.length} تغطيات\n`;
      msg += `🧾 إجمالي المطالبات المفتوحة: ${formatCurrency(pTotalInvoiced)}\n`;
      msg += `💰 إجمالي المبالغ المسددة: ${formatCurrency(pTotalPaid)}\n`;
      msg += `🔴 الرصيد المتبقي المستحق: ${formatCurrency(pRemaining)}\n\n`;
      msg += `شاكرين ومقدرين لثقتك بنا! 📷`;

      const encoded = encodeURIComponent(msg);
      const phoneNum = selectedClientProfile.phone.replace(/[^0-9]/g, '');
      const targetPhone = phoneNum.startsWith('966') ? phoneNum : `966${phoneNum.replace(/^0/, '')}`;
      
      window.open(`https://wa.me/${targetPhone}?text=${encoded}`, '_blank');
    };

    const handlePrintStatement = () => {
      window.print();
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', direction: 'rtl' }}>
        <style>{`
          @media print {
            body { background: #ffffff !important; color: #000000 !important; }
            .no-print { display: none !important; }
            .print-header { display: block !important; text-align: center; margin-bottom: 20px; }
            .card { border: none !important; box-shadow: none !important; padding: 0 !important; background: transparent !important; }
            table { border: 1px solid #ccc !important; width: 100% !important; }
            th, td { border-bottom: 1px solid #ccc !important; padding: 8px !important; }
          }
        `}</style>

        {/* Printable Header */}
        <div className="print-header" style={{ display: 'none' }}>
          <h2>استوديو ستار ميديا Star Media</h2>
          <h3>كشف حساب مالي وتفصيلي للعميل</h3>
          <hr />
        </div>

        {/* Back button */}
        <div className="no-print">
          <button
            onClick={() => setSelectedClientProfile(null)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', height: '32px', borderRadius: '8px' }}
          >
            <Icons.ArrowRight size={14} />
            <span>العودة إلى دليل العملاء</span>
          </button>
        </div>

        {/* 1. Client Premium Card Header */}
        <div className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '5px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Left: Avatar & Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '2.5rem', width: '64px', height: '64px', borderRadius: '12px', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                {selectedClientProfile.avatar || '👤'}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0 }}>{selectedClientProfile.name}</h2>
                  {bookingsCount > 1 && (
                    <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.66rem', fontWeight: 900, padding: '2px 8px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Icons.Star size={10} fill="#f59e0b" />
                      <span>عميل متكرر ⭐</span>
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    value={selectedClientProfile.type || 'فرد'}
                    onChange={e => {
                      const t = e.target.value;
                      updateClient(selectedClientProfile.id, { type: t });
                      setSelectedClientProfile(prev => ({ ...prev, type: t }));
                    }}
                    style={{ fontSize: '0.72rem', height: '26px', padding: '2px 6px', borderRadius: '6px', width: '75px', fontWeight: 800 }}
                  >
                    <option value="فرد">فرد</option>
                    <option value="شركة">شركة</option>
                    <option value="جهة">جهة</option>
                  </select>

                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    أول تعامل: <strong>{firstDeal}</strong> | آخر تعامل: <strong>{lastDeal}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick actions */}
            <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedClientProfile.phone && (
                <>
                  <a
                    href={`https://wa.me/966${selectedClientProfile.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success"
                    style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="واتساب 🟢"
                  >
                    <Icons.MessageSquare size={18} />
                  </a>
                  <a
                    href={`tel:${selectedClientProfile.phone}`}
                    className="btn btn-secondary"
                    style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="اتصال تلفوني 📞"
                  >
                    <Icons.Phone size={18} />
                  </a>
                </>
              )}
              {selectedClientProfile.email && (
                <a
                  href={`mailto:${selectedClientProfile.email}`}
                  className="btn btn-secondary"
                  style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="إرسال بريد ✉️"
                >
                  <Icons.Mail size={18} />
                </a>
              )}
              {selectedClientProfile.phone && (
                <button
                  onClick={handleCopyPhone}
                  className="btn btn-secondary"
                  style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="نسخ رقم الجوال 📋"
                >
                  <Icons.Copy size={18} />
                </button>
              )}
            </div>

          </div>

          {/* Core Operations Buttons */}
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <button onClick={handleCreatePrefilledBooking} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', height: '36px', borderRadius: '8px' }}>
              <Icons.CalendarPlus size={15} />
              <span>+ حجز جديد</span>
            </button>
            <button onClick={() => setIsAddInvoiceOpen(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', height: '36px', borderRadius: '8px' }}>
              <Icons.FileSpreadsheet size={15} />
              <span>+ فاتورة</span>
            </button>
            <button onClick={() => setIsAddPaymentOpen(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', height: '36px', borderRadius: '8px' }}>
              <Icons.BadgeDollarSign size={15} />
              <span>+ تسجيل دفعة</span>
            </button>
            <button onClick={() => setIsStatementOpen(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', height: '36px', borderRadius: '8px', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
              <Icons.LineChart size={15} />
              <span>📊 كشف حساب</span>
            </button>
          </div>
        </div>

        {/* 2. Scrollable Navigation Sub-Tabs */}
        <div className="card no-print" style={{ padding: '6px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '4px' }}>
            <button
              onClick={() => setCrmTab('overview')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: crmTab === 'overview' ? 'var(--primary-color)' : 'transparent',
                color: crmTab === 'overview' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              📋 نظرة عامة وتفضيلات
            </button>
            <button
              onClick={() => setCrmTab('bookings')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: crmTab === 'bookings' ? 'var(--primary-color)' : 'transparent',
                color: crmTab === 'bookings' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              📅 سجل الحجوزات ({bookingsCount})
            </button>
            <button
              onClick={() => setCrmTab('invoices')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: crmTab === 'invoices' ? 'var(--primary-color)' : 'transparent',
                color: crmTab === 'invoices' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              🧾 الفواتير الصادرة ({clientInvoices.length})
            </button>
            <button
              onClick={() => setCrmTab('payments')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: crmTab === 'payments' ? 'var(--primary-color)' : 'transparent',
                color: crmTab === 'payments' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              💰 المدفوعات والمالية
            </button>
            <button
              onClick={() => setCrmTab('comms')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: crmTab === 'comms' ? 'var(--primary-color)' : 'transparent',
                color: crmTab === 'comms' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              💬 سجل الاتصال ({selectedClientProfile.communicationLog?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        
        {/* TAB 1: Overview */}
        {crmTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Quick Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div className="card" style={{ padding: '12px', borderRight: '3px solid var(--primary-color)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>الحجوزات الكلية</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 950 }}>{bookingsCount}</h4>
              </div>
              <div className="card" style={{ padding: '12px', borderRight: '3px solid #3b82f6', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>المهام القادمة</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 950, color: '#3b82f6' }}>{upcomingCount}</h4>
              </div>
              <div className="card" style={{ padding: '12px', borderRight: '3px solid #8b5cf6', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>المهام المكتملة</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 950, color: '#8b5cf6' }}>{completedCount}</h4>
              </div>
              <div className="card" style={{ padding: '12px', borderRight: '3px solid #10b981', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>إجمالي الفواتير</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '0.96rem', fontWeight: 950, color: '#10b981' }}>{formatCurrency(totalInvoiced)}</h4>
              </div>
              <div className="card" style={{ padding: '12px', borderRight: '3px solid #ef4444', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>الرصيد المستحق</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '0.96rem', fontWeight: 950, color: '#ef4444' }}>{formatCurrency(remainingBalance)}</h4>
              </div>
            </div>

            {/* Notes & Files Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              
              {/* Client special notes card */}
              <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.FileEdit size={16} />
                  <span>📝 ملاحظات وتفضيلات العميل الخاصة</span>
                </h4>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="اكتب هنا تفضيلات العميل (أوقات التصوير المفضلة، أسلوب التعديل، ملاحظات المناسبات الخاصة...)"
                  value={clientNotesEdit}
                  onChange={e => setClientNotesEdit(e.target.value)}
                  style={{ fontSize: '0.8rem', borderRadius: '8px', padding: '8px' }}
                />
                <button onClick={handleNotesSave} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-end', height: '30px' }}>
                  حفظ التفضيلات
                </button>
              </div>

              {/* Client files list card with classified folders */}
              <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Folder size={16} />
                  <span>📁 مجلدات وملفات العميل المصنفة</span>
                </h4>
                
                {/* Upload Form */}
                <form onSubmit={handleAddFileSubmit} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="اسم الملف..."
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    style={{ height: '30px', fontSize: '0.76rem', flex: 1 }}
                    required
                  />
                  <select
                    className="form-control"
                    value={newFileType}
                    onChange={e => setNewFileType(e.target.value)}
                    style={{ height: '30px', fontSize: '0.74rem', width: '90px' }}
                  >
                    <option value="عقود">عقود 📄</option>
                    <option value="صور وتصاميم">صور 📷</option>
                    <option value="فواتير وسندات">فواتير 💰</option>
                    <option value="أخرى">أخرى 📂</option>
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ height: '30px', padding: '0 10px' }}>
                    إرفاق
                  </button>
                </form>

                {/* Folder Groups */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {['عقود', 'صور وتصاميم', 'فواتير وسندات', 'أخرى'].map(folder => {
                    const filesInFolder = clientFiles.filter(f => f.category === folder || (folder === 'أخرى' && !['عقود', 'صور وتصاميم', 'فواتير وسندات'].includes(f.category)));
                    return (
                      <div key={folder} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', backgroundColor: 'var(--bg-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.78rem', color: 'var(--primary-color)', marginBottom: '4px' }}>
                          <Icons.Folder size={14} />
                          <span>{folder} ({filesInFolder.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '12px' }}>
                          {filesInFolder.length === 0 ? (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>لا توجد ملفات.</span>
                          ) : (
                            filesInFolder.map(file => (
                              <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', padding: '4px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                <span>📄 {file.name}</span>
                                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{file.type || 'PDF'}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: Bookings */}
        {crmTab === 'bookings' && (
          <div className="card" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', fontWeight: 900 }}>📅 تاريخ وجدول الحجوزات الكامل</h4>
            
            {clientBookings.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px' }}>لا توجد حجوزات مسجلة لهذا العميل</p>
            ) : (
              [...clientBookings].sort((a,b) => (b.startDate || b.date).localeCompare(a.startDate || a.date)).map(b => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBooking(b);
                    setIsBookingDetailOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 900 }}>{b.title}</h5>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span>📅 {b.date}</span>
                      {b.location && <span>📍 {b.location}</span>}
                      {b.status && (
                        <span style={{ color: getStatusColor(b.status), fontWeight: 900 }}>
                          {b.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ fontSize: '0.88rem', display: 'block' }}>{formatCurrency(b.totalPrice)}</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 900, color: b.paymentStatus === 'مدفوع' ? '#10b981' : '#ef4444' }}>
                      {b.paymentStatus || 'غير مدفوع'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Invoices */}
        {crmTab === 'invoices' && (
          <div className="card" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', fontWeight: 900 }}>🧾 كشف فواتير العميل الصادرة</h4>
            
            {clientInvoices.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px' }}>لا توجد فواتير صادرة للعميل</p>
            ) : (
              clientInvoices.map(inv => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900 }}>رقم الفاتورة: {inv.invoiceNumber}</h5>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      تاريخ الإصدار: {inv.issueDate} | وصف الخدمة: {inv.description || '-'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '0.86rem', display: 'block' }}>{formatCurrency(inv.total)}</strong>
                      <span style={{ fontSize: '0.68rem', fontWeight: 900, color: inv.status === 'مدفوعة' ? '#10b981' : '#f59e0b' }}>
                        {inv.status || 'غير مدفوعة'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="btn btn-secondary btn-icon"
                      style={{ width: '28px', height: '28px', padding: 0 }}
                      title="طباعة الفاتورة 🖨️"
                    >
                      <Icons.Printer size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: Payments */}
        {crmTab === 'payments' && (
          <div className="card" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 900 }}>💰 سجل الدفعات المالية والتحصيل</h4>
            
            {/* Aggregate summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: 'var(--bg-main)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>إجمالي المطالبات:</span>
                <strong style={{ display: 'block', fontSize: '0.92rem', marginTop: '2px' }}>{formatCurrency(totalInvoiced)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>إجمالي المسدد:</span>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#10b981', marginTop: '2px' }}>{formatCurrency(totalPaid)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>الرصيد المستحق:</span>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#ef4444', marginTop: '2px' }}>{formatCurrency(remainingBalance)}</strong>
              </div>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {clientPayments.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px' }}>لا توجد دفعات مسجلة</p>
              ) : (
                clientPayments.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', fontSize: '0.8rem' }}>
                    <div>
                      <strong>فاتورة: {p.invoiceNumber}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        التاريخ: {p.date} | طريقة الدفع: {p.method} | ملاحظة: {p.notes || '-'}
                      </div>
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: '#10b981' }}>+{formatCurrency(p.amount)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Communication Log */}
        {crmTab === 'comms' && (
          <div className="card" style={{ padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 900 }}>💬 سجل التواصل مع العميل</h4>
              <button
                onClick={() => setIsAddCommOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ height: '28px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Icons.Plus size={12} />
                <span>إضافة ملاحظة تواصل</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {!selectedClientProfile.communicationLog || selectedClientProfile.communicationLog.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px' }}>لا يوجد سجل تواصل مسجل لهذا العميل</p>
              ) : (
                selectedClientProfile.communicationLog.map((log, idx) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span>📅 {log.date}</span>
                      <span>🕐 {log.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>{log.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODAL 1: Add Communication Note */}
        {isAddCommOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ maxWidth: '400px', width: '90%', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontWeight: 900 }}>إضافة ملاحظة تواصل جديدة</h4>
                <button onClick={() => setIsAddCommOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><Icons.X size={16} /></button>
              </div>
              <textarea
                className="form-control"
                rows={3}
                placeholder="مثال: تم إرسال مسودة العقد، تم تأكيد الموعد هاتفياً..."
                value={newCommText}
                onChange={e => setNewCommText(e.target.value)}
                style={{ fontSize: '0.8rem', borderRadius: '8px', padding: '8px' }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '14px' }}>
                <button onClick={() => setIsAddCommOpen(false)} className="btn btn-secondary btn-sm">إلغاء</button>
                <button onClick={handleAddCommNoteSubmit} className="btn btn-primary btn-sm" disabled={!newCommText.trim()}>حفظ الملاحظة</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Add Invoice */}
        {isAddInvoiceOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ maxWidth: '420px', width: '90%', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontWeight: 950 }}>🧾 إنشاء فاتورة جديدة للعميل</h4>
                <button onClick={() => setIsAddInvoiceOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><Icons.X size={16} /></button>
              </div>
              <form onSubmit={handleAddInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>ربط الفاتورة بحجز قائم:</label>
                  <select
                    className="form-control"
                    value={newInvoiceData.bookingId}
                    onChange={e => setNewInvoiceData({ ...newInvoiceData, bookingId: e.target.value })}
                    style={{ fontSize: '0.78rem', height: '32px' }}
                  >
                    <option value="">-- فاتورة حرة (بدون حجز) --</option>
                    {clientBookings.map(b => (
                      <option key={b.id} value={b.id}>{formatBookingNumber(b.bookingNumber)} - {b.title}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>وصف الخدمة:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="مثال: تغطية زفاف متكاملة"
                    value={newInvoiceData.description}
                    onChange={e => setNewInvoiceData({ ...newInvoiceData, description: e.target.value })}
                    style={{ fontSize: '0.78rem', height: '32px' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>إجمالي الفاتورة (شامل الضريبة):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0"
                    dir="ltr"
                    value={newInvoiceData.subtotal}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNewInvoiceData({ ...newInvoiceData, subtotal: val });
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', fontWeight: 'bold' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>حالة الفاتورة:</label>
                  <select
                    className="form-control"
                    value={newInvoiceData.status}
                    onChange={e => setNewInvoiceData({ ...newInvoiceData, status: e.target.value })}
                    style={{ fontSize: '0.78rem', height: '32px' }}
                  >
                    <option value="غير مدفوعة">❌ غير مدفوعة</option>
                    <option value="جزئي">🟡 مدفوعة جزئياً</option>
                    <option value="مدفوعة">✅ مدفوعة بالكامل</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsAddInvoiceOpen(false)} className="btn btn-secondary btn-sm">إلغاء</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!newInvoiceData.subtotal || !newInvoiceData.description}>إنشاء الفاتورة</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Add Payment */}
        {isAddPaymentOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ maxWidth: '420px', width: '90%', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontWeight: 950 }}>💰 تسجيل دفعة مالية جديدة</h4>
                <button onClick={() => setIsAddPaymentOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><Icons.X size={16} /></button>
              </div>
              <form onSubmit={handleAddPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>ربط بالفاتورة الصادرة:</label>
                  <select
                    className="form-control"
                    value={newPaymentData.invoiceNumber}
                    onChange={e => setNewPaymentData({ ...newPaymentData, invoiceNumber: e.target.value })}
                    style={{ fontSize: '0.78rem', height: '32px' }}
                    required
                  >
                    <option value="">-- اختر الفاتورة --</option>
                    {clientInvoices.map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber}>{inv.invoiceNumber} - إجمالي: {inv.total}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>المبلغ المدفوع (ريال):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0"
                    dir="ltr"
                    value={newPaymentData.amount}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNewPaymentData({ ...newPaymentData, amount: val });
                    }}
                    style={{ fontSize: '0.78rem', height: '32px', fontWeight: 'bold' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>طريقة الدفع:</label>
                  <select
                    className="form-control"
                    value={newPaymentData.method}
                    onChange={e => setNewPaymentData({ ...newPaymentData, method: e.target.value })}
                    style={{ fontSize: '0.78rem', height: '32px' }}
                  >
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="نقداً">نقداً</option>
                    <option value="مدى">مدى</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800 }}>ملاحظات الدفعة:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="دفعة عربون، قسط ثان..."
                    value={newPaymentData.notes}
                    onChange={e => setNewPaymentData({ ...newPaymentData, notes: e.target.value })}
                    style={{ fontSize: '0.78rem', height: '32px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsAddPaymentOpen(false)} className="btn btn-secondary btn-sm">إلغاء</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!newPaymentData.amount || !newPaymentData.invoiceNumber}>حفظ الدفعة</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Statement Dialog / Print view */}
        {isStatementOpen && (
          <div className="modal-overlay no-print" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ maxWidth: '650px', width: '95%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontWeight: 950 }}>📊 كشف حساب العميل التفاعلي</h4>
                <button onClick={() => setIsStatementOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Icons.X size={16} /></button>
              </div>

              {/* Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px', padding: '10px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800 }}>تحديد الفترة:</label>
                  <select
                    className="form-control"
                    value={statementPeriod}
                    onChange={e => setStatementPeriod(e.target.value)}
                    style={{ fontSize: '0.74rem', height: '28px' }}
                  >
                    <option value="all">كل الفترات</option>
                    <option value="this_month">هذا الشهر</option>
                    <option value="last_month">الشهر السابق</option>
                    <option value="this_year">هذه السنة</option>
                    <option value="custom">فترة مخصصة</option>
                  </select>
                </div>
                {statementPeriod === 'custom' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800 }}>من:</label>
                      <input type="date" className="form-control" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ fontSize: '0.72rem', height: '28px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800 }}>إلى:</label>
                      <input type="date" className="form-control" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ fontSize: '0.72rem', height: '28px' }} />
                    </div>
                  </>
                )}
              </div>

              {/* Generated calculations for filtered period */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
                
                {/* Bookings */}
                <div>
                  <h5 style={{ fontWeight: 900, marginBottom: '6px' }}>📅 الحجوزات بالفترة ({getPeriodBookings().length})</h5>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '6px' }}>الحجز</th>
                        <th style={{ padding: '6px' }}>التاريخ</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>القيمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPeriodBookings().map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid var(--bg-main)' }}>
                          <td style={{ padding: '6px' }}>{b.title}</td>
                          <td style={{ padding: '6px' }}>{b.date}</td>
                          <td style={{ padding: '6px', textAlign: 'left', fontWeight: 800 }}>{formatCurrency(b.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Invoices */}
                <div>
                  <h5 style={{ fontWeight: 900, marginBottom: '6px' }}>🧾 الفواتير الصادرة بالفترة ({getPeriodInvoices().length})</h5>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '6px' }}>رقم الفاتورة</th>
                        <th style={{ padding: '6px' }}>التاريخ</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPeriodInvoices().map(inv => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--bg-main)' }}>
                          <td style={{ padding: '6px' }}>{inv.invoiceNumber}</td>
                          <td style={{ padding: '6px' }}>{inv.issueDate}</td>
                          <td style={{ padding: '6px', textAlign: 'left', fontWeight: 800 }}>{formatCurrency(inv.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Payments */}
                <div>
                  <h5 style={{ fontWeight: 900, marginBottom: '6px' }}>💰 الدفعات المسددة بالفترة ({getPeriodPayments().length})</h5>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '6px' }}>الفاتورة</th>
                        <th style={{ padding: '6px' }}>التاريخ</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>القيمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPeriodPayments().map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--bg-main)' }}>
                          <td style={{ padding: '6px' }}>{p.invoiceNumber}</td>
                          <td style={{ padding: '6px' }}>{p.date}</td>
                          <td style={{ padding: '6px', textAlign: 'left', fontWeight: 800, color: '#10b981' }}>+{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px' }}>
                <button onClick={handlePrintStatement} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icons.Printer size={13} />
                  <span>طباعة الكشف</span>
                </button>
                <button onClick={handleSendStatementWhatsApp} className="btn btn-success btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icons.MessageSquare size={13} />
                  <span>إرسال عبر الواتساب 💬</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // -------------------------------------------------------------
  // Default View: Client Directory Grid & Search (CRM directory)
  // -------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl' }}>
      
      {/* Search and addition control header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderRadius: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 950 }}>👥 دليل العملاء وإدارة العلاقات (CRM)</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>استعرض الحسابات الفردية والمؤسسات وتتبع تاريخ الحجوزات والمدفوعات</p>
        </div>
        <button onClick={() => setIsAddClientOpen(true)} className="btn btn-primary" style={{ height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Icons.UserPlus size={16} strokeWidth={2.5} />
          <span>+ إضافة عميل جديد</span>
        </button>
      </div>

      {/* Advanced search bar */}
      <div className="card" style={{ padding: '12px 16px', borderRadius: '12px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Icons.Search size={16} style={{ position: 'absolute', right: '12px', top: '11px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="ابحث بالاسم، الجوال، البريد، اسم الشركة المسؤول..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingRight: '36px', borderRadius: '50px', fontSize: '0.82rem', height: '38px' }}
          />
        </div>
      </div>

      {/* Client List directory grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '12px' }}>
        {getFilteredClients().length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            لا يوجد عملاء يطابقون معايير البحث المحددة.
          </div>
        ) : (
          getFilteredClients().map(c => {
            const bookingsCount = bookings?.filter(b => b.clientId === c.id || (b.bookingType === 'client' && b.clientName === c.name)).length || 0;
            const totalSpent = payments?.filter(p => p.clientName === c.name).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

            const clientBookings = bookings?.filter(b => b.clientId === c.id || (b.bookingType === 'client' && b.clientName === c.name)) || [];
            let isInactive = false;
            if (clientBookings.length > 0) {
              const sorted = [...clientBookings].sort((a, b) => (b.date || b.startDate).localeCompare(a.date || a.startDate));
              const lastDate = new Date(sorted[0].date || sorted[0].startDate);
              const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
              isInactive = diffDays >= 180;
            } else {
              isInactive = true;
            }

            return (
              <div
                key={c.id}
                className="card"
                onClick={() => setSelectedClientProfile(c)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  borderRight: '4px solid var(--primary-color)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.6rem' }}>{c.avatar || '👤'}</span>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{c.name}</h3>
                      {c.contactPerson && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>المسؤول: {c.contactPerson}</p>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge ${c.type === 'شركة' ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.66rem', fontWeight: 800 }}>
                      {c.type}
                    </span>
                    {isInactive && (
                      <span className="badge badge-danger" style={{ fontSize: '0.62rem', fontWeight: 800 }}>
                        ⚠️ خامل
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub details metrics */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-main)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>📞 رقم الجوال: <strong dir="ltr" style={{ color: 'var(--text-main)' }}>{c.phone}</strong></div>
                  <div>✉️ البريد: <strong>{c.email || '-'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
                    <span>📅 الحجوزات: <strong style={{ color: 'var(--text-main)' }}>{bookingsCount}</strong></span>
                    <span>💰 المسدد: <strong style={{ color: '#10b981' }}>{formatCurrency(totalSpent)}</strong></span>
                  </div>
                </div>

                {/* Bottom detail action link */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>آخر تعامل: {c.lastBookingDate || 'قريباً'}</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--primary-color)' }}>فتح الملف والـ CRM 👤 ↗</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Add Client */}
      {isAddClientOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', width: '90%', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950 }}>👥 تسجيل عميل جديد بالدليل</h3>
              <button onClick={() => setIsAddClientOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Icons.X size={18} /></button>
            </div>
            <form onSubmit={handleAddClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800 }}>تصنيف العميل:</label>
                <select className="form-control" value={newClient.type} onChange={e => setNewClient({ ...newClient, type: e.target.value })} style={{ height: '34px', fontSize: '0.8rem' }}>
                  <option value="فرد">فرد 👨</option>
                  <option value="شركة">شركة 🏢</option>
                  <option value="جهة">جهة حكومية/خاصة 🏛️</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800 }}>اسم العميل / الجهة *</label>
                <input type="text" className="form-control" required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} style={{ height: '34px', fontSize: '0.8rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800 }}>رقم الهاتف / الجوال *</label>
                <input type="text" className="form-control" required placeholder="05xxxxxxxx" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} style={{ height: '34px', fontSize: '0.8rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800 }}>البريد الإلكتروني:</label>
                <input type="email" className="form-control" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} style={{ height: '34px', fontSize: '0.8rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800 }}>اسم الشخص المسؤول:</label>
                <input type="text" className="form-control" value={newClient.contactPerson} onChange={e => setNewClient({ ...newClient, contactPerson: e.target.value })} style={{ height: '34px', fontSize: '0.8rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid var(--border-color)', marginTop: '10px', paddingTop: '12px' }}>
                <button type="button" onClick={() => setIsAddClientOpen(false)} className="btn btn-secondary btn-sm">إلغاء</button>
                <button type="submit" className="btn btn-primary btn-sm">حفظ العميل</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  function getStatusColor(st) {
    switch (st) {
      case 'مؤكد': return '#10b981';
      case 'بانتظار التأكيد': return '#f59e0b';
      case 'جاري التنفيذ': return '#3b82f6';
      case 'مكتمل': return '#8b5cf6';
      case 'ملغي': return '#ef4444';
      default: return '#3b82f6';
    }
  }
};

export default ClientsView;
