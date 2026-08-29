import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatCurrency, formatBookingNumber } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import * as Icons from 'lucide-react';

export const FinancialsView = () => {
  const { 
    invoices = [], 
    payments = [], 
    expenses = [], 
    clients = [], 
    bookings = [], 
    team = [], 
    addInvoice, 
    addPayment, 
    addExpense,
    addAuditLog,
    showCelebration,
    settings,
    userRole,
    currentUser
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('invoices'); // 'invoices' | 'payments' | 'expenses' | 'reports'
  const [isFinanceHidden, setIsFinanceHidden] = useState(true);

  const isSuper = userRole === 'admin' || currentUser?.isSupervisor || currentUser?.role?.includes('مشرف') || currentUser?.role?.includes('مدير') || currentUser?.id === 1;

  if (!isSuper) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.ShieldAlert size={28} color="var(--status-danger)" />
            </div>
          </div>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 900, marginBottom: '8px' }}>عذراً، هذا القسم غير مصرح لك بدخوله</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>هذه الصفحة تحتوي على معلومات مالية حساسة ومقتصرة فقط على المشرفين ومديري النظام.</p>
        </div>
      </div>
    );
  }
  
  // Modals visibility
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState(null);

  // Search & Filters
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  
  const [paymentSearch, setPaymentSearch] = useState('');
  
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  // New Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    invoiceNumber: (invoices && invoices[0]?.invoiceNumber) || '',
    clientName: (invoices && invoices[0]?.clientName) || '',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    method: 'تحويل بنكي',
    referenceNumber: '',
    notes: 'سداد دفعة'
  });

  // New Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'مواصلات',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    spentBy: (team && team[0]?.name) || 'عاهد العماري',
    notes: ''
  });

  // New Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: '',
    clientId: '',
    bookingId: '',
    issueDate: new Date().toISOString().substring(0, 10),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    items: [
      { id: 1, description: 'تغطية تصوير فوتوغرافي وفيديو', quantity: 1, price: 1000 }
    ],
    notes: 'شكراً لتعاملكم معنا. يرجى سداد المبلغ المستحق في غضون 7 أيام.'
  });

  // Financial calculations
  const totalInvoiced = useMemo(() => invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0), [invoices]);
  const totalPaid = useMemo(() => invoices.reduce((sum, inv) => sum + (Number(inv.paid) || 0), 0), [invoices]);
  const outstandingAmount = useMemo(() => totalInvoiced - totalPaid, [totalInvoiced, totalPaid]);
  const totalExpensesAmount = useMemo(() => expenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0), [expenses]);
  
  // Profit calculations
  const netProfit = totalPaid - totalExpensesAmount;
  const collectionRate = useMemo(() => totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0, [totalPaid, totalInvoiced]);
  const profitMargin = useMemo(() => totalPaid > 0 ? (netProfit / totalPaid) * 100 : 0, [netProfit, totalPaid]);

  // Expenses categories definition
  const expenseCategories = ['مواصلات', 'إيجار معدات', 'رواتب', 'إعاشة وضيافة', 'تسويق', 'صيانة', 'أخرى'];

  // Group expenses by category for Donut chart
  const expenseChartData = useMemo(() => {
    const categoriesMap = {};
    expenseCategories.forEach(cat => { categoriesMap[cat] = 0; });
    expenses.forEach(ex => {
      const cat = ex.category || 'أخرى';
      if (categoriesMap[cat] !== undefined) {
        categoriesMap[cat] += Number(ex.amount) || 0;
      } else {
        categoriesMap['أخرى'] = (categoriesMap['أخرى'] || 0) + (Number(ex.amount) || 0);
      }
    });

    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
    return Object.keys(categoriesMap)
      .map((cat, idx) => ({
        name: cat,
        value: categoriesMap[cat],
        color: colors[idx % colors.length]
      }))
      .filter(item => item.value > 0);
  }, [expenses]);

  // Dynamic monthly chart data for reports
  const monthlyChartData = useMemo(() => {
    // Basic baseline data for the prototype
    return [
      { name: 'مايو', إيرادات: 35000, مصروفات: 8000, أرباح: 27000 },
      { name: 'يونيو', إيرادات: 42000, مصروفات: 11000, أرباح: 31000 },
      { name: 'يوليو', إيرادات: 48000, مصروفات: 9500, أرباح: 38500 },
      { name: 'أغسطس (الحالي)', إيرادات: totalInvoiced, مصروفات: totalExpensesAmount, أرباح: netProfit }
    ];
  }, [totalInvoiced, totalExpensesAmount, netProfit]);

  // Filtered lists
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = (inv.invoiceNumber?.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
                             inv.clientName?.toLowerCase().includes(invoiceSearch.toLowerCase()));
      let matchesStatus = true;
      if (invoiceStatusFilter === 'paid') matchesStatus = inv.status === 'مدفوعة' || inv.status === 'مدفوع';
      else if (invoiceStatusFilter === 'partial') matchesStatus = inv.status === 'جزئي';
      else if (invoiceStatusFilter === 'unpaid') matchesStatus = inv.status === 'غير مدفوعة' || inv.status === 'غير مدفوع' || inv.status === 'متأخرة';
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, invoiceSearch, invoiceStatusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      return (p.invoiceNumber?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
              p.clientName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
              p.method?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
              (p.referenceNumber && p.referenceNumber.toLowerCase().includes(paymentSearch.toLowerCase())));
    });
  }, [payments, paymentSearch]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(ex => {
      const matchesSearch = (ex.title?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                             ex.spentBy?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                             (ex.notes && ex.notes.toLowerCase().includes(expenseSearch.toLowerCase())));
      const matchesCategory = expenseCategoryFilter === 'all' || ex.category === expenseCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, expenseSearch, expenseCategoryFilter]);

  // Handle Payment Submit
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.invoiceNumber) return;
    
    const amountNum = Number(paymentForm.amount);
    
    // Update invoice paid amount in AppContext
    const relatedInvoice = invoices.find(inv => inv.invoiceNumber === paymentForm.invoiceNumber);
    if (relatedInvoice) {
      const newPaid = (Number(relatedInvoice.paid) || 0) + amountNum;
      const isFullyPaid = newPaid >= Number(relatedInvoice.total);
      
      const updatedFields = {
        paid: newPaid,
        status: isFullyPaid ? 'مدفوعة' : 'جزئي'
      };
      
      // Update the invoice in context state
      const updatedInvoicesList = invoices.map(inv => 
        inv.id === relatedInvoice.id ? { ...inv, ...updatedFields } : inv
      );
      
      // Save payment
      if (addPayment) {
        addPayment({
          ...paymentForm,
          amount: amountNum,
          clientName: relatedInvoice.clientName
        });
      }
      
      // Update invoices context list directly
      if (addAuditLog) {
        addAuditLog('استلام دفعة', `تم استلام دفعة بقيمة ${formatCurrency(amountNum)} للفاتورة ${paymentForm.invoiceNumber}`, '💰');
      }
    }
    
    setIsPaymentModalOpen(false);
    // Reset form
    setPaymentForm({
      invoiceNumber: invoices[0]?.invoiceNumber || '',
      clientName: invoices[0]?.clientName || '',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      method: 'تحويل بنكي',
      referenceNumber: '',
      notes: 'سداد دفعة'
    });
  };

  // Handle Expense Submit
  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.title) return;

    if (addExpense) {
      addExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount)
      });
    }

    if (addAuditLog) {
      addAuditLog('تسجيل مصروفات', `تم تسجيل مصروف جديد بقيمة ${formatCurrency(expenseForm.amount)}: ${expenseForm.title}`, '💸');
    }

    if (showCelebration) {
      showCelebration('تم تسجيل المصروف المالي بنجاح! 💸');
    }

    setIsExpenseModalOpen(false);
    // Reset form
    setExpenseForm({
      title: '',
      category: 'مواصلات',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      spentBy: team[0]?.name || 'عاهد العماري',
      notes: ''
    });
  };

  // Handle Invoice Line Items Changes
  const handleAddLineItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveLineItem = (itemId) => {
    if (invoiceForm.items.length <= 1) return; // Must keep at least one
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleLineItemChange = (itemId, field, value) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedValue = (field === 'quantity' || field === 'price') ? Number(value) : value;
          return { ...item, [field]: updatedValue };
        }
        return item;
      })
    }));
  };

  // Calculate temporary invoice totals dynamically for the form
  const computedInvoiceTotals = useMemo(() => {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    const taxRate = 15; // 15% Standard VAT
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxRate, taxAmount, total };
  }, [invoiceForm.items]);

  // Handle Linked Booking Change
  const handleLinkedBookingChange = (bookingId) => {
    if (!bookingId) {
      setInvoiceForm(prev => ({ ...prev, bookingId: '', clientName: '', clientId: '' }));
      return;
    }
    const booking = bookings.find(b => b.id === Number(bookingId));
    if (booking) {
      // Calculate subtotal from booking.totalPrice (totalPrice / 1.15) to make totals match
      const bookingTotal = booking.totalPrice || 0;
      const subtotal = Math.round((bookingTotal / 1.15) * 100) / 100;
      
      setInvoiceForm(prev => ({
        ...prev,
        bookingId: bookingId,
        clientName: booking.clientName,
        clientId: booking.clientId || '',
        items: [
          {
            id: Date.now(),
            description: `تغطية وتصوير: ${booking.title}`,
            quantity: 1,
            price: subtotal
          }
        ]
      }));
    }
  };

  // Handle Invoice Submit
  const handleInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!invoiceForm.clientName || invoiceForm.items.some(item => !item.description || item.price <= 0)) {
      alert('الرجاء التأكد من تعبئة جميع بنود الفاتورة وإدخال اسم العميل بشكل صحيح.');
      return;
    }

    const { subtotal, taxRate, taxAmount, total } = computedInvoiceTotals;

    if (addInvoice) {
      addInvoice({
        clientName: invoiceForm.clientName,
        bookingId: invoiceForm.bookingId ? Number(invoiceForm.bookingId) : null,
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        paid: 0,
        status: 'غير مدفوعة',
        notes: invoiceForm.notes,
        items: invoiceForm.items
      });
    }

    if (addAuditLog) {
      addAuditLog('إنشاء فاتورة', `تم إنشاء فاتورة مبيعات جديدة للعميل ${invoiceForm.clientName} بقيمة ${formatCurrency(total)}`, '📄');
    }

    if (showCelebration) {
      showCelebration('تم إنشاء الفاتورة الضريبية بنجاح! 📄');
    }

    setIsInvoiceModalOpen(false);
    // Reset Invoice form
    setInvoiceForm({
      clientName: '',
      clientId: '',
      bookingId: '',
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      items: [{ id: Date.now(), description: 'تغطية تصوير فوتوغرافي وفيديو', quantity: 1, price: 1000 }],
      notes: 'شكراً لتعاملكم معنا. يرجى سداد المبلغ المستحق في غضون 7 أيام.'
    });
  };

  // Export to CSV Function
  const exportToCSV = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Adds BOM for Excel RTL Arabic
    
    if (type === 'invoices') {
      csvContent += "رقم الفاتورة,العميل,تاريخ الإصدار,تاريخ الاستحقاق,المجموع الفرعي,مبلغ الضريبة (15%),الإجمالي النهائي,المدفوع,المتبقي,الحالة\n";
      filteredInvoices.forEach(inv => {
        const remaining = inv.total - inv.paid;
        csvContent += `"${inv.invoiceNumber}","${inv.clientName}","${inv.issueDate}","${inv.dueDate}",${inv.subtotal},${inv.taxAmount},${inv.total},${inv.paid},${remaining},"${inv.status}"\n`;
      });
    } else if (type === 'payments') {
      csvContent += "رقم العملية,رقم الفاتورة,اسم العميل,المبلغ المدفوع,التاريخ,طريقة الدفع,الرقم المرجعي,ملاحظات\n";
      filteredPayments.forEach(p => {
        csvContent += `#PAY-${p.id},"${p.invoiceNumber}","${p.clientName}",${p.amount},"${p.date}","${p.method}","${p.referenceNumber || 'لا يوجد'}","${p.notes || ''}"\n`;
      });
    } else if (type === 'expenses') {
      csvContent += "اسم المصروف,الفئة,المبلغ,التاريخ,المسؤول,ملاحظات\n";
      filteredExpenses.forEach(ex => {
        csvContent += `"${ex.title}","${ex.category}",${ex.amount},"${ex.date}","${ex.spentBy}","${ex.notes || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showCelebration) {
      showCelebration('تم تصدير البيانات بنجاح! 📥');
    }
  };

  const renderSettlementsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Photographers and Freelancers Settlements */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 950, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Users size={18} style={{ color: 'var(--primary-color)' }} />
            <span>👥 كشوفات مستحقات طاقم العمل والمصورين</span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px' }}>الاسم</th>
                  <th style={{ padding: '12px' }}>الدور</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>المهام المنجزة</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>المستحقات</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>المدفوع</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {team.map(member => {
                  const memberTasks = bookings.filter(b => (b.teamAssigned || b.teamMemberIds || []).includes(member.id));
                  const count = memberTasks.length;
                  const estimatedPay = count * 350; // Flat rate of 350 per shoot for prototype
                  const paid = count * 200; // Flat paid
                  const remaining = estimatedPay - paid;

                  return (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 800 }}>{member.name}</td>
                      <td style={{ padding: '12px' }}>{member.role || 'مصور'}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'Inter' }}>{count}</td>
                      <td style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-color)', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(estimatedPay)}</td>
                      <td style={{ padding: '12px', textAlign: 'left', color: '#10b981', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(paid)}</td>
                      <td style={{ padding: '12px', textAlign: 'left', color: remaining > 0 ? '#ef4444' : '#10b981', fontWeight: 800, fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(remaining)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company Partnerships Settlements */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 950, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Building2 size={18} style={{ color: 'var(--secondary-color)' }} />
            <span>🏢 كشوفات تسويات الشركات والشركاء</span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px' }}>اسم الشركة</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>عدد التغطيات</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>إجمالي الفواتير</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>المبالغ المسددة</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>الرصيد المعلق</th>
                </tr>
              </thead>
              <tbody>
                {bookings.filter(b => b.bookingType === 'company').reduce((acc, curr) => {
                  const exist = acc.find(x => x.companyName === curr.companyName);
                  if (exist) {
                    exist.count += 1;
                    exist.total += Number(curr.totalPrice) || 0;
                    exist.paid += Number(curr.paidAmount) || 0;
                  } else if (curr.companyName) {
                    acc.push({
                      companyName: curr.companyName,
                      count: 1,
                      total: Number(curr.totalPrice) || 0,
                      paid: Number(curr.paidAmount) || 0
                    });
                  }
                  return acc;
                }, []).map((company, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 800 }}>{company.companyName}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'Inter' }}>{company.count}</td>
                    <td style={{ padding: '12px', textAlign: 'left', fontWeight: 700, fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(company.total)}</td>
                    <td style={{ padding: '12px', textAlign: 'left', color: '#10b981', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(company.paid)}</td>
                    <td style={{ padding: '12px', textAlign: 'left', color: (company.total - company.paid) > 0 ? '#ef4444' : '#10b981', fontWeight: 800, fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(company.total - company.paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Sub-Header Navigation */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'invoices', label: 'الفواتير', icon: Icons.Receipt },
            { id: 'payments', label: 'المدفوعات والمتحصلات', icon: Icons.CreditCard },
            { id: 'expenses', label: 'المصروفات والنفقات', icon: Icons.TrendingDown },
            { id: 'reports', label: 'التقارير المتقدمة والتحليلات', icon: Icons.BarChart3 },
            { id: 'statements', label: 'كشوفات حساب المصورين والشركاء', icon: Icons.Handshake }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Action Buttons based on Tab */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsFinanceHidden(!isFinanceHidden)}
            className="btn btn-secondary"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              backgroundColor: isFinanceHidden ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              color: isFinanceHidden ? '#f87171' : '#34d399',
              fontWeight: 800,
              fontSize: '0.82rem',
              transition: 'all 0.2s'
            }}
            title={isFinanceHidden ? "إظهار المبالغ المالية" : "إخفاء المبالغ المالية"}
          >
            {isFinanceHidden ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
            <span>{isFinanceHidden ? "إظهار المبالغ" : "إخفاء المبالغ"}</span>
          </button>

          {activeSubTab === 'invoices' && (
            <>
              <button onClick={() => exportToCSV('invoices')} className="btn btn-secondary">
                <Icons.Download size={18} />
                <span>تصدير CSV</span>
              </button>
              <button onClick={() => setIsInvoiceModalOpen(true)} className="btn btn-primary">
                <Icons.Plus size={18} />
                <span>إنشاء فاتورة جديدة 📄</span>
              </button>
            </>
          )}
          {activeSubTab === 'payments' && (
            <>
              <button onClick={() => exportToCSV('payments')} className="btn btn-secondary">
                <Icons.Download size={18} />
                <span>تصدير CSV</span>
              </button>
              <button onClick={() => setIsPaymentModalOpen(true)} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                <Icons.Plus size={18} />
                <span>تسجيل دفعة جديدة 💰</span>
              </button>
            </>
          )}
          {activeSubTab === 'expenses' && (
            <>
              <button onClick={() => exportToCSV('expenses')} className="btn btn-secondary">
                <Icons.Download size={18} />
                <span>تصدير CSV</span>
              </button>
              <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-danger" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}>
                <Icons.Plus size={18} />
                <span>تسجيل مصروف جديد 💸</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Enhanced Financial Stat Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ borderRight: '5px solid var(--primary-color)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الفواتير الصادرة</span>
              <button
                type="button"
                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                title={isFinanceHidden ? "إظهار المبالغ" : "إخفاء المبالغ"}
              >
                {isFinanceHidden ? <Icons.EyeOff size={15} /> : <Icons.Eye size={15} />}
              </button>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(totalInvoiced)}</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>المستحقات غير المحصلة</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-warning)' }}>{isFinanceHidden ? "••••••" : formatCurrency(outstandingAmount)}</span>
          </div>
        </div>
        <div className="card" style={{ borderRight: '5px solid #10b981', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المبالغ المحصلة (السيولة المتوفرة)</span>
              <button
                type="button"
                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                title={isFinanceHidden ? "إظهار المبالغ" : "إخفاء المبالغ"}
              >
                {isFinanceHidden ? <Icons.EyeOff size={15} /> : <Icons.Eye size={15} />}
              </button>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '6px', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(totalPaid)}</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>نسبة التحصيل الفعلي</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>{collectionRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="card" style={{ borderRight: '5px solid #ef4444', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المصروفات والنفقات</span>
              <button
                type="button"
                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                title={isFinanceHidden ? "إظهار المبالغ" : "إخفاء المبالغ"}
              >
                {isFinanceHidden ? <Icons.EyeOff size={15} /> : <Icons.Eye size={15} />}
              </button>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '6px', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(totalExpensesAmount)}</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>نسبة النفقات للسيولة</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444' }}>{totalPaid > 0 ? ((totalExpensesAmount / totalPaid) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
        <div className="card" style={{ borderRight: '5px solid #8b5cf6', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>صافي الأرباح (السيولة المحققة)</span>
              <button
                type="button"
                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                title={isFinanceHidden ? "إظهار المبالغ" : "إخفاء المبالغ"}
              >
                {isFinanceHidden ? <Icons.EyeOff size={15} /> : <Icons.Eye size={15} />}
              </button>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6', marginTop: '6px', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(netProfit)}</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>هامش الربح التشغيلي</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#8b5cf6' }}>{profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* 3. Invoices Tab View */}
      {activeSubTab === 'invoices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Filters block */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', padding: '14px' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ابحث برقم الفاتورة، أو اسم العميل..." 
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                style={{ width: '100%', paddingRight: '36px' }}
              />
              <Icons.Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Icons.Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select 
                className="form-control" 
                value={invoiceStatusFilter} 
                onChange={e => setInvoiceStatusFilter(e.target.value)}
                style={{ minWidth: '160px' }}
              >
                <option value="all">كل الفواتير</option>
                <option value="paid">مدفوعة بالكامل</option>
                <option value="partial">مدفوعة جزئياً</option>
                <option value="unpaid">غير مدفوعة/متأخرة</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  <th style={{ padding: '14px' }}>رقم الفاتورة</th>
                  <th style={{ padding: '14px' }}>اسم العميل</th>
                  <th style={{ padding: '14px' }}>تاريخ الإصدار</th>
                  <th style={{ padding: '14px' }}>تاريخ الاستحقاق</th>
                  <th style={{ padding: '14px' }}>الإجمالي النهائي (شامل 15%)</th>
                  <th style={{ padding: '14px' }}>المدفوع</th>
                  <th style={{ padding: '14px' }}>المتبقي</th>
                  <th style={{ padding: '14px' }}>الحالة</th>
                  <th style={{ padding: '14px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map(inv => {
                    const remaining = inv.total - inv.paid;
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '14px' }}><strong>{inv.invoiceNumber}</strong></td>
                        <td style={{ padding: '14px' }}>{inv.clientName}</td>
                        <td style={{ padding: '14px' }} className="en-digits">{inv.issueDate}</td>
                        <td style={{ padding: '14px' }} className="en-digits">{inv.dueDate}</td>
                        <td style={{ padding: '14px' }}><strong>{isFinanceHidden ? "••••••" : formatCurrency(inv.total || 0)}</strong></td>
                        <td style={{ padding: '14px', color: '#10b981', fontWeight: 700 }}>{isFinanceHidden ? "••••••" : formatCurrency(inv.paid || 0)}</td>
                        <td style={{ padding: '14px', color: remaining > 0 ? 'var(--status-warning)' : 'var(--text-muted)', fontWeight: 700 }}>{isFinanceHidden ? "••••••" : formatCurrency(remaining)}</td>
                        <td style={{ padding: '14px' }}><StatusBadge status={inv.status} /></td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedInvoiceForPDF(inv)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '6px 12px', borderRadius: '6px' }}
                          >
                            <Icons.FileText size={14} style={{ marginLeft: '4px' }} />
                            معاينة وطباعة ZATCA 📄
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد فواتير مطابقة للبحث.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Payments Tab View */}
      {activeSubTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search block */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', padding: '14px' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ابحث برقم الفاتورة، اسم العميل، طريقة الدفع أو الرقم المرجعي..." 
                value={paymentSearch}
                onChange={e => setPaymentSearch(e.target.value)}
                style={{ width: '100%', paddingRight: '36px' }}
              />
              <Icons.Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Payments Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  <th style={{ padding: '14px' }}>رقم العملية</th>
                  <th style={{ padding: '14px' }}>الفاتورة المرتبطة</th>
                  <th style={{ padding: '14px' }}>اسم العميل</th>
                  <th style={{ padding: '14px' }}>المبلغ المدفوع</th>
                  <th style={{ padding: '14px' }}>التاريخ</th>
                  <th style={{ padding: '14px' }}>طريقة الدفع</th>
                  <th style={{ padding: '14px' }}>الرقم المرجعي</th>
                  <th style={{ padding: '14px' }}>ملاحظات الدفعة</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px' }} className="en-digits">#PAY-{p.id}</td>
                      <td style={{ padding: '14px' }}><strong>{p.invoiceNumber}</strong></td>
                      <td style={{ padding: '14px' }}>{p.clientName}</td>
                      <td style={{ padding: '14px' }}><strong style={{ color: '#10b981' }}>{isFinanceHidden ? "••••••" : formatCurrency(p.amount || 0)}</strong></td>
                      <td style={{ padding: '14px' }} className="en-digits">{p.date}</td>
                      <td style={{ padding: '14px' }}><span className="badge badge-info">{p.method}</span></td>
                      <td style={{ padding: '14px' }} className="en-digits" dir="ltr">{p.referenceNumber || 'N/A'}</td>
                      <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{p.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد عمليات تحصيل مسجلة.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Expenses Tab View */}
      {activeSubTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Filters */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', padding: '14px' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ابحث باسم المصروف، ملاحظات أو الشخص المسؤول..." 
                value={expenseSearch}
                onChange={e => setExpenseSearch(e.target.value)}
                style={{ width: '100%', paddingRight: '36px' }}
              />
              <Icons.Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Icons.Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select 
                className="form-control" 
                value={expenseCategoryFilter} 
                onChange={e => setExpenseCategoryFilter(e.target.value)}
                style={{ minWidth: '160px' }}
              >
                <option value="all">كل الفئات</option>
                {expenseCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  <th style={{ padding: '14px' }}>اسم المصروف وموضوعه</th>
                  <th style={{ padding: '14px' }}>الفئة والتصنيف</th>
                  <th style={{ padding: '14px' }}>مبلغ المصروف</th>
                  <th style={{ padding: '14px' }}>تاريخ الصرف</th>
                  <th style={{ padding: '14px' }}>بواسطة (الموظف)</th>
                  <th style={{ padding: '14px' }}>الملاحظات التفصيلية</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map(ex => (
                    <tr key={ex.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px' }}><strong>{ex.title}</strong></td>
                      <td style={{ padding: '14px' }}><span className="badge badge-neutral">{ex.category}</span></td>
                      <td style={{ padding: '14px' }}><strong style={{ color: '#ef4444' }}>{isFinanceHidden ? "••••••" : formatCurrency(ex.amount || 0)}</strong></td>
                      <td style={{ padding: '14px' }} className="en-digits">{ex.date}</td>
                      <td style={{ padding: '14px' }}>👤 {ex.spentBy}</td>
                      <td style={{ padding: '14px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{ex.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد مصروفات مسجلة تطابق التصفية.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'statements' && renderSettlementsTab()}

      {/* 6. Reports & Advanced Analytics Tab View */}
      {activeSubTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Chart 1: Revenue vs Expenses */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.BarChart3 size={18} style={{ color: 'var(--primary-color)' }} />
                  تحليل التدفق النقدي الشهري (ريال)
                </h3>
              </div>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip formatter={(val) => [`${val.toLocaleString('en-US')} ريال`, '']} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)', direction: 'rtl' }} />
                    <Bar dataKey="إيرادات" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="مصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="أرباح" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Expenses Breakdown by Category */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.TrendingDown size={18} style={{ color: '#ef4444' }} />
                توزيع النفقات والمصروفات حسب الفئة
              </h3>
              
              {expenseChartData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', height: '100%' }}>
                  <div style={{ width: '180px', height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => `${val.toLocaleString('en-US')} ريال`} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '150px' }}>
                    {expenseChartData.map((item, index) => {
                      const percentage = ((item.value / totalExpensesAmount) * 100).toFixed(1);
                      return (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{percentage}% ({isFinanceHidden ? "••••••" : formatCurrency(item.value)})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  لا توجد مصروفات مسجلة لتحليلها حالياً.
                </div>
              )}
            </div>
          </div>
          
          {/* Top Clients Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>👥 قائمة العملاء الأكثر تحقيقاً للإيرادات</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                    <th style={{ padding: '10px' }}>العميل</th>
                    <th style={{ padding: '10px' }}>النوع</th>
                    <th style={{ padding: '10px' }}>عدد الحجوزات</th>
                    <th style={{ padding: '10px' }}>إجمالي ما أنفقه (السيولة المستلمة)</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px' }}><strong>{c.name}</strong> ({c.contactPerson})</td>
                      <td style={{ padding: '10px' }}><span className="badge badge-neutral">{c.type}</span></td>
                      <td style={{ padding: '10px' }}>{c.bookingsCount} حجز</td>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#10b981' }}>{isFinanceHidden ? "••••••" : formatCurrency(c.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODALS SECTION */}
      
      {/* Modal 1: Create New Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInvoiceModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>📄 إنشاء فاتورة مبيعات جديدة</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsInvoiceModalOpen(false)}><Icons.X size={18} /></button>
            </div>
            
            <form onSubmit={handleInvoiceSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Link with Booking */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">ربط بحجز قائم (اختياري)</label>
                    <select
                      className="form-control"
                      value={invoiceForm.bookingId}
                      onChange={e => handleLinkedBookingChange(e.target.value)}
                    >
                      <option value="">-- اختر الحجز لملء البيانات تلقائياً --</option>
                      {bookings.map(b => (
                        <option key={b.id} value={b.id}>
                          {formatBookingNumber(b.bookingNumber)} - {b.title} ({isFinanceHidden ? "••••••" : formatCurrency(b.totalPrice)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Client Name */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">اسم العميل *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="أدخل اسم العميل أو حدده" 
                      value={invoiceForm.clientName} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })} 
                      list="clients-datalist"
                    />
                    <datalist id="clients-datalist">
                      {clients.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Issue Date */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ الإصدار</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required
                      value={invoiceForm.issueDate} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })} 
                    />
                  </div>

                  {/* Due Date */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ الاستحقاق</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required
                      value={invoiceForm.dueDate} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Line Items Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>📝 بنود وتفاصيل الفاتورة</label>
                    <button 
                      type="button" 
                      onClick={handleAddLineItem} 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      <Icons.Plus size={14} /> إضافة بند جديد
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {invoiceForm.items.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{idx + 1}</span>
                        
                        <input 
                          type="text" 
                          placeholder="وصف وتفاصيل البند (مثال: تصوير فوتوغرافي للحفل...)" 
                          className="form-control" 
                          style={{ flex: 3 }}
                          required
                          value={item.description}
                          onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                        />
                        
                        <input 
                          type="number" 
                          placeholder="الكمية" 
                          className="form-control" 
                          style={{ flex: 1, minWidth: '70px' }}
                          required
                          min="1"
                          value={item.quantity}
                          onChange={e => handleLineItemChange(item.id, 'quantity', e.target.value)}
                        />
                        
                        <input 
                          type="number" 
                          placeholder="السعر (ريال)" 
                          className="form-control" 
                          style={{ flex: 1.5, minWidth: '100px' }}
                          required
                          min="0"
                          value={item.price}
                          onChange={e => handleLineItemChange(item.id, 'price', e.target.value)}
                        />

                        <button 
                          type="button" 
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="btn btn-icon btn-danger"
                          style={{ width: '36px', height: '36px', padding: 0 }}
                          disabled={invoiceForm.items.length <= 1}
                        >
                          <Icons.Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal and VAT preview */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '250px', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>المجموع الفرعي:</span>
                      <strong>{formatCurrency(computedInvoiceTotals.subtotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>الضريبة (15%):</span>
                      <span>{formatCurrency(computedInvoiceTotals.taxAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '0.85rem' }}>
                      <span>الإجمالي شامل الضريبة:</span>
                      <strong style={{ color: 'var(--primary-color)', fontSize: '0.95rem' }}>{formatCurrency(computedInvoiceTotals.total)}</strong>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">ملاحظات وشروط الفاتورة</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    value={invoiceForm.notes} 
                    onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  />
                </div>

              </div>
              
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ وإصدار الفاتورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create New Payment Modal */}
      {isPaymentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>💰 تسجيل دفعة تحصيل جديدة</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsPaymentModalOpen(false)}><Icons.X size={18} /></button>
            </div>
            
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">الفاتورة المرتبطة *</label>
                  <select
                    className="form-control"
                    required
                    value={paymentForm.invoiceNumber}
                    onChange={e => {
                      const inv = invoices.find(i => i.invoiceNumber === e.target.value);
                      setPaymentForm({ 
                        ...paymentForm, 
                        invoiceNumber: e.target.value, 
                        clientName: inv ? inv.clientName : '' 
                      });
                    }}
                  >
                    <option value="">-- اختر الفاتورة المطلوب تحصيلها --</option>
                    {invoices.map(inv => {
                      const remaining = inv.total - inv.paid;
                      return (
                        <option key={inv.id} value={inv.invoiceNumber}>
                          {inv.invoiceNumber} - {inv.clientName} (المتبقي: {isFinanceHidden ? "••••••" : formatCurrency(remaining)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">المبلغ المدفوع (ريال) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    min="1"
                    value={paymentForm.amount} 
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">طريقة الدفع *</label>
                    <select 
                      className="form-control" 
                      value={paymentForm.method} 
                      onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    >
                      <option value="تحويل بنكي">تحويل بنكي 🏦</option>
                      <option value="مدى">بطاقة مدى 💳</option>
                      <option value="Apple Pay">Apple Pay 📱</option>
                      <option value="نقداً">نقداً 💵</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">الرقم المرجعي للعملية</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="مثال: TRX-889128" 
                      value={paymentForm.referenceNumber} 
                      onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">تاريخ التحصيل</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required
                    value={paymentForm.date} 
                    onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} 
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">ملاحظات إضافية</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={paymentForm.notes} 
                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} 
                  />
                </div>

              </div>
              
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-success" style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#ffffff' }}>تأكيد وتسجيل الدفعة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>💸 تسجيل مصروف ونفقة جديدة</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsExpenseModalOpen(false)}><Icons.X size={18} /></button>
            </div>
            
            <form onSubmit={handleExpenseSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">بيان وموضوع المصروف *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="مثال: وقود لسيارات فريق التصوير، استئجار كشاف إضاءة..." 
                    value={expenseForm.title} 
                    onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">الفئة والتصنيف *</label>
                    <select 
                      className="form-control" 
                      value={expenseForm.category} 
                      onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    >
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">المبلغ (ريال) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="1"
                      value={expenseForm.amount} 
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ الصرف *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required
                      value={expenseForm.date} 
                      onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} 
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">بواسطة (الموظف المسؤول)</label>
                    <select
                      className="form-control"
                      value={expenseForm.spentBy}
                      onChange={e => setExpenseForm({ ...expenseForm, spentBy: e.target.value })}
                    >
                      {team.map(member => (
                        <option key={member.id} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">ملاحظات وتفاصيل أخرى</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="شرح مبسط للغرض من المصروف للرجوع له لاحقاً..."
                    value={expenseForm.notes} 
                    onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} 
                  />
                </div>

              </div>
              
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-danger" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }}>تسجيل المصروف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: ZATCA simplified tax invoice Preview & Print Modal */}
      {selectedInvoiceForPDF && (
        <div className="modal-overlay" onClick={() => setSelectedInvoiceForPDF(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', backgroundColor: '#ffffff', color: '#0f172a', padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
            
            {/* Modal actions bar (hidden in prints) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} className="no-print-bar">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>
                🧾 معاينة الفاتورة الضريبية المبسطة ZATCA
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => window.print()} 
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  <Icons.Printer size={16} />
                  <span>طباعة وحفظ كـ PDF</span>
                </button>
                <button 
                  className="btn btn-icon btn-secondary" 
                  style={{ width: '34px', height: '34px', padding: 0 }} 
                  onClick={() => setSelectedInvoiceForPDF(null)}
                >
                  <Icons.X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div style={{ padding: '35px 30px', fontFamily: "'Cairo', 'Inter', sans-serif" }} className="print-invoice-container">
              
              {/* Dual Language Header Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #6366f1', paddingBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4f46e5', margin: 0 }}>
                    {(settings && settings.general?.companyName) || 'مؤسسة استوديو عاهد العماري للإنتاج'}
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#475569', margin: '4px 0 0 0', fontWeight: 600 }}>
                    الرقم الضريبي / VAT: 310992817200003
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    الرياض، المملكة العربية السعودية | Riyadh, KSA
                  </p>
                </div>
                
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontWeight: 900, fontSize: '1.2rem', margin: 0, color: '#1e293b' }}>فاتورة ضريبية مبسطة</h3>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: '2px 0 0 0', color: '#64748b' }}>Simplified Tax Invoice</h4>
                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: '6px 0 0 0', fontWeight: 700 }}>
                    الرقم / No: <span className="en-digits" style={{ color: '#4f46e5' }}>{selectedInvoiceForPDF.invoiceNumber}</span>
                  </p>
                </div>
              </div>

              {/* Invoice Metadata block */}
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', fontSize: '0.85rem', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b' }}>فاتورة إلى / Invoice To:</td>
                        <td style={{ padding: '3px 0', fontWeight: 800 }}>{selectedInvoiceForPDF.clientName}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b' }}>البريد الإلكتروني / Email:</td>
                        <td style={{ padding: '3px 0' }}>{selectedInvoiceForPDF.clientEmail || '-'}</td>
                      </tr>
                      {selectedInvoiceForPDF.bookingId && (
                        <tr>
                          <td style={{ padding: '3px 0', color: '#64748b' }}>مرجع الحجز / Booking Ref:</td>
                          <td style={{ padding: '3px 0', fontWeight: 600 }}>BK-2026-{selectedInvoiceForPDF.bookingId}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b' }}>تاريخ الإصدار / Date:</td>
                        <td style={{ padding: '3px 0', fontWeight: 700 }} className="en-digits">{selectedInvoiceForPDF.issueDate}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b' }}>تاريخ الاستحقاق / Due:</td>
                        <td style={{ padding: '3px 0', fontWeight: 700 }} className="en-digits">{selectedInvoiceForPDF.dueDate}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b' }}>الحالة / Status:</td>
                        <td style={{ padding: '3px 0', fontWeight: 800 }}>
                          <span style={{ 
                            color: selectedInvoiceForPDF.status === 'مدفوعة' ? '#10b981' : '#f59e0b',
                            backgroundColor: selectedInvoiceForPDF.status === 'مدفوعة' ? '#d1fae5' : '#fef3c7',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.74rem'
                          }}>
                            {selectedInvoiceForPDF.status}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px', textAlign: 'right', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '10px 8px', width: '40px' }}>#</th>
                    <th style={{ padding: '10px 8px' }}>البيان والتفاصيل / Description</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '60px' }}>الكمية / Qty</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', width: '130px' }}>معدل الوحدة / Rate</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', width: '130px' }}>المجموع / Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoiceForPDF.items && selectedInvoiceForPDF.items.length > 0 ? (
                    selectedInvoiceForPDF.items.map((item, idx) => {
                      const totalItem = (item.quantity || 0) * (item.price || 0);
                      return (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 8px' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <strong>{item.description || 'خدمات تصوير وتغطية حفلات ومناسبات'}</strong>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'left' }} className="en-digits">{formatCurrency(item.price)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'left' }} className="en-digits"><strong>{formatCurrency(totalItem)}</strong></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px' }}>1</td>
                      <td style={{ padding: '12px 8px' }}>
                        <strong>خدمات تغطية وتصوير فوتوغرافي وفيديو وكاميرات طائرة للمناسبة</strong>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          Photography, Videography & Aerial Drone Coverage
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '12px 8px', textAlign: 'left' }} className="en-digits">{formatCurrency(selectedInvoiceForPDF.subtotal)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'left' }} className="en-digits"><strong>{formatCurrency(selectedInvoiceForPDF.subtotal)}</strong></td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals Summary and QR Code section */}
              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
                
                {/* ZATCA Compliant QR Code Mockup (Vector drawing, renders perfectly in print) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ border: '2px solid #e2e8f0', padding: '6px', borderRadius: '8px', backgroundColor: '#ffffff', width: '125px', height: '125px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="110" height="110" viewBox="0 0 100 100" style={{ shapeRendering: 'crispEdges' }}>
                      {/* Outer boundary */}
                      <path d="M0,0 h30 v6 h-24 v24 h-6 z M70,0 h30 v30 h-6 v-24 h-24 z M0,70 h6 v24 h24 v6 h-30 z M70,94 v-24 h30 v30 h-30 z" fill="#0f172a" />
                      {/* Top Left square */}
                      <rect x="6" y="6" width="18" height="18" fill="#0f172a" />
                      <rect x="10" y="10" width="10" height="10" fill="#ffffff" />
                      <rect x="12" y="12" width="6" height="6" fill="#0f172a" />
                      {/* Top Right square */}
                      <rect x="76" y="6" width="18" height="18" fill="#0f172a" />
                      <rect x="80" y="80" width="10" height="10" fill="#ffffff" />
                      <rect x="82" y="12" width="6" height="6" fill="#0f172a" />
                      {/* Bottom Left square */}
                      <rect x="6" y="76" width="18" height="18" fill="#0f172a" />
                      <rect x="10" y="80" width="10" height="10" fill="#ffffff" />
                      <rect x="12" y="82" width="6" height="6" fill="#0f172a" />
                      {/* Center alignment square */}
                      <rect x="76" y="76" width="18" height="18" fill="#0f172a" />
                      <rect x="80" y="80" width="10" height="10" fill="#ffffff" />
                      <rect x="82" y="82" width="6" height="6" fill="#0f172a" />
                      {/* Simulated ZATCA digital signature grid */}
                      <path d="M35,6 h6 v6 h-6 z M45,6 h10 v6 h-10 z M60,6 h8 v12 h-8 z M35,16 h14 v6 h-14 z M55,16 h12 v6 h-12 z M35,26 h10 v6 h-10 z M50,26 h18 v6 h-18 z M6,35 h24 v6 h-24 z M35,35 h8 v12 h-8 z M48,35 h14 v6 h-14 z M68,35 h26 v6 h-26 z M6,45 h10 v6 h-10 z M22,45 h20 v6 h-20 z M48,45 h16 v12 h-16 z M70,45 h24 v6 h-24 z M6,55 h30 v6 h-30 z M40,55 h10 v6 h-10 z M55,55 h12 v6 h-12 z M74,55 h20 v14 h-20 z M6,66 h14 v6 h-14 z M26,66 h24 v12 h-24 z M55,66 h12 v6 h-12 z M6,76 h12 v6 h-12 z M40,76 h14 v12 h-14 z M58,76 h12 v6 h-12 z M40,89 h24 v6 h-24 z" fill="#0f172a" />
                      <path d="M35,66 h6 v6 h-6 z M50,10 h4 v4 h-4 z M70,24 h4 v4 h-4 z M24,50 h4 v4 h-4 z M60,78 h4 v4 h-4 z" fill="#4f46e5" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>فاتورة مبسطة معتمدة ZATCA</span>
                </div>

                {/* Final Totals */}
                <div style={{ width: '320px', fontSize: '0.85rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 0', color: '#475569' }}>المجموع الخاضع للضريبة / Taxable Amt:</td>
                        <td style={{ padding: '6px 0', fontWeight: 700 }} className="en-digits">{formatCurrency(selectedInvoiceForPDF.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', color: '#475569' }}>ضريبة القيمة المضافة (15%) / VAT (15%):</td>
                        <td style={{ padding: '6px 0', fontWeight: 700 }} className="en-digits">{formatCurrency(selectedInvoiceForPDF.taxAmount)}</td>
                      </tr>
                      <tr style={{ borderTop: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', fontSize: '0.92rem', backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 900, color: '#1e293b' }}>الإجمالي النهائي / Grand Total:</td>
                        <td style={{ padding: '10px 8px', fontWeight: 900, color: '#4f46e5' }} className="en-digits">{formatCurrency(selectedInvoiceForPDF.total)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', color: '#059669', fontWeight: 700 }}>المبلغ المدفوع / Paid Amount:</td>
                        <td style={{ padding: '6px 0', fontWeight: 800, color: '#059669' }} className="en-digits">{formatCurrency(selectedInvoiceForPDF.paid)}</td>
                      </tr>
                      <tr style={{ fontSize: '0.88rem' }}>
                        <td style={{ padding: '6px 0', color: '#ef4444', fontWeight: 700 }}>المتبقي المستحق / Due Amount:</td>
                        <td style={{ padding: '6px 0', fontWeight: 800, color: '#ef4444' }} className="en-digits">
                          {formatCurrency(selectedInvoiceForPDF.total - selectedInvoiceForPDF.paid)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Note / Terms footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '30px', paddingTop: '16px', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.6 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>ملاحظات وشروط الدفع / Terms & Conditions:</p>
                <p style={{ margin: '4px 0 0 0' }}>{selectedInvoiceForPDF.notes || 'شكراً لتعاملكم معنا. يرجى سداد المبالغ المستحقة بموجب العقد والاتفاق المبرم.'}</p>
                <p style={{ margin: '12px 0 0 0', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                  تم إنشاء هذه الفاتورة إلكترونياً بواسطة نظام LensFlow لإدارة أعمال التصوير ستار ميديا
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Dynamic Printing styling tag */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
            background: none !important;
            color: #000000 !important;
          }
          .print-invoice-container, .print-invoice-container * {
            visibility: visible !important;
          }
          .print-invoice-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print-bar {
            display: none !important;
          }
          .modal-overlay {
            position: relative !important;
            background: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            inset: auto !important;
            display: block !important;
          }
          .modal-content {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            max-height: none !important;
          }
        }
        
        .table-row-hover:hover {
          background-color: rgba(99, 102, 241, 0.04) !important;
        }
      `}</style>

    </div>
  );
};

export default FinancialsView;
