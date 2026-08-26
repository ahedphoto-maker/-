import confetti from 'canvas-confetti';

export const toEnglishDigits = (str) => {
  if (str === null || str === undefined) return '';
  return str.toString()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
};

export const sanitizeObjectToEnglishDigits = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return toEnglishDigits(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectToEnglishDigits(item));
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date || obj instanceof RegExp || (obj.constructor && obj.constructor.name !== 'Object')) {
      return obj;
    }
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitizeObjectToEnglishDigits(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

export const formatCurrency = (amount, currency = 'ريال') => {
  if (amount === undefined || amount === null || amount === '') return 'السعر غير محدد';
  const formatted = new Intl.NumberFormat('ar-SA-u-nu-latn').format(amount);
  return `${formatted} ريال`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return toEnglishDigits(dateString);
  }
};

export const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Simple cheerful arpeggio sound effect
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + index * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (err) {
    // Audio playback not supported or user gesture needed — fail silently
  }
};

export const triggerCelebration = () => {
  // Sound
  playSuccessSound();

  // Burst 1: Main colorful explosion
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
  });

  // Burst 2: Side stars after 150ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#3b82f6', '#10b981', '#f59e0b']
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#8b5cf6', '#ec4899', '#f59e0b']
    });
  }, 150);
};

export const formatBookingNumber = (bookingNumber) => {
  if (!bookingNumber) return '';
  const match = bookingNumber.toString().match(/\d+$/);
  if (match) {
    return parseInt(match[0], 10).toString();
  }
  const digitsOnly = bookingNumber.toString().replace(/[^0-9]/g, '');
  if (digitsOnly) {
    return parseInt(digitsOnly, 10).toString();
  }
  return bookingNumber.toString();
};

export const formatTime12h = (time24) => {
  if (!time24) return '';
  const timeStr = String(time24);
  if (timeStr === 'صباحًا' || timeStr === 'مساءً') return timeStr;
  if (timeStr.includes('ص') || timeStr.includes('م') || timeStr.includes('AM') || timeStr.includes('PM')) {
    let result = timeStr;
    if (result.includes('AM')) result = result.replace('AM', 'ص');
    if (result.includes('PM')) result = result.replace('PM', 'م');
    return result;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = String(parts[1]).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

export const parseTime12hTo24h = (hourOrString, minutes, ampm) => {
  if (!hourOrString) return '12:00';
  
  // If called with multiple arguments (e.g. hour, minutes, ampm)
  if (minutes !== undefined && ampm !== undefined) {
    let hour = parseInt(hourOrString, 10);
    const min = String(minutes).padStart(2, '0');
    const isPM = ampm === 'م' || ampm === 'PM';
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${min}`;
  }
  
  // If called with a single string (e.g. "4:00 م" or "16:00")
  const timeStr = String(hourOrString);
  if (!timeStr.includes('ص') && !timeStr.includes('م') && !timeStr.includes('AM') && !timeStr.includes('PM')) {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return timeStr;
  }
  const cleanTime = timeStr.replace(/[صم\s]/g, '');
  const parts = cleanTime.split(':');
  if (parts.length < 2) return '12:00';
  let hours = parseInt(parts[0], 10);
  const minutesPart = parts[1];
  const isPM = timeStr.includes('م') || timeStr.includes('PM');
  if (isPM && hours < 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutesPart.padStart(2, '0')}`;
};

export const parse24hToParts = (time24) => {
  if (!time24) return { hours: '12', minutes: '00', ampm: 'ص' };
  const timeStr = String(time24);
  if (timeStr.includes('ص') || timeStr.includes('م') || timeStr.includes('AM') || timeStr.includes('PM')) {
    const cleanTime = timeStr.replace(/[صم\s]/g, '');
    const parts = cleanTime.split(':');
    if (parts.length < 2) return { hours: '12', minutes: '00', ampm: 'ص' };
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const ampm = timeStr.includes('م') || timeStr.includes('PM') ? 'م' : 'ص';
    return {
      hours: String(hours),
      minutes: String(minutes).padStart(2, '0'),
      ampm
    };
  }
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return { hours: '12', minutes: '00', ampm: 'ص' };
  let rawHours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const ampm = rawHours >= 12 ? 'م' : 'ص';
  let hours = rawHours % 12;
  hours = hours ? hours : 12;
  return {
    hours: String(hours),
    minutes: String(minutes).padStart(2, '0'),
    ampm
  };
};

export const formatDateTime12h = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  try {
    const date = new Date(dateTimeStr);
    const formattedDate = date.toISOString().substring(0, 10);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHour = hours % 12 || 12;
    return `${formattedDate} ${displayHour}:${minutes} ${ampm}`;
  } catch (e) {
    return dateTimeStr;
  }
};

export const getPeriodFromTime = (startTime) => {
  if (startTime === 'صباحًا' || startTime === 'مساءً') return startTime;
  if (!startTime) return 'صباحًا';
  const parts = startTime.split(':');
  if (parts.length < 2) return 'صباحًا';
  const hour = parseInt(parts[0], 10);
  return hour < 12 ? 'صباحًا' : 'مساءً';
};

export const generateAttendanceTimeOptions = () => {
  const options = [];
  const periods = ['ص', 'م'];
  periods.forEach(p => {
    const periodLabel = p === 'ص' ? 'صباحًا' : 'مساءً';
    options.push(`12:00 ${periodLabel}`);
    for (let h = 1; h <= 11; h++) {
      options.push(`${h}:00 ${periodLabel}`);
    }
  });
  return options;
};
