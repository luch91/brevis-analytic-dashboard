import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ title, value, icon: Icon, change, loading = false }) {
  if (loading) {
    return (
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-dark-700 rounded w-24"></div>
          <div className="h-10 w-10 bg-dark-700 rounded"></div>
        </div>
        <div className="h-8 bg-dark-700 rounded w-32 mb-2"></div>
      </div>
    );
  }

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 hover:border-primary-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {Icon && (
          <div className="p-2 bg-primary-900/20 rounded-lg">
            <Icon className="h-5 w-5 text-primary-400" />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white mb-1">
            {value}
          </p>

          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive && (
                <>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400">+{change}%</span>
                </>
              )}
              {isNegative && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">{change}%</span>
                </>
              )}
              {!isPositive && !isNegative && (
                <span className="text-sm text-gray-400">No change</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
