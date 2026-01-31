/**
 * Report Generation JavaScript Module
 * Functions for generating various reports
 */

import { supabase, getCurrentUser } from './config.js';

/**
 * Generate student report
 * @param {Object} filters - Report filters
 * @returns {Promise<Array>} Student data
 */
export async function generateStudentReport(filters = {}) {
  try {
    const currentUser = await getCurrentUser();
    
    let query = supabase
      .from('learners')
      .select('*, classes(name, level)')
      .eq('school_id', currentUser.school_id);
    
    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }
    
    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }
    
    if (filters.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    
    query = query.order('first_name');
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate financial report
 * @param {string} reportType - Type of report (income/expenses)
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Object>} Financial data
 */
export async function generateFinancialReport(reportType, startDate, endDate) {
  try {
    const currentUser = await getCurrentUser();
    
    if (reportType === 'income') {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('school_id', currentUser.school_id)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);
      
      if (error) throw error;
      
      const total = data.reduce((sum, p) => sum + Number(p.amount), 0);
      
      return {
        success: true,
        data: {
          payments: data,
          total,
          count: data.length
        }
      };
    } else if (reportType === 'expenses') {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_categories(name)')
        .eq('school_id', currentUser.school_id)
        .eq('status', 'approved')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);
      
      if (error) throw error;
      
      const total = data.reduce((sum, e) => sum + Number(e.amount), 0);
      
      return {
        success: true,
        data: {
          expenses: data,
          total,
          count: data.length
        }
      };
    }
    
    return { success: false, error: 'Invalid report type' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
