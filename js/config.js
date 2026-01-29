// ================================================
// SCOTECH SMS - CONFIGURATION
// ================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase Configuration
const SUPABASE_URL = "https://jddphdeflisqwtqqujox.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZHBoZGVmbGlzcXd0cXF1am94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MTc5NDksImV4cCI6MjA4NDE5Mzk0OX0.gUFTDCq6VSyPydK4Ll7xjqY8HEi1EvNXvUMwjAr73FA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application Configuration
export const APP_CONFIG = {
  name: "ScoTech SMS",
  version: "2.0.0",
  description: "Modern School Management System",
  defaultLogo: "/assets/logo.png",
  dateFormat: "DD/MM/YYYY",
  currency: "KES",
  currencySymbol: "KES",
  
  // SMS Configuration (Africa's Talking / Twilio)
  sms: {
    enabled: true,
    provider: "africas_talking", // or "twilio"
    apiKey: "", // Configure in school settings
    username: "", // Configure in school settings
    senderId: "SCOTECH", // Configure in school settings
    maxLength: 160
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 50,
    pageSizes: [25, 50, 100, 200]
  },
  
  // File Upload
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
    allowedDocTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  
  // Academic Settings
  academic: {
    termsPerYear: 3,
    periodsPerDay: 10,
    daysPerWeek: 5,
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  
  // User Roles
  roles: {
    SUPER_ADMIN: 'super_admin',
    SCHOOL_ADMIN: 'school_admin',
    TEACHER: 'teacher',
    ACCOUNTANT: 'accountant',
    SUPPORT: 'support'
  },
  
  // Permission Levels
  permissions: {
    super_admin: ['all'],
    school_admin: ['students', 'staff', 'fees', 'academic', 'finance', 'communication', 'settings'],
    teacher: ['students', 'academic'],
    accountant: ['fees', 'finance'],
    support: ['students']
  }
};

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Get current user profile with school info
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        schools(*)
      `)
      .eq('id', user.id)
      .single();
    
    if (profileError) throw profileError;
    return profile;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(userRole, requiredPermission) {
  const userPermissions = APP_CONFIG.permissions[userRole] || [];
  return userPermissions.includes('all') || userPermissions.includes(requiredPermission);
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return `${APP_CONFIG.currencySymbol} ${Number(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format date
 */
export function formatDate(date, format = APP_CONFIG.dateFormat) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year);
}

/**
 * Format phone number for SMS (Kenyan format)
 */
export function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    // Already in international format
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Local format: 0722123456 -> +254722123456
    return '+254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    // Missing leading zero: 722123456 -> +254722123456
    return '+254' + cleaned;
  }
  
  return '+' + cleaned;
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone) {
  const formatted = formatPhoneNumber(phone);
  if (!formatted) return false;
  
  // Kenyan phone numbers are 12 digits including country code (+254...)
  return /^\+254[71]\d{8}$/.test(formatted);
}

/**
 * Generate admission/staff number
 */
export async function generateNumber(schoolId, type = 'learner') {
  try {
    const table = type === 'learner' ? 'learners' : 'staff';
    const column = type === 'learner' ? 'admission_no' : 'staff_no';
    
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .eq('school_id', schoolId)
      .order(column, { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    let nextNumber = 1;
    
    if (data && data.length > 0) {
      const lastNumber = data[0][column];
      const numPart = parseInt(lastNumber.replace(/\D/g, ''));
      if (!isNaN(numPart)) {
        nextNumber = numPart + 1;
      }
    }
    
    // Format with prefix and padding
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = type === 'learner' ? 'STD' : 'STF';
    return `${prefix}${year}${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating number:', error);
    return null;
  }
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    console.warn('Toast container not found');
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${getToastIcon(type)}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

/**
 * Show loading state
 */
export function setButtonLoading(button, loading, text = null) {
  if (!button) return;
  
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `
      <span class="spinner"></span>
      <span>${text || 'Processing...'}</span>
    `;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || text || 'Submit';
  }
}

/**
 * Confirm dialog
 */
export function confirmAction(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    resolve(confirmed);
  });
}

/**
 * Export to Excel
 */
export function exportToExcel(data, filename, sheetName = 'Sheet1') {
  if (typeof XLSX === 'undefined') {
    console.error('XLSX library not loaded');
    showToast('Export feature requires XLSX library', 'error');
    return;
  }
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get academic year from date
 */
export function getAcademicYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed
  
  // Academic year typically starts in January in Kenya
  // If before July, it's first half of academic year
  // After July, prepare for next year
  return month < 7 ? year : year;
}

/**
 * Storage helpers
 */
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage error:', e);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  }
};

export default {
  supabase,
  APP_CONFIG,
  getCurrentUser,
  hasPermission,
  formatCurrency,
  formatDate,
  formatPhoneNumber,
  isValidPhoneNumber,
  generateNumber,
  showToast,
  setButtonLoading,
  confirmAction,
  exportToExcel,
  debounce,
  getAcademicYear,
  storage
};
