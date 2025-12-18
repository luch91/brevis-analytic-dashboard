import { Search, Calendar, X, Filter } from 'lucide-react';
import { useState } from 'react';

export default function FilterBar({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onReset,
  activeFilterCount
}) {
  const [isOpen, setIsOpen] = useState(false);

  const dateRangeOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 90 Days', value: '90' },
  ];

  return (
    <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by address..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent cursor-pointer"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters & Reset */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-900/20 rounded-lg">
              <Filter className="h-4 w-4 text-primary-400" />
              <span className="text-sm text-primary-400 font-medium">
                {activeFilterCount} active
              </span>
            </div>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
