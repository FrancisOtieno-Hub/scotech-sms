/**
 * Expense Management JavaScript Module
 * Functions for expense tracking and approval
 */

import { supabase, getCurrentUser, generateNumber } from './config.js';

/**
 * Record an expense
 * @param {Object} expenseData - Expense information
 * @returns {Promise<Object>} Created expense record
 */
export async function recordExpense(expenseData) {
  try {
    const currentUser = await getCurrentUser();
    
    const expense = {
      ...expenseData,
      school_id: currentUser.school_id,
      recorded_by: currentUser.id,
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Approve or reject an expense
 * @param {string} expenseId - Expense UUID
 * @param {boolean} approve - True to approve, false to reject
 * @returns {Promise<Object>} Result
 */
export async function approveExpense(expenseId, approve) {
  try {
    const currentUser = await getCurrentUser();
    
    const { error } = await supabase
      .from('expenses')
      .update({
        status: approve ? 'approved' : 'rejected',
        approved_by: currentUser.id
      })
      .eq('id', expenseId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get expense summary for a period
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Object>} Expense summary
 */
export async function getExpenseSummary(startDate, endDate) {
  try {
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, category_id, status, expense_categories(name)')
      .eq('school_id', currentUser.school_id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);
    
    if (error) throw error;
    
    const summary = {
      total: data.reduce((sum, e) => sum + Number(e.amount), 0),
      approved: data.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0),
      pending: data.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0),
      count: data.length,
      byCategory: {}
    };
    
    // Group by category
    data.forEach(expense => {
      if (expense.status === 'approved') {
        const catName = expense.expense_categories?.name || 'Uncategorized';
        summary.byCategory[catName] = (summary.byCategory[catName] || 0) + Number(expense.amount);
      }
    });
    
    return { success: true, data: summary };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
