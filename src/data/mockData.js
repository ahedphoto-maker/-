export const initialTeam = [
  {
    id: 1,
    name: 'عاهد العماري',
    role: 'مصور فريلانسر / منظم حجوزاتي العهد ستار 👑',
    email: 'ahdalamary@gmail.com',
    password: 'admin',
    phone: '+966 50 123 4567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    tasksCompleted: 48,
    completionRate: 98,
    points: 2150,
    badge: 'العهد ستار 👑',
    status: 'نشط'
  },
  {
    id: 2,
    name: 'محمد العتيبي',
    role: 'مصور فيديو وحفلات رئيسي',
    email: 'm.otaibi@lensflow.sa',
    password: 'photo123',
    phone: '+966 55 987 6543',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    tasksCompleted: 28,
    completionRate: 92,
    points: 1240,
    badge: 'المصور الذهبي ⭐',
    status: 'نشط'
  },
  {
    id: 3,
    name: 'أحمد الشهري',
    role: 'مصور فوتوغرافي ومعدل صور',
    email: 'a.shehri@lensflow.sa',
    password: 'photo123',
    phone: '+966 54 222 3333',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    tasksCompleted: 21,
    completionRate: 86,
    points: 980,
    badge: 'خبير الفوتوشوب 🎨',
    status: 'نشط'
  },
  {
    id: 4,
    name: 'سعيد القحطاني',
    role: 'فني إضاءة وتجهيز معدات',
    email: 's.qahtani@lensflow.sa',
    password: 'photo123',
    phone: '+966 56 444 5555',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    tasksCompleted: 15,
    completionRate: 78,
    points: 720,
    badge: 'ماستر الإضاءة 💡',
    status: 'نشط'
  },
  {
    id: 5,
    name: 'يوسف الحربي',
    role: 'مونتير فيديو ومؤثرات بصري',
    email: 'y.harbi@lensflow.sa',
    password: 'photo123',
    phone: '+966 59 777 8888',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    tasksCompleted: 19,
    completionRate: 84,
    points: 890,
    badge: 'بطل المونتاج 🎬',
    status: 'نشط'
  }
];

export const initialClients = [
  {
    id: 101,
    name: 'شركة الإبداع للفعاليات',
    type: 'شركة',
    contactPerson: 'فهد السبيعي',
    phone: '+966 50 111 2222',
    email: 'info@ebda-events.sa',
    whatsapp: '+966501112222',
    bookingsCount: 8,
    totalSpent: 42000,
    avatar: '🏢',
    lastBookingDate: '2026-08-05'
  },
  {
    id: 102,
    name: 'متجر بيت ستايل',
    type: 'شركة',
    contactPerson: 'سارة المنصور',
    phone: '+966 55 333 4444',
    email: 'marketing@home-style.sa',
    whatsapp: '+966553334444',
    bookingsCount: 4,
    totalSpent: 18500,
    avatar: '🏬',
    lastBookingDate: '2026-08-08'
  },
  {
    id: 103,
    name: 'مؤسسة البناء الحديث',
    type: 'شركة',
    contactPerson: 'المهندس طارق',
    phone: '+966 54 555 6666',
    email: 't.binaa@modern.sa',
    whatsapp: '+966545556666',
    bookingsCount: 3,
    totalSpent: 14000,
    avatar: '🏗️',
    lastBookingDate: '2026-07-28'
  },
  {
    id: 104,
    name: 'الشيخ خالد السليمان',
    type: 'فرد',
    contactPerson: 'خالد السليمان',
    phone: '+966 59 888 9999',
    email: 'k.sulaiman@gmail.com',
    whatsapp: '+966598889999',
    bookingsCount: 2,
    totalSpent: 12000,
    avatar: '👨‍💼',
    lastBookingDate: '2026-08-11'
  }
];

export const initialCompanies = [
  {
    id: 201,
    name: 'استوديو أضواء الشرق الإنتاجي',
    logo: '🎬',
    contactPerson: 'عبدالله الخالدي',
    phone: '+966 11 456 7890',
    email: 'projects@adhwaa-east.com',
    totalRevenue: 65000,
    projectsCount: 6
  },
  {
    id: 202,
    name: 'وكالة إبداع للإعلام والتسويق',
    logo: '📢',
    contactPerson: 'مها الشمري',
    phone: '+966 11 234 5678',
    email: 'media@ebdaa-agency.sa',
    totalRevenue: 48000,
    projectsCount: 4
  }
];

