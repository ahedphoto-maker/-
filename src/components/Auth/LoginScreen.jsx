import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { navigateTo } from '../../routes/Router';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export const LoginScreen = ({ onLogin }) => {
  const { team, loginUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = password;

    if (!cleanPassword || cleanPassword.length < 6) {
      setIsLoading(false);
      setError('❌ كلمة المرور يجب أن تتكون من 6 خانات على الأقل (مثال: 123456).');
      return;
    }

    // Check if the user exists in our local team list
    const foundMember = team.find(m => m.email && m.email.toLowerCase().trim() === cleanEmail) || 
      ( (cleanEmail === 'ahdalamary@gmail.com' || cleanEmail === 'ahed@lensflow.sa' || cleanEmail === 'admin@lensflow.sa') ? {
        id: 1,
        name: 'عاهد العماري',
        role: 'مصور فريلانسر / منظم حجوزاتي العهد ستار 👑',
        email: 'ahdalamary@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        isSupervisor: true
      } : null );

    if (!foundMember) {
      setIsLoading(false);
      setError('❌ لم يتم العثور على بريد إلكتروني مسجل كعضو في الفريق. يرجى مراجعة مدير الاستوديو.');
      return;
    }

    try {
      // 1. Try signing in using Firebase Auth
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      console.log("Logged in to Firebase Auth successfully as:", cleanEmail);
      
      if (loginUser) loginUser(foundMember);
      setIsLoading(false);
      if (onLogin) onLogin(foundMember);
      
      const isSuper = foundMember.isSupervisor || (foundMember.role && (foundMember.role.includes('مشرف') || foundMember.role.includes('مدير')));
      if (isSuper) {
        navigateTo('/admin/dashboard');
      } else {
        navigateTo('/employee/dashboard');
      }
    } catch (err) {
      console.warn("Firebase Auth login failed:", err.code, err.message);
      
      // 2. Auto-register if the error is user-not-found or invalid-credential (since we verified they are on the team)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          console.log("User not found in Firebase. Attempting auto-registration for team member:", cleanEmail);
          await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          console.log("Firebase Auth user registered successfully:", cleanEmail);
          
          if (loginUser) loginUser(foundMember);
          setIsLoading(false);
          if (onLogin) onLogin(foundMember);
          
          const isSuper = foundMember.isSupervisor || (foundMember.role && (foundMember.role.includes('مشرف') || foundMember.role.includes('مدير')));
          if (isSuper) {
            navigateTo('/admin/dashboard');
          } else {
            navigateTo('/employee/dashboard');
          }
        } catch (regErr) {
          console.error("Auto-registration in Firebase Auth failed:", regErr);
          setIsLoading(false);
          if (regErr.code === 'auth/email-already-in-use') {
            setError('❌ كلمة المرور التي أدخلتها غير صحيحة.');
          } else {
            setError(`❌ فشل تسجيل الحساب تلقائيًا في الخدمة: ${regErr.message}`);
          }
        }
      } else {
        setIsLoading(false);
        setError(`❌ خطأ في تسجيل الدخول: ${err.message}`);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'inherit'
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(99,102,241,0.25)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '36px 28px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
          }}>
            <Icons.Camera size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: 0 }}>بوابة الفريق</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>سجّل دخولك للوصول لمهامك وجدولك</p>
        </div>

        {/* Quick Team Member Selector Pills */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '8px', textAlign: 'center' }}>
            ⚡ اختر حسابك للدخول السريع أو اكتب بياناتك:
          </label>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {team && team.map(member => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setEmail(member.email || '');
                  setPassword((member.password && member.password.length >= 6) ? member.password : '123456');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '20px',
                  backgroundColor: email === member.email ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  border: email === member.email ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <img src={member?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                <span>{member?.name ? member.name.split(' ')[0] : 'عضو'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>أو تسجيل بالبريد الإلكتروني</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              البريد الإلكتروني
            </label>
            <div style={{ position: 'relative' }}>
              <Icons.Mail size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yourname@lensflow.sa"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <Icons.Lock size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  direction: 'ltr'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showPass ? <Icons.EyeOff size={16} color="rgba(255,255,255,0.5)" /> : <Icons.Eye size={16} color="rgba(255,255,255,0.5)" />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span />
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                style={{ background: 'none', border: 'none', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                🔑 نسيت كلمة المرور؟
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <Icons.AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '13px 20px',
              borderRadius: '12px',
              background: isLoading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: isLoading ? 'wait' : 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)'
            }}
          >
            {isLoading ? (
              <>
                <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>جارٍ التحقق...</span>
              </>
            ) : (
              <>
                <Icons.LogIn size={18} />
                <span>تسجيل الدخول</span>
              </>
            )}
          </button>
        </form>

        {/* Hint */}
        <p style={{ textAlign: 'center', fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)', marginTop: '20px', lineHeight: 1.5 }}>
          هذه البوابة مخصصة لأعضاء الفريق فقط.<br />
          للاستفسار، تواصل مع مدير الاستوديو.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '380px', backgroundColor: '#1e293b', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.15)', padding: '24px', color: '#ffffff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>🔑 استعادة كلمة المرور</h3>
              <button onClick={() => setIsForgotOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <Icons.X size={20} />
              </button>
            </div>
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✉️</div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginBottom: '6px' }}>تم إرسال رابط التعيين!</h4>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                  أرسلنا رابط إعادة تعيين كلمة المرور إلى <strong>{resetEmail}</strong>. يرجى تفقّد بريدك.
                </p>
                <button className="btn btn-primary" onClick={() => { setIsForgotOpen(false); setResetSent(false); }} style={{ width: '100%' }}>
                  موافق والعودة للدخول
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setResetSent(true);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  أدخل بريدك الإلكتروني المسجل في النظام وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور.
                </p>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="example@lensflow.sa"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '11px' }}>
                  إرسال رابط الاستعادة ✉️
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
        input:focus { border-color: rgba(99,102,241,0.7) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
      `}</style>
    </div>
  );
};

export default LoginScreen;
