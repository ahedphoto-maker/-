import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';

export const LensFlowAI = () => {
  const { bookings, team, tasks, invoices, checkBookingConflicts } = useApp();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'مرحباً بك في مساعد الذكاء الاصطناعي 🤖! كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const askSuggestions = [
    'كم أرباحي هذا الشهر؟',
    'من أكثر موظف أنجز مهام؟',
    'هل لدي تعارض في الجدول؟',
    'ما الحجوزات القادمة؟',
    'أعطني ملخص اليوم.'
  ];

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = 'عذراً، لم أفهم السؤال بدقة. يمكنك الاستعلام عن الأرباح، التعارضات، مهام الموظفين، أو حجوزات اليوم والغد.';
      const query = textToSend.toLowerCase();

      if (query.includes('أرباح') || query.includes('كم دخل') || query.includes('المبالغ')) {
        const total = invoices ? invoices.reduce((acc, inv) => acc + (inv.total || 0), 0) : 0;
        const paid = invoices ? invoices.reduce((acc, inv) => acc + (inv.paid || 0), 0) : 0;
        replyText = `📊 إجمالي الفواتير الصادرة للنظام حالياً هي **${total.toLocaleString('en-US')} ريال**، تم تحصيل **${paid.toLocaleString('en-US')} ريال** منها، والمبلغ المتبقي للتحصيل هو **${(total - paid).toLocaleString('en-US')} ريال**.`;
      } else if (query.includes('موظف') || query.includes('أنجز') || query.includes('أفضل')) {
        const sorted = team ? [...team].sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0)) : [];
        const top = sorted[0];
        if (top) {
          replyText = `🏆 الموظف الأكثر إنجازاً للمهام هو **${top.name}** بـ **${top.tasksCompleted} مهمة مكتملة** بنجاح ومعدل التزام بمواعيد الميدان بلغ **${top.completionRate || 95}%**!`;
        } else {
          replyText = `❌ لا توجد بيانات موظفين حالياً.`;
        }
      } else if (query.includes('تعارض') || query.includes('جدول') || query.includes('تداخل')) {
        let conflictList = [];
        if (bookings && checkBookingConflicts) {
          bookings.forEach(b => {
            const check = checkBookingConflicts(b.date, b.startTime, b.endTime, b.teamMemberIds || b.teamAssigned || [], b.equipmentAssigned || [], b.id);
            if (check.team.length > 0 || check.equipment.length > 0) {
              conflictList.push(b.title);
            }
          });
        }
        if (conflictList.length > 0) {
          replyText = `⚠️ نعم، لقد رصدت تعارضاً محتملاً في جدولة المهام والمصورين للحجوزات التالية: **${[...new Set(conflictList)].join('، ')}**. يرجى تفقد شاشة التعارضات لحل التداخل.`;
        } else {
          replyText = `✅ ممتاز! لا توجد أية تعارضات مرصودة حالياً في جدولة المصورين أو المعدات عبر كامل حجوزات التقويم.`;
        }
      } else if (query.includes('قادمة') || query.includes('حجوزات')) {
        const upcoming = bookings ? bookings.filter(b => b.status === 'مؤكد') : [];
        if (upcoming.length > 0) {
          replyText = `📅 الحجوزات القادمة المجدولة بالتقويم هي **${upcoming.length} حجوزات**: \n` + upcoming.map(b => `- **${b.title}** بتاريخ (${b.date}) الساعة ${b.startTime}.`).join('\n');
        } else {
          replyText = `📅 لا توجد حجوزات مؤكدة قادمة حالياً.`;
        }
      } else if (query.includes('ملخص') || query.includes('اليوم')) {
        const todayStr = new Date().toISOString().substring(0, 10);
        const todayB = bookings ? bookings.filter(b => (b.startDate || b.date) === todayStr) : [];
        replyText = `📋 ملخص اليوم يحتوي على **${todayB.length} حجوزات ميدانية** و **${tasks ? tasks.length : 0} مهام تنفيذية** قائمة بالمنظومة.`;
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: replyText }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
      {/* AI Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.05) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', color: 'var(--primary-color)' }}>
            <Icons.Bot size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>مساعد ستار ميديا الذكي</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>كيف يمكنني مساعدتك اليوم؟</p>
          </div>
        </div>
        <span className="badge badge-success">نشط 🟢</span>
      </div>

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {askSuggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            style={{
              padding: '6px 14px',
              borderRadius: '50px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            💬 {s}
          </button>
        ))}
      </div>

      {/* Chat Messages Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', height: '480px' }}>
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-start' : 'flex-end', flexDirection: m.sender === 'user' ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: m.sender === 'user' ? 'var(--primary-color)' : 'var(--bg-sidebar)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem'
              }}>
                {m.sender === 'user' ? '👤' : '🤖'}
              </div>
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: '14px',
                borderTopRightRadius: m.sender === 'ai' ? '2px' : '14px',
                borderTopLeftRadius: m.sender === 'user' ? '2px' : '14px',
                backgroundColor: m.sender === 'user' ? 'var(--primary-color)' : '#ffffff',
                color: m.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                border: m.sender === 'ai' ? '1px solid var(--border-color)' : 'none',
                fontSize: '0.88rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-line'
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <Icons.Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>جاري صياغة الإجابة...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', backgroundColor: '#ffffff', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="اكتب استفسارك هنا..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage(input)}
            style={{ borderRadius: '50px', fontSize: '0.85rem' }}
          />
          <button className="btn btn-primary" onClick={() => handleSendMessage(input)} style={{ borderRadius: '50px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Send size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LensFlowAI;
