/**
 * Reusable UI Components JavaScript Module
 * Functions to create common UI elements
 */

/**
 * Create a stat card
 * @param {Object} options - Card options
 * @returns {string} HTML string
 */
export function createStatCard(options) {
  const { title, value, subtitle, gradient = 'purple', icon = '' } = options;
  
  const gradients = {
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    green: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    orange: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  };
  
  return `
    <div style="padding: 20px; background: ${gradients[gradient]}; border-radius: var(--radius-sm); color: white;">
      ${icon ? `<div style="font-size: 2rem; margin-bottom: 8px;">${icon}</div>` : ''}
      <div style="font-size: 0.9rem; opacity: 0.9;">${title}</div>
      <div style="font-size: 2.5rem; font-weight: 700; margin: 8px 0;">${value}</div>
      <div style="font-size: 0.85rem; opacity: 0.8;">${subtitle}</div>
    </div>
  `;
}

/**
 * Create a progress bar
 * @param {number} percentage - Progress (0-100)
 * @param {string} color - Bar color
 * @returns {string} HTML string
 */
export function createProgressBar(percentage, color = 'var(--success)') {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  
  return `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="flex: 1; background: var(--bg-secondary); border-radius: 4px; height: 8px; overflow: hidden;">
        <div style="background: ${color}; height: 100%; width: ${safePercentage}%; transition: width 0.3s ease;"></div>
      </div>
      <span style="font-weight: 600; min-width: 45px;">${safePercentage.toFixed(0)}%</span>
    </div>
  `;
}

/**
 * Create a status badge
 * @param {string} status - Status text
 * @param {string} type - Badge type (success/warning/danger/info)
 * @returns {string} HTML string
 */
export function createStatusBadge(status, type = 'success') {
  const colors = {
    success: { bg: '#d1fae5', text: '#065f46' },
    warning: { bg: '#fef3c7', text: '#92400e' },
    danger: { bg: '#fee2e2', text: '#991b1b' },
    info: { bg: '#dbeafe', text: '#1e40af' }
  };
  
  const color = colors[type] || colors.success;
  
  return `
    <span style="background: ${color.bg}; color: ${color.text}; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; white-space: nowrap;">
      ${status}
    </span>
  `;
}

/**
 * Create an empty state message
 * @param {string} message - Message text
 * @param {string} icon - Emoji icon
 * @returns {string} HTML string
 */
export function createEmptyState(message, icon = '📭') {
  return `
    <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
      <div style="font-size: 4rem; margin-bottom: 16px; opacity: 0.5;">${icon}</div>
      <p style="font-size: 1.1rem; margin: 0;">${message}</p>
    </div>
  `;
}

/**
 * Create a loading spinner
 * @returns {string} HTML string
 */
export function createLoadingSpinner() {
  return `
    <div style="display: flex; justify-content: center; align-items: center; padding: 40px;">
      <div style="
        border: 3px solid var(--border-color);
        border-top-color: var(--primary);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      "></div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
}

/**
 * Create an alert box
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success/warning/danger/info)
 * @returns {string} HTML string
 */
export function createAlert(message, type = 'info') {
  const styles = {
    success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    danger: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
  };
  
  const style = styles[type] || styles.info;
  
  return `
    <div style="
      padding: 16px;
      background: ${style.bg};
      border-left: 4px solid ${style.border};
      border-radius: var(--radius-sm);
      color: ${style.text};
      margin-bottom: 20px;
    ">
      ${message}
    </div>
  `;
}
