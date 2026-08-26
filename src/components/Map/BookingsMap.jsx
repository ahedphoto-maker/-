import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as Icons from 'lucide-react';
import { formatBookingNumber, formatTime12h } from '../../utils/helpers';

// Default Riyadh Coordinates for initial bookings
const defaultCoordinates = {
  501: [24.6636, 46.6268], // Ritz Carlton
  502: [24.7436, 46.6432], // Nakheel
  503: [24.7136, 46.6753], // Ulayya
  504: [24.7865, 46.7118]  // Exhibition Center
};

// Deterministic Riyadh Coordinate generator for extra bookings to keep coordinates stable
const getBookingCoords = (booking) => {
  if (booking.lat && booking.lng) return [booking.lat, booking.lng];
  if (defaultCoordinates[booking.id]) return defaultCoordinates[booking.id];
  const idHash = Number(booking.id) || 500;
  const lat = 24.7136 + (Math.sin(idHash) * 0.05);
  const lng = 46.6753 + (Math.cos(idHash) * 0.05);
  return [lat, lng];
};

// Map booking status to coverage status
const getCoverageStatus = (booking) => {
  if (booking.status === 'مكتمل' || booking.status === 'مكتملة') {
    return 'انتهت التغطية';
  }
  if (booking.status === 'قيد التنفيذ' || booking.status === 'قيد الاستخدام') {
    // Variations for mockup realism based on ID
    return booking.id % 2 === 0 ? 'التغطية نشطة' : 'بدأ التغطية';
  }
  if (booking.status === 'مؤكد') {
    return 'في الطريق';
  }
  return 'متاح';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'متاح': return '#3b82f6'; // Blue
    case 'في الطريق': return '#f59e0b'; // Amber
    case 'بدأ التغطية': return '#8b5cf6'; // Purple
    case 'التغطية نشطة': return '#10b981'; // Green
    case 'انتهت التغطية': return '#64748b'; // Slate
    default: return '#6366f1'; // Primary Indigo
  }
};

