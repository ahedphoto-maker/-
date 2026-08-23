import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';

const DEFAULT_PRESETS = [
  {
    id: 'preset-portrait',
    name: 'قالب بورتريه',
    photographyType: 'بورتريه',
    icon: 'User',
    items: [
      { categoryMatch: 'الكاميرات', qty: 1 },
      { nameMatch: '24-70', qty: 1 },
      { nameMatch: 'AD600', qty: 1 },
      { nameMatch: 'Speedlite', qty: 1 }
    ]
  },
  {
    id: 'preset-project',
    name: 'قالب تصوير مشروع',
    photographyType: 'تصوير مشروع',
    icon: 'Building2',
    items: [
      { categoryMatch: 'الكاميرات', qty: 2 },
      { nameMatch: '24-70', qty: 1 },
      { nameMatch: '70-200', qty: 1 },
      { nameMatch: 'AD600', qty: 2 }
    ]
  },
  {
    id: 'preset-event',
    name: 'قالب فعالية',
    photographyType: 'فعالية',
    icon: 'PartyPopper',
    items: [
      { categoryMatch: 'الكاميرات', qty: 2 },
      { nameMatch: '24-70', qty: 1 },
      { nameMatch: '70-200', qty: 1 },
      { nameMatch: 'Speedlite', qty: 2 }
    ]
  }
];

