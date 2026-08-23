import React from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';

export const TeamAchievements = () => {
  const { team, settings } = useApp();

  // Sorting team by gamification points for leaderboard
  const sortedTeam = team ? [...team].sort((a, b) => (b.points || 0) - (a.points || 0)) : [];

  // Predefined milestones with descriptions
  const achievementsList = [
    { id: 'first_task', label: '🎉 أول مهمة مكتملة', desc: 'تم إنجاز أول مهمة ميدانية بنجاح واستحقاق.', icon: Icons.Award, color: '#10b981' },
    { id: 'five_tasks_day', label: '🔥 5 مهام في يوم واحد', desc: 'إتمام 5 مهام تصوير أو تجهيز منفصلة خلال 24 ساعة.', icon: Icons.Flame, color: '#ef4444' },
    { id: 'perfect_attendance', label: '⚡ التزام كامل بالمواعيد', desc: 'الحضور والوصول الجغرافي للموقع قبل الموعد بنسبة 100%.', icon: Icons.Zap, color: '#f59e0b' },
    { id: 'best_month', label: '🏆 أفضل مصور هذا الشهر', desc: 'حصد أعلى نقاط إنجاز وتقييم رضا العملاء خلال الشهر الحالي.', icon: Icons.Trophy, color: '#8b5cf6' },
    { id: 'fifty_tasks', label: '📸 50 مهمة مكتملة', desc: 'الوصول لليوبيل الذهبي بإنجاز 50 مهمة تصوير متميزة.', icon: Icons.Camera, color: '#06b6d4' }
  ];

  const getRankMedal = (index) => {
    switch (index) {
      case 0: return '🥇 الأول';
      case 1: return '🥈 الثاني';
      case 2: return '🥉 الثالث';
      default: return `${index + 1}`;
    }
  };

  const enableGamification = settings && settings.general && settings.general.enableGamification !== false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🏆 لوحة الصدارة وإنجازات الفريق</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لوحة الجيمنج والتحفيز (Gamification) لترتيب المصورين وتحصيل الأوسمة والنقاط الميدانية.</p>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
          {enableGamification ? '🟢 نظام التحفيز مفعّل' : '🔴 نظام التحفيز مغلق'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1.6fr 1.4fr', gap: '20px', alignItems: 'start' }}>
        {/* Leaderboard */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>🥇 جدول الصدارة الأسبوعي (Leaderboard)</h3>
          
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px', padding: '12px' }}>الترتيب</th>
                  <th style={{ padding: '12px' }}>المصور</th>
                  <th style={{ padding: '12px' }}>المهام المنجزة</th>
                  <th style={{ padding: '12px' }}>نسبة الالتزام</th>
                  <th style={{ padding: '12px' }}>النقاط التراكمية</th>
                  <th style={{ padding: '12px' }}>الوسام الحالي</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeam.map((member, index) => (
                  <tr key={member.id} style={{ backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.03)' : 'transparent', borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ fontWeight: 800, color: index < 3 ? 'var(--primary-color)' : 'inherit', padding: '12px' }}>
                      {getRankMedal(index)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} alt={member.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <p style={{ fontWeight: 700, margin: 0 }}>{member.name}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, padding: '12px' }}>{member.tasksCompleted || 0} مهمة</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{member.completionRate || 100}%</span>
                        <div style={{ width: '50px', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${member.completionRate || 100}%`, height: '100%', backgroundColor: '#10b981' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary-color)', padding: '12px' }}>
                      {(member.points || 0).toLocaleString('en-US')} نقطة
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.66rem' }}>{member.badge || 'عضو جديد 🌟'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Milestones & Badges list */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>🎖️ أوسمة وبادجات التميز المتوفرة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {achievementsList.map(a => {
              const Icon = a.icon;
              return (
                <div key={a.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '14px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: '#ffffff' }}>
                  <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: `${a.color}15`, color: a.color }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{a.label}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', margin: '4px 0 0 0' }}>{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAchievements;
