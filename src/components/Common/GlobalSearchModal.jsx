import React from 'react';
import { useApp } from '../../context/AppContext';
import * as Icons from 'lucide-react';
import { formatBookingNumber } from '../../utils/helpers';

export const GlobalSearchModal = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    searchQuery,
    setSearchQuery,
    bookings,
    clients,
    equipment,
    team,
    tasks,
    setActiveTab,
    setSelectedBooking,
    setIsBookingDetailOpen
  } = useApp();

  if (!isSearchModalOpen) return null;

  const query = searchQuery.trim().toLowerCase();

  const filteredBookings = query ? bookings.filter(b => (b.title || '').toLowerCase().includes(query) || (b.clientName || '').toLowerCase().includes(query) || (b.bookingNumber || '').toLowerCase().includes(query) || formatBookingNumber(b.bookingNumber).includes(query)) : [];
  const filteredClients = query ? clients.filter(c => (c.name || '').toLowerCase().includes(query) || (c.contactPerson || '').toLowerCase().includes(query)) : [];
  const filteredEquipment = query ? equipment.filter(e => (e.name || '').toLowerCase().includes(query) || (e.category || '').toLowerCase().includes(query)) : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 900, // Matching var(--z-modal-backdrop)
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 16px 16px 16px'
      }}
      onClick={() => setIsSearchModalOpen(false)}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '100%', marginTop: '10vh' }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', backgroundColor: 'var(--bg-main)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <Icons.Search size={20} color="var(--text-muted)" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن حجز، عميل، معدات، موظف، مهمة..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'transparent',
                color: 'var(--text-main)'
              }}
            />
          </div>
          <button className="btn btn-icon btn-secondary" onClick={() => setIsSearchModalOpen(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
            <Icons.X size={18} />
          </button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '16px' }}>
          {!query ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              <Icons.Search size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '0.88rem' }}>اكتب اسم العميل، الحجز، المعدة، أو اسم الموظف للبحث الفوري</p>
            </div>
          ) : (
            <div>
              {/* Bookings */}
              {filteredBookings.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 800 }}>📅 الحجوزات</h4>
                  {filteredBookings.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBooking(b);
                        setIsBookingDetailOpen(true);
                        setIsSearchModalOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--bg-card)'
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.title}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>العميل: {b.clientName} | رقم الحجز: {formatBookingNumber(b.bookingNumber)} | {b.date}</p>
                      </div>
                      <span className="badge badge-info">{b.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Clients */}
              {filteredClients.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 800 }}>👥 العملاء</h4>
                  {filteredClients.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setActiveTab('clients');
                        setIsSearchModalOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--bg-card)'
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 700 }}>{c.name}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.phone} | {c.type}</p>
                      </div>
                      <span className="badge badge-success">{c.totalSpent.toLocaleString('en-US')} ريال</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Equipment */}
              {filteredEquipment.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 800 }}>📷 المعدات</h4>
                  {filteredEquipment.map(e => (
                    <div
                      key={e.id}
                      onClick={() => {
                        setActiveTab('equipment');
                        setIsSearchModalOpen(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--bg-card)'
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 700 }}>{e.name}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{e.category} | الرقم التعريفى: {e.id}</p>
                      </div>
                      <span className="badge badge-warning">{e.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {filteredBookings.length === 0 && filteredClients.length === 0 && filteredEquipment.length === 0 && (
                <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>لم يتم العثور على نتائج تطابق "{searchQuery}"</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
