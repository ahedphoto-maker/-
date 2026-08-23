import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../Common/StatusBadge';
import * as Icons from 'lucide-react';

export const TasksView = () => {
  const {
    tasks,
    team,
    completeTask,
    userRole,
    currentUser
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('tasksList'); // 'tasksList' | 'leaderboard'
  const [statusFilter, setStatusFilter] = useState('الكل');

  const isEmployee = userRole === 'employee' || userRole === 'photographer';
  const currentFirstName = (currentUser?.name || '').split(' ')[0];

  const filteredTasks = tasks ? tasks.filter(t => {
    // 1. Employee Scoping Security Check
    if (isEmployee) {
      if (!currentUser) return false;
      const matchId = t.assigneeId === currentUser.id;
      const matchName = t.assigneeName ? t.assigneeName.includes(currentFirstName) : false;
      if (!matchId && !matchName) return false;
    }

    // 2. Status Filter match
    if (statusFilter === 'مكتملة' && t.status !== 'مكتملة') return false;
    if (statusFilter === 'قيد التنفيذ' && t.status !== 'قيد التنفيذ') return false;
    if (statusFilter === 'لم تبدأ' && t.status !== 'لم تبدأ') return false;
    return true;
  }) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Navigation Sub-Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveSubTab('tasksList')}
            className={`btn ${activeSubTab === 'tasksList' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Icons.CheckSquare size={18} />
            <span>قائمة المهام ({tasks ? tasks.length : 0})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`btn ${activeSubTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Icons.Trophy size={18} />
            <span>أداء الفريق ونقاط الإنجاز ⭐</span>
          </button>
        </div>

        {activeSubTab === 'tasksList' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {['الكل', 'قيد التنفيذ', 'لم تبدأ', 'مكتملة'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '50px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: statusFilter === st ? 'var(--primary-color)' : 'var(--bg-card)',
                  color: statusFilter === st ? '#ffffff' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeSubTab === 'tasksList' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '16px',
                borderRight: `4px solid ${task.status === 'مكتملة' ? 'var(--status-success)' : 'var(--primary-color)'}`
              }}
            >
              {/* Task Title & Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                      📌 {task.bookingTitle || 'حجز ميداني'}
                    </span>
                    <span className={`badge ${task.priority === 'عالية' || task.priority === 'عالية جداً' ? 'badge-danger' : task.priority === 'متوسطة' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                      أولوية {task.priority || 'عادية'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, marginTop: '1px', color: 'var(--text-main)' }}>
                    {task.title}
                  </h3>
                </div>
                <StatusBadge status={task.status} />
              </div>

              {/* Details */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px' }}>
                <p>👤 العميل: <strong style={{ color: 'var(--text-main)' }}>{task.clientName || 'الاستوديو الرئيسي'}</strong></p>
                <p>👨‍💼 المصور المسؤول: <strong style={{ color: 'var(--primary-color)' }}>{task.assigneeName}</strong></p>
                <p>🗓️ التوقيت والتاريخ: <strong>{task.dueDate}</strong></p>
                {task.description && <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>📝 {task.description}</p>}
              </div>

              {/* Progress Checklist */}
              {task.checklist && task.checklist.length > 0 && (
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px' }}>قائمة الإنجاز ({task.checklist.filter(c => c.done).length}/{task.checklist.length}):</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {task.checklist.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <span style={{ color: item.done ? 'var(--status-success)' : 'var(--text-muted)' }}>{item.done ? '✓' : '○'}</span>
                        <span style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'inherit' }}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Bar */}
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>+{task.points || 10} نقاط ⭐</span>

                {task.status !== 'مكتملة' ? (
                  <button
                    onClick={() => completeTask && completeTask(task.id)}
                    className="btn btn-primary"
                    style={{ borderRadius: '50px', fontWeight: 800, padding: '3px 12px', fontSize: '0.75rem', height: '28px', minHeight: '28px' }}
                  >
                    <Icons.CheckCircle size={14} />
                    <span>إكمال المهمة ✓</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icons.CheckCircle size={14} />
                    مكتملة بنجاح 🎉
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Leaderboard View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', border: 'none' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: '#ffffff' }}>
              🏆 لوحة صدارة أداء فريق التصوير
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              يتم منح النقاط والأوسمة تلقائيًا عند الضغط على زر "إكمال المهمة" مع الاحتفال بالـ Confetti 🎉!
            </p>
          </div>

          <div className="card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 800 }}>الترتيب</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 800 }}>عضو الفريق</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 800 }}>الوظيفة واللقب</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 800 }}>المهام المكتملة</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 800 }}>نسبة الإنجاز</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 800 }}>نقاط الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {team && [...team].sort((a, b) => (b.points || 0) - (a.points || 0)).map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={m.avatar} alt={m.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                        <strong style={{ fontSize: '0.9rem' }}>{m.name}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.82rem' }}>{m.role ? m.role.split('/')[0] : ''}</p>
                        <span className="badge badge-purple" style={{ fontSize: '0.68rem', marginTop: '2px' }}>{m.badge}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><strong>{m.tasksCompleted} مهمة</strong></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${m.completionRate}%`, height: '100%', backgroundColor: 'var(--primary-color)' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.completionRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--status-warning)' }}>
                        ⭐ {m.points} نقطة
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;
