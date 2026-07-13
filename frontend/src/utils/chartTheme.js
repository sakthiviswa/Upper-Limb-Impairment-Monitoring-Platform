/**
 * Shared Chart.js theme configuration
 */
export const chartColors = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0EA5E9',
  grid: '#E2E8F0',
  text: '#64748B',
}

export function getChartOptions(overrides = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-secondary)',
          font: { family: 'Inter, sans-serif', size: 12 },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'var(--bg-card)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Inter, sans-serif', weight: '600' },
        bodyFont: { family: 'Inter, sans-serif' },
      },
    },
    scales: {
      x: {
        grid: { color: 'var(--border-light)' },
        ticks: { color: 'var(--text-muted)', font: { family: 'Inter, sans-serif', size: 11 } },
      },
      y: {
        grid: { color: 'var(--border-light)' },
        ticks: { color: 'var(--text-muted)', font: { family: 'Inter, sans-serif', size: 11 } },
      },
    },
    animation: { duration: 300, easing: 'easeOutQuart' },
    ...overrides,
  }
}
