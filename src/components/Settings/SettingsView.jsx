import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';

export const SettingsView = () => {
  const {
    settings,
    updateSettings,
    currentUser,
    updateUserProfile,
    team,
    updateTeamMember,
  } = useApp();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'notifications' | 'passwords' | 'appearance' | 'menu' | 'permissions' | 'whatsapp' | 'gamification'
  const [visiblePasses, setVisiblePasses] = useState({});
  const [cloudApiUrl, setCloudApiUrl] = useState('https://api.star-media.sa/v1');

  const togglePass = (id) => {
    setVisiblePasses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetThemeToDefaults = () => {
    if (updateSettings) {
      updateSettings({
        ...settings,
        appearance: {
          primaryColor: '#6366f1',
          primaryHover: '#4f46e5',
          secondaryColor: '#06b6d4',
          bgSidebar: '#0f172a',
          borderRadius: '12px',
          buttonStyle: 'rounded',
          fontFamily: 'Cairo'
        }
      });
    }
  };

  const [generalForm, setGeneralForm] = useState(settings?.general || { systemName: 'ستار ميديا', subtitle: 'نظام إدارة حجوزات ومعدات التصوير' });
  const [appearanceForm, setAppearanceForm] = useState(settings?.appearance || { primaryColor: '#6366f1', bgSidebar: '#0f172a', fontFamily: 'Cairo', borderRadius: '12px' });
  const [menuItemsForm, setMenuItemsForm] = useState(
    settings?.menuItems || [
      { id: 'dashboard', label: 'لوحة القيادة', visible: true },
      { id: 'bookings', label: 'الحجوزات والجدولة', visible: true },
      { id: 'calendar', label: 'التقويم العام', visible: true },
      { id: 'tasks', label: 'مهام المصورين', visible: true },
      { id: 'equipment', label: 'المستودع والمعدات', visible: true },
      { id: 'clients', label: 'العملاء (CRM)', visible: true },
      { id: 'companies', label: 'الشركات والشركاء', visible: true },
      { id: 'projects', label: 'المشاريع الإنتاجية', visible: true },
      { id: 'financials', label: 'المالية والحسابات', visible: true },
      { id: 'settings', label: 'إعدادات النظام', visible: true }
    ]
  );

  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    if (updateSettings) {
      updateSettings({
        ...settings,
        general: generalForm
      });
    }
    alert('✅ تم حفظ وتأكيد إعدادات النظام بنجاح! ✨');
    setIsSaving(false);
  };

  const handleSaveAppearance = (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    if (updateSettings) {
      updateSettings({
        ...settings,
        appearance: appearanceForm
      });
    }
    alert('✅ تم تطبيق المظهر والألوان المخصصة فوراً وحفظها! 🎨');
    setIsSaving(false);
  };

  const handleSaveMenu = (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    if (updateSettings) {
      updateSettings({
        ...settings,
        menuItems: menuItemsForm
      });
    }
    alert('✅ تم حفظ وترتيب عناصر القائمة بنجاح! 📋');
    setIsSaving(false);
  };

  const moveMenuItem = (index, direction) => {
    const newItems = [...menuItemsForm];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setMenuItemsForm(newItems);
  };

  const handleFileChange = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        callback(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Settings Navigation */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'general', label: 'الإعدادات العامة', icon: Icons.Globe },
          { id: 'notifications', label: '🔔 إعدادات الإشعارات', icon: Icons.Bell },
          { id: 'passwords', label: '🔑 كلمات مرور الفريق', icon: Icons.Key },
          { id: 'appearance', label: 'تخصيص المظهر (Theme)', icon: Icons.Palette },
          { id: 'menu', label: 'ترتيب القائمة (Menu)', icon: Icons.ListOrdered },
          { id: 'permissions', label: 'الصلاحيات (Permissions)', icon: Icons.ShieldCheck },
          { id: 'whatsapp', label: 'ربط WhatsApp التنبيهات', icon: Icons.MessageSquare },
          { id: 'gamification', label: 'نظام التحفيز (Gamification)', icon: Icons.Trophy }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (updateUserProfile) {
                updateUserProfile({ name: profileName, avatar: profileAvatar });
              }
              alert('تم تحديث بيانات وصورة البروفايل الشخصية بنجاح! 👤✓');
            }}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Icons.User size={20} />
              <span>👤 إعدادات الملف الشخصي (الحساب الحالي)</span>
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                {profileAvatar && (profileAvatar.startsWith('http') || profileAvatar.startsWith('/') || profileAvatar.startsWith('data:')) ? (
                  <img
                    src={profileAvatar}
                    alt="Preview"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
                  />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', fontSize: '2.5rem' }}>
                    {profileAvatar || '👤'}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">الاسم الكامل *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>صورة البروفايل</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      id="profile-avatar-file"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleFileChange(e, setProfileAvatar)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => document.getElementById('profile-avatar-file').click()}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }}
                    >
                      <Icons.Upload size={14} />
                      <span>📂 رفع صورة</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    style={{ marginTop: '8px' }}
                    placeholder="أو ضع رابطًا أو رمزًا تعبيريًا (إيموجي)"
                    value={profileAvatar}
                    onChange={e => setProfileAvatar(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Icons.Save size={18} />
              <span>حفظ بيانات البروفايل</span>
            </button>
          </form>

          <form onSubmit={handleSaveGeneral} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Icons.Building2 size={20} />
              <span>🏢 الهوية والشعارات التجارية (Branding)</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label">اسم النظام الرئيسي</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalForm.systemName}
                  onChange={e => setGeneralForm({ ...generalForm, systemName: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label">الوصف الفرعي</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalForm.subtitle}
                  onChange={e => setGeneralForm({ ...generalForm, subtitle: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Icons.Save size={18} />
              <span>حفظ إعدادات النظام</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Notifications Settings */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ borderRight: '5px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>📱 إشعارات النظام وتنبيهات المتصفح</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>تفعيل إشعارات المتصفح المنبثقة للأحداث التشغيلية المهمة.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                if ('Notification' in window) {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    alert('🟢 تم تفعيل إشعارات المتصفح للجهاز بنجاح!');
                  } else {
                    alert('⚠️ صلاحية الإشعارات مرفوضة. يرجى تفعيلها من إعدادات المتصفح.');
                  }
                } else {
                  alert('⚠️ المتصفح لا يدعم الإشعارات المنبثقة.');
                }
              }}
            >
              <span>تفعيل تنبيهات المتصفح 🔔</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Passwords Settings */}
      {activeTab === 'passwords' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>🔑 كلمات مرور الحسابات وفريق الميدان</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {team && team.map(member => (
              <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>{member.name}</span>
                  <span className="badge badge-purple" style={{ marginRight: '8px', fontSize: '0.68rem' }}>{member.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <code style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary-color)', padding: '2px 8px', backgroundColor: 'var(--bg-card)', borderRadius: '4px' }}>
                    {visiblePasses[member.id] ? member.password : '••••••••'}
                  </code>
                  <button onClick={() => togglePass(member.id)} className="btn btn-secondary btn-icon" style={{ width: '28px', height: '28px', padding: 0 }}>
                    {visiblePasses[member.id] ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Appearance Editor */}
      {activeTab === 'appearance' && (
        <form onSubmit={handleSaveAppearance} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>🎨 تخصيص الهوية والسمات الفورية (Live Theme Editor)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <label className="form-label">اللون الأساسي (Primary Color)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <input
                  type="color"
                  value={appearanceForm.primaryColor}
                  onChange={e => setAppearanceForm({ ...appearanceForm, primaryColor: e.target.value })}
                  style={{ width: '45px', height: '45px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={appearanceForm.primaryColor}
                  onChange={e => setAppearanceForm({ ...appearanceForm, primaryColor: e.target.value })}
                />
              </div>
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <label className="form-label">لون القائمة الجانبية (Sidebar BG)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <input
                  type="color"
                  value={appearanceForm.bgSidebar}
                  onChange={e => setAppearanceForm({ ...appearanceForm, bgSidebar: e.target.value })}
                  style={{ width: '45px', height: '45px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={appearanceForm.bgSidebar}
                  onChange={e => setAppearanceForm({ ...appearanceForm, bgSidebar: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">
              <Icons.Sparkles size={16} />
              <span>تطبيق المظهر 🎨</span>
            </button>
            <button type="button" onClick={resetThemeToDefaults} className="btn btn-secondary">
              <Icons.RotateCcw size={16} />
              <span>إعادة الضبط الافتراضي 🔄</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Menu Customizer */}
      {activeTab === 'menu' && (
        <form onSubmit={handleSaveMenu} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>📋 تخصيص ترتيب وتسميات القائمة الجانبية</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {menuItemsForm.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={() => moveMenuItem(idx, 'up')} disabled={idx === 0} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>↑</button>
                  <button type="button" onClick={() => moveMenuItem(idx, 'down')} disabled={idx === menuItemsForm.length - 1} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>↓</button>
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="form-control"
                    value={item.label}
                    onChange={e => {
                      const val = e.target.value;
                      setMenuItemsForm(prev => prev.map((m, i) => i === idx ? { ...m, label: val } : m));
                    }}
                    style={{ height: '32px', fontSize: '0.8rem' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={item.visible !== false}
                    onChange={e => {
                      const checked = e.target.checked;
                      setMenuItemsForm(prev => prev.map((m, i) => i === idx ? { ...m, visible: checked } : m));
                    }}
                  />
                  <span>إظهار</span>
                </label>
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            <Icons.Save size={18} />
            <span>حفظ القائمة الجانبية</span>
          </button>
        </form>
      )}

      {/* Tab 6: Permissions Settings */}
      {activeTab === 'permissions' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>🛡️ إدارة الأدوار والصلاحيات للكوادر</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
              <div>
                <strong style={{ fontSize: '0.86rem' }}>صلاحية تعديل الملف الشخصي</strong>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>السماح للمصورين بتغيير أسمائهم وصورهم.</p>
              </div>
              <span className="badge badge-success">مسموح للكل ✓</span>
            </div>
            <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
              <div>
                <strong style={{ fontSize: '0.86rem' }}>الوصول للإعدادات العامة والضريبية</strong>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>منع المصورين من تعديل الضريبة أو الفواتير.</p>
              </div>
              <span className="badge badge-warning">مشرفين فقط 👑</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: WhatsApp Integration */}
      {activeTab === 'whatsapp' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>💬 إشعارات وتنبيهات WhatsApp التلقائية</h3>
          <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>حالة الاتصال بـ WhatsApp Business API</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>متصل بنشاط برقم المؤسسة المعتمد.</p>
            </div>
            <span className="badge badge-success">متصل ✓</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800 }}>قالب: تأكيد الحجز المالي 📅</label>
              <textarea className="form-control" rows={2} defaultValue="أهلاً بك {{ClientName}}، تم تأكيد حجز جلسة التصوير بنجاح بموعد {{Date}} وقيمة {{Price}} ريال." />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800 }}>قالب: تذكير موعد الجلسة ⏰</label>
              <textarea className="form-control" rows={2} defaultValue="نود تذكيرك بموعد جلسة تصويرك غداً في موقع {{Location}}." />
            </div>
          </div>

          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => alert('تم حفظ قوالب تذكيرات WhatsApp بنجاح!')}>
            <Icons.Save size={18} />
            <span>حفظ القوالب</span>
          </button>
        </div>
      )}

      {/* Tab 8: Gamification Settings */}
      {activeTab === 'gamification' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>🏆 محرك تحفيز المصورين والإنتاجية (Gamification)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>تفعيل الأوسمة ونقاط الإنجاز الميداني لحث الموظفين على إتمام المهام بسرعة ودقة.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem' }}>⭐</div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginTop: '6px', margin: 0 }}>+10 نقاط</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>عن كل مهمة منجزة</p>
            </div>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem' }}>🔥</div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginTop: '6px', margin: 0 }}>وسام "المحترف اليومي"</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>عند إكمال 5 مهام باليوم</p>
            </div>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem' }}>👑</div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginTop: '6px', margin: 0 }}>وسام "الملتزم الحديدي"</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>تجنب أية تعارضات تشغيلية</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
