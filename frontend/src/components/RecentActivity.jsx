import { ExternalLink, Copy, Check, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const truncateHash = (hash) => {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const BSC_EXPLORER_TX = 'https://bscscan.com/tx/';
const BSC_EXPLORER_ADDRESS = 'https://bscscan.com/address/';

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
      title="Copy"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3 text-gray-400" />
      )}
    </button>
  );
}

export default function RecentActivity({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 animate-pulse">
        <div className="h-6 bg-dark-700 rounded w-48 mb-6"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-dark-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
        <div className="text-center text-gray-400 py-8">
          No recent activity available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <span className="text-sm text-gray-400">{data.length} swaps</span>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {data.map((activity, index) => (
          <div
            key={`${activity.txHash}-${index}`}
            className="bg-dark-900/50 rounded-lg p-4 border border-dark-700 hover:border-primary-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-900/20 rounded">
                  <ArrowUpDown className="h-4 w-4 text-primary-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-300">
                      {truncateAddress(activity.trader)}
                    </code>
                    <CopyButton text={activity.trader} />
                    <a
                      href={`${BSC_EXPLORER_ADDRESS}${activity.trader}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300"
                      title="View address"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestampDate), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-green-400">
                  {activity.volumeFormatted}
                </p>
                <p className="text-xs text-gray-500">Volume</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Tx:</span>
              <code className="text-gray-400 font-mono">
                {truncateHash(activity.txHash)}
              </code>
              <CopyButton text={activity.txHash} />
              <a
                href={`${BSC_EXPLORER_TX}${activity.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
                title="View transaction"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
