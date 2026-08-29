import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import * as Icons from 'lucide-react';

export const CompaniesView = () => {
  const { companies, setCompanies, userRole, currentUser } = useApp();
  const isSuper = userRole === 'admin' || 
                  (currentUser && (
                    currentUser.isSupervisor === true || 
                    currentUser.id === 1 || 
                    (currentUser.role && (currentUser.role.includes('مدير') || currentUser.role.includes('مشرف')))
                  ));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', logo: '🏢', contactPerson: '', phone: '', email: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCompany.name) return;
    if (setCompanies) {
      setCompanies(prev => [...prev, { id: Date.now(), totalRevenue: 0, projectsCount: 0, ...newCompany }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🏢 شركات ووكالات التصوير الشريكة</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الشركات والوكالات الإعلانية التي تسند مشاريعها للمصور الفريلانسر</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Icons.Plus size={18} />
          <span>إضافة شركة جديدة</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {companies && companies.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '2rem', padding: '8px', background: '#f8fafc', borderRadius: '12px' }}>{c.logo || '🏢'}</div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{c.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المسؤول: {c.contactPerson}</p>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p>📞 الهاتف: <strong dir="ltr">{c.phone}</strong></p>
              <p>✉️ البريد: <strong>{c.email || 'partner@star-media.sa'}</strong></p>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {isSuper && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>إجمالي إيراد العقود:</span>
                  <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-color)' }}>{formatCurrency(c.totalRevenue || 0)}</p>
                </div>
              )}
              <span className="badge badge-purple">{c.projectsCount || 0} مشاريع</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>إضافة شركة تصوير جديدة</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsModalOpen(false)}><Icons.X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">اسم الشركة / الوكالة *</label>
                  <input type="text" className="form-control" required value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">الشخص المسؤول *</label>
                  <input type="text" className="form-control" required value={newCompany.contactPerson} onChange={e => setNewCompany({ ...newCompany, contactPerson: e.target.value })} />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">رقم الهاتف</label>
                  <input type="text" className="form-control" value={newCompany.phone} onChange={e => setNewCompany({ ...newCompany, phone: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الشركة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesView;
