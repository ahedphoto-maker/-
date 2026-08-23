import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import { formatCurrency } from '../../utils/helpers';
import * as Icons from 'lucide-react';

export const ProjectsView = () => {
  const { projects, userRole, currentUser } = useApp();

  const isEmployee = userRole === 'employee' || userRole === 'photographer';

  const userProjects = projects ? projects.filter(p => {
    if (!isEmployee) return true;
    if (!currentUser || !currentUser.id) return false;
    const teamIds = p.teamIds || p.teamMemberIds || [];
    return teamIds.includes(currentUser.id) || p.managerId === currentUser.id;
  }) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📁 المشاريع الإنتاجية المجمعة</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>متابعة المشاريع التي تشتمل على عدة جلسات تصوير وتغطيات ميدانية</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {userProjects.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Icons.FolderX size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p style={{ fontWeight: 700 }}>لا توجد مشاريع مسندة لك حالياً</p>
          </div>
        ) : (
          userProjects.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{p.category}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>{p.name}</h3>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p>👤 العميل: <strong>{p.clientName}</strong></p>
                {p.companyName && <p>🏢 الشركة: <strong>{p.companyName}</strong></p>}
                <p>📅 الفتره: <strong>{p.startDate} إلى {p.endDate}</strong></p>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>نسبة الإنجاز:</span>
                  <span style={{ color: 'var(--primary-color)' }}>{p.progress || 0}%</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.progress || 0}%`, backgroundColor: 'var(--primary-color)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>الإيراد:</span>
                  <p style={{ fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(p.revenue || 0)}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>المصروفات:</span>
                  <p style={{ fontWeight: 800, color: '#ef4444' }}>{formatCurrency(p.expenses || 0)}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>الربح الصافي:</span>
                  <p style={{ fontWeight: 800, color: '#10b981' }}>{formatCurrency(p.profit || 0)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
