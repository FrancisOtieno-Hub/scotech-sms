/**
 * Staff Management JavaScript Module
 * Functions for staff operations and duty management
 */

import { supabase, getCurrentUser, generateNumber } from './config.js';

/**
 * Register a new staff member
 * @param {Object} staffData - Staff information
 * @returns {Promise<Object>} Created staff record
 */
export async function registerStaff(staffData) {
  try {
    const currentUser = await getCurrentUser();
    
    // Generate staff number
    if (!staffData.staff_no) {
      staffData.staff_no = await generateNumber(currentUser.school_id, 'staff');
    }
    
    staffData.school_id = currentUser.school_id;
    
    const { data, error } = await supabase
      .from('staff')
      .insert([staffData])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all staff members
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Staff members
 */
export async function getStaff(filters = {}) {
  try {
    const currentUser = await getCurrentUser();
    
    let query = supabase
      .from('staff')
      .select('*, departments(name)')
      .eq('school_id', currentUser.school_id);
    
    if (filters.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    
    if (filters.position) {
      query = query.eq('position', filters.position);
    }
    
    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
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
 * Update staff information
 * @param {string} staffId - Staff UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated staff record
 */
export async function updateStaff(staffId, updates) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get staff statistics
 * @returns {Promise<Object>} Staff statistics
 */
export async function getStaffStats() {
  try {
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('staff')
      .select('position, active, employment_type')
      .eq('school_id', currentUser.school_id);
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      active: data.filter(s => s.active).length,
      inactive: data.filter(s => !s.active).length,
      teachers: data.filter(s => s.active && s.position === 'Teacher').length,
      permanent: data.filter(s => s.active && s.employment_type === 'permanent').length,
      contract: data.filter(s => s.active && s.employment_type === 'contract').length
    };
    
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
