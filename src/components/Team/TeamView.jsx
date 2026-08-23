import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';

export const TeamView = () => {
  const { team, addTeamMember, updateTeamMember, deleteTeamMember, toggleSupervisorRole, userRole } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'مصور رئيسي',
    email: '',
    password: 'photo123',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    badge: 'مصور محترف ⭐',
    status: 'نشط',
    points: 100
  });

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.phone || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const finalForm = {
        ...memberForm,
        password: memberForm.password || 'photo123'
      };
      if (addTeamMember) {
        addTeamMember(finalForm);
      }
      setIsAddModalOpen(false);
      alert(`✅ تم إضافة الموظف "${memberForm.name}" بنجاح!\n🔑 كلمة المرور الخاصة به للدخول هي: ${finalForm.password}`);
      setMemberForm({
        name: '',
        role: 'مصور رئيسي',
        email: '',
        password: 'photo123',
        phone: '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        badge: 'مصور محترف ⭐',
        status: 'نشط',
        points: 100
      });
    } catch (err) {
      console.error(err);
      alert('❌ فشل إضافة الموظف. يرجى التأكد من البيانات وتكرار المحاولة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (updateTeamMember) {
        updateTeamMember(editingMember.id, editingMember);
      }
      setEditingMember(null);
      alert('✅ تم حفظ التعديلات على بيانات الموظف بنجاح!');
    } catch (err) {
      console.error(err);
      alert('❌ فشل حفظ التعديلات. يرجى التكرار.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = (member) => {
    if (window.confirm(`⚠️ هل أنت متأكد من حذف الموظف "${member.name}" من فريق العمل؟`)) {
      try {
        if (deleteTeamMember) {
          deleteTeamMember(member.id);
        }
        alert('🗑️ تم حذف الموظف بنجاح.');
      } catch (err) {
        console.error(err);
        alert('❌ حدث خطأ عند حذف الموظف.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Controls */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Users size={24} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>فريق العمل وصلاحيات الإشراف</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            إضافة موظفين، تعديل الملفات الشخصية، وتعيين أو إلغاء صلاحيات المشرفين 👑
          </p>
        </div>

        {userRole === 'admin' && (
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
            <Icons.UserPlus size={18} />
            <span>إضافة موظف جديد</span>
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {team && team.map(member => {
          const isSupervisor = member.isSupervisor || member.role.includes('مشرف') || member.id === 1;

          return (
            <div
              key={member.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                borderTop: `4px solid ${isSupervisor ? '#f59e0b' : 'var(--primary-color)'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={member.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${isSupervisor ? '#f59e0b' : 'var(--primary-color)'}`
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <span>{member.name}</span>
                      {isSupervisor && <Icons.Crown size={16} color="#f59e0b" />}
                    </h3>
                    <span className="badge badge-success" style={{ fontSize: '0.66rem' }}>{member.status || 'نشط'}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>{member.role}</p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {isSupervisor && <span className="badge badge-warning" style={{ fontSize: '0.66rem' }}>👑 مشرف النظام</span>}
                    <span className="badge badge-purple" style={{ fontSize: '0.66rem' }}>
                      {member.badge || 'مصور محترف ⭐'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Icons.Phone size={15} color="var(--primary-color)" />
                  <span>الهاتف: </span>
                  <strong dir="ltr">{member.phone}</strong>
                </p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Icons.Mail size={15} color="var(--secondary-color)" />
                  <span>البريد: </span>
                  <strong>{member.email}</strong>
                </p>
                {userRole === 'admin' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(99, 102, 241, 0.08)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icons.Key size={14} color="var(--primary-color)" />
                      <span>كلمة السر: </span>
                      <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                        {visiblePasswords[member.id] ? (member.password || 'photo123') : '••••••••'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(member.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}
                      title={visiblePasswords[member.id] ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {visiblePasswords[member.id] ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                    </button>
                  </div>
                )}
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Icons.Award size={15} color="#f59e0b" />
                  <span>نقاط الإنجاز: </span>
                  <strong style={{ color: '#f59e0b' }}>{member.points || 0} نقطة</strong>
                </p>
              </div>

              {/* Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>معدل إنجاز المهام:</span>
                  <span>{member.completionRate || 100}% ({member.tasksCompleted || 0} مهمة)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${member.completionRate || 100}%`, height: '100%', backgroundColor: isSupervisor ? '#f59e0b' : 'var(--primary-color)' }} />
                </div>
              </div>

              {userRole === 'admin' && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => toggleSupervisorRole && toggleSupervisorRole(member.id)}
                    className={`btn ${isSupervisor ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                  >
                    <Icons.ShieldCheck size={14} />
                    <span>{isSupervisor ? 'تخفيض لموظف' : 'تعيين كمشرف 👑'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setEditingMember({ ...member })}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                    >
                      <Icons.Edit size={14} />
                      <span>تعديل</span>
                    </button>
                    {member.id !== 1 && (
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px' }}
                        title="حذف الموظف"
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Team Member */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>✨ إضافة موظف / مصور جديد للفريق</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setIsAddModalOpen(false)}><Icons.X size={18} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">اسم الموظف الثلاثي *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="مثال: خالد العتيبي"
                    value={memberForm.name}
                    onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">المسمى الوظيفي والدور *</label>
                    <select
                      className="form-control"
                      value={memberForm.role}
                      onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                    >
                      <option value="مدير فريق / مصور رئيسي">مدير فريق / مصور رئيسي</option>
                      <option value="مصور فيديو وحفلات رئيسي">مصور فيديو وحفلات رئيسي</option>
                      <option value="مصور فوتوغرافي ومعدل صور">مصور فوتوغرافي ومعدل صور</option>
                      <option value="فني إضاءة وتجهيز معدات">فني إضاءة وتجهيز معدات</option>
                      <option value="مونتير فيديو ومؤثرات بصري">مونتير فيديو ومؤثرات بصري</option>
                      <option value="مساعد مصور">مساعد مصور ميداني</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">اللقب والوسام التشجيعي</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="مثال: نجم التصوير ⭐"
                      value={memberForm.badge}
                      onChange={e => setMemberForm({ ...memberForm, badge: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">البريد الإلكتروني للدخول *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="employee@star-media.sa"
                      value={memberForm.email}
                      onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">🔑 كلمة المرور للدخول *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="photo123"
                      required
                      value={memberForm.password}
                      onChange={e => setMemberForm({ ...memberForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">رقم الهاتف *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="+966 50 123 4567"
                      value={memberForm.phone}
                      onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">رابط الصورة الشخصية (Avatar)</label>
                    <input
                      type="url"
                      className="form-control"
                      value={memberForm.avatar}
                      onChange={e => setMemberForm({ ...memberForm, avatar: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ وإضافة الموظف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Team Member Profile */}
      {editingMember && (
        <div className="modal-overlay" onClick={() => setEditingMember(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>✏️ تعديل بيانات والبروفايل للموظف: {editingMember.name}</h3>
              <button className="btn btn-icon btn-secondary" style={{ width: '30px', height: '30px', padding: 0 }} onClick={() => setEditingMember(null)}><Icons.X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">اسم الموظف *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editingMember.name}
                    onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">المسمى الوظيفي والدور</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingMember.role}
                      onChange={e => setEditingMember({ ...editingMember, role: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">الوسام</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingMember.badge || ''}
                      onChange={e => setEditingMember({ ...editingMember, badge: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">البريد الإلكتروني</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editingMember.email}
                      onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">🔑 كلمة المرور للدخول</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingMember.password || 'photo123'}
                      onChange={e => setEditingMember({ ...editingMember, password: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">رابط الصورة الشخصية</label>
                    <input
                      type="url"
                      className="form-control"
                      value={editingMember.avatar}
                      onChange={e => setEditingMember({ ...editingMember, avatar: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">حالة الحساب</label>
                    <select
                      className="form-control"
                      value={editingMember.status}
                      onChange={e => setEditingMember({ ...editingMember, status: e.target.value })}
                    >
                      <option value="نشط">نشط 🟢</option>
                      <option value="إجازة">في إجازة 🟡</option>
                      <option value="غير نشط">معطل / غير نشط 🔴</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMember(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;