export const initialEquipment = [
  {
    id: 301,
    name: 'Canon R5',
    category: 'الكاميرات',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 302,
    name: 'Canon R5 Mark II',
    category: 'الكاميرات',
    quantity: 1,
    reservedQuantity: 0,
    status: 'غير متاحة'
  },
  {
    id: 303,
    name: 'عدسة 24-70',
    category: 'العدسات',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 304,
    name: 'عدسة 200 + 70',
    category: 'العدسات',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 305,
    name: 'عدسة 35 + 16',
    category: 'العدسات',
    quantity: 1,
    reservedQuantity: 0,
    status: 'غير متاحة'
  },
  {
    id: 306,
    name: 'Speedlite V1',
    category: 'الفلاش والإضاءة',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 307,
    name: 'Godox AD600 Pro',
    category: 'الفلاش والإضاءة',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 308,
    name: 'فلاش AD600',
    category: 'الفلاش والإضاءة',
    quantity: 1,
    reservedQuantity: 0,
    status: 'غير متاحة'
  },
  {
    id: 309,
    name: 'أمبرلا 130W',
    category: 'الفلاش والإضاءة',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 310,
    name: 'أكتا 90W',
    category: 'الفلاش والإضاءة',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 311,
    name: 'استاند حملات إضاءة',
    category: 'الحوامل والاستديو',
    quantity: 3,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 312,
    name: 'إستاند حامل خلفية',
    category: 'الحوامل والاستديو',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 313,
    name: 'عاكس',
    category: 'الحوامل والاستديو',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 314,
    name: 'استاند عاكس',
    category: 'الحوامل والاستديو',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 315,
    name: 'خلفية بيضاء',
    category: 'الحوامل والاستديو',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 316,
    name: 'ذواكر 128 + 64',
    category: 'التخزين والإكسسوارات',
    quantity: 2,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 317,
    name: 'قارئ ذاكرة',
    category: 'التخزين والإكسسوارات',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 318,
    name: 'حزام',
    category: 'التخزين والإكسسوارات',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 319,
    name: 'تلاجر',
    category: 'التخزين والإكسسوارات',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  },
  {
    id: 320,
    name: 'لابتوب هونر 2025',
    category: 'الأجهزة',
    quantity: 1,
    reservedQuantity: 0,
    status: 'متاحة'
  }
];