export const BookingsMap = () => {
  const { bookings, team, setSelectedBooking, setIsBookingDetailOpen, updateBooking } = useApp();
  
  // State variables
  const [selectedPin, setSelectedPin] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [photographerFilter, setPhotographerFilter] = useState('الكل');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all', 'active', 'upcoming'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);

  // Detect theme updates
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(currentTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active bookings filter (excluding cancelled bookings)
  const activeBookings = useMemo(() => {
    return bookings ? bookings.filter(b => b.status !== 'ملغي') : [];
  }, [bookings]);

  // Unique photographers for filtering dropdown
  const activePhotographers = useMemo(() => {
    if (!team) return [];
    // Only return team members who have bookings assigned
    const assignedIds = new Set(activeBookings.flatMap(b => b.teamAssigned || []));
    return team.filter(m => assignedIds.has(m.id));
  }, [team, activeBookings]);

  // Statistics for Sidebar
  const stats = useMemo(() => {
    const total = activeBookings.length;
    const active = activeBookings.filter(b => b.status === 'قيد التنفيذ').length;
    const completed = activeBookings.filter(b => b.status === 'مكتمل' || b.status === 'مكتملة').length;
    
    // Count photographers currently active in fields
    const activePhotographerIds = new Set(
      activeBookings
        .filter(b => b.status === 'قيد التنفيذ')
        .flatMap(b => b.teamAssigned || [])
    );
    const photographersInField = activePhotographerIds.size;

    const upcoming = activeBookings.filter(b => b.status === 'مؤكد' || b.status === 'بانتظار العميل').length;

    return { total, active, completed, photographersInField, upcoming };
  }, [activeBookings]);

  // Apply filters
  const filteredBookings = useMemo(() => {
    return activeBookings.filter(b => {
      const coverageStatus = getCoverageStatus(b);
      const assignedIds = b.teamAssigned || [];
      
      // Search text filter
      const matchesSearch = 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.clientName && b.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.location && b.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || formatBookingNumber(b.bookingNumber).includes(searchQuery);

      // Status filter
      const matchesStatus = statusFilter === 'الكل' || coverageStatus === statusFilter;

      // Photographer filter
      const matchesPhotographer = photographerFilter === 'الكل' || assignedIds.includes(Number(photographerFilter));

      // Quick tab filters
      let matchesQuick = true;
      if (quickFilter === 'active') {
        matchesQuick = b.status === 'قيد التنفيذ';
      } else if (quickFilter === 'upcoming') {
        matchesQuick = b.status === 'مؤكد' || b.status === 'بانتظار العميل';
      }

      return matchesSearch && matchesStatus && matchesPhotographer && matchesQuick;
    });
  }, [activeBookings, searchQuery, statusFilter, photographerFilter, quickFilter]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Create map instance
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([24.7136, 46.6753], 12);

      // Render custom zoom control in top-right corner using CSS later
      L.control.attribution({
        position: 'bottomleft'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Map Tiles on Theme Change
  useEffect(() => {
    if (mapRef.current) {
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }

      // Premium CartoDB map styles
      const tileUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 19
      }).addTo(mapRef.current);
    }
  }, [theme]);

  // Redraw Markers when filteredBookings change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Draw new markers
    filteredBookings.forEach(b => {
      const [lat, lng] = getBookingCoords(b);
      const status = getCoverageStatus(b);
      const color = getStatusColor(status);
      const titleShort = b.title.length > 20 ? `${b.title.substring(0, 18)}...` : b.title;

      // Custom Glowing Pulsing Marker HTML
      const markerHtml = `
        <div class="leaflet-custom-marker-wrapper" style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <!-- Glowing pulse ring -->
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${color};
            opacity: 0.35;
            animation: pulse-ring 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite;
          "></div>
          
          <!-- Inner circle with camera icon -->
          <div style="
            position: relative;
            z-index: 2;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background-color: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
            border: 2px solid ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            color: ${color};
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>

          <!-- Label tooltip -->
          <div style="
            position: absolute;
            bottom: -22px;
            background-color: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.9)'};
            border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'};
            box-shadow: var(--card-shadow);
            color: #ffffff;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 1px 7px;
            border-radius: 12px;
            white-space: nowrap;
            z-index: 5;
            max-width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
            pointer-events: none;
          ">
            ${titleShort}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker-div',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);
      
      marker.on('click', () => {
        const assignedPhotographer = team && b.teamAssigned && team.find(t => b.teamAssigned.includes(t.id));
        setSelectedPin({
          b,
          status,
          photographer: assignedPhotographer,
          coords: [lat, lng]
        });
        mapRef.current.setView([lat - 0.008, lng], 14, { animate: true, duration: 0.8 });
        setIsMobileSheetOpen(false); // Close sheet to show card on mobile
      });

      markersRef.current.push(marker);
    });

    // If there are markers and no specific pin selected, fit the bounds of Riyadh dynamically
    if (filteredBookings.length > 0 && !selectedPin) {
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.15));
    }
  }, [filteredBookings, theme, team]);

  // Pan and Zoom to selected booking from Sidebar List
  const handleSelectBookingFromList = (booking) => {
    const coords = getBookingCoords(booking);
    const status = getCoverageStatus(booking);
    const assignedPhotographer = team && booking.teamAssigned && team.find(t => booking.teamAssigned.includes(t.id));

    setSelectedPin({
      b: booking,
      status,
      photographer: assignedPhotographer,
      coords
    });

    if (mapRef.current) {
      mapRef.current.setView([coords[0] - 0.008, coords[1]], 14, { animate: true, duration: 0.8 });
    }

    setIsMobileSheetOpen(false); // Close bottom drawer on mobile
  };

  // Zoom controls
  const zoomIn = () => mapRef.current && mapRef.current.zoomIn();
  const zoomOut = () => mapRef.current && mapRef.current.zoomOut();
  
  const resetMap = () => {
    setSelectedPin(null);
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.15));
    } else {
      mapRef.current.setView([24.7136, 46.6753], 12);
    }
  };

  // Get User Geolocation and Fly
  const locateMe = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current.setView([latitude, longitude], 14, { animate: true });
          
          // Temporary blue pulse marker for user location
          const userMarkerHtml = `
            <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #3b82f6; border: 3px solid #ffffff; box-shadow: 0 0 12px #3b82f6; position: relative;">
              <div style="position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px; border-radius: 50%; border: 3px solid rgba(59,130,246,0.4); animation: pulse-ring 1.5s infinite;"></div>
            </div>
          `;
          L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: userMarkerHtml,
              className: 'user-loc-marker',
              iconSize: [20, 20]
            })
          }).addTo(mapRef.current);
        },
        () => {
          alert('❌ تعذر تحديد موقعك الحالي. يرجى تفعيل صلاحية الـ GPS في متصفحك.');
        }
      );
    } else {
      alert('❌ ميزة الموقع الجغرافي غير مدعومة.');
    }
  };

  // Quick Action: Update Status of Booking
  const handleUpdateStatus = (bookingId, nextStatus) => {
    if (updateBooking) {
      updateBooking(bookingId, { status: nextStatus });
      // Update local state if selectedPin matches
      if (selectedPin && selectedPin.b.id === bookingId) {
        const updatedBooking = { ...selectedPin.b, status: nextStatus };
        const status = getCoverageStatus(updatedBooking);
        setSelectedPin(prev => ({
          ...prev,
          b: updatedBooking,
          status
        }));
      }
    }
  };

  // Inline CSS animations injection
  useEffect(() => {
    const styleId = 'map-marker-glow-pulse-css';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.9; }
          75% { transform: scale(1.6); opacity: 0.1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .custom-leaflet-marker-div {
          background: transparent !important;
          border: none !important;
        }
        .user-loc-marker {
          background: transparent !important;
          border: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 100px)', minHeight: '500px' }}>
      
      {/* ─── Header Stats Banner ─── */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '12px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
            <Icons.MapPin size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>🗺️ خريطة التغطيات والفعاليات الميدانية الحية</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>تتبع فرق التصوير والمصورين وحجوزات التغطيات بشكل مباشر وتفاعلي</p>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', padding: '6px 12px', fontWeight: 700 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'inline-block', animation: 'pulse-ring 1s infinite' }}></span>
            <span className="en-digits" style={{ fontWeight: 800 }}>{stats.active}</span> نشطة الآن
          </span>
          <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', padding: '6px 12px', fontWeight: 700 }}>
            🏢 <span className="en-digits" style={{ fontWeight: 800 }}>{stats.upcoming}</span> قادمة ومؤكدة
          </span>
          <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', padding: '6px 12px', fontWeight: 700 }}>
            📸 <span className="en-digits" style={{ fontWeight: 800 }}>{stats.photographersInField}</span> مصورين في الميدان
          </span>
        </div>
      </div>

      {/* ─── Main Map + Sidebar Flex Grid ─── */}
      <div style={{ display: 'flex', flex: 1, gap: '20px', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        
        {/* ─── MAP CANVAS (Left Area) ─── */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Map Header details */}
          <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-main)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>تغطية النطاق الجغرافي للرياض</span>
              <span className="en-digits" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--border-color)', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
                {filteredBookings.length} موقع
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                مزامنة حية 🟢
              </span>
            </div>
          </div>

          {/* Leaflet container */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

            {/* Floating Custom Map Controls */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={zoomIn} 
                title="تكبير"
                style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              >
                <Icons.Plus size={18} />
              </button>
              <button 
                onClick={zoomOut} 
                title="تصغير"
                style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              >
                <Icons.Minus size={18} />
              </button>
              <button 
                onClick={resetMap} 
                title="إعادة التوسيط للكل"
                style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                <Icons.Maximize2 size={16} />
              </button>
              <button 
                onClick={locateMe} 
                title="موقعي الحالي"
                style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                <Icons.Locate size={16} />
              </button>
            </div>

            {/* Sidebar toggle button (Desktop only) */}
            {!isMobile && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                  position: 'absolute', top: '16px', left: '16px', zIndex: 1000,
                  width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)', color: 'var(--text-main)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s'
                }}
                title={isSidebarOpen ? "إخفاء القائمة" : "إظهار القائمة"}
              >
                {isSidebarOpen ? <Icons.ChevronRight size={18} /> : <Icons.ChevronLeft size={18} />}
              </button>
            )}

            {/* Mobile Sidebar open button */}
            {isMobile && (
              <button
                onClick={() => setIsMobileSheetOpen(true)}
                style={{
                  position: 'absolute', bottom: '16px', left: '16px', zIndex: 1000,
                  borderRadius: '30px', border: 'none',
                  backgroundColor: 'var(--primary-color)', color: '#ffffff',
                  padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.4)', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem'
                }}
              >
                <Icons.List size={16} />
                قائمة التغطيات الحية
              </button>
            )}

            {/* Selected Marker Detail Card (Over the Map) */}
            {selectedPin && (
              <div style={{
                position: 'absolute', bottom: isMobile ? '70px' : '20px', right: '20px', left: isMobile ? '20px' : 'auto',
                width: isMobile ? 'auto' : '340px', backgroundColor: theme === 'dark' ? '#141b27' : '#ffffff',
                borderRadius: '16px', border: `1px solid var(--border-color)`,
                boxShadow: '0 12px 36px rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', flexDirection: 'column',
                gap: '12px', padding: '16px', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                    <span className="en-digits" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                      {formatBookingNumber(selectedPin.b.bookingNumber)}
                    </span>
                    <span className="badge" style={{
                      backgroundColor: `${getStatusColor(selectedPin.status)}15`,
                      color: getStatusColor(selectedPin.status),
                      fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', width: 'fit-content'
                    }}>
                      ● {selectedPin.status}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedPin(null)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                  >
                    <Icons.X size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {selectedPin.b.title}
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                    👨‍💼 <strong>العميل:</strong> {selectedPin.b.clientName || 'غير متوفر'}
                  </p>
                </div>

                {/* Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <Icons.MapPin size={14} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>الموقع:</strong> {selectedPin.b.location}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Icons.Calendar size={14} color="#6366f1" />
                    <span><strong>التاريخ:</strong> {selectedPin.b.date || selectedPin.b.startDate}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Icons.Clock size={14} color="#f59e0b" />
                    <span><strong>التوقيت:</strong> {selectedPin.b.isAllDay ? 'طوال اليوم' : (selectedPin.b.startTime === 'صباحًا' || selectedPin.b.startTime === 'مساءً' ? selectedPin.b.startTime : `${formatTime12h(selectedPin.b.startTime)} - ${formatTime12h(selectedPin.b.endTime)}`)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Icons.Camera size={14} color="#8b5cf6" />
                    <span><strong>المصور:</strong> {selectedPin.photographer ? selectedPin.photographer.name : 'لم يتم التكليف'}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  
                  {/* Directions Button */}
                  {selectedPin.coords && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPin.coords[0]},${selectedPin.coords[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: '6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Icons.Navigation size={13} />
                      فتح الاتجاهات
                    </a>
                  )}

                  {/* Complete details modal */}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (setSelectedBooking && setIsBookingDetailOpen) {
                        setSelectedBooking(selectedPin.b);
                        setIsBookingDetailOpen(true);
                      }
                    }}
                    style={{ flex: 1, padding: '6px', fontSize: '0.72rem' }}
                  >
                    عرض التفاصيل ➔
                  </button>

                  {/* Coverage quick actions status trigger */}
                  {selectedPin.status === 'في الطريق' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleUpdateStatus(selectedPin.b.id, 'قيد التنفيذ')}
                      style={{ width: '100%', padding: '6px', fontSize: '0.72rem', backgroundColor: '#10b981', color: '#ffffff', marginTop: '4px' }}
                    >
                      🎥 بدء التغطية الحية الآن
                    </button>
                  )}
                  {(selectedPin.status === 'بدأ التغطية' || selectedPin.status === 'التغطية نشطة') && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleUpdateStatus(selectedPin.b.id, 'مكتمل')}
                      style={{ width: '100%', padding: '6px', fontSize: '0.72rem', backgroundColor: '#ef4444', color: '#ffffff', marginTop: '4px' }}
                    >
                      ✓ إنهاء التغطية وإغلاق الموقع
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ─── SIDEBAR LIST (Right Area) ─── */}
        {(!isMobile && isSidebarOpen) && (
          <div style={{
            width: '320px', display: 'flex', flexDirection: 'column', gap: '14px',
            height: '100%', flexShrink: 0, animation: 'slideInRight 0.3s ease'
          }}>
            <SidebarContent
              filteredBookings={filteredBookings}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              photographerFilter={photographerFilter}
              setPhotographerFilter={setPhotographerFilter}
              quickFilter={quickFilter}
              setQuickFilter={setQuickFilter}
              activePhotographers={activePhotographers}
              selectedPin={selectedPin}
              handleSelectBookingFromList={handleSelectBookingFromList}
            />
          </div>
        )}

      </div>

      {/* ─── MOBILE BOTTOM SHEET DRAWER ─── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '70vh',
          backgroundColor: theme === 'dark' ? '#141b27' : '#ffffff',
          borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.15)', zIndex: 9000,
          transform: isMobileSheetOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          
          {/* Bottom Sheet Handle */}
          <div 
            onClick={() => setIsMobileSheetOpen(false)}
            style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}
          >
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)', marginBottom: '8px' }}></div>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>إغلاق القائمة ▾</span>
          </div>

          {/* Bottom Sheet Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <SidebarContent
              filteredBookings={filteredBookings}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              photographerFilter={photographerFilter}
              setPhotographerFilter={setPhotographerFilter}
              quickFilter={quickFilter}
              setQuickFilter={setQuickFilter}
              activePhotographers={activePhotographers}
              selectedPin={selectedPin}
              handleSelectBookingFromList={handleSelectBookingFromList}
            />
          </div>
        </div>
      )}

    </div>
  );
};

// Sub-Component for clean sidebar rendering (reused in desktop and mobile bottom-sheet)
const SidebarContent = ({
  filteredBookings,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  photographerFilter,
  setPhotographerFilter,
  quickFilter,
  setQuickFilter,
  activePhotographers,
  selectedPin,
  handleSelectBookingFromList
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', height: '100%', overflow: 'hidden' }}>
      
      {/* 1. Header and Quick reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexShrink: 0 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          📍 قائمة التغطيات والحجوزات
        </h3>
        <button 
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('الكل');
            setPhotographerFilter('الكل');
            setQuickFilter('all');
          }}
          style={{ fontSize: '0.7rem', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >
          إعادة تعيين
        </button>
      </div>

      {/* 2. Quick Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-main)', padding: '3px', borderRadius: '8px', flexShrink: 0 }}>
        <button
          onClick={() => setQuickFilter('all')}
          style={{
            flex: 1, padding: '6px 4px', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
            backgroundColor: quickFilter === 'all' ? 'var(--bg-card)' : 'transparent',
            color: quickFilter === 'all' ? 'var(--primary-color)' : 'var(--text-muted)',
            boxShadow: quickFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer'
          }}
        >
          الكل
        </button>
        <button
          onClick={() => setQuickFilter('active')}
          style={{
            flex: 1, padding: '6px 4px', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
            backgroundColor: quickFilter === 'active' ? 'var(--bg-card)' : 'transparent',
            color: quickFilter === 'active' ? 'var(--primary-color)' : 'var(--text-muted)',
            boxShadow: quickFilter === 'active' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer'
          }}
        >
          النشطة فقط
        </button>
        <button
          onClick={() => setQuickFilter('upcoming')}
          style={{
            flex: 1, padding: '6px 4px', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
            backgroundColor: quickFilter === 'upcoming' ? 'var(--bg-card)' : 'transparent',
            color: quickFilter === 'upcoming' ? 'var(--primary-color)' : 'var(--text-muted)',
            boxShadow: quickFilter === 'upcoming' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer'
          }}
        >
          القادمة
        </button>
      </div>

      {/* 3. Search Bar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Icons.Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="ابحث عن تغطية، عميل، أو حي..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '8px 30px 8px 10px', borderRadius: '8px',
            border: '1px solid var(--border-color)', fontSize: '0.78rem',
            backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none'
          }}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <Icons.X size={12} />
          </button>
        )}
      </div>

      {/* 4. Dropdowns filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flexShrink: 0 }}>
        
        {/* Status Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700 }}>تصفية حسب الحالة</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)',
              fontSize: '0.74rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none'
            }}
          >
            <option value="الكل">كل الحالات</option>
            <option value="متاح">متاح</option>
            <option value="في الطريق">في الطريق</option>
            <option value="بدأ التغطية">بدأ التغطية</option>
            <option value="التغطية نشطة">التغطية نشطة</option>
            <option value="انتهت التغطية">انتهت التغطية</option>
          </select>
        </div>

        {/* Photographer Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700 }}>تصفية حسب المصور</span>
          <select
            value={photographerFilter}
            onChange={e => setPhotographerFilter(e.target.value)}
            style={{
              padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)',
              fontSize: '0.74rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none'
            }}
          >
            <option value="الكل">كل المصورين</option>
            {activePhotographers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* 5. Scrollable Coverages List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
        {filteredBookings.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '30px 10px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.6rem' }}>🔍</span>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>لا توجد تغطيات تطابق خيارات التصفية الحالية</p>
          </div>
        ) : (
          filteredBookings.map(b => {
            const status = getCoverageStatus(b);
            const color = getStatusColor(status);
            const isSelected = selectedPin && selectedPin.b.id === b.id;

            return (
              <div
                key={b.id}
                onClick={() => handleSelectBookingFromList(b)}
                style={{
                  padding: '10px 12px', borderRadius: '10px',
                  border: isSelected ? `2.5px solid var(--primary-color)` : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,0.08)' : '0 2px 5px rgba(0,0,0,0.02)'
                }}
              >
                {/* Status Indicator Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="en-digits" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                    {formatBookingNumber(b.bookingNumber)}
                  </span>
                  <span style={{ fontSize: '0.68rem', color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
                    {status}
                  </span>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {b.title}
                </h4>

                {/* Details preview */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>📍 {b.location.split(' - ')[0]}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span className="en-digits">📅 {b.date || b.startDate}</span>
                    <span className="en-digits">🕒 {b.isAllDay ? 'طوال اليوم' : (b.startTime === 'صباحًا' || b.startTime === 'مساءً' ? b.startTime : `${formatTime12h(b.startTime)} - ${formatTime12h(b.endTime)}`)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default BookingsMap;
