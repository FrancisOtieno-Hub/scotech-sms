/**
 * Fee Management JavaScript Module
 * Functions for fee calculations, payments, and receipts
 */

import { supabase, getCurrentUser, formatCurrency, generateNumber } from './config.js';

/**
 * Get student's fee for current term
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Fee information
 */
export async function getStudentFee(studentId) {
  try {
    const currentUser = await getCurrentUser();
    
    // Get active term
    const { data: activeTerm } = await supabase
      .from('terms')
      .select('id')
      .eq('school_id', currentUser.school_id)
      .eq('active', true)
      .single();
    
    if (!activeTerm) {
      return { success: false, error: 'No active term found' };
    }
    
    // Check for custom fee first
    const { data: customFee } = await supabase
      .from('custom_fees')
      .select('*')
      .eq('learner_id', studentId)
      .eq('term_id', activeTerm.id)
      .single();
    
    if (customFee) {
      return {
        success: true,
        data: {
          amount: customFee.custom_amount,
          type: 'custom',
          reason: customFee.reason
        }
      };
    }
    
    // Get standard class fee
    const { data: student } = await supabase
      .from('learners')
      .select('class_id')
      .eq('id', studentId)
      .single();
    
    const { data: standardFee } = await supabase
      .from('fees')
      .select('amount')
      .eq('class_id', student.class_id)
      .eq('term_id', activeTerm.id)
      .single();
    
    return {
      success: true,
      data: {
        amount: standardFee?.amount || 0,
        type: 'standard'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate fee balance for a student
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Balance details
 */
export async function calculateFeeBalance(studentId) {
  try {
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('v_learner_fee_summary')
      .select('*')
      .eq('school_id', currentUser.school_id)
      .eq('learner_id', studentId)
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      data: {
        totalFees: Number(data.total_fees),
        totalPaid: Number(data.total_paid),
        balance: Number(data.balance),
        status: Number(data.balance) <= 0 ? 'Fully Paid' : Number(data.total_paid) > 0 ? 'Partially Paid' : 'Not Paid'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Record a payment
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} Created payment record
 */
export async function recordPayment(paymentData) {
  try {
    const currentUser = await getCurrentUser();
    
    // Generate reference number
    if (!paymentData.reference_no) {
      paymentData.reference_no = await generateNumber(currentUser.school_id, 'payment');
    }
    
    // Get active term
    const { data: activeTerm } = await supabase
      .from('terms')
      .select('id')
      .eq('school_id', currentUser.school_id)
      .eq('active', true)
      .single();
    
    // Prepare payment data
    const payment = {
      ...paymentData,
      school_id: currentUser.school_id,
      term_id: activeTerm?.id,
      received_by: currentUser.id
    };
    
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get payment history for a student
 * @param {string} studentId - Student UUID
 * @returns {Promise<Array>} Payment records
 */
export async function getPaymentHistory(studentId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        terms (year, term),
        user_profiles!received_by (full_name)
      `)
      .eq('learner_id', studentId)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get fee defaulters
 * @param {number} minBalance - Minimum balance to be considered defaulter
 * @returns {Promise<Array>} Defaulters list
 */
export async function getFeeDefaulters(minBalance = 0) {
  try {
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('v_learner_fee_summary')
      .select('*')
      .eq('school_id', currentUser.school_id)
      .gt('balance', minBalance)
      .order('balance', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get fee collection summary
 * @returns {Promise<Object>} Collection statistics
 */
export async function getFeeCollectionSummary() {
  try {
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('v_learner_fee_summary')
      .select('*')
      .eq('school_id', currentUser.school_id);
    
    if (error) throw error;
    
    const summary = {
      totalExpected: data.reduce((sum, s) => sum + Number(s.total_fees), 0),
      totalCollected: data.reduce((sum, s) => sum + Number(s.total_paid), 0),
      totalBalance: data.reduce((sum, s) => sum + Number(s.balance), 0),
      studentsCount: data.length,
      fullyPaid: data.filter(s => Number(s.balance) <= 0).length,
      partiallyPaid: data.filter(s => Number(s.balance) > 0 && Number(s.total_paid) > 0).length,
      notPaid: data.filter(s => Number(s.total_paid) === 0).length
    };
    
    summary.collectionRate = summary.totalExpected > 0 
      ? ((summary.totalCollected / summary.totalExpected) * 100).toFixed(1)
      : 0;
    
    return { success: true, data: summary };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Set custom fee for a student
 * @param {string} studentId - Student UUID
 * @param {number} amount - Custom fee amount
 * @param {string} reason - Reason for custom fee
 * @returns {Promise<Object>} Result
 */
export async function setCustomFee(studentId, amount, reason) {
  try {
    const currentUser = await getCurrentUser();
    
    // Get active term
    const { data: activeTerm } = await supabase
      .from('terms')
      .select('id')
      .eq('school_id', currentUser.school_id)
      .eq('active', true)
      .single();
    
    if (!activeTerm) {
      return { success: false, error: 'No active term found' };
    }
    
    const customFee = {
      school_id: currentUser.school_id,
      learner_id: studentId,
      term_id: activeTerm.id,
      custom_amount: amount,
      fee_type: amount === 0 ? 'Full Sponsorship' : 'Custom Amount',
      reason: reason
    };
    
    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('custom_fees')
      .upsert([customFee], {
        onConflict: 'learner_id,term_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate payment receipt
 * @param {string} paymentId - Payment UUID
 * @returns {Promise<Object>} Receipt data
 */
export async function generateReceipt(paymentId) {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        learners (first_name, last_name, admission_no),
        classes (name),
        user_profiles!received_by (full_name),
        schools (name, phone, address)
      `)
      .eq('id', paymentId)
      .single();
    
    if (error) throw error;
    
    return { success: true, data: payment };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
