import { useState } from 'react';
import { BlogAnalyticsDashboard } from '@/components/admin/BlogAnalyticsDashboard';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';
import { useAuth } from '@/hooks/useAuth';

export default function BlogAnalytics() {
  const [dateRange, setDateRange] = useState(30);
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog Analytics</h2>
          <p className="text-muted-foreground">
            Análises detalhadas dos seus posts
          </p>
        </div>
        <AnalyticsFilters dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      <BlogAnalyticsDashboard dateRange={dateRange} authorId={user?.id} />
    </div>
  );
}
