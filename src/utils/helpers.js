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