export const initialBookings = [
  {
    id: 501,
    bookingNumber: 'BK-2026-081',
    title: 'تصوير حفل زفاف آل مشخص',
    clientName: 'الشيخ خالد السليمان',
    clientId: 104,
    companyId: 201,
    companyName: 'استوديو أضواء الشرق الإنتاجي',
    category: 'تصوير حفلات',
    date: '2026-08-12',
    startTime: '16:00',
    endTime: '23:00',
    location: 'فندق الريتز كارلتون - القاعة الكبرى، الرياض',
    googleMapsUrl: 'https://maps.google.com/?q=Ritz-Carlton+Riyadh',
    description: 'تغطية فوتوغرافية وفيديو كاملة للحفل مع درون ووحدة مونتاج سريعة.',
    photographersCount: 3,
    videographersCount: 2,
    teamAssigned: [2, 3, 4],
    equipmentAssigned: [301, 302, 304],
    totalPrice: 15000,
    deposit: 5000,
    paidAmount: 5000,
    remainingAmount: 10000,
    paymentDueDate: '2026-08-15',
    status: 'مؤكد',
    paymentStatus: 'جزئي'
  },
  {
    id: 502,
    bookingNumber: 'BK-2026-082',
    title: 'جلسة تصوير عقار فاخر',
    clientName: 'شركة عقار',
    clientId: 103,
    companyId: null,
    companyName: '-',
    category: 'تصوير عقار',
    date: '2026-08-13',
    startTime: '14:00',
    endTime: '18:00',
    location: 'مجمع النخيل السكني - فيلا 42، الرياض',
    googleMapsUrl: 'https://maps.google.com/?q=Nakheel+Riyadh',
    description: 'تصوير داخلي وخارجي للفيلا مع فيديو تعريفي 4K.',
    photographersCount: 1,
    videographersCount: 1,
    teamAssigned: [2, 5],
    equipmentAssigned: [301, 303],
    totalPrice: 4500,
    deposit: 1500,
    paidAmount: 4500,
    remainingAmount: 0,
    paymentDueDate: '2026-08-13',
    status: 'قيد التنفيذ',
    paymentStatus: 'مدفوع'
  },
  {
    id: 503,
    bookingNumber: 'BK-2026-083',
    title: 'تصوير منتجات التشكيلة الجديدة',
    clientName: 'متجر بيت ستايل',
    clientId: 102,
    companyId: 202,
    companyName: 'وكالة إبداع للإعلام والتسويق',
    category: 'تصوير منتج',
    date: '2026-08-14',
    startTime: '13:00',
    endTime: '19:00',
    location: 'استوديو لينس فلو - الفرع الرئيسي',
    googleMapsUrl: 'https://maps.google.com/?q=Riyadh+Studio',
    description: 'تصوير 25 منتج أثاث وديكور بخلفية بيضاء وتنسيق استوديو.',
    photographersCount: 2,
    videographersCount: 0,
    teamAssigned: [3, 4],
    equipmentAssigned: [301, 302, 303],
    totalPrice: 8000,
    deposit: 3000,
    paidAmount: 3000,
    remainingAmount: 5000,
    paymentDueDate: '2026-08-20',
    status: 'مؤكد',
    paymentStatus: 'جزئي'
  },
  {
    id: 504,
    bookingNumber: 'BK-2026-084',
    title: 'تغطية مؤتمر التحول الرقمي',
    clientName: 'شركة الإبداع للفعاليات',
    clientId: 101,
    companyId: 202,
    companyName: 'وكالة إبداع للإعلام والتسويق',
    category: 'مؤتمر',
    date: '2026-08-18',
    startTime: '09:00',
    endTime: '17:00',
    location: 'مركز الرياض للمعارض والمؤتمرات',
    googleMapsUrl: 'https://maps.google.com/?q=Riyadh+Exhibition+Center',
    description: 'تغطية شاملة للمتحدثين والجلسات والحضور مع تسليم صور صحفية فورية.',
    photographersCount: 3,
    videographersCount: 2,
    teamAssigned: [1, 2, 3, 4, 5],
    equipmentAssigned: [301, 302, 304, 306],
    totalPrice: 22000,
    deposit: 10000,
    paidAmount: 10000,
    remainingAmount: 12000,
    paymentDueDate: '2026-08-25',
    status: 'بانتظار العميل',
    paymentStatus: 'جزئي'
  }
];

export const initialProjects = [
  {
    id: 601,
    name: 'موسم الرياض 2026 - تغطية الفعاليات',
    clientName: 'شركة الإبداع للفعاليات',
    companyName: 'استوديو أضواء الشرق الإنتاجي',
    category: 'مؤتمرات وفعاليات ضخمة',
    startDate: '2026-08-01',
    endDate: '2026-08-30',
    budget: 85000,
    revenue: 120000,
    expenses: 25000,
    profit: 95000,
    status: 'قيد التنفيذ',
    progress: 65,
    teamIds: [1, 2, 3, 4, 5]
  },
  {
    id: 602,
    name: 'حملة إطلاق أثاث بيت ستايل صيف 2026',
    clientName: 'متجر بيت ستايل',
    companyName: 'وكالة إبداع للإعلام والتسويق',
    category: 'إعلانات وتصوير تجاري',
    startDate: '2026-08-10',
    endDate: '2026-08-22',
    budget: 25000,
    revenue: 35000,
    expenses: 6000,
    profit: 29000,
    status: 'قيد التنفيذ',
    progress: 40,
    teamIds: [3, 4, 5]
  }
];

