import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function EventsChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 animate-pulse">
        <div className="h-6 bg-dark-700 rounded w-48 mb-6"></div>
        <div className="h-64 bg-dark-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-white mb-6">Swaps Over Time</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-900 border border-dark-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-gray-400 mb-2">
            {format(parseISO(data.date), 'MMM dd, yyyy')}
          </p>
          <p className="text-sm font-semibold text-white">
            Swaps: <span className="text-primary-400">{data.count.toLocaleString()}</span>
          </p>
          <p className="text-sm font-semibold text-white">
            Volume: <span className="text-green-400">${data.volume.toLocaleString()}</span>
          </p>
          <p className="text-sm font-semibold text-white">
            Traders: <span className="text-purple-400">{data.uniqueTraders}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-white mb-6">Swaps Over Time</h3>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSwaps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorSwaps)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
