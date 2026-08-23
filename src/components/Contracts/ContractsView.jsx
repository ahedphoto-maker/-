import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { formatBookingNumber } from '../../utils/helpers';

export const ContractsView = () => {
  const { contracts, addContract, signContract, bookings } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedContractForSigning, setSelectedContractForSigning] = useState(null);
  const [signedName, setSignedName] = useState('');
  
  const [formData, setFormData] = useState({
    bookingId: '',
    clientName: '',
    clientPhone: '',
    type: 'تصوير حفلات',
    date: '',
    location: '',
    totalPrice: '',
    deposit: '',
    terms: 'يلتزم الطرف الأول بتقديم الخدمات في الوقت المحدد وبأعلى جودة ممكنة. يلتزم الطرف الثاني بدفع المستحقات المالية حسب الجدول الزمني المتفق عليه.'
  });

  const handleCreateContract = (e) => {
    e.preventDefault();
    if (!formData.bookingId) return;
    const linkedBooking = bookings && bookings.find(b => b.id === Number(formData.bookingId));
    if (addContract) {
      addContract({
        ...formData,
        bookingId: Number(formData.bookingId),
        bookingTitle: linkedBooking ? linkedBooking.title : 'حجز مستقل',
        totalPrice: Number(formData.totalPrice),
        deposit: Number(formData.deposit),
        remainingAmount: Number(formData.totalPrice) - Number(formData.deposit)
      });
    }
    setIsCreateModalOpen(false);
    // Reset form
    setFormData({
      bookingId: '',
      clientName: '',
      clientPhone: '',
      type: 'تصوير حفلات',
      date: '',
      location: '',
      totalPrice: '',
      deposit: '',
      terms: 'يلتزم الطرف الأول بتقديم الخدمات في الوقت المحدد وبأعلى جودة ممكنة. يلتزم الطرف الثاني بدفع المستحقات المالية حسب الجدول الزمني المتفق عليه.'
    });
  };

  const handleSignSubmit = (e) => {
    e.preventDefault();
    if (!signedName) return;
    // Generate a simple simulated signature data URI
    const canvasSig = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><text x="10" y="30" font-family="cursive" font-size="20">${signedName}</text></svg>`;
    if (signContract) {
      signContract(selectedContractForSigning.id, canvasSig, signedName);
    }
    setSelectedContractForSigning(null);
    setSignedName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📄 إدارة العقود الإلكترونية</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إنشاء، توقيع، ومتابعة الوضع القانوني لعقود التصوير الميداني والتجاري.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Icons.Plus size={18} />
          <span>عقد جديد</span>
        </button>
      </div>

      {/* Contracts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {contracts && contracts.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.contractNumber}</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginTop: '2px' }}>{c.bookingTitle}</h3>
              </div>
              <span className={`badge ${c.status === 'تم التوقيع' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.66rem' }}>
                {c.status}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ margin: 0 }}>👤 العميل: <strong>{c.clientName}</strong> ({c.clientPhone})</p>
              <p style={{ margin: 0 }}>📍 الموقع: <strong>{c.location}</strong></p>
              <p style={{ margin: 0 }}>💰 القيمة الإجمالية: <strong>{(c.totalPrice || 0).toLocaleString('en-US')} ريال</strong></p>
              <p style={{ margin: 0 }}>💳 العربون المدفوع: <strong>{(c.deposit || 0).toLocaleString('en-US')} ريال</strong></p>
            </div>

            <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', borderRight: '3px solid var(--border-color)', fontStyle: 'italic' }}>
              "{c.terms && c.terms.substring(0, 100)}..."
            </div>

            {/* Signature Area */}
            {c.status === 'تم التوقيع' ? (
              <div style={{ marginTop: '8px', padding: '10px', border: '1px dashed #10b981', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 800, margin: 0 }}>✍️ موقع إلكترونياً بواسطة:</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 900, marginTop: '2px', margin: 0 }}>{c.signedByClient}</p>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                  {c.signedAt}
                </div>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setSelectedContractForSigning(c)} style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '36px', fontSize: '0.8rem' }}>
                <Icons.Signature size={16} />
                <span>توقيع العقد إلكترونياً ✍️</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create Contract Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>📄 صياغة عقد إلكتروني جديد</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsCreateModalOpen(false)}><Icons.X size={18} /></button>
            </div>
            <form onSubmit={handleCreateContract}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">ربط الحجز المالي *</label>
                  <select className="form-control" required value={formData.bookingId} onChange={e => {
                    const b = bookings && bookings.find(item => item.id === Number(e.target.value));
                    setFormData({
                      ...formData,
                      bookingId: e.target.value,
                      clientName: b ? b.clientName : '',
                      totalPrice: b ? b.totalPrice : '',
                      deposit: b ? b.deposit : '',
                      date: b ? b.date : '',
                      location: b ? b.location : ''
                    });
                  }}>
                    <option value="">-- اختر حجز قائم --</option>
                    {bookings && bookings.map(b => (
                      <option key={b.id} value={b.id}>{formatBookingNumber(b.bookingNumber)} - {b.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">اسم العميل *</label>
                    <input type="text" className="form-control" required value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">جوال العميل *</label>
                    <input type="text" className="form-control" required value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">السعر الإجمالي (ريال) *</label>
                    <input type="number" className="form-control" required value={formData.totalPrice} onChange={e => setFormData({ ...formData, totalPrice: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">العربون (ريال) *</label>
                    <input type="number" className="form-control" required value={formData.deposit} onChange={e => setFormData({ ...formData, deposit: e.target.value })} />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">شروط العقد وبنود التسليم</label>
                  <textarea className="form-control" rows={3} value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ وإنشاء العقد</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signing Pad Modal */}
      {selectedContractForSigning && (
        <div className="modal-overlay" onClick={() => setSelectedContractForSigning(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>✍️ توقيع رقمي مصادق للعقد</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setSelectedContractForSigning(null)}><Icons.X size={18} /></button>
            </div>
            <form onSubmit={handleSignSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>أكتب اسمك الصريح أدناه لمحاكاة توقيعك والمصادقة على بنود هذا العقد إلكترونياً.</p>
                <div style={{ height: '120px', border: '2px dashed var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', position: 'relative' }}>
                  {signedName ? (
                    <span style={{ fontFamily: 'cursive', fontSize: '1.8rem', color: 'var(--primary-color)' }}>{signedName}</span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مربع التوقيع الرقمي 🖋️</span>
                  )}
                </div>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="أدخل اسمك الكامل للتوقيع"
                  value={signedName}
                  onChange={e => setSignedName(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800 }}
                />
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedContractForSigning(null)}>إلغاء</button>
                <button type="submit" className="btn btn-success" disabled={!signedName}>تأكيد وتوقيع العقد ✓</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsView;
