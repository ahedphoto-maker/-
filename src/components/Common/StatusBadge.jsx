import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (st) => {
    switch (st) {
      case 'مؤكد':
      case 'مكتمل':
      case 'مكتملة':
      case 'متاحة':
      case 'مدفوع':
      case 'مدفوعة':
      case 'نشط':
        return 'badge-success';

      case 'قيد التنفيذ':
      case 'قيد الاستخدام':
      case 'جزئي':
        return 'badge-warning';

      case 'ملغي':
      case 'محجوزة':
      case 'صيانة':
      case 'متأخرة':
      case 'غير مدفوع':
      case 'غير مدفوعة':
        return 'badge-danger';

      case 'بانتظار العميل':
      case 'لم تبدأ':
        return 'badge-info';

      default:
        return 'badge-neutral';
    }
  };

  return <span className={`badge ${getBadgeClass(status)}`}>{status}</span>;
};

export default StatusBadge;
