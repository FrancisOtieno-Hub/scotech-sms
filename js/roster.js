/**
 * Duty Roster Generator JavaScript Module
 * Functions for generating fair duty rosters
 */

import { supabase, getCurrentUser } from './config.js';

/**
 * Generate duty roster with fair distribution
 * @param {Object} params - Roster parameters
 * @returns {Promise<Object>} Generated roster
 */
export async function generateDutyRoster(params) {
  const { startDate, endDate, dutyTypes } = params;
  
  try {
    const currentUser = await getCurrentUser();
    
    // Get active staff
    const { data: staff } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('school_id', currentUser.school_id)
      .eq('active', true);
    
    if (!staff || staff.length === 0) {
      return { success: false, error: 'No active staff available' };
    }
    
    // Get recent duty history (last 30 days for fairness)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentDuties } = await supabase
      .from('duty_roster')
      .select('staff_id, duty_type')
      .eq('school_id', currentUser.school_id)
      .gte('duty_date', thirtyDaysAgo.toISOString().split('T')[0]);
    
    // Count duties per staff per type
    const dutyCounts = {};
    staff.forEach(s => {
      dutyCounts[s.id] = {};
      dutyTypes.forEach(type => {
        dutyCounts[s.id][type] = 0;
      });
    });
    
    recentDuties?.forEach(d => {
      if (dutyCounts[d.staff_id] && dutyCounts[d.staff_id][d.duty_type] !== undefined) {
        dutyCounts[d.staff_id][d.duty_type]++;
      }
    });
    
    // Generate roster for date range (exclude weekends)
    const days = getWeekdays(startDate, endDate);
    const roster = [];
    
    days.forEach(date => {
      dutyTypes.forEach(dutyType => {
        // Sort staff by least duties of this type
        const sortedStaff = [...staff].sort((a, b) => 
          dutyCounts[a.id][dutyType] - dutyCounts[b.id][dutyType]
        );
        
        // Assign to staff with lowest count
        const assignedStaff = sortedStaff[0];
        const times = getDutyTimes(dutyType);
        
        roster.push({
          school_id: currentUser.school_id,
          staff_id: assignedStaff.id,
          duty_type: dutyType,
          duty_date: date,
          start_time: times.start,
          end_time: times.end,
          location: getDutyLocation(dutyType)
        });
        
        // Increment count for next iteration
        dutyCounts[assignedStaff.id][dutyType]++;
      });
    });
    
    // Insert roster
    const { data, error } = await supabase
      .from('duty_roster')
      .insert(roster)
      .select();
    
    if (error) throw error;
    
    return {
      success: true,
      count: data.length,
      message: `Generated ${data.length} duty assignments`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get weekdays between two dates (excluding weekends)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Array of date strings
 */
function getWeekdays(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const day = current.getDay();
    // Skip Sunday (0) and Saturday (6)
    if (day !== 0 && day !== 6) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Get duty times for a duty type
 * @param {string} dutyType - Type of duty
 * @returns {Object} Start and end times
 */
function getDutyTimes(dutyType) {
  const times = {
    morning_duty: { start: '07:00', end: '08:00' },
    lunch_duty: { start: '12:00', end: '13:00' },
    games_duty: { start: '15:00', end: '16:00' },
    closing_duty: { start: '16:00', end: '17:00' }
  };
  
  return times[dutyType] || { start: '07:00', end: '08:00' };
}

/**
 * Get duty location
 * @param {string} dutyType - Type of duty
 * @returns {string} Location
 */
function getDutyLocation(dutyType) {
  const locations = {
    morning_duty: 'Main Gate',
    lunch_duty: 'Dining Hall',
    games_duty: 'Sports Field',
    closing_duty: 'Main Gate'
  };
  
  return locations[dutyType] || 'School Compound';
}

/**
 * Get roster for date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Array>} Roster entries
 */
export async function getRoster(startDate, endDate) {
  try {
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('duty_roster')
      .select(`
        *,
        staff (first_name, last_name, position)
      `)
      .eq('school_id', currentUser.school_id)
      .gte('duty_date', startDate)
      .lte('duty_date', endDate)
      .order('duty_date')
      .order('start_time');
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