export const initialTasks = [
  {
    id: 701,
    bookingId: 501,
    bookingTitle: 'تصوير حفل زفاف آل مشخص',
    title: 'تجهيز المعدات والكاميرات وشحن البطاريات',
    description: 'تأكد من شحن كاميرا Canon R5 والبطاريات الإضافية واختبار فلاشات Godox.',
    assigneeId: 4,
    assigneeName: 'سعيد القحطاني',
    priority: 'عالية',
    dueDate: '2026-08-12 12:00',
    status: 'قيد التنفيذ',
    progress: 66,
    points: 10,
    checklist: [
      { text: 'شحن بطاريات Canon R5 (4 بطاريات)', done: true },
      { text: 'تهيئة كروت الذاكرة SanDisk 128GB', done: true },
      { text: 'اختبار مانع الاهتزاز DJI RS3', done: false }
    ]
  },
  {
    id: 702,
    bookingId: 501,
    bookingTitle: 'تصوير حفل زفاف آل مشخص',
    title: 'الوصول لموقع الفندق وبدء تصوير قاعة الرجال والنساء',
    description: 'التواجد الساعة 4:00 عصراً والتنسيق مع مشرف القاعة.',
    assigneeId: 2,
    assigneeName: 'محمد العتيبي',
    priority: 'عالية جداً',
    dueDate: '2026-08-12 16:00',
    status: 'قيد التنفيذ',
    progress: 50,
    points: 15,
    checklist: [
      { text: 'الالتقاء بالمشرف وتأكيد التصريح', done: true },
      { text: 'تصوير لقطات عامة للفرقة والديكور', done: false }
    ]
  },
  {
    id: 703,
    bookingId: 501,
    bookingTitle: 'تصوير حفل زفاف آل مشخص',
    title: 'تعديل الصور واختيار أفضل 100 صورة للحفل',
    description: 'معالجة الألوان وتصفية الوجه وتصدير الصور بدقة عالية للعميل.',
    assigneeId: 3,
    assigneeName: 'أحمد الشهري',
    priority: 'متوسطة',
    dueDate: '2026-08-14 18:00',
    status: 'لم تبدأ',
    progress: 0,
    points: 20,
    checklist: [
      { text: 'رفع ملفات RAW للسرفر', done: false },
      { text: 'تعديل الألوان عبر Lightroom Presets', done: false }
    ]
  },
  {
    id: 704,
    bookingId: 502,
    bookingTitle: 'جلسة تصوير عقار فاخر',
    title: 'مونتاج فيديو الجولة العقارية 4K 60fps',
    description: 'إضافة الموسيقى التصويرية والشعار والمؤثرات الانتقالية الناعمة.',
    assigneeId: 5,
    assigneeName: 'يوسف الحربي',
    priority: 'عالية',
    dueDate: '2026-08-14 20:00',
    status: 'لم تبدأ',
    progress: 0,
    points: 15,
    checklist: [
      { text: 'قص المقاطع وتقطيع الفيديو', done: false },
      { text: 'إضافة هيدر حقوق الملكية والعلامة المائية', done: false }
    ]
  }
];

export const initialInvoices = [
  {
    id: 801,
    invoiceNumber: 'INV-2026-101',
    bookingId: 501,
    clientName: 'الشيخ خالد السليمان',
    clientEmail: 'k.sulaiman@gmail.com',
    issueDate: '2026-08-10',
    dueDate: '2026-08-15',
    subtotal: 13043.48,
    taxRate: 15,
    taxAmount: 1956.52,
    total: 15000,
    paid: 5000,
    status: 'جزئي'
  },
  {
    id: 802,
    invoiceNumber: 'INV-2026-102',
    bookingId: 502,
    clientName: 'شركة عقار',
    clientEmail: 't.binaa@modern.sa',
    issueDate: '2026-08-11',
    dueDate: '2026-08-13',
    subtotal: 3913.04,
    taxRate: 15,
    taxAmount: 586.96,
    total: 4500,
    paid: 4500,
    status: 'مدفوعة'
  }
];

export const initialPayments = [
  {
    id: 901,
    invoiceNumber: 'INV-2026-101',
    clientName: 'الشيخ خالد السليمان',
    amount: 5000,
    date: '2026-08-10',
    method: 'تحويل بنكي',
    referenceNumber: 'TRX-998812',
    notes: 'دفعة عربون مؤكدة لحفل الزفاف'
  },
  {
    id: 902,
    invoiceNumber: 'INV-2026-102',
    clientName: 'شركة عقار',
    amount: 4500,
    date: '2026-08-11',
    method: 'مدى',
    referenceNumber: 'MADA-771120',
    notes: 'تم الدفع بالكامل عبر البوابة'
  }
];

export const initialExpenses = [
  {
    id: 1001,
    title: 'وقود ومواصلات فريق التصوير',
    category: 'مواصلات',
    amount: 450,
    date: '2026-08-10',
    spentBy: 'سعيد القحطاني',
    notes: 'تغطية موقع الفندق وقاعة الحفل'
  },
  {
    id: 1002,
    title: 'استئجار طائرة درون DJI Inspire 3',
    category: 'إيجار معدات',
    amount: 1800,
    date: '2026-08-11',
    spentBy: 'محمد العتيبي',
    notes: 'استئجار يومي لتغطية اللقطات الجوية للمؤتمر'
  }
];

