import React, { memo } from 'react';
import { StatCard } from '../../Common/StatCard';
import { useApp } from '../../../context/AppContext';
import { navigateTo } from '../../../routes/Router';
import * as Icons from 'lucide-react';

export const DashboardStats = memo(({ bookingsCount, tasksCount, activeProjectsCount, totalRevenue }) => {
  const { setActiveTab } = useApp();

  const handleCardClick = (tabId, path) => {
    if (setActiveTab) setActiveTab(tabId);
    navigateTo(path);
  };

  return (
    <div className="stats-grid">
      <div onClick={() => handleCardClick('bookings', '/admin/bookings')} style={{ cursor: 'pointer' }}>
        <StatCard
          title="إجمالي الحجوزات"
          value={bookingsCount}
          change="+12% هذا الشهر"
          isPositive={true}
          icon={Icons.Calendar}
          color="primary"
        />
      </div>

      <div onClick={() => handleCardClick('tasks', '/admin/tasks')} style={{ cursor: 'pointer' }}>
        <StatCard
          title="مهام اليوم الميدانية"
          value={tasksCount}
          change="4 مكتملة اليوم"
          isPositive={true}
          icon={Icons.CheckSquare}
          color="warning"
        />
      </div>

      <div onClick={() => handleCardClick('projects', '/admin/projects')} style={{ cursor: 'pointer' }}>
        <StatCard
          title="المشاريع الجارية"
          value={activeProjectsCount}
          change="نشطة ومتابعة"
          isPositive={true}
          icon={Icons.FolderKanban}
          color="purple"
        />
      </div>

      <div onClick={() => handleCardClick('invoices', '/admin/invoices')} style={{ cursor: 'pointer' }}>
        <StatCard
          title="إجمالي الإيرادات"
          value={`${(totalRevenue || 0).toLocaleString('en-US')} ريال`}
          change="+18% مقارنة بالشهر السابق"
          isPositive={true}
          icon={Icons.TrendingUp}
          color="success"
        />
      </div>
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
export default DashboardStats;