export const EquipmentManifestModal = ({
  isOpen,
  onClose,
  equipmentList = [],
  currentUser,
  savedManifests = [],
  onSaveManifest
}) => {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview'
  const [projectName, setProjectName] = useState('');
  const [clientEntity, setClientEntity] = useState('');
  const [photographyType, setPhotographyType] = useState('تصوير مشروع');
  const [shootingDate, setShootingDate] = useState(new Date().toISOString().split('T')[0]);
  const [photographerName, setPhotographerName] = useState(currentUser?.name || 'عاهد العماري');

  // Equipment Selection State: { [equipId]: quantity }
  const [selectedItems, setSelectedItems] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(equipmentList.map(e => e.category || 'أخرى'));
    return ['all', ...Array.from(cats)];
  }, [equipmentList]);

  const filteredEquipment = useMemo(() => {
    if (filterCategory === 'all') return equipmentList;
    return equipmentList.filter(e => e.category === filterCategory);
  }, [equipmentList, filterCategory]);

  const toggleEquipment = (equipId) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[equipId]) {
        delete next[equipId];
      } else {
        const item = equipmentList.find(e => String(e.id) === String(equipId));
        next[equipId] = item?.quantity || 1;
      }
      return next;
    });
  };

  const updateItemQty = (equipId, qty) => {
    const parsed = Math.max(1, parseInt(qty) || 1);
    setSelectedItems(prev => ({
      ...prev,
      [equipId]: parsed
    }));
  };

  const applyPreset = (preset) => {
    const newSelected = {};
    if (preset.photographyType) setPhotographyType(preset.photographyType);

    equipmentList.forEach(equip => {
      const matched = preset.items.find(p => {
        if (p.nameMatch && equip.name.toLowerCase().includes(p.nameMatch.toLowerCase())) return true;
        if (p.categoryMatch && equip.category === p.categoryMatch) return true;
        return false;
      });

      if (matched) {
        newSelected[equip.id] = Math.min(equip.quantity || 1, matched.qty || 1);
      }
    });

    setSelectedItems(newSelected);
  };

  const selectedEquipmentList = useMemo(() => {
    return Object.entries(selectedItems)
      .map(([id, qty]) => {
        const item = equipmentList.find(e => String(e.id) === String(id));
        if (!item) return null;
        return { ...item, selectedQty: qty };
      })
      .filter(Boolean);
  }, [selectedItems, equipmentList]);

  const handleSave = () => {
    if (!projectName.trim()) {
      alert('الرجاء إدخال اسم المشروع أولاً.');
      return;
    }
    if (selectedEquipmentList.length === 0) {
      alert('الرجاء اختيار معدة واحدة على الأقل للكشف.');
      return;
    }

    const newManifest = {
      id: `man-${Date.now()}`,
      projectName,
      clientEntity,
      photographyType,
      shootingDate,
      photographerName,
      createdAt: new Date().toISOString(),
      items: selectedEquipmentList.map(e => ({ id: e.id, name: e.name, category: e.category, qty: e.selectedQty }))
    };

    if (onSaveManifest) onSaveManifest(newManifest);
    alert('✅ تم حفظ كشف المعدات بنجاح!');
  };

  const handleShare = () => {
    const summary = `🎒 *كشف معدات مشروع - STAR MEDIA*\n\n📌 *المشروع:* ${projectName || 'غير مسمى'}\n🏢 *الجهة:* ${clientEntity || 'عام'}\n📅 *التاريخ:* ${shootingDate}\n👤 *المصور:* ${photographerName}\n\n*المعدات المختارة (${selectedEquipmentList.length} قطعة):*\n` +
      selectedEquipmentList.map(e => `- ${e.name} (الكمية: ${e.selectedQty})`).join('\n');
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      alert('📋 تم نسخ ملخص كشف المعدات إلى الحافظة للمشاركة!');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100, // var(--z-modal-backdrop)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.FileSpreadsheet size={20} color="var(--primary-color)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>منشئ كشوفات استلام المعدات 🎒</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose} style={{ width: '32px', height: '32px', padding: 0 }}>
            <Icons.X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <button
            onClick={() => setActiveTab('form')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              color: activeTab === 'form' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'form' ? '3px solid var(--primary-color)' : 'none'
            }}
          >
            📋 اختيار وتجهيز المعدات
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              color: activeTab === 'preview' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'preview' ? '3px solid var(--primary-color)' : 'none'
            }}
          >
            👁️ معاينة وطباعة الكشف
          </button>
        </div>

        {/* Body content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'form' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Left Side: Metadata and presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 900, margin: 0 }}>تفاصيل التغطية والمشروع</h4>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>اسم المشروع / المهمة *</label>
                    <input type="text" className="form-control" placeholder="مثال: تغطية فعاليات مؤتمر اليوم الوطني" value={projectName} onChange={e => setProjectName(e.target.value)} style={{ height: '36px', fontSize: '0.82rem' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>الجهة / العميل</label>
                    <input type="text" className="form-control" placeholder="مثال: وزارة الإعلام" value={clientEntity} onChange={e => setClientEntity(e.target.value)} style={{ height: '36px', fontSize: '0.82rem' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>تاريخ العمل</label>
                      <input type="date" className="form-control" value={shootingDate} onChange={e => setShootingDate(e.target.value)} style={{ height: '36px', fontSize: '0.82rem' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>المصور</label>
                      <input type="text" className="form-control" value={photographerName} onChange={e => setPhotographerName(e.target.value)} style={{ height: '36px', fontSize: '0.82rem' }} />
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 900, margin: 0 }}>⚡ اختيار سريع من القوالب</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {DEFAULT_PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p)}
                        className="btn btn-secondary"
                        style={{ justifyContent: 'flex-start', gap: '8px', padding: '8px 12px', fontSize: '0.82rem', height: '38px', minHeight: '38px' }}
                      >
                        <Icons.Bookmark size={14} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Equipment picker */}
              <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 900, margin: 0 }}>📷 اختر المعدات</h4>
                  <select
                    className="form-control"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{ width: '150px', height: '32px', fontSize: '0.78rem', padding: '0 8px' }}
                  >
                    <option value="all">كل التصنيفات</option>
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredEquipment.map(item => {
                    const isChecked = !!selectedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: isChecked ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleEquipment(item.id)}>
                          <input type="checkbox" checked={isChecked} readOnly style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          <div>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>{item.name}</span>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.category}</span>
                          </div>
                        </div>
                        {isChecked && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>العدد:</span>
                            <input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={selectedItems[item.id]}
                              onChange={e => updateItemQty(item.id, e.target.value)}
                              style={{ width: '50px', height: '24px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 700 }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Preview mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '30px',
                  borderRadius: '12px',
                  border: '2px solid #000000',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontFamily: 'Cairo, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {/* Print layout title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>مؤسسة ستار ميديا للإنتاج الفني</h2>
                    <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>كشف تسليم واستلام العهد والمعدات الميدانية</p>
                  </div>
                  <Icons.Camera size={36} color="#000000" />
                </div>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
                  <div>📌 المشروع: <strong>{projectName || 'غير مسمى'}</strong></div>
                  <div>🏢 الجهة: <strong>{clientEntity || 'عام'}</strong></div>
                  <div>📅 تاريخ التغطية: <strong>{shootingDate}</strong></div>
                  <div>👤 المصور المسؤول: <strong>{photographerName}</strong></div>
                </div>

                {/* Items table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000000', borderTop: '2px solid #000000', backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '8px', textAlign: 'right' }}>الرقم</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>اسم المعدة والأجهزة</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>التصنيف</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>الكمية المستلمة</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>حالة الاستلام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEquipmentList.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>لم يتم اختيار أي معدة بعد.</td>
                      </tr>
                    ) : (
                      selectedEquipmentList.map((item, index) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px' }}>{index + 1}</td>
                          <td style={{ padding: '8px' }}><strong>{item.name}</strong></td>
                          <td style={{ padding: '8px' }}>{item.category}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}><strong>{item.selectedQty}</strong></td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>[  ] سليم  /  [  ] ملاحظة</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', marginTop: '40px', fontSize: '0.85rem', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                  <div>
                    <p>توقيع المصور المستلم للعهدة:</p>
                    <p style={{ marginTop: '30px', borderBottom: '1px solid #000', width: '180px' }}></p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p>اعتماد وتوقيع مسؤول المستودع:</p>
                    <p style={{ marginTop: '30px', borderBottom: '1px solid #000', width: '180px', marginRight: 'auto' }}></p>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={handleShare} style={{ gap: '6px' }}>
                  <Icons.Share2 size={16} />
                  <span>نسخ تقرير التجهيز</span>
                </button>
                <button className="btn btn-primary" onClick={() => window.print()} style={{ gap: '6px' }}>
                  <Icons.Printer size={16} />
                  <span>طباعة الكشف PDF ↗</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-main)' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ marginRight: '8px' }}>إغلاق</button>
          {activeTab === 'form' && (
            <button className="btn btn-primary" onClick={handleSave}>
              حفظ كشف العهدة ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentManifestModal;
