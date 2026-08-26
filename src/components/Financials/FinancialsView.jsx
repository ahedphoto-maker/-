import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatCurrency, formatBookingNumber, formatTime12h } from '../../utils/helpers';
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
    auditLogs = [],
    addInvoice, 
    updateInvoice,
    addPayment, 
    updatePayment,
    addExpense,
    updateExpense,
    addAuditLog,
    showCelebration,
    settings,
    userRole,
    currentUser 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // 'dashboard' | 'revenues' | 'ledger' | 'expenses' | 'reports' | 'auditLogs' | 'statements'
  const [isFinanceHidden, setIsFinanceHidden] = useState(true);

  // Modals visibility
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // Revenue details modal
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState(null); // Print modal for ZATCA invoice
  const [selectedReportForPDF, setSelectedReportForPDF] = useState(null); // Print modal for PDF Report
  const [editingInvoice, setEditingInvoice] = useState(null); // Edit invoice modal
  const [editingExpense, setEditingExpense] = useState(null); // Edit expense modal

  // Search & Global Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeType, setDateRangeType] = useState('all'); // 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [filterClient, setFilterClient] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    invoiceNumber: '',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    method: 'تحويل بنكي',
    referenceNumber: '',
    notes: 'سداد دفعة'
  });

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'مواصلات',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    spentBy: (team && team[0]?.name) || 'عاهد العماري',
    recipient: '',
    paymentMethod: 'تحويل بنكي',
    referenceNumber: '',
    notes: '',
    attachment: ''
  });

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

  // Check roles/permissions
  const isSuper = userRole === 'admin' || currentUser?.isSupervisor || currentUser?.role?.includes('مشرف') || currentUser?.role?.includes('مدير') || currentUser?.id === 1;

  // Riyadh date helpers
  const getRiyadhDate = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
  };

  const getRiyadhDateStr = (date = getRiyadhDate()) => {
    return date.toISOString().substring(0, 10);
  };

  // Date range filter checker
  const checkDateInRange = (itemDate) => {
    if (!itemDate) return false;
    const dateStr = itemDate.substring(0, 10);
    const today = getRiyadhDate();
    const todayStr = getRiyadhDateStr(today);

    switch (dateRangeType) {
      case 'today':
        return dateStr === todayStr;
      case 'this_week': {
        const dayOfWeek = today.getDay(); 
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek);
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        const startStr = getRiyadhDateStr(sunday);
        const endStr = getRiyadhDateStr(saturday);
        return dateStr >= startStr && dateStr <= endStr;
      }
      case 'this_month':
        return dateStr.startsWith(todayStr.substring(0, 7));
      case 'last_month': {
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthPrefix = lastMonthDate.toISOString().substring(0, 7);
        return dateStr.startsWith(lastMonthPrefix);
      }
      case 'this_year':
        return dateStr.startsWith(todayStr.substring(0, 4));
      case 'custom':
        if (customStartDate && customEndDate) return dateStr >= customStartDate && dateStr <= customEndDate;
        if (customStartDate) return dateStr >= customStartDate;
        if (customEndDate) return dateStr <= customEndDate;
        return true;
      case 'all':
      default:
        return true;
    }
  };

  // -------------------------------------------------------------
  // Data Filtering & Memoized calculations
  // -------------------------------------------------------------

  // Filters dropdown options
  const uniqueClients = useMemo(() => [...new Set(invoices.map(inv => inv.clientName))].filter(Boolean), [invoices]);
  const uniqueCompanies = useMemo(() => [...new Set(bookings.map(b => b.companyName))].filter(name => name && name !== '-'), [bookings]);
  const uniqueServices = useMemo(() => [...new Set(bookings.map(b => b.title))].filter(Boolean), [bookings]);
  const uniqueMethods = useMemo(() => [...new Set([...payments.map(p => p.method), ...expenses.map(ex => ex.paymentMethod)])].filter(Boolean), [payments, expenses]);
  const uniqueSources = useMemo(() => [...new Set(bookings.map(b => b.source))].filter(Boolean), [bookings]);

  // Main filters matcher
  const matchesFilters = (item, type) => {
    let dateVal = item.date || item.issueDate || '';
    if (!checkDateInRange(dateVal)) return false;

    // Search query matching
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const client = (item.clientName || '').toLowerCase();
      const num = (item.invoiceNumber || item.bookingNumber || '').toLowerCase();
      const company = (type === 'invoice' && item.bookingId 
        ? bookings.find(b => b.id === item.bookingId)?.companyName || '' 
        : item.companyName || ''
      ).toLowerCase();

      const matchesSearch = client.includes(query) || num.includes(query) || company.includes(query);
      if (!matchesSearch) return false;
    }

    // Dropdown filters
    if (filterClient !== 'all' && item.clientName !== filterClient) return false;
    
    if (filterCompany !== 'all') {
      const companyName = type === 'invoice' && item.bookingId
        ? bookings.find(b => b.id === item.bookingId)?.companyName || ''
        : item.companyName || '';
      if (companyName !== filterCompany) return false;
    }

    if (filterService !== 'all') {
      const serviceTitle = type === 'invoice' && item.bookingId
        ? bookings.find(b => b.id === item.bookingId)?.title || ''
        : item.title || '';
      if (serviceTitle !== filterService) return false;
    }

    if (filterStatus !== 'all' && type === 'invoice' && item.status !== filterStatus) return false;
    
    if (filterMethod !== 'all') {
      const methodVal = item.method || item.paymentMethod || '';
      if (methodVal !== filterMethod) return false;
    }

    if (filterSource !== 'all') {
      const sourceVal = type === 'invoice' && item.bookingId
        ? bookings.find(b => b.id === item.bookingId)?.source || ''
        : item.source || '';
      if (sourceVal !== filterSource) return false;
    }

    return true;
  };

  // Filtered Lists
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => matchesFilters(inv, 'invoice'));
  }, [invoices, searchQuery, dateRangeType, customStartDate, customEndDate, filterClient, filterCompany, filterService, filterStatus, filterSource, bookings]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => matchesFilters(p, 'payment'));
  }, [payments, searchQuery, dateRangeType, customStartDate, customEndDate, filterClient, filterCompany, filterMethod]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(ex => matchesFilters(ex, 'expense'));
  }, [expenses, searchQuery, dateRangeType, customStartDate, customEndDate, filterCompany, filterMethod]);

  // Combined ledger (In & Out)
  const ledgerTransactions = useMemo(() => {
    const ins = payments.map(p => {
      const relatedInvoice = invoices.find(inv => inv.invoiceNumber === p.invoiceNumber);
      return {
        type: 'in', // الداخل
        id: p.id,
        date: p.date,
        description: `دفعة مبيعات - فاتورة رقم ${p.invoiceNumber}`,
        category: 'إيراد مبيعات',
        amount: Number(p.amount) || 0,
        method: p.method,
        bookingId: relatedInvoice?.bookingId || null,
        clientName: p.clientName,
        status: p.status || 'نشط',
        referenceNumber: p.referenceNumber,
        notes: p.notes
      };
    });

    const outs = expenses.map(ex => ({
      type: 'out', // الخارج
      id: ex.id,
      date: ex.date,
      description: ex.title,
      category: ex.category || 'مصروفات',
      amount: Number(ex.amount) || 0,
      method: ex.paymentMethod || 'نقداً',
      bookingId: ex.bookingId || null,
      clientName: ex.recipient || ex.spentBy || 'جهة غير محددة',
      status: ex.status || 'نشط',
      referenceNumber: ex.referenceNumber,
      notes: ex.notes
    }));

    return [...ins, ...outs]
      .filter(item => matchesFilters(item, item.type === 'in' ? 'payment' : 'expense'))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, expenses, invoices, searchQuery, dateRangeType, customStartDate, customEndDate, filterClient, filterCompany, filterMethod]);

  // Totals calculations
  const totalInvoiced = useMemo(() => {
    return invoices
      .filter(inv => inv.status !== 'ملغاة')
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return payments
      .filter(p => p.status !== 'ملغي')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const outstandingAmount = useMemo(() => totalInvoiced - totalPaid, [totalInvoiced, totalPaid]);
  
  const totalExpensesAmount = useMemo(() => {
    return expenses
      .filter(ex => ex.status !== 'ملغي')
      .reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  }, [expenses]);

  const netProfit = useMemo(() => totalPaid - totalExpensesAmount, [totalPaid, totalExpensesAmount]);

  const transactionsCount = useMemo(() => {
    const activePayments = payments.filter(p => p.status !== 'ملغي').length;
    const activeExpenses = expenses.filter(ex => ex.status !== 'ملغي').length;
    return activePayments + activeExpenses;
  }, [payments, expenses]);

  const linkedBookingsCount = useMemo(() => {
    const bookingIds = invoices
      .filter(inv => inv.status !== 'ملغاة' && inv.bookingId)
      .map(inv => inv.bookingId);
    return new Set(bookingIds).size;
  }, [invoices]);

  // Filtered audit logs
  const financialLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const act = log.action || '';
      return act.includes('فاتورة') || act.includes('دفعة') || act.includes('مصروف') || act.includes('مالي');
    });
  }, [auditLogs]);

  // Recharts Data
  const expenseCategories = ['مواصلات', 'إيجار معدات', 'رواتب', 'إعاشة وضيافة', 'تسويق', 'صيانة', 'أخرى'];
  const expenseChartData = useMemo(() => {
    const categoriesMap = {};
    expenseCategories.forEach(cat => { categoriesMap[cat] = 0; });
    expenses.filter(ex => ex.status !== 'ملغي').forEach(ex => {
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

  const monthlyChartData = useMemo(() => {
    return [
      { name: 'مايو', إيرادات: 35000, مصروفات: 8000, أرباح: 27000 },
      { name: 'يونيو', إيرادات: 42000, مصروفات: 11000, أرباح: 31000 },
      { name: 'يوليو', إيرادات: 48000, مصروفات: 9500, أرباح: 38500 },
      { name: 'أغسطس (الحالي)', إيرادات: totalInvoiced, مصروفات: totalExpensesAmount, أرباح: netProfit }
    ];
  }, [totalInvoiced, totalExpensesAmount, netProfit]);

  // Clients contribution chart
  const clientsContributionData = useMemo(() => {
    const clientsMap = {};
    invoices.filter(inv => inv.status !== 'ملغاة').forEach(inv => {
      clientsMap[inv.clientName] = (clientsMap[inv.clientName] || 0) + (Number(inv.total) || 0);
    });
    return Object.keys(clientsMap)
      .map(name => ({ name, value: clientsMap[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [invoices]);

  // -------------------------------------------------------------
  // Form Submission & Operations handlers
  // -------------------------------------------------------------

  const handleInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!invoiceForm.clientName || invoiceForm.items.some(item => !item.description || item.price <= 0)) {
      alert('الرجاء التأكد من تعبئة جميع بنود الفاتورة وإدخال اسم العميل بشكل صحيح.');
      return;
    }

    const subtotal = invoiceForm.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    const taxAmount = subtotal * 0.15;
    const total = subtotal + taxAmount;

    if (addInvoice) {
      addInvoice({
        ...invoiceForm,
        subtotal,
        taxRate: 15,
        taxAmount,
        total,
        paid: 0,
        status: 'غير مدفوعة',
        items: invoiceForm.items
      });
      
      addAuditLog('إنشاء فاتورة', `تم إنشاء فاتورة مبيعات جديدة للعميل ${invoiceForm.clientName} بقيمة ${formatCurrency(total)}`, '📄');
      showCelebration('تم إنشاء الفاتورة الضريبية بنجاح! 📄');
    }

    setIsInvoiceModalOpen(false);
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

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.invoiceNumber) return;

    const amountNum = Number(paymentForm.amount);
    const relatedInvoice = invoices.find(inv => inv.invoiceNumber === paymentForm.invoiceNumber);

    if (relatedInvoice) {
      const newPaid = (Number(relatedInvoice.paid) || 0) + amountNum;
      const isFullyPaid = newPaid >= Number(relatedInvoice.total);

      if (updateInvoice) {
        updateInvoice(relatedInvoice.id, {
          paid: newPaid,
          status: isFullyPaid ? 'مدفوعة' : 'جزئي'
        });
      }

      if (addPayment) {
        addPayment({
          ...paymentForm,
          amount: amountNum,
          clientName: relatedInvoice.clientName,
          status: 'نشط'
        });
      }

      addAuditLog('تسجيل دفعة', `تم استلام دفعة مالية بقيمة ${formatCurrency(amountNum)} للفاتورة ${paymentForm.invoiceNumber}`, '💰');
      showCelebration('تم تسجيل الدفعة المالية بنجاح! 💰');
    }

    setIsPaymentModalOpen(false);
    setPaymentForm({
      invoiceNumber: '',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      method: 'تحويل بنكي',
      referenceNumber: '',
      notes: 'سداد دفعة'
    });
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.title) return;

    if (addExpense) {
      addExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
        status: 'نشط'
      });
      addAuditLog('تسجيل مصروفات', `تم تسجيل مصروف جديد بقيمة ${formatCurrency(expenseForm.amount)}: ${expenseForm.title}`, '💸');
      showCelebration('تم تسجيل المصروف المالي بنجاح! 💸');
    }

    setIsExpenseModalOpen(false);
    setExpenseForm({
      title: '',
      category: 'مواصلات',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      spentBy: team[0]?.name || 'عاهد العماري',
      recipient: '',
      paymentMethod: 'تحويل بنكي',
      referenceNumber: '',
      notes: '',
      attachment: ''
    });
  };

  // Edit Invoice Submit
  const handleEditInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const subtotal = editingInvoice.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    const taxAmount = subtotal * 0.15;
    const total = subtotal + taxAmount;
    const oldTotal = invoices.find(inv => inv.id === editingInvoice.id)?.total || 0;

    if (updateInvoice) {
      updateInvoice(editingInvoice.id, {
        clientName: editingInvoice.clientName,
        issueDate: editingInvoice.issueDate,
        dueDate: editingInvoice.dueDate,
        items: editingInvoice.items,
        subtotal,
        taxAmount,
        total,
        notes: editingInvoice.notes
      });

      addAuditLog('تعديل فاتورة', `تعديل قيمة الفاتورة رقم ${editingInvoice.invoiceNumber} من ${formatCurrency(oldTotal)} إلى ${formatCurrency(total)}`, '✏️');
      showCelebration('تم تعديل الفاتورة بنجاح! ✏️');
    }

    setEditingInvoice(null);
  };

  // Action cancel invoice
  const handleCancelInvoice = (invoiceId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه الفاتورة؟ سيتم إلغاؤها محاسبياً والاحتفاظ بسجلها.')) return;
    const target = invoices.find(inv => inv.id === invoiceId);
    if (target && updateInvoice) {
      updateInvoice(invoiceId, { status: 'ملغاة' });
      addAuditLog('إلغاء فاتورة', `تم إلغاء الفاتورة رقم ${target.invoiceNumber} بقيمة ${formatCurrency(target.total)}`, '⚠️');
      showCelebration('تم إلغاء الفاتورة! ⚠️');
      if (selectedInvoice?.id === invoiceId) setSelectedInvoice(null);
    }
  };

  // Action cancel payment
  const handleCancelPayment = (paymentId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه العملية المالية؟ سيتم إدراجها كملغاة محاسبياً.')) return;
    const target = payments.find(p => p.id === paymentId);
    if (target && updatePayment) {
      updatePayment(paymentId, { status: 'ملغي' });
      
      // Refund invoice paid amount
      const relatedInvoice = invoices.find(inv => inv.invoiceNumber === target.invoiceNumber);
      if (relatedInvoice && updateInvoice) {
        const newPaid = Math.max(0, (relatedInvoice.paid || 0) - target.amount);
        updateInvoice(relatedInvoice.id, {
          paid: newPaid,
          status: newPaid === 0 ? 'غير مدفوعة' : 'جزئي'
        });
      }

      addAuditLog('إلغاء دفعة', `تم إلغاء الدفعة بقيمة ${formatCurrency(target.amount)} للفاتورة ${target.invoiceNumber}`, '⚠️');
      showCelebration('تم إلغاء الدفعة المالية! ⚠️');
    }
  };

  // Action cancel expense
  const handleCancelExpense = (expenseId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا المصروف المالي؟')) return;
    const target = expenses.find(ex => ex.id === expenseId);
    if (target && updateExpense) {
      updateExpense(expenseId, { status: 'ملغي' });
      addAuditLog('إلغاء مصروف', `تم إلغاء مصروف بقيمة ${formatCurrency(target.amount)}: ${target.title}`, '⚠️');
      showCelebration('تم إلغاء المصروف المالي! ⚠️');
    }
  };

  // CSV Export
  const exportToCSV = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    
    if (type === 'invoices') {
      csvContent += "رقم الفاتورة,العميل,تاريخ الإصدار,تاريخ الاستحقاق,الإجمالي,المدفوع,المتبقي,الحالة\n";
      filteredInvoices.forEach(inv => {
        const remaining = inv.total - inv.paid;
        csvContent += `"${inv.invoiceNumber}","${inv.clientName}","${inv.issueDate}","${inv.dueDate}",${inv.total},${inv.paid},${remaining},"${inv.status}"\n`;
      });
    } else if (type === 'ledger') {
      csvContent += "التاريخ,النوع,البيان,التصنيف,المبلغ,طريقة الدفع,العميل/الجهة,رقم المرجع,الحالة\n";
      ledgerTransactions.forEach(t => {
        csvContent += `"${t.date}","${t.type === 'in' ? 'داخل' : 'خارج'}","${t.description}","${t.category}",${t.amount},"${t.method}","${t.clientName}","${t.referenceNumber || ''}","${t.status}"\n`;
      });
    } else if (type === 'expenses') {
      csvContent += "المصروف,التصنيف,المبلغ,التاريخ,المسؤول,المستلم,طريقة الدفع,المرجع,الحالة\n";
      filteredExpenses.forEach(ex => {
        csvContent += `"${ex.title}","${ex.category}",${ex.amount},"${ex.date}","${ex.spentBy}","${ex.recipient || ''}","${ex.paymentMethod || ''}","${ex.referenceNumber || ''}","${ex.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showCelebration('تم تصدير البيانات بنجاح! 📥');
  };

  // Report Period generator
  const getReportSummary = () => {
    let periodTitle = '';
    const today = getRiyadhDateStr();
    
    if (dateRangeType === 'today') periodTitle = `اليوم (${today})`;
    else if (dateRangeType === 'this_week') periodTitle = 'هذا الأسبوع';
    else if (dateRangeType === 'this_month') periodTitle = `هذا الشهر (${today.substring(0, 7)})`;
    else if (dateRangeType === 'last_month') periodTitle = 'الشهر السابق';
    else if (dateRangeType === 'this_year') periodTitle = `هذا العام (${today.substring(0, 4)})`;
    else if (dateRangeType === 'custom') periodTitle = `الفترة من ${customStartDate || 'القبل'} إلى ${customEndDate || 'الآن'}`;
    else periodTitle = 'جميع الأوقات';

    const invs = filteredInvoices.filter(inv => inv.status !== 'ملغاة');
    const pays = filteredPayments.filter(p => p.status !== 'ملغي');
    const exps = filteredExpenses.filter(ex => ex.status !== 'ملغي');

    const totalRev = invs.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalCol = pays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOut = exps.reduce((sum, ex) => sum + (ex.amount || 0), 0);
    const totalRem = totalRev - totalCol;
    const netInc = totalCol - totalOut;

    const avgValue = invs.length > 0 ? totalRev / invs.length : 0;

    return {
      periodTitle,
      totalRev,
      totalCol,
      totalRem,
      totalOut,
      netInc,
      bookingsCount: invs.filter(i => i.bookingId).length,
      avgValue,
      invoicesList: invs,
      expensesList: exps,
      paymentsList: pays
    };
  };

  // If not super/admin - render unauthorized screen
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

  // -------------------------------------------------------------
  // Render Sub-Views
  // -------------------------------------------------------------

  const renderDashboardTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          
          {/* Chart 1: Revenue vs Expenses */}
          <div className="card" style={{ padding: '16px', minHeight: '340px' }}>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-main)' }}>📈 الإيرادات والمصروفات والأرباح شهرياً</h4>
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: '0.78rem' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.78rem' }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="إيرادات" name="المبيعات والفواتير" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="مصروفات" name="المصروفات التشغيلية" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="أرباح" name="صافي الأرباح" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Expenses Breakdown */}
          <div className="card" style={{ padding: '16px', minHeight: '340px' }}>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-main)' }}>🍩 هيكل النفقات والمصروفات حسب الفئة</h4>
            <div style={{ width: '100%', height: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {expenseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => isFinanceHidden ? "••••••" : formatCurrency(val)} />
                    <Legend layout="vertical" verticalAlign="middle" align="left" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem', padding: '40px 0' }}>
                  لا توجد مصروفات مسجلة لعرضها
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table: Customer Contribution */}
        <div className="card" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: '0.94rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>👥 قائمة العملاء الأكثر تحقيقاً للإيرادات</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px' }}>العميل / المؤسسة</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>إجمالي الفواتير الصادرة</th>
                </tr>
              </thead>
              <tbody>
                {clientsContributionData.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px', fontWeight: 800 }}>{c.name}</td>
                    <td style={{ padding: '10px', textAlign: 'left', fontWeight: 700, color: '#10b981', fontFamily: 'Inter' }}>
                      {isFinanceHidden ? "••••••" : formatCurrency(c.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRevenuesTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>رقم الفاتورة</th>
                <th style={{ padding: '12px' }}>العميل</th>
                <th style={{ padding: '12px' }}>تاريخ الإصدار</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>المبلغ الإجمالي</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>المدفوع</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>المتبقي</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => {
                const remaining = (inv.total || 0) - (inv.paid || 0);
                const relatedBooking = bookings.find(b => b.id === inv.bookingId);
                
                return (
                  <tr 
                    key={inv.id} 
                    onClick={() => setSelectedInvoice(inv)} 
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', opacity: inv.status === 'ملغاة' ? 0.6 : 1 }}
                    className="card-interactive"
                  >
                    <td style={{ padding: '12px', fontWeight: 800 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{inv.clientName}</div>
                      {relatedBooking?.companyName && relatedBooking.companyName !== '-' && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>🏢 {relatedBooking.companyName}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'Inter' }}>{inv.issueDate}</td>
                    <td style={{ padding: '12px', textAlign: 'left', fontWeight: 700, fontFamily: 'Inter' }}>
                      {isFinanceHidden ? "••••••" : formatCurrency(inv.total)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'left', color: '#10b981', fontFamily: 'Inter' }}>
                      {isFinanceHidden ? "••••••" : formatCurrency(inv.paid)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'left', color: remaining > 0 ? '#ef4444' : '#10b981', fontWeight: 800, fontFamily: 'Inter' }}>
                      {isFinanceHidden ? "••••••" : formatCurrency(remaining)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    لا توجد فواتير أو إيرادات تطابق معايير البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLedgerTab = () => {
    const totalIn = ledgerTransactions
      .filter(t => t.type === 'in' && t.status !== 'ملغي')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalOut = ledgerTransactions
      .filter(t => t.type === 'out' && t.status !== 'ملغي')
      .reduce((sum, t) => sum + t.amount, 0);
    const netCash = totalIn - totalOut;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Ledger live metrics header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>🟢 إجمالي التدفقات الداخلة</span>
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#10b981', marginTop: '4px', fontFamily: 'Inter' }}>
              {isFinanceHidden ? "••••••" : formatCurrency(totalIn)}
            </strong>
          </div>
          <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '14px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>🔴 إجمالي النفقات الخارجة</span>
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#ef4444', marginTop: '4px', fontFamily: 'Inter' }}>
              {isFinanceHidden ? "••••••" : formatCurrency(totalOut)}
            </strong>
          </div>
          <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '14px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>📊 صافي الرصيد النقدي</span>
            <strong style={{ display: 'block', fontSize: '1.15rem', color: netCash >= 0 ? '#10b981' : '#ef4444', marginTop: '4px', fontFamily: 'Inter' }}>
              {isFinanceHidden ? "••••••" : formatCurrency(netCash)}
            </strong>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>التاريخ</th>
                <th style={{ padding: '12px' }}>الاتجاه</th>
                <th style={{ padding: '12px' }}>تفاصيل العملية والبيان</th>
                <th style={{ padding: '12px' }}>التصنيف</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>المبلغ</th>
                <th style={{ padding: '12px' }}>طريقة الدفع</th>
                <th style={{ padding: '12px' }}>العميل / الجهة</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>الخيارات</th>
              </tr>
            </thead>
            <tbody>
              {ledgerTransactions.map(t => {
                const isCanceled = t.status === 'ملغي' || t.status === 'ملغاة';
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: isCanceled ? 0.5 : 1 }}>
                    <td style={{ padding: '12px', fontFamily: 'Inter' }}>{t.date}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${t.type === 'in' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '4px' }}>
                        {t.type === 'in' ? 'داخل' : 'خارج'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong>{t.description}</strong>
                      {t.referenceNumber && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>مرجع: {t.referenceNumber}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.8rem' }}>{t.category}</td>
                    <td style={{ padding: '12px', textAlign: 'left', fontWeight: 800, color: t.type === 'in' ? '#10b981' : '#ef4444', fontFamily: 'Inter' }}>
                      {isFinanceHidden ? "••••••" : formatCurrency(t.amount)}
                    </td>
                    <td style={{ padding: '12px' }}>{t.method}</td>
                    <td style={{ padding: '12px' }}>{t.clientName}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {!isCanceled ? (
                        <button
                          type="button"
                          onClick={() => t.type === 'in' ? handleCancelPayment(t.id) : handleCancelExpense(t.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444', padding: '4px 8px', fontSize: '0.72rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                          title="إلغاء وتعديل الحركة"
                        >
                          إلغاء ❌
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>ملغاة</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {ledgerTransactions.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    لا توجد حركات مالية مطابقة لمعايير البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExpensesTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>المصروف</th>
                <th style={{ padding: '12px' }}>التصنيف</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>المبلغ</th>
                <th style={{ padding: '12px' }}>التاريخ</th>
                <th style={{ padding: '12px' }}>المسؤول</th>
                <th style={{ padding: '12px' }}>المستلم</th>
                <th style={{ padding: '12px' }}>طريقة الدفع</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(ex => {
                const isCanceled = ex.status === 'ملغي' || ex.status === 'ملغاة';
                return (
                  <tr key={ex.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: isCanceled ? 0.55 : 1 }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{ex.title}</strong>
                      {ex.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ex.notes}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.74rem' }}>
                        {ex.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: '#ef4444', fontFamily: 'Inter' }}>
                      {isFinanceHidden ? "••••••" : formatCurrency(ex.amount)}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'Inter' }}>{ex.date}</td>
                    <td style={{ padding: '12px' }}>{ex.spentBy}</td>
                    <td style={{ padding: '12px' }}>{ex.recipient || '-'}</td>
                    <td style={{ padding: '12px' }}>{ex.paymentMethod || 'نقداً'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {isCanceled ? (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>ملغاة</span>
                      ) : (
                        <button
                          onClick={() => handleCancelExpense(ex.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', color: 'var(--status-danger)' }}
                        >
                          إلغاء ❌
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    لا توجد مصروفات مسجلة مطابقة لمعايير البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReportsTab = () => {
    const r = getReportSummary();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* On screen preview card */}
        <div className="card" style={{ padding: '24px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>📊 المعاينة المالية للتقرير</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>تقرير الفترة المحددة: <strong>{r.periodTitle}</strong></p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => exportToCSV('ledger')} 
                className="btn btn-secondary"
              >
                <Icons.Download size={16} />
                <span>تصدير CSV للتقرير</span>
              </button>
              <button 
                onClick={() => setSelectedReportForPDF(r)} 
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
              >
                <Icons.FileText size={16} />
                <span>تصدير التقرير PDF 📄</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>إجمالي المبيعات (الفواتير)</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '6px', color: 'var(--text-main)', fontFamily: 'Inter' }}>
                {isFinanceHidden ? "••••••" : formatCurrency(r.totalRev)}
              </strong>
            </div>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>إجمالي المحصل الفعلي</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '6px', color: '#10b981', fontFamily: 'Inter' }}>
                {isFinanceHidden ? "••••••" : formatCurrency(r.totalCol)}
              </strong>
            </div>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>المستحقات المتبقية</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '6px', color: '#ef4444', fontFamily: 'Inter' }}>
                {isFinanceHidden ? "••••••" : formatCurrency(r.totalRem)}
              </strong>
            </div>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>المصروفات والنفقات</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '6px', color: '#ef4444', fontFamily: 'Inter' }}>
                {isFinanceHidden ? "••••••" : formatCurrency(r.totalOut)}
              </strong>
            </div>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>صافي الدخل للفترة</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '6px', color: r.netInc >= 0 ? '#10b981' : '#ef4444', fontFamily: 'Inter' }}>
                {isFinanceHidden ? "••••••" : formatCurrency(r.netInc)}
              </strong>
            </div>
          </div>

          {/* Operational performance stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>عدد الفواتير والحجوزات المدرجة:</span>
                <strong style={{ color: 'var(--text-main)' }}>{r.invoicesList.length} حجز</strong>
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>متوسط قيمة الحجز/الاتفاق المالي:</span>
                <strong style={{ color: 'var(--text-main)', fontFamily: 'Inter' }}>
                  {isFinanceHidden ? "••••••" : formatCurrency(r.avgValue)}
                </strong>
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>📋 تفاصيل المعاملات المالية المشمولة في الفترة</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>التاريخ</th>
                  <th style={{ padding: '8px' }}>رقم العملية</th>
                  <th style={{ padding: '8px' }}>النوع</th>
                  <th style={{ padding: '8px' }}>البيان</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>المبلغ</th>
                  <th style={{ padding: '8px' }}>الجهة/العميل</th>
                  <th style={{ padding: '8px' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {r.invoicesList.map(inv => (
                  <tr key={`inv-${inv.id}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', fontFamily: 'Inter' }}>{inv.issueDate}</td>
                    <td style={{ padding: '8px' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '8px' }}>فاتورة</td>
                    <td style={{ padding: '8px' }}>مبيعات وتغطيات</td>
                    <td style={{ padding: '8px', textAlign: 'left', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(inv.total)}</td>
                    <td style={{ padding: '8px' }}>{inv.clientName}</td>
                    <td style={{ padding: '8px' }}><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
                {r.expensesList.map(ex => (
                  <tr key={`ex-${ex.id}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', fontFamily: 'Inter' }}>{ex.date}</td>
                    <td style={{ padding: '8px' }}>#EXP-{ex.id}</td>
                    <td style={{ padding: '8px' }}>مصروف</td>
                    <td style={{ padding: '8px' }}>{ex.title}</td>
                    <td style={{ padding: '8px', textAlign: 'left', color: '#ef4444', fontFamily: 'Inter' }}>{isFinanceHidden ? "••••••" : formatCurrency(ex.amount)}</td>
                    <td style={{ padding: '8px' }}>{ex.recipient || ex.spentBy}</td>
                    <td style={{ padding: '8px' }}><span style={{ color: 'var(--status-danger)' }}>مصروف</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAuditLogsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '0.96rem', fontWeight: 800, marginBottom: '4px', color: 'var(--text-main)' }}>🛡️ سجل النشاطات والتعديلات المالية في النظام</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {financialLogs.map(log => (
            <div 
              key={log.id} 
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-card)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {log.icon || '💰'}
                </span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {log.userName || 'مشرف النظام'} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>({log.userRole})</span>: {log.action}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.76rem' }}>
                    {log.details}
                  </div>
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontFamily: 'Inter' }}>
                {log.timestamp}
              </span>
            </div>
          ))}
          {financialLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              لا توجد تعديلات مالية مسجلة في النظام حالياً
            </div>
          )}
        </div>
      </div>
    );
  };

  // Settlements Tab (Existing implementation statements)
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
                  const estimatedPay = count * 350; 
                  const paid = count * 200; 
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
      
      {/* 1. Dynamic Actions Sub-header bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'dashboard', label: 'لوحة التحكم المالية', icon: Icons.BarChart3 },
            { id: 'revenues', label: 'تفاصيل الإيرادات', icon: Icons.Receipt },
            { id: 'ledger', label: 'الداخل والخارج', icon: Icons.Handshake },
            { id: 'expenses', label: 'المصروفات', icon: Icons.TrendingDown },
            { id: 'reports', label: 'التقارير المالية', icon: Icons.FileText },
            { id: 'auditLogs', label: 'سجل العمليات', icon: Icons.Clock },
            { id: 'statements', label: 'التسويات', icon: Icons.CreditCard }
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
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Controls & Add Actions */}
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

          {activeSubTab === 'revenues' && (
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

          {activeSubTab === 'ledger' && (
            <>
              <button onClick={() => exportToCSV('ledger')} className="btn btn-secondary">
                <Icons.Download size={18} />
                <span>تصدير CSV</span>
              </button>
              <button onClick={() => setIsPaymentModalOpen(true)} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                <Icons.Plus size={18} />
                <span>تسجيل دفعة 💰</span>
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
                <span>تسجيل مصروف 💸</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Global Filters bar (applicable to all tabs except auditLogs/statements) */}
      {activeSubTab !== 'auditLogs' && activeSubTab !== 'statements' && (
        <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            {/* Search query */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>ابحث برقم الفاتورة، العميل، الشركة</label>
              <input
                type="text"
                className="form-control"
                placeholder="رقم الفاتورة، العميل..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Date range selection */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>الفترة الزمنية</label>
              <select
                className="form-control"
                value={dateRangeType}
                onChange={e => setDateRangeType(e.target.value)}
              >
                <option value="all">جميع الأوقات</option>
                <option value="today">اليوم</option>
                <option value="this_week">هذا الأسبوع</option>
                <option value="this_month">هذا الشهر</option>
                <option value="last_month">الشهر السابق</option>
                <option value="this_year">هذا العام</option>
                <option value="custom">فترة مخصصة</option>
              </select>
            </div>

            {/* Client selector */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>العميل</label>
              <select
                className="form-control"
                value={filterClient}
                onChange={e => setFilterClient(e.target.value)}
              >
                <option value="all">كل العملاء</option>
                {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Company selector */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>الجهة / الشركة</label>
              <select
                className="form-control"
                value={filterCompany}
                onChange={e => setFilterCompany(e.target.value)}
              >
                <option value="all">كل الجهات</option>
                {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Expandable Advanced Filters for Reports & Admin */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            
            {/* Custom dates picker */}
            {dateRangeType === 'custom' && (
              <>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>من تاريخ</label>
                  <input type="date" className="form-control" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>إلى تاريخ</label>
                  <input type="date" className="form-control" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                </div>
              </>
            )}

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>نوع الخدمة / الحجز</label>
              <select className="form-control" value={filterService} onChange={e => setFilterService(e.target.value)}>
                <option value="all">كل الخدمات</option>
                {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>طريقة الدفع</label>
              <select className="form-control" value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
                <option value="all">كل الطرق</option>
                {uniqueMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>الحالة (الفواتير فقط)</label>
              <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">كل الحالات</option>
                <option value="مدفوعة">مدفوعة</option>
                <option value="جزئي">جزئي</option>
                <option value="غير مدفوعة">غير مدفوعة</option>
                <option value="ملغاة">ملغاة</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>مصدر الحجز</label>
              <select className="form-control" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
                <option value="all">كل المصادر</option>
                {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Live Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Invoiced */}
        <div className="card" style={{ borderRight: '5px solid var(--primary-color)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الإيرادات (الفواتير)</span>
              <button
                type="button"
                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
              >
                {isFinanceHidden ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              </button>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '6px', fontFamily: 'Inter' }}>
              {isFinanceHidden ? "••••••" : formatCurrency(totalInvoiced)}
            </h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>عدد الحجوزات المرتبطة:</span>
            <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{linkedBookingsCount} حجز</span>
          </div>
        </div>

        {/* Card 2: Collected */}
        <div className="card" style={{ borderRight: '5px solid #10b981', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المبالغ المحصلة</span>
              <button
                type="button"
                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
              >
                {isFinanceHidden ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              </button>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '6px', fontFamily: 'Inter' }}>
              {isFinanceHidden ? "••••••" : formatCurrency(totalPaid)}
            </h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>المستحقات المتبقية:</span>
            <span style={{ fontWeight: 800, color: '#ef4444' }}>{isFinanceHidden ? "••••••" : formatCurrency(outstandingAmount)}</span>
          </div>
        </div>

        {/* Card 3: Expenses */}
        <div className="card" style={{ borderRight: '5px solid #ef4444', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المصروفات والنفقات</span>
              <button
                type="button"
                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
              >
                {isFinanceHidden ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              </button>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '6px', fontFamily: 'Inter' }}>
              {isFinanceHidden ? "••••••" : formatCurrency(totalExpensesAmount)}
            </h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>عدد العمليات المالية:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{transactionsCount} عملية</span>
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className="card" style={{ borderRight: '5px solid #8b5cf6', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>صافي الدخل (المحصل - النفقات)</span>
              <button
                type="button"
                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
              >
                {isFinanceHidden ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              </button>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6', marginTop: '6px', fontFamily: 'Inter' }}>
              {isFinanceHidden ? "••••••" : formatCurrency(netProfit)}
            </h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>الهامش المحقق:</span>
            <span style={{ fontWeight: 800, color: '#8b5cf6' }}>{totalPaid > 0 ? ((netProfit / totalPaid) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      </div>

      {/* 4. Active Tab Content rendering */}
      <div className="tab-content" style={{ marginTop: '10px' }}>
        {activeSubTab === 'dashboard' && renderDashboardTab()}
        {activeSubTab === 'revenues' && renderRevenuesTab()}
        {activeSubTab === 'ledger' && renderLedgerTab()}
        {activeSubTab === 'expenses' && renderExpensesTab()}
        {activeSubTab === 'reports' && renderReportsTab()}
        {activeSubTab === 'auditLogs' && renderAuditLogsTab()}
        {activeSubTab === 'statements' && renderSettlementsTab()}
      </div>

      {/* -------------------------------------------------------------
          MODALS & PRINT DIALOGS
         ------------------------------------------------------------- */}

      {/* Modal 1: Revenue / Invoice Detail Modal */}
      {selectedInvoice && (() => {
        const relatedBooking = bookings.find(b => b.id === selectedInvoice.bookingId);
        const relatedPayments = payments.filter(p => p.invoiceNumber === selectedInvoice.invoiceNumber && p.status !== 'ملغي');
        const remaining = selectedInvoice.total - selectedInvoice.paid;

        return (
          <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>🧾 تفاصيل الإيراد والفاتورة رقم {selectedInvoice.invoiceNumber}</h3>
                <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setSelectedInvoice(null)}><Icons.X size={18} /></button>
              </div>

              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
                
                {/* 1. Booking Context Details */}
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: 'var(--primary-color)', fontWeight: 800 }}>📅 معلومات الحجز المرتبط</h4>
                  {relatedBooking ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                      <div>رقم الحجز: <strong>{formatBookingNumber(relatedBooking.bookingNumber)}</strong></div>
                      <div>اسم العميل: <strong>{relatedBooking.clientName}</strong></div>
                      <div>الجهة: <strong>{relatedBooking.companyName || '-'}</strong></div>
                      <div>نوع الخدمة: <strong>{relatedBooking.title}</strong></div>
                      <div>تاريخ الحجز: <strong className="en-digits">{relatedBooking.date}</strong></div>
                      <div>الموقع: <strong>{relatedBooking.location || 'الرياض'}</strong></div>
                      <div>المصدر: <strong>{relatedBooking.source || 'مباشر'}</strong></div>
                      <div>المصور الميداني: <strong>{relatedBooking.teamAssignedNames || 'غير محدد'}</strong></div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>لا يوجد حجز مسجل مرتبط بهذه الفاتورة</span>
                  )}
                </div>

                {/* 2. Invoice Totals Table */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: 'var(--primary-color)', fontWeight: 800 }}>💵 البنود والمبالغ المالية</h4>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                        <th style={{ padding: '8px' }}>البيان</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>الكمية</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>سعر الوحدة</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px' }}>{item.description}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '8px', textAlign: 'left' }} className="en-digits">{isFinanceHidden ? "••••••" : formatCurrency(item.price)}</td>
                          <td style={{ padding: '8px', textAlign: 'left' }} className="en-digits">{isFinanceHidden ? "••••••" : formatCurrency(item.quantity * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', marginTop: '10px', fontSize: '0.82rem', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <div>المجموع الفرعي: <strong className="en-digits">{isFinanceHidden ? "••••••" : formatCurrency(selectedInvoice.subtotal)}</strong></div>
                    <div>ضريبة القيمة المضافة (15%): <strong className="en-digits">{isFinanceHidden ? "••••••" : formatCurrency(selectedInvoice.taxAmount)}</strong></div>
                    <div style={{ fontSize: '0.94rem', color: 'var(--primary-color)', marginTop: '4px' }}>
                      الإجمالي النهائي: <strong className="en-digits">{isFinanceHidden ? "••••••" : formatCurrency(selectedInvoice.total)}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Payments Ledger */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: 'var(--primary-color)', fontWeight: 800 }}>💰 سجل سداد الدفعات والمتحصلات</h4>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                        <th style={{ padding: '6px' }}>التاريخ</th>
                        <th style={{ padding: '6px', textAlign: 'left' }}>المبلغ</th>
                        <th style={{ padding: '6px' }}>طريقة الدفع</th>
                        <th style={{ padding: '6px' }}>رقم المرجع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedPayments.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '6px' }} className="en-digits">{p.date}</td>
                          <td style={{ padding: '6px', textAlign: 'left', color: '#10b981', fontWeight: 700 }} className="en-digits">
                            {isFinanceHidden ? "••••••" : formatCurrency(p.amount)}
                          </td>
                          <td style={{ padding: '6px' }}>{p.method}</td>
                          <td style={{ padding: '6px' }}>{p.referenceNumber || '-'}</td>
                        </tr>
                      ))}
                      {relatedPayments.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>لم يتم تسجيل أي دفعات نقدية بعد</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedInvoice.status !== 'ملغاة' && (
                    <>
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingInvoice(selectedInvoice);
                          setSelectedInvoice(null);
                        }} 
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem' }}
                      >
                        ✏️ تعديل الفاتورة
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleCancelInvoice(selectedInvoice.id)} 
                        className="btn btn-secondary"
                        style={{ color: '#ef4444', fontSize: '0.8rem' }}
                      >
                        ❌ إلغاء الفاتورة
                      </button>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedInvoiceForPDF(selectedInvoice);
                      setSelectedInvoice(null);
                    }} 
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    📄 طباعة الفاتورة الضريبية
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>إغلاق</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 2: Create New Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInvoiceModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>📄 إنشاء فاتورة ضريبية جديدة</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsInvoiceModalOpen(false)}><Icons.X size={18} /></button>
            </div>

            <form onSubmit={handleInvoiceSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Client Name */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">اسم العميل بالكامل *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="أدخل اسم العميل أو الشركة المستفيدة..."
                    value={invoiceForm.clientName} 
                    onChange={e => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })} 
                  />
                </div>

                {/* Linked booking */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">ربط بحجز حالي (إن وجد)</label>
                  <select 
                    className="form-control"
                    value={invoiceForm.bookingId}
                    onChange={e => {
                      const bId = e.target.value;
                      const booking = bookings.find(b => b.id === Number(bId));
                      if (booking) {
                        setInvoiceForm({
                          ...invoiceForm,
                          bookingId: bId,
                          clientName: booking.clientName,
                          items: [{ id: Date.now(), description: `تغطية وتصوير: ${booking.title}`, quantity: 1, price: Math.round(Number(booking.totalPrice) / 1.15) }]
                        });
                      } else {
                        setInvoiceForm({ ...invoiceForm, bookingId: '' });
                      }
                    }}
                  >
                    <option value="">-- حجز غير مرتبط --</option>
                    {bookings.filter(b => b.status !== 'ملغي').map(b => (
                      <option key={b.id} value={b.id}>BK-{b.bookingNumber} | {b.clientName} - {b.title}</option>
                    ))}
                  </select>
                </div>

                {/* Invoice Items editor */}
                <div>
                  <label className="form-label" style={{ fontWeight: 800, display: 'block', marginBottom: '8px' }}>بنود الفاتورة والخدمات</label>
                  {invoiceForm.items.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        style={{ flex: 3 }}
                        placeholder="بيان الخدمة..." 
                        value={item.description}
                        onChange={e => {
                          const updated = invoiceForm.items.map(it => it.id === item.id ? { ...it, description: e.target.value } : it);
                          setInvoiceForm({ ...invoiceForm, items: updated });
                        }}
                      />
                      <input 
                        type="number" 
                        className="form-control" 
                        required 
                        style={{ flex: 1, textAlign: 'center' }}
                        placeholder="الكمية" 
                        min="1"
                        value={item.quantity}
                        onChange={e => {
                          const updated = invoiceForm.items.map(it => it.id === item.id ? { ...it, quantity: Number(e.target.value) } : it);
                          setInvoiceForm({ ...invoiceForm, items: updated });
                        }}
                      />
                      <input 
                        type="number" 
                        className="form-control" 
                        required 
                        style={{ flex: 1.5, textAlign: 'left' }}
                        placeholder="السعر (بدون ضريبة)" 
                        min="0"
                        value={item.price}
                        onChange={e => {
                          const updated = invoiceForm.items.map(it => it.id === item.id ? { ...it, price: Number(e.target.value) } : it);
                          setInvoiceForm({ ...invoiceForm, items: updated });
                        }}
                      />
                      {invoiceForm.items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setInvoiceForm({ ...invoiceForm, items: invoiceForm.items.filter(it => it.id !== item.id) })}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, { id: Date.now(), description: '', quantity: 1, price: 0 }] })}
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: '6px' }}
                  >
                    ➕ إضافة بند جديد
                  </button>
                </div>

                {/* Issue and due dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ الإصدار</label>
                    <input type="date" className="form-control" required value={invoiceForm.issueDate} onChange={e => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ الاستحقاق</label>
                    <input type="date" className="form-control" required value={invoiceForm.dueDate} onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">ملاحظات الفاتورة</label>
                  <textarea className="form-control" rows="2" value={invoiceForm.notes} onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الفاتورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Invoice Modal */}
      {editingInvoice && (
        <div className="modal-overlay" onClick={() => setEditingInvoice(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>✏️ تعديل الفاتورة رقم {editingInvoice.invoiceNumber}</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setEditingInvoice(null)}><Icons.X size={18} /></button>
            </div>

            <form onSubmit={handleEditInvoiceSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">اسم العميل بالكامل *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={editingInvoice.clientName} 
                    onChange={e => setEditingInvoice({ ...editingInvoice, clientName: e.target.value })} 
                  />
                </div>

                {/* Edit Items */}
                <div>
                  <label className="form-label" style={{ fontWeight: 800, display: 'block', marginBottom: '8px' }}>بنود الفاتورة والخدمات</label>
                  {editingInvoice.items?.map((item, idx) => (
                    <div key={item.id || idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        style={{ flex: 3 }}
                        value={item.description}
                        onChange={e => {
                          const updated = editingInvoice.items.map((it, i) => (it.id === item.id || i === idx) ? { ...it, description: e.target.value } : it);
                          setEditingInvoice({ ...editingInvoice, items: updated });
                        }}
                      />
                      <input 
                        type="number" 
                        className="form-control" 
                        required 
                        style={{ flex: 1, textAlign: 'center' }}
                        min="1"
                        value={item.quantity}
                        onChange={e => {
                          const updated = editingInvoice.items.map((it, i) => (it.id === item.id || i === idx) ? { ...it, quantity: Number(e.target.value) } : it);
                          setEditingInvoice({ ...editingInvoice, items: updated });
                        }}
                      />
                      <input 
                        type="number" 
                        className="form-control" 
                        required 
                        style={{ flex: 1.5 }}
                        min="0"
                        value={item.price}
                        onChange={e => {
                          const updated = editingInvoice.items.map((it, i) => (it.id === item.id || i === idx) ? { ...it, price: Number(e.target.value) } : it);
                          setEditingInvoice({ ...editingInvoice, items: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ الإصدار</label>
                    <input type="date" className="form-control" required value={editingInvoice.issueDate} onChange={e => setEditingInvoice({ ...editingInvoice, issueDate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ الاستحقاق</label>
                    <input type="date" className="form-control" required value={editingInvoice.dueDate} onChange={e => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })} />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">ملاحظات الفاتورة</label>
                  <textarea className="form-control" rows="2" value={editingInvoice.notes} onChange={e => setEditingInvoice({ ...editingInvoice, notes: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingInvoice(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">تحديث وتعديل</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Record New Payment Modal */}
      {isPaymentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>💰 تسجيل دفعة نقدية مستلمة (الداخل)</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsPaymentModalOpen(false)}><Icons.X size={18} /></button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                
                {/* Related Invoice Selector */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">الفاتورة المستحقة *</label>
                  <select 
                    className="form-control" 
                    required
                    value={paymentForm.invoiceNumber}
                    onChange={e => {
                      const num = e.target.value;
                      const related = invoices.find(inv => inv.invoiceNumber === num);
                      setPaymentForm({
                        ...paymentForm,
                        invoiceNumber: num,
                        amount: related ? Math.max(0, related.total - related.paid) : ''
                      });
                    }}
                  >
                    <option value="">-- اختر الفاتورة المطلوب تحصيلها --</option>
                    {invoices.filter(inv => inv.status !== 'مدفوعة' && inv.status !== 'ملغاة').map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber}>{inv.invoiceNumber} | {inv.clientName} (المتبقي: {formatCurrency(inv.total - inv.paid)})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">مبلغ الدفعة (ريال) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      min="1"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">طريقة الدفع *</label>
                    <select 
                      className="form-control"
                      value={paymentForm.method}
                      onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    >
                      <option value="تحويل بنكي">تحويل بنكي</option>
                      <option value="مدى">بطاقة مدى</option>
                      <option value="فيزا / ماستركارد">فيزا / ماستركارد</option>
                      <option value="نقداً">نقداً</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ التحصيل *</label>
                    <input type="date" className="form-control" required value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">الرقم المرجعي للتحويل</label>
                    <input type="text" className="form-control" placeholder="مثل: TRX-00012" value={paymentForm.referenceNumber} onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">ملاحظات السداد</label>
                  <textarea className="form-control" rows="2" value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#ffffff' }}>تسجيل الدفعة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Record New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>💸 تسجيل مصروف ونفقة تشغيلية (الخارج)</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsExpenseModalOpen(false)}><Icons.X size={18} /></button>
            </div>

            <form onSubmit={handleExpenseSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">بيان وموضوع المصروف *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="مثال: شراء قرص صلب لتخزين الصور، صيانة كاميرا..." 
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
                    <label className="form-label">الجهة المستلمة للمصروف *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="اسم المعرض أو الشركة المستلمة"
                      value={expenseForm.recipient} 
                      onChange={e => setExpenseForm({ ...expenseForm, recipient: e.target.value })} 
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">طريقة الدفع *</label>
                    <select 
                      className="form-control"
                      value={expenseForm.paymentMethod}
                      onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    >
                      <option value="تحويل بنكي">تحويل بنكي</option>
                      <option value="نقداً">نقداً</option>
                      <option value="بطاقة مدى">بطاقة مدى</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">تاريخ الصرف</label>
                    <input type="date" className="form-control" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">الرقم المرجعي للمصروف</label>
                    <input type="text" className="form-control" placeholder="مثل رقم الفاتورة أو مرجع التحويل" value={expenseForm.referenceNumber} onChange={e => setExpenseForm({ ...expenseForm, referenceNumber: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">المسؤول (الموظف)</label>
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
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">مستند / فاتورة مرفقة (اختياري)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="اسم المستند المرفق (مثال: doc_0023)"
                      value={expenseForm.attachment} 
                      onChange={e => setExpenseForm({ ...expenseForm, attachment: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">تفاصيل وملاحظات إضافية</label>
                  <textarea className="form-control" rows="2" value={expenseForm.notes} onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
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

      {/* Modal 6: Printable ZATCA Tax Invoice Modal */}
      {selectedInvoiceForPDF && (
        <div className="modal-overlay" onClick={() => setSelectedInvoiceForPDF(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', backgroundColor: '#ffffff', color: '#0f172a', padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} className="no-print-bar">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>🧾 معاينة الفاتورة الضريبية المبسطة ZATCA</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  <Icons.Printer size={16} />
                  <span>طباعة وحفظ كـ PDF</span>
                </button>
                <button className="btn btn-icon btn-secondary" style={{ width: '34px', height: '34px', padding: 0 }} onClick={() => setSelectedInvoiceForPDF(null)}><Icons.X size={18} /></button>
              </div>
            </div>

            <div style={{ padding: '35px 30px', fontFamily: "'Cairo', 'Inter', sans-serif" }} className="print-invoice-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #6366f1', paddingBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4f46e5', margin: 0 }}>
                    {(settings && settings.general?.companyName) || 'مؤسسة استوديو عاهد العماري للإنتاج'}
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#475569', margin: '4px 0 0 0', fontWeight: 600 }}>الرقم الضريبي / VAT: 310992817200003</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>الرياض، المملكة العربية السعودية | Riyadh, KSA</p>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontWeight: 900, fontSize: '1.2rem', margin: 0, color: '#1e293b' }}>فاتورة ضريبية مبسطة</h3>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: '2px 0 0 0', color: '#64748b' }}>Simplified Tax Invoice</h4>
                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: '6px 0 0 0', fontWeight: 700 }}>
                    الرقم / No: <span className="en-digits" style={{ color: '#4f46e5' }}>{selectedInvoiceForPDF.invoiceNumber}</span>
                  </p>
                </div>
              </div>

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
                        <td style={{ padding: '3px 0', fontWeight: 800 }}>{selectedInvoiceForPDF.status}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

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
                  {selectedInvoiceForPDF.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 8px' }}><strong>{item.description}</strong></td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'left' }} className="en-digits">{formatCurrency(item.price)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'left' }} className="en-digits"><strong>{formatCurrency(item.quantity * item.price)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ border: '2px solid #e2e8f0', padding: '6px', borderRadius: '8px', backgroundColor: '#ffffff', width: '110px', height: '110px' }}>
                    <svg width="95" height="95" viewBox="0 0 100 100" style={{ shapeRendering: 'crispEdges' }}>
                      <path d="M0,0 h30 v6 h-24 v24 h-6 z M70,0 h30 v30 h-6 v-24 h-24 z M0,70 h6 v24 h24 v6 h-30 z M70,94 v-24 h30 v30 h-30 z" fill="#0f172a" />
                      <rect x="6" y="6" width="18" height="18" fill="#0f172a" />
                      <rect x="10" y="10" width="10" height="10" fill="#ffffff" />
                      <rect x="12" y="12" width="6" height="6" fill="#0f172a" />
                      <rect x="76" y="6" width="18" height="18" fill="#0f172a" />
                      <rect x="80" y="12" width="10" height="10" fill="#ffffff" />
                      <rect x="82" y="12" width="6" height="6" fill="#0f172a" />
                      <rect x="6" y="76" width="18" height="18" fill="#0f172a" />
                      <rect x="10" y="80" width="10" height="10" fill="#ffffff" />
                      <rect x="12" y="82" width="6" height="6" fill="#0f172a" />
                      <path d="M35,6 h6 v6 h-6 z M45,6 h10 v6 h-10 z M60,6 h8 v12 h-8 z M35,16 h14 v6 h-14 z M55,16 h12 v6 h-12 z M35,26 h10 v6 h-10 z M50,26 h18 v6 h-18 z M6,35 h24 v6 h-24 z M35,35 h8 v12 h-8 z M48,35 h14 v6 h-14 z M68,35 h26 v6 h-26 z M6,45 h10 v6 h-10 z M22,45 h20 v6 h-20 z M48,45 h16 v12 h-16 z M70,45 h24 v6 h-24 z M6,55 h30 v6 h-30 z M40,55 h10 v6 h-10 z M55,55 h12 v6 h-12 z M74,55 h20 v14 h-20 z M6,66 h14 v6 h-14 z M26,66 h24 v12 h-24 z" fill="#0f172a" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.6' + 'rem', color: '#64748b', fontWeight: 600 }}>فاتورة مبسطة معتمدة ZATCA</span>
                </div>

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
                        <td style={{ padding: '8px 0', fontWeight: 900, color: '#1e293b' }}>الإجمالي النهائي / Total Due:</td>
                        <td style={{ padding: '8px 0', fontWeight: 900, color: '#4f46e5' }} className="en-digits">{formatCurrency(selectedInvoiceForPDF.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Printable Financial Report Modal */}
      {selectedReportForPDF && (
        <div className="modal-overlay" onClick={() => setSelectedReportForPDF(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', backgroundColor: '#ffffff', color: '#0f172a', padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} className="no-print-bar">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>📄 معاينة وطباعة التقرير المالي</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  <Icons.Printer size={16} />
                  <span>طباعة التقرير PDF</span>
                </button>
                <button className="btn btn-icon btn-secondary" style={{ width: '34px', height: '34px', padding: 0 }} onClick={() => setSelectedReportForPDF(null)}><Icons.X size={18} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 30px', fontFamily: "'Cairo', 'Inter', sans-serif" }} className="print-invoice-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #6366f1', paddingBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4f46e5', margin: 0 }}>
                    {(settings && settings.general?.companyName) || 'مؤسسة استوديو عاهد العماري للإنتاج'}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>عنوان التقرير: تقرير مالي تشغيلي مفصل</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>الفترة: <strong>{selectedReportForPDF.periodTitle}</strong></p>
                </div>
                <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>
                  <div>تاريخ التصدير: <span className="en-digits">{new Date().toISOString().substring(0, 10)}</span></div>
                  <div>المصدر: لوحة التحكم المالية</div>
                  <div>المعدّ: {currentUser?.name || 'عاهد العماري'}</div>
                </div>
              </div>

              {/* Stats Metrics Block */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '24px', marginBottom: '24px' }}>
                <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>إجمالي الفواتير</span>
                  <strong style={{ fontSize: '0.94rem', color: '#0f172a', display: 'block', marginTop: '4px' }} className="en-digits">{formatCurrency(selectedReportForPDF.totalRev)}</strong>
                </div>
                <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>المبالغ المحصلة</span>
                  <strong style={{ fontSize: '0.94rem', color: '#10b981', display: 'block', marginTop: '4px' }} className="en-digits">{formatCurrency(selectedReportForPDF.totalCol)}</strong>
                </div>
                <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>المستحقات المتبقية</span>
                  <strong style={{ fontSize: '0.94rem', color: '#ef4444', display: 'block', marginTop: '4px' }} className="en-digits">{formatCurrency(selectedReportForPDF.totalRem)}</strong>
                </div>
                <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>المصروفات والنفقات</span>
                  <strong style={{ fontSize: '0.94rem', color: '#ef4444', display: 'block', marginTop: '4px' }} className="en-digits">{formatCurrency(selectedReportForPDF.totalOut)}</strong>
                </div>
                <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>صافي الدخل</span>
                  <strong style={{ fontSize: '0.94rem', color: selectedReportForPDF.netInc >= 0 ? '#10b981' : '#ef4444', display: 'block', marginTop: '4px' }} className="en-digits">{formatCurrency(selectedReportForPDF.netInc)}</strong>
                </div>
              </div>

              {/* Transactions List */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', color: '#1e293b' }}>📋 قائمة العمليات المالية والتدفقات النقدية التفصيلية</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'right', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px' }}>تاريخ الحركة</th>
                    <th style={{ padding: '8px' }}>رقم الفاتورة/العملية</th>
                    <th style={{ padding: '8px' }}>التصنيف والبيان</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>القيمة</th>
                    <th style={{ padding: '8px' }}>العميل / الجهة</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>حالة السداد</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReportForPDF.invoicesList.map(inv => (
                    <tr key={`print-inv-${inv.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{inv.issueDate}</td>
                      <td style={{ padding: '8px' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '8px' }}>فاتورة مبيعات - خدمات تصوير</td>
                      <td style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }} className="en-digits">{formatCurrency(inv.total)}</td>
                      <td style={{ padding: '8px' }}>{inv.clientName}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{inv.status}</td>
                    </tr>
                  ))}
                  {selectedReportForPDF.expensesList.map(ex => (
                    <tr key={`print-ex-${ex.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{ex.date}</td>
                      <td style={{ padding: '8px' }}>#EXP-{ex.id}</td>
                      <td style={{ padding: '8px' }}>مصروف تشغيلي: {ex.title}</td>
                      <td style={{ padding: '8px', textAlign: 'left', color: '#ef4444', fontWeight: 700 }} className="en-digits">-{formatCurrency(ex.amount)}</td>
                      <td style={{ padding: '8px' }}>{ex.recipient || ex.spentBy}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#ef4444' }}>مصروف</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '30px', borderTop: '2px solid #e2e8f0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                <span>نهاية التقرير المالي المعتمد</span>
                <span className="en-digits">الصفحة 1 من 1</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialsView;
