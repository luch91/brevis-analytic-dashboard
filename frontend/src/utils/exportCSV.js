/**
 * Export leaderboard data to CSV file
 */
export function exportLeaderboardToCSV(leaderboard, filename = 'pancakeswap-leaderboard') {
  if (!leaderboard || leaderboard.length === 0) {
    console.warn('No data to export');
    return;
  }

  // CSV headers
  const headers = [
    'Rank',
    'Address',
    'Total Volume (USD)',
    'Swap Count',
    'Avg Volume Per Swap (USD)',
    'First Seen',
    'Last Seen'
  ];

  // Convert data to CSV rows
  const rows = leaderboard.map((trader, index) => [
    index + 1,
    trader.address,
    trader.totalVolume,
    trader.swapCount,
    trader.avgVolumePerSwap,
    trader.firstSeenDate,
    trader.lastSeenDate
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export all analytics data to CSV
 */
export function exportAllAnalyticsToCSV(analytics, filename = 'pancakeswap-analytics') {
  if (!analytics) {
    console.warn('No data to export');
    return;
  }

  // Create comprehensive CSV with multiple sections
  const sections = [];

  // Summary section
  sections.push('SUMMARY');
  sections.push('Metric,Value');
  sections.push(`Total Swaps,${analytics.summary.totalSwaps}`);
  sections.push(`Unique Traders,${analytics.summary.uniqueTraders}`);
  sections.push(`Total Volume,${analytics.summary.totalVolume}`);
  sections.push(`Avg Volume Per Swap,${analytics.summary.avgVolumePerSwap}`);
  sections.push(`Avg Volume Per Trader,${analytics.summary.avgVolumePerTrader}`);
  sections.push('');

  // Time series section
  sections.push('TIME SERIES - DAILY DATA');
  sections.push('Date,Swap Count,Volume (USD),Unique Traders');
  analytics.timeSeries.swapsPerDay.forEach(day => {
    sections.push(`${day.date},${day.count},${day.volume},${day.uniqueTraders}`);
  });
  sections.push('');

  // Leaderboard section
  sections.push('LEADERBOARD - TOP TRADERS');
  sections.push('Rank,Address,Total Volume (USD),Swap Count,Avg Volume Per Swap (USD),First Seen,Last Seen');
  analytics.leaderboard.forEach((trader, index) => {
    sections.push(
      `${index + 1},${trader.address},${trader.totalVolume},${trader.swapCount},${trader.avgVolumePerSwap},${trader.firstSeenDate},${trader.lastSeenDate}`
    );
  });

  const csvContent = sections.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