export const initialAuditLogs = [
  {
    id: 2001,
    timestamp: '2026-08-11 18:42:10',
    userName: 'محمد العتيبي',
    userRole: 'مصور رئيسي',
    action: 'تحديث مهمة',
    details: 'أكمل جزءاً من مهمة "تجهيز المعدات والكاميرات" وبنسبة 66%',
    icon: '✓'
  },
  {
    id: 2002,
    timestamp: '2026-08-11 17:15:00',
    userName: 'عاهد العماري',
    userRole: 'المشرف',
    action: 'إنشاء حجز',
    details: 'تم إنشاء حجز جديد برقم BK-2026-083 لصالح متجر بيت ستايل',
    icon: '📅'
  },
  {
    id: 2003,
    timestamp: '2026-08-11 15:30:22',
    userName: 'عاهد العماري',
    userRole: 'المشرف',
    action: 'تسجيل دفعة',
    details: 'تم استلام دفعة 4,500 ريال تسديداً لفاتورة INV-2026-102',
    icon: '💰'
  }
];

export const initialNotifications = [
  {
    id: 3001,
    title: 'تأكيد حجز جديد 📅',
    message: 'قام العميل الشيخ خالد السليمان بتأكيد حجز تصوير حفل زفاف.',
    time: 'منذ 20 دقيقة',
    read: false,
    type: 'booking'
  },
  {
    id: 3002,
    title: 'مهمة جديدة مسندة 🎯',
    message: 'تم تعيين مهمة "تعديل صور المنتجات" لك بواسطة المشرف.',
    time: 'منذ ساعة',
    read: false,
    type: 'task'
  },
  {
    id: 3003,
    title: 'تنبيه موعد تصوير ⏰',
    message: 'تبقى أقل من 24 ساعة على موعد جلسة تصوير عقار النخيل.',
    time: 'منذ 3 ساعات',
    read: true,
    type: 'alert'
  }
];

export const initialContracts = [
  {
    id: 701,
    contractNumber: 'CTR-2026-001',
    bookingId: 501,
    bookingTitle: 'تصوير حفل زفاف آل مشخص',
    clientName: 'الشيخ خالد السليمان',
    clientPhone: '+966 59 888 9999',
    type: 'تصوير حفلات',
    date: '2026-08-12',
    location: 'فندق الريتز كارلتون - القاعة الكبرى، الرياض',
    totalPrice: 15000,
    deposit: 5000,
    remainingAmount: 10000,
    terms: 'يلتزم الطرف الأول بتقديم التغطية الكاملة للحفل بجودة 4K والتسليم خلال 14 يوم عمل. العربون غير مسترد في حال الإلغاء قبل الموعد بـ 48 ساعة.',
    status: 'تم التوقيع',
    signedByClient: 'خالد السليمان',
    signedAt: '2026-08-01 10:30',
    signatureData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10 20 Q 30 5 50 20 T 90 10" fill="none" stroke="black" stroke-width="2"/></svg>'
  },
  {
    id: 702,
    contractNumber: 'CTR-2026-002',
    bookingId: 502,
    bookingTitle: 'جلسة تصوير عقار فاخر',
    clientName: 'شركة عقار',
    clientPhone: '+966 54 555 6666',
    type: 'تصوير عقار',
    date: '2026-08-13',
    location: 'مجمع النخيل السكني - فيلا 42، الرياض',
    totalPrice: 4500,
    deposit: 1000,
    remainingAmount: 3500,
    terms: 'يتم تسليم 25 لقطة فوتوغرافية معالجة بالإضافة لفيديو تعريفي للفيلا. يلتزم العميل بتسهيل الدخول للموقع.',
    status: 'بانتظار التوقيع',
    signedByClient: '',
    signedAt: '',
    signatureData: ''
  }
];

