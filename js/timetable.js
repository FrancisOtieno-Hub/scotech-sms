/**
 * Timetable Creator JavaScript Module
 * Functions for creating and managing school timetables
 */

import { supabase, getCurrentUser } from './config.js';

/**
 * Check for timetable conflicts
 * @param {Object} params - Allocation parameters
 * @returns {Promise<Object>} Conflict check result
 */
export async function checkConflict(params) {
  const { termId, classId, teacherId, dayOfWeek, periodNumber } = params;
  
  try {
    // Check if class already has a subject at this time
    const { data: classConflict } = await supabase
      .from('timetable')
      .select('*')
      .eq('term_id', termId)
      .eq('class_id', classId)
      .eq('day_of_week', dayOfWeek)
      .eq('period_number', periodNumber)
      .single();
    
    if (classConflict) {
      return {
        hasConflict: true,
        message: 'This class already has a subject at this time'
      };
    }
    
    // Check if teacher is already assigned at this time
    const { data: teacherConflict } = await supabase
      .from('timetable')
      .select('*')
      .eq('term_id', termId)
      .eq('teacher_id', teacherId)
      .eq('day_of_week', dayOfWeek)
      .eq('period_number', periodNumber)
      .single();
    
    if (teacherConflict) {
      return {
        hasConflict: true,
        message: 'This teacher is already assigned at this time'
      };
    }
    
    return { hasConflict: false };
  } catch (error) {
    // No conflict found (Supabase returns error on .single() with no results)
    return { hasConflict: false };
  }
}

/**
 * Allocate subject to timetable
 * @param {Object} allocationData - Allocation details
 * @returns {Promise<Object>} Result
 */
export async function allocateSubject(allocationData) {
  try {
    const currentUser = await getCurrentUser();
    
    // Check for conflicts
    const conflictCheck = await checkConflict(allocationData);
    if (conflictCheck.hasConflict) {
      return { success: false, error: conflictCheck.message };
    }
    
    // Get period times
    const times = getPeriodTimes(allocationData.periodNumber);
    
    const allocation = {
      ...allocationData,
      school_id: currentUser.school_id,
      start_time: times.start,
      end_time: times.end
    };
    
    const { data, error } = await supabase
      .from('timetable')
      .insert([allocation])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get timetable for a class
 * @param {string} classId - Class UUID
 * @returns {Promise<Array>} Timetable entries
 */
export async function getClassTimetable(classId) {
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
    
    const { data, error } = await supabase
      .from('timetable')
      .select(`
        *,
        subjects (name, code),
        staff (first_name, last_name)
      `)
      .eq('class_id', classId)
      .eq('term_id', activeTerm.id)
      .order('day_of_week')
      .order('period_number');
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove allocation from timetable
 * @param {string} allocationId - Timetable entry UUID
 * @returns {Promise<Object>} Result
 */
export async function removeAllocation(allocationId) {
  try {
    const { error } = await supabase
      .from('timetable')
      .delete()
      .eq('id', allocationId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get period times
 * @param {number} periodNumber - Period number (1-8)
 * @returns {Object} Start and end times
 */
export function getPeriodTimes(periodNumber) {
  const periods = {
    1: { start: '08:00', end: '08:40' },
    2: { start: '08:40', end: '09:20' },
    3: { start: '09:20', end: '10:00' },
    4: { start: '10:20', end: '11:00' }, // Break at 10:00
    5: { start: '11:00', end: '11:40' },
    6: { start: '11:40', end: '12:20' },
    7: { start: '13:00', end: '13:40' }, // Lunch at 12:20
    8: { start: '13:40', end: '14:20' }
  };
  
  return periods[periodNumber] || { start: '08:00', end: '08:40' };
}

/**
 * Get day name from number
 * @param {number} dayNumber - Day number (1=Monday, 5=Friday)
 * @returns {string} Day name
 */
export function getDayName(dayNumber) {
  const days = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday'
  };
  
  return days[dayNumber] || '';
}
