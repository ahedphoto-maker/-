import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatDate } from '../../utils/helpers';
import { EquipmentManifestModal } from './EquipmentManifestModal';
import * as Icons from 'lucide-react';

export const EquipmentView = () => {
  const { equipment, addEquipment, updateEquipment, deleteEquipment, bookings, userRole, currentUser } = useApp();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal / Drawer States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState(null);
  const [selectedEquip, setSelectedEquip] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeMenuEquipId, setActiveMenuEquipId] = useState(null);

  // Equipment Manifest State
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [savedManifests, setSavedManifests] = useState(() => {
    try {
      const raw = localStorage.getItem('lensflow_equipment_manifests');
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  });

  const handleSaveManifest = (newManifest) => {
    setSavedManifests(prev => {
      const updated = [newManifest, ...prev];
      try { localStorage.setItem('lensflow_equipment_manifests', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  // Form State for Add / Edit
  const initialFormState = {
    name: '',
    category: 'الكاميرات',
    quantity: 1,
    serialNumber: '',
    brand: '',
    model: '',
    status: 'متاحة',
    condition: 'ممتازة 100%',
    inspectionScore: 100,
    purchaseDate: '',
    lastMaintenance: '',
    nextMaintenance: '',
    imageUrl: '',
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const isEmployee = userRole === 'employee' || userRole === 'photographer';
  const isAdmin = !isEmployee;

  // Dynamic Fleet Statistics Calculations from DB
  const totalTypesCount = equipment ? equipment.length : 0;
  const totalPiecesCount = equipment ? equipment.reduce((sum, e) => sum + (Number(e.quantity) || 1), 0) : 0;

  const availablePiecesCount = equipment ? equipment.reduce((sum, e) => {
    if (e.status === 'غير متاحة' || e.status === 'صيانة') return sum;
    const reserved = Number(e.reservedQuantity) || 0;
    const qty = Number(e.quantity) || 1;
    return sum + Math.max(0, qty - reserved);
  }, 0) : 0;

  const unavailablePiecesCount = equipment ? equipment.reduce((sum, e) => {
    const qty = Number(e.quantity) || 1;
    if (e.status === 'غير متاحة' || e.status === 'صيانة') return sum + qty;
    return sum + (Number(e.reservedQuantity) || 0);
  }, 0) : 0;

  const inUsePiecesCount = equipment ? equipment.reduce((sum, e) => sum + (Number(e.reservedQuantity) || 0), 0) : 0;

  const readinessPercent = totalPiecesCount > 0 
    ? Math.round((availablePiecesCount / totalPiecesCount) * 100) 
    : 100;

  // Filtered Equipment List
  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];
    return equipment.filter(item => {
      // Search text match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(query)) ||
        (item.brand && item.brand.toLowerCase().includes(query)) ||
        (item.model && item.model.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));

      // Status filter match
      let matchesStatus = true;
      if (statusFilter === 'متاحة') matchesStatus = item.status === 'متاحة';
      else if (statusFilter === 'غير متاحة') matchesStatus = item.status === 'غير متاحة';
      else if (statusFilter === 'قيد الاستخدام') matchesStatus = item.status === 'قيد الاستخدام' || (item.reservedQuantity > 0);
      else if (statusFilter === 'محجوزة') matchesStatus = item.status === 'محجوزة' || (item.reservedQuantity > 0);
      else if (statusFilter === 'صيانة') matchesStatus = item.status === 'صيانة';

      // Category filter match
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [equipment, searchQuery, statusFilter, categoryFilter]);

  const getCategoryIcon = (category) => {
    const iconProps = { size: 18, style: { minWidth: '18px' } };
    const cat = category || '';
    if (cat.includes('كامير')) return <Icons.Camera {...iconProps} color="#6366f1" />;
    if (cat.includes('عدس')) return <Icons.Aperture {...iconProps} color="#06b6d4" />;
    if (cat.includes('إضاء') || cat.includes('فلاش')) return <Icons.Sun {...iconProps} color="#f59e0b" />;
    if (cat.includes('حوامل') || cat.includes('استديو')) return <Icons.Maximize2 {...iconProps} color="#ec4899" />;
    if (cat.includes('تخزين') || cat.includes('إكسسوار') || cat.includes('ذاكر')) return <Icons.HardDrive {...iconProps} color="#8b5cf6" />;
    if (cat.includes('جهاز') || cat.includes('لابتوب') || cat.includes('كمبيوتر')) return <Icons.Laptop {...iconProps} color="#3b82f6" />;
    return <Icons.Package {...iconProps} color="#94a3b8" />;
  };

  // Open Details Drawer
  const handleOpenDetails = (equip) => {
    setSelectedEquip(equip);
    setIsDetailDrawerOpen(true);
    setActiveMenuEquipId(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (equip) => {
    setEditingEquip(equip);
    setFormData({
      name: equip.name || '',
      category: equip.category || 'الكاميرات',
      quantity: equip.quantity || 1,
      serialNumber: equip.serialNumber || '',
      brand: equip.brand || '',
      model: equip.model || '',
      status: equip.status || 'متاحة',
      condition: equip.condition || 'ممتازة 100%',
      inspectionScore: equip.inspectionScore || 100,
      purchaseDate: equip.purchaseDate || '',
      lastMaintenance: equip.lastMaintenance || '',
      nextMaintenance: equip.nextMaintenance || '',
      imageUrl: equip.imageUrl || '',
      notes: equip.notes || ''
    });
    setIsAddModalOpen(true);
    setActiveMenuEquipId(null);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingEquip) {
      updateEquipment(editingEquip.id, formData);
      alert('✅ تم تحديث بيانات المعدة بنجاح!');
    } else {
      addEquipment({
        ...formData,
        quantity: Number(formData.quantity) || 1,
        reservedQuantity: 0,
        serialNumber: formData.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
        id: Date.now()
      });
      alert('🎉 تم إضافة المعدة الجديدة بنجاح إلى قاعدة البيانات!');
    }

    setIsAddModalOpen(false);
    setEditingEquip(null);
    setFormData(initialFormState);
  };

  // Delete Equipment
  const handleDelete = (equip) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف المعدة "${equip.name}"؟`)) {
      deleteEquipment(equip.id);
      setActiveMenuEquipId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header Section */}
      <div 
        className="card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icons.Camera size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  إدارة المعدات والعهد 🎥
                </h1>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  مراقبة جاهزية الكاميرات، العدسات، الفلاشات وتجهيز كشوفات التغطية.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setIsManifestModalOpen(true)}
              className="btn btn-secondary"
              style={{ height: '38px', padding: '0 14px', gap: '8px', fontSize: '0.82rem', fontWeight: 800 }}
            >
              <Icons.FileSpreadsheet size={16} />
              <span>إنشاء كشف معدات PDF</span>
            </button>

            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingEquip(null);
                  setFormData(initialFormState);
                  setIsAddModalOpen(true);
                }} 
                className="btn btn-primary"
                style={{ height: '38px', padding: '0 14px', gap: '8px', fontSize: '0.82rem', fontWeight: 800 }}
              >
                <Icons.Plus size={16} />
                <span>إضافة معدة جديدة</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          {/* Instant Search Input */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Icons.Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              className="form-control"
              placeholder="بحث باسم المعدة (مثل: R5 أو 600)، الموديل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: '38px', height: '36px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ flex: '0 1 170px' }}>
            <select 
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.82rem' }}
            >
              <option value="all">كل الحالات</option>
              <option value="متاحة">🟢 متاحة</option>
              <option value="قيد الاستخدام">🟠 قيد الاستخدام / محجوزة</option>
              <option value="صيانة">🔴 صيانة</option>
              <option value="غير متاحة">🔴 غير متاحة</option>
            </select>
          </div>

          {/* Category Filter Dropdown */}
          <div style={{ flex: '0 1 180px' }}>
            <select 
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.82rem' }}
            >
              <option value="all">جميع التصنيفات</option>
              <option value="الكاميرات">📷 الكاميرات</option>
              <option value="العدسات">🔭 العدسات</option>
              <option value="الإضاءة والفلاش">💡 الإضاءة والفلاش</option>
              <option value="الحوامل والاستديو">🎛️ الحوامل والاستديو</option>
              <option value="التخزين والإكسسوارات">🎒 التخزين والإكسسوارات</option>
              <option value="الأجهزة">💻 الأجهزة واللابتوب</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fleet Readiness Banner */}
      <div 
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icons.ShieldCheck size={22} color="#10b981" />
            <div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>جاهزية أسطول التغطية:</span>
              <strong style={{ display: 'block', fontSize: '0.92rem', color: '#ffffff', marginTop: '2px' }}>
                حالة الأسطول: {readinessPercent}% من القطع ({availablePiecesCount} من أصل {totalPiecesCount} قطعة) جاهزة للاستخدام
              </strong>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${readinessPercent}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)', 
              borderRadius: '999px',
              transition: 'width 0.5s ease'
            }} 
          />
        </div>
      </div>

      {/* Equipment Desktop Table */}
      {filteredEquipment.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Icons.CameraOff size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontWeight: 700 }}>لا توجد معدات تطابق خيارات التصفية الحالية</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>المعدة</th>
                <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>التصنيف</th>
                <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>الكمية والتوفر</th>
                <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>Serial Number</th>
                <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>الحالة</th>
                {isAdmin && <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800, textAlign: 'left' }}>الإجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map(equip => {
                const totalQty = Number(equip.quantity) || 1;
                const resQty = Number(equip.reservedQuantity) || 0;
                const availQty = Math.max(0, totalQty - resQty);
                const isUnavailable = equip.status === 'غير متاحة' || equip.status === 'صيانة';

                return (
                  <tr key={equip.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                          {getCategoryIcon(equip.category)}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.88rem' }}>{equip.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{equip.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{equip.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.8rem' }}>{availQty} متاح / {totalQty} كلي</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ fontSize: '0.78rem', color: 'var(--primary-color)' }}>{equip.serialNumber || `SN-${equip.id}`}</code>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isUnavailable ? (
                        <span className="badge badge-danger">{equip.status}</span>
                      ) : (
                        <StatusBadge status={equip.status} />
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button onClick={() => handleOpenEdit(equip)} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.74rem', height: '28px' }}>تعديل</button>
                          <button onClick={() => handleDelete(equip)} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.74rem', height: '28px', color: 'var(--status-danger)' }}>حذف</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manifest Modal */}
      <EquipmentManifestModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        equipmentList={equipment}
        currentUser={currentUser}
        savedManifests={savedManifests}
        onSaveManifest={handleSaveManifest}
      />

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEquip ? 'تعديل المعدة' : 'إضافة معدة جديدة'}</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setIsAddModalOpen(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
                <Icons.X size={18} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">اسم المعدة *</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">التصنيف *</label>
                    <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      <option value="الكاميرات">الكاميرات</option>
                      <option value="العدسات">العدسات</option>
                      <option value="الإضاءة والفلاش">الإضاءة والفلاش</option>
                      <option value="الحوامل والاستديو">الحوامل والاستديو</option>
                      <option value="التخزين والإكسسوارات">التخزين والإكسسوارات</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">الكمية *</label>
                    <input type="number" min="1" className="form-control" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">الرقم التسلسلي</label>
                    <input type="text" className="form-control" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">العلامة التجارية</label>
                    <input type="text" className="form-control" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ المعدة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentView;
