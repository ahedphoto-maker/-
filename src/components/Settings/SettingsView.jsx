import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { registerDeviceToken, sendTestNotification } from '../../utils/fcm';

// HTML5 Canvas client-side image compression helper
const compressImage = (file, maxDimension = 600, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const SettingsView = () => {
  const {
    settings,
    updateSettings,
    currentUser,
    updateUserProfile,
    team,
    updateTeamMember,
    userRole
  } = useApp();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'notifications' | 'passwords' | 'appearance' | 'menu' | 'permissions' | 'whatsapp' | 'gamification'
  const [visiblePasses, setVisiblePasses] = useState({});
  const [cloudApiUrl, setCloudApiUrl] = useState('https://api.star-media.sa/v1');
  const [pushStatus, setPushStatus] = useState('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('star_media_notification_prefs');
      return saved ? JSON.parse(saved) : { bookings: true, clients: true, updates: true, team: true };
    } catch (e) {
      return { bookings: true, clients: true, updates: true, team: true };
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  const togglePref = (key) => {
    setPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('star_media_notification_prefs', JSON.stringify(updated));
      return updated;
    });
  };

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

  // Initialize and sync company identity form state
  const [identityForm, setIdentityForm] = useState({
    name: settings?.companyIdentity?.name || 'استوديو العهد ستار للإنتاج الإعلامي',
    logo: settings?.companyIdentity?.logo || '',
    profilePic: settings?.companyIdentity?.profilePic || '',
    coverPic: settings?.companyIdentity?.coverPic || '',
    profileBg: settings?.companyIdentity?.profileBg || '',
    primaryColor: settings?.companyIdentity?.primaryColor || settings?.appearance?.primaryColor || '#6366f1',
    buttonColor: settings?.companyIdentity?.buttonColor || settings?.appearance?.primaryHover || '#4f46e5',
    description: settings?.companyIdentity?.description || 'نقدم خدمات التصوير الاحترافي والتغطيات المباشرة بأعلى جودة.'
  });

  useEffect(() => {
    if (settings) {
      setIdentityForm({
        name: settings.companyIdentity?.name || 'استوديو العهد ستار للإنتاج الإعلامي',
        logo: settings.companyIdentity?.logo || '',
        profilePic: settings.companyIdentity?.profilePic || '',
        coverPic: settings.companyIdentity?.coverPic || '',
        profileBg: settings.companyIdentity?.profileBg || '',
        primaryColor: settings.companyIdentity?.primaryColor || settings.appearance?.primaryColor || '#6366f1',
        buttonColor: settings.companyIdentity?.buttonColor || settings.appearance?.primaryHover || '#4f46e5',
        description: settings.companyIdentity?.description || 'نقدم خدمات التصوير الاحترافي والتغطيات المباشرة بأعلى جودة.'
      });
    }
  }, [settings]);

  const isSuper = userRole === 'admin' || currentUser?.isSupervisor || currentUser?.role?.includes('مشرف') || currentUser?.role?.includes('مدير') || currentUser?.id === 1;

  const handleImageUpload = async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const compressedBase64 = await compressImage(file, 600, 0.7);
      setIdentityForm(prev => ({
        ...prev,
        [key]: compressedBase64
      }));
    } catch (err) {
      console.error('Image compression failed:', err);
      alert('⚠️ فشل في ضغط وتحميل الصورة. يرجى تجربة ملف آخر.');
    }
  };

  const handleDeleteImage = (key) => {
    setIdentityForm(prev => ({
      ...prev,
      [key]: ''
    }));
  };

  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    
    if (!isSuper) {
      alert('⚠️ عذراً، لا تمتلك الصلاحيات الكافية لتعديل هوية ومظهر الشركة.');
      setIsSaving(false);
      return;
    }

    if (updateSettings) {
      updateSettings({
        ...settings,
        companyIdentity: identityForm,
        appearance: {
          ...settings.appearance,
          primaryColor: identityForm.primaryColor,
          primaryHover: identityForm.buttonColor
        }
      });
    }
    alert('✅ تم حفظ وتحديث هوية الشركة والمظهر البصري لجميع الأجهزة النشطة بنجاح! 🎨✨');
    setIsSaving(false);
  };

  const resetIdentityToDefaults = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في استعادة الهوية والألوان الافتراضية للمنظومة؟')) {
      const defaults = {
        name: 'استوديو العهد ستار للإنتاج الإعلامي',
        logo: '',
        profilePic: '',
        coverPic: '',
        profileBg: '',
        primaryColor: '#6366f1',
        buttonColor: '#4f46e5',
        description: 'نقدم خدمات التصوير الاحترافي والتغطيات المباشرة بأعلى جودة.'
      };
      setIdentityForm(defaults);
      if (updateSettings) {
        updateSettings({
          ...settings,
          companyIdentity: defaults,
          appearance: {
            ...settings.appearance,
            primaryColor: '#6366f1',
            primaryHover: '#4f46e5'
          }
        });
      }
      alert('🔄 تم استعادة الإعدادات والمظهر الافتراضي بنجاح.');
    }
  };

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
          { id: 'appearance', label: 'هوية الشركة وتخصيص المظهر', icon: Icons.Palette },
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Device Notification Status */}
          <div className="card" style={{ borderRight: '5px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>📱 إشعارات النظام وأجهزة الجوال (Push Notifications)</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px' }}>تلقي التنبيهات والأحداث على شاشة قفل جهازك مباشرة حتى عند إغلاق التطبيق أو المتصفح.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>حالة هذا الجهاز:</span>
                {pushStatus === 'granted' ? (
                  <span className="badge badge-success" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Icons.CheckCircle size={12} /> مفعّلة ومصرح بها
                  </span>
                ) : pushStatus === 'denied' ? (
                  <span className="badge badge-danger" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Icons.XCircle size={12} /> مرفوضة بالمتصفح
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Icons.AlertCircle size={12} /> بانتظار الترخيص
                  </span>
                )}
              </div>
            </div>
            
            {pushStatus !== 'granted' && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSubscribing}
                onClick={async () => {
                  setIsSubscribing(true);
                  try {
                    if ('Notification' in window) {
                      const permission = await Notification.requestPermission();
                      setPushStatus(permission);
                      if (permission === 'granted') {
                        await registerDeviceToken(currentUser);
                        alert('✅ تم تفعيل إشعارات المتصفح وتسجيل جهازك بنجاح!');
                      } else {
                        alert('⚠️ صلاحية الإشعارات مرفوضة. يرجى تفعيلها يدوياً من إعدادات المتصفح.');
                      }
                    } else {
                      alert('⚠️ هذا المتصفح لا يدعم إشعارات النظام.');
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsSubscribing(false);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
              >
                <Icons.BellRing size={16} />
                <span>{isSubscribing ? 'جاري تفعيل الإشعار...' : 'تفعيل الإشعارات الآن 🔔'}</span>
              </button>
            )}
          </div>

          {/* Card 2: Notification Preferences Categories */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Sliders size={20} />
              <span>⚙️ تخصيص المواضيع والعمليات المفضلة</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>اختر أنواع الإشعارات التي ترغب باستقبالها على هذا الجهاز:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '10px' }}>
              {[
                { key: 'bookings', label: '📅 إشعارات الحجوزات الجديدة', desc: 'تنبيه عند إضافة حجز جديد للفريق أو المشرف.' },
                { key: 'clients', label: '👤 إشعارات العملاء الجدد', desc: 'تنبيه عند تسجيل عميل جديد في النظام.' },
                { key: 'updates', label: '🔄 إشعارات تعديل الحجوزات', desc: 'تنبيه فوري لأي تغيير في تاريخ أو حالة الحجز.' },
                { key: 'team', label: '👥 إشعارات الفريق والمهام', desc: 'تنبيه للتكليفات والمهام الجديدة المسندة إليك.' }
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', gap: '12px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-main)', cursor: 'pointer', margin: 0, transition: 'border-color 0.15s ease' }}>
                  <input
                    type="checkbox"
                    checked={prefs[item.key]}
                    onChange={() => togglePref(item.key)}
                    style={{ width: '18px', height: '18px', marginTop: '3px', accentColor: 'var(--primary-color)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Card 3: Test Notification Dispatcher */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Flame size={20} />
              <span>🧪 فحص واختبار الإشعارات</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>يمكنك فحص سلامة الاتصال باستقبال إشعار Push حقيقي فوري على هذا الجهاز حتى عند إغلاق التطبيق.</p>
            <div>
              <button
                type="button"
                disabled={isTesting}
                onClick={async () => {
                  setIsTesting(true);
                  const token = localStorage.getItem('star_media_fcm_token');
                  if (!token) {
                    alert('⚠️ لم يتم العثور على رمز الإشعارات (FCM Token). يرجى التأكد من الضغط على زر تفعيل الإشعارات أولاً.');
                    setIsTesting(false);
                    return;
                  }
                  const success = await sendTestNotification(token);
                  if (success) {
                    alert('🚀 تم إرسال إشعار تجريبي بنجاح! راقب شاشة جهازك.');
                  } else {
                    alert('❌ فشل إرسال الإشعار. يرجى التحقق من أذونات المتصفح.');
                  }
                  setIsTesting(false);
                }}
                className="btn"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Icons.Send size={16} />
                <span>{isTesting ? 'جاري الإرسال الفوري...' : 'إرسال إشعار تجريبي للجهاز 🚀'}</span>
              </button>
            </div>
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

      {/* Tab 4: Appearance & Company Identity Editor */}
      {activeTab === 'appearance' && (
        <form onSubmit={handleSaveIdentity} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>🎨 هوية الشركة وتخصيص المظهر (Live Theme Editor)</h3>
          
          {!isSuper && (
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--status-danger)', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.ShieldAlert size={16} />
              <span>وضع القراءة فقط: لا تمتلك الصلاحيات لتعديل هوية الشركة. الميزة متاحة للمشرفين والمديرين فقط.</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Right column: Texts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">اسم الشركة</label>
                <input
                  type="text"
                  className="form-control"
                  value={identityForm.name}
                  disabled={!isSuper}
                  onChange={e => setIdentityForm({ ...identityForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">وصف الشركة</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={identityForm.description}
                  disabled={!isSuper}
                  onChange={e => setIdentityForm({ ...identityForm, description: e.target.value })}
                  placeholder="اكتب وصفاً مختصراً للشركة..."
                />
              </div>

              {/* Color selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>اللون الرئيسي</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="color"
                      value={identityForm.primaryColor}
                      disabled={!isSuper}
                      onChange={e => setIdentityForm({ ...identityForm, primaryColor: e.target.value })}
                      style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={identityForm.primaryColor}
                      disabled={!isSuper}
                      onChange={e => setIdentityForm({ ...identityForm, primaryColor: e.target.value })}
                      style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                    />
                  </div>
                </div>

                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>لون الأزرار والعناصر</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="color"
                      value={identityForm.buttonColor}
                      disabled={!isSuper}
                      onChange={e => setIdentityForm({ ...identityForm, buttonColor: e.target.value })}
                      style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={identityForm.buttonColor}
                      disabled={!isSuper}
                      onChange={e => setIdentityForm({ ...identityForm, buttonColor: e.target.value })}
                      style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Left column: Images Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Logo Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>شعار الشركة / Logo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {identityForm.logo ? (
                    <img src={identityForm.logo} alt="Logo" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.2rem' }}>🎬</div>
                  )}
                  {isSuper && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Upload size={12} />
                        <span>رفع</span>
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} style={{ display: 'none' }} />
                      </label>
                      {identityForm.logo && (
                        <button type="button" onClick={() => handleDeleteImage('logo')} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '0.72rem', backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--status-danger)', border: '1px solid rgba(239,68,68,0.15)' }}>حذف</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Profile Pic Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>صورة البروفايل</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {identityForm.profilePic ? (
                    <img src={identityForm.profilePic} alt="Profile" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.2rem' }}>👤</div>
                  )}
                  {isSuper && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Upload size={12} />
                        <span>رفع</span>
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'profilePic')} style={{ display: 'none' }} />
                      </label>
                      {identityForm.profilePic && (
                        <button type="button" onClick={() => handleDeleteImage('profilePic')} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '0.72rem', backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--status-danger)', border: '1px solid rgba(239,68,68,0.15)' }}>حذف</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Cover Pic Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>صورة الغلاف / Cover</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {identityForm.coverPic ? (
                    <img src={identityForm.coverPic} alt="Cover" style={{ width: '90px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  ) : (
                    <div style={{ width: '90px', height: '50px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🖼️ غلاف</div>
                  )}
                  {isSuper && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Upload size={12} />
                        <span>رفع</span>
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'coverPic')} style={{ display: 'none' }} />
                      </label>
                      {identityForm.coverPic && (
                        <button type="button" onClick={() => handleDeleteImage('coverPic')} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '0.72rem', backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--status-danger)', border: '1px solid rgba(239,68,68,0.15)' }}>حذف</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Profile Background Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>خلفية البروفايل</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {identityForm.profileBg ? (
                    <img src={identityForm.profileBg} alt="Background" style={{ width: '90px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  ) : (
                    <div style={{ width: '90px', height: '50px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🎨 خلفية</div>
                  )}
                  {isSuper && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Upload size={12} />
                        <span>رفع</span>
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'profileBg')} style={{ display: 'none' }} />
                      </label>
                      {identityForm.profileBg && (
                        <button type="button" onClick={() => handleDeleteImage('profileBg')} className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '0.72rem', backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--status-danger)', border: '1px solid rgba(239,68,68,0.15)' }}>حذف</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isSuper && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Save size={16} />
                <span>حفظ التعديلات وتطبيق الهوية 🎨</span>
              </button>
              <button type="button" onClick={resetIdentityToDefaults} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.RotateCcw size={16} />
                <span>استعادة الافتراضيات 🔄</span>
              </button>
            </div>
          )}
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
