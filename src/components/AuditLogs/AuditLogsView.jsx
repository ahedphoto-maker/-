import React from 'react';
import { useApp } from '../../context/AppContext';

export const AuditLogsView = () => {
  const { auditLogs } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>📜 سجل النشاطات والعمليات (Audit Log)</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>تتبع دقيق لجميع التعديلات والإنشاءات والتغييرات المالية وحالات المهام من المشرف والموظفين</p>
        </div>
        <span className="badge badge-info">{(auditLogs || []).length} سطر نشاط</span>
      </div>

      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px' }}>الوقت والتاريخ</th>
              <th style={{ padding: '12px' }}>المستخدم</th>
              <th style={{ padding: '12px' }}>الدور والتصريح</th>
              <th style={{ padding: '12px' }}>الحدث والإجراء</th>
              <th style={{ padding: '12px' }}>تفاصيل العملية</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs && auditLogs.map((log, idx) => (
              <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', padding: '12px' }}>
                  {log.timestamp}
                </td>
                <td style={{ padding: '12px' }}><strong>{log.userName}</strong></td>
                <td style={{ padding: '12px' }}><span className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>{log.userRole}</span></td>
                <td style={{ padding: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <span>{log.icon || '📝'}</span>
                    <span>{log.action}</span>
                  </span>
                </td>
                <td style={{ fontSize: '0.88rem', padding: '12px' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsView;
