import { ExternalLink, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const getMedalEmoji = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
};

const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const BSC_EXPLORER = 'https://bscscan.com/address/';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-dark-700 rounded transition-colors"
      title="Copy address"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3 text-gray-400" />
      )}
    </button>
  );
}

export default function LeaderboardTable({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 animate-pulse">
        <div className="h-6 bg-dark-700 rounded w-48 mb-6"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-dark-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-white mb-6">Top Traders</h3>
        <div className="text-center text-gray-400 py-8">
          No leaderboard data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-white mb-6">Top Traders</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-dark-700">
              <th className="pb-3 text-sm font-medium text-gray-400">Rank</th>
              <th className="pb-3 text-sm font-medium text-gray-400">Address</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">Volume</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">Swaps</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">Avg/Swap</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">First Seen</th>
            </tr>
          </thead>
          <tbody>
            {data.map((trader, index) => (
              <tr
                key={trader.address}
                className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
              >
                <td className="py-4">
                  <span className="text-lg font-semibold">
                    {getMedalEmoji(index + 1)}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-300">
                      {truncateAddress(trader.address)}
                    </code>
                    <CopyButton text={trader.address} />
                    <a
                      href={`${BSC_EXPLORER}${trader.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 transition-colors"
                      title="View on BscScan"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <span className="font-semibold text-green-400">
                    {trader.totalVolumeFormatted}
                  </span>
                </td>
                <td className="py-4 text-right text-gray-300">
                  {trader.swapCount.toLocaleString()}
                </td>
                <td className="py-4 text-right text-gray-400">
                  ${trader.avgVolumePerSwap.toLocaleString()}
                </td>
                <td className="py-4 text-right text-gray-400 text-sm">
                  {formatDistanceToNow(new Date(trader.firstSeenDate), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
