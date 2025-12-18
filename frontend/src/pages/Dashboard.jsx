import { useQuery } from '@tanstack/react-query';
import { Activity, Users, DollarSign, TrendingUp, RefreshCw, Download } from 'lucide-react';
import { useState, useMemo } from 'react';
import { isWithinInterval, subDays, parseISO } from 'date-fns';
import { analyticsAPI } from '../lib/api';
import MetricCard from '../components/MetricCard';
import EventsChart from '../components/EventsChart';
import LeaderboardTable from '../components/LeaderboardTable';
import RecentActivity from '../components/RecentActivity';
import FilterBar from '../components/FilterBar';
import { exportLeaderboardToCSV, exportAllAnalyticsToCSV } from '../utils/exportCSV';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const { data: response, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsAPI.getAnalytics,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const analytics = response?.data;

  // Filter data based on search and date range
  const filteredData = useMemo(() => {
    if (!analytics) return null;

    const now = new Date();
    let filtered = { ...analytics };

    // Filter leaderboard by search
    if (searchQuery) {
      filtered.leaderboard = analytics.leaderboard.filter(trader =>
        trader.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = subDays(now, days);

      // Filter time series
      filtered.timeSeries = {
        swapsPerDay: analytics.timeSeries.swapsPerDay.filter(day =>
          isWithinInterval(parseISO(day.date), { start: cutoffDate, end: now })
        )
      };

      // Filter recent activity
      filtered.recentActivity = analytics.recentActivity.filter(activity =>
        isWithinInterval(new Date(activity.timestampDate), { start: cutoffDate, end: now })
      );
    }

    return filtered;
  }, [analytics, searchQuery, dateRange]);

  const activeFilterCount = (searchQuery ? 1 : 0) + (dateRange !== 'all' ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateRange('all');
  };

  const handleRefresh = async () => {
    try {
      await analyticsAPI.refreshData();
      // Wait a moment then refetch
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error('Failed to trigger refresh:', err);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 text-gray-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-dark-800 rounded-lg p-8 border border-red-900/50">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error.message}</p>
          <p className="text-sm text-gray-500 mb-6">
            Make sure the backend server is running on port 3001
          </p>
          <button
            onClick={() => refetch()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
                Brevis PancakeSwap Analytics
              </h1>
              <p className="text-gray-400 mt-1">
                USDT-USDC Pool on BSC • Real-time trading insights
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => exportAllAnalyticsToCSV(analytics)}
                disabled={!analytics}
                className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 disabled:bg-dark-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors"
                title="Export all data to CSV"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>

              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onReset={handleResetFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Swaps"
            value={analytics?.summary.totalSwaps.toLocaleString() || '0'}
            icon={Activity}
            loading={isLoading}
          />
          <MetricCard
            title="Unique Traders"
            value={analytics?.summary.uniqueTraders.toLocaleString() || '0'}
            icon={Users}
            loading={isLoading}
          />
          <MetricCard
            title="Total Volume"
            value={analytics?.summary.totalVolumeFormatted || '$0'}
            icon={DollarSign}
            loading={isLoading}
          />
          <MetricCard
            title="Avg Volume/Swap"
            value={`$${Math.round(analytics?.summary.avgVolumePerSwap || 0).toLocaleString()}`}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="lg:col-span-2">
            <EventsChart
              data={filteredData?.timeSeries.swapsPerDay}
              loading={isLoading}
            />
          </div>
        </div>

        {/* Leaderboard and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LeaderboardTable
              data={filteredData?.leaderboard}
              loading={isLoading}
            />
          </div>
          <div>
            <RecentActivity
              data={filteredData?.recentActivity}
              loading={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-dark-800">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <p>Data last updated: {analytics?.metadata.generatedAt ? new Date(analytics.metadata.generatedAt).toLocaleString() : 'N/A'}</p>
              <p className="mt-1">Pool: {analytics?.metadata.poolAddress || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p>Days of data: {analytics?.metadata.daysIncluded || 0}</p>
              <p className="mt-1">Blocks: {analytics?.metadata.fromBlock?.toLocaleString()} - {analytics?.metadata.toBlock?.toLocaleString()}</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