export const initialFiles = [
  {
    id: 601,
    entityType: 'booking',
    entityId: 501,
    name: 'جدول تغطية الحفل.pdf',
    size: '1.2 MB',
    category: 'PDF',
    uploadedBy: 'عاهد العماري',
    uploadedAt: '2026-08-01 12:15',
    url: '#'
  },
  {
    id: 602,
    entityType: 'booking',
    entityId: 501,
    name: 'لقطات العروسين_مسودة.jpg',
    size: '8.4 MB',
    category: 'JPG',
    uploadedBy: 'محمد العتيبي',
    uploadedAt: '2026-08-11 16:30',
    url: '#'
  },
  {
    id: 603,
    entityType: 'booking',
    entityId: 502,
    name: 'مخطط الفيلا الداخلي.pdf',
    size: '2.5 MB',
    category: 'PDF',
    uploadedBy: 'أحمد الشهري',
    uploadedAt: '2026-08-11 11:20',
    url: '#'
  }
];

export const initialCustomRoles = [
  { id: 'admin', label: 'مدير النظام (Admin)', permissions: { view: true, create: true, edit: true, delete: true, approve: true, export: true, assign: true, manage: true } },
  { id: 'supervisor', label: 'مشرف عام (Supervisor)', permissions: { view: true, create: true, edit: true, delete: false, approve: true, export: true, assign: true, manage: true } },
  { id: 'photographer', label: 'مصور رئيسي (Photographer)', permissions: { view: true, create: false, edit: false, delete: false, approve: false, export: false, assign: false, manage: false } },
  { id: 'videographer', label: 'مصور فيديو (Videographer)', permissions: { view: true, create: false, edit: false, delete: false, approve: false, export: false, assign: false, manage: false } },
  { id: 'editor', label: 'مونتير ومصمم (Editor)', permissions: { view: true, create: false, edit: false, delete: false, approve: false, export: false, assign: false, manage: false } },
  { id: 'accountant', label: 'محاسب مالي (Accountant)', permissions: { view: true, create: true, edit: true, delete: false, approve: true, export: true, assign: false, manage: false } }
];

export const defaultSettings = {
  general: {
    systemName: 'LensFlow',
    subtitle: 'إدارة التصوير الذكية',
    companyName: 'استوديو لينس فلو للإنتاج الإعلامي',
    partnerLogo: '',
    partnerLogoTitle: '',
    logoDisplayMode: 'both',
    currency: 'ريال',
    currencySymbol: 'ر.س',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    dateFormat: 'YYYY-MM-DD',
    taxRate: 15,
    enableGamification: true
  },
  appearance: {
    primaryColor: '#6366f1',
    primaryHover: '#4f46e5',
    secondaryColor: '#06b6d4',
    bgSidebar: '#0f172a',
    borderRadius: '12px',
    buttonStyle: 'rounded',
    fontFamily: 'Cairo'
  },
  menuItems: [
    { id: 'dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard', visible: true },
    { id: 'operations', label: 'مركز العمليات', icon: 'Activity', visible: true },
    { id: 'calendar', label: 'التقويم', icon: 'Calendar', visible: true },
    { id: 'bookings', label: 'الحجوزات', icon: 'BookOpen', visible: true },
    { id: 'projects', label: 'المشاريع', icon: 'FolderKanban', visible: true },
    { id: 'tasks', label: 'المهام والإنتاج', icon: 'CheckSquare', visible: true },
    { id: 'contracts', label: 'العقود الإلكترونية', icon: 'FileText', visible: true },
    { id: 'clients', label: 'العملاء', icon: 'Users', visible: true },
    { id: 'companies', label: 'الشركات', icon: 'Building2', visible: true },
    { id: 'team', label: 'فريق العمل', icon: 'UserCheck', visible: true },
    { id: 'achievements', label: 'إنجازات الفريق', icon: 'Trophy', visible: true },
    { id: 'equipment', label: 'المعدات', icon: 'Camera', visible: true },
    { id: 'map', label: 'خريطة الحجوزات', icon: 'MapPin', visible: true },
    { id: 'invoices', label: 'الفواتير والمالية', icon: 'Receipt', visible: true },
    { id: 'reports', label: 'التقارير', icon: 'BarChart3', visible: true },
    { id: 'ai', label: 'LensFlow AI', icon: 'Bot', visible: true },
    { id: 'auditLogs', label: 'سجل النشاطات', icon: 'History', visible: true },
    { id: 'settings', label: 'الإعدادات والتخصيص', icon: 'Settings', visible: true }
  ],
  widgetsOrder: ['calendar', 'teamTasks', 'upcomingBookings']
};
