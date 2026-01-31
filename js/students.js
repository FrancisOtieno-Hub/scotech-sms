/**
 * Student Management JavaScript Module
 * Contains reusable functions for student operations
 */

import { supabase, getCurrentUser, showToast, formatDate, generateNumber } from './config.js';

/**
 * Register a new student
 * @param {Object} studentData - Student information
 * @returns {Promise<Object>} Created student record
 */
export async function registerStudent(studentData) {
  try {
    const currentUser = await getCurrentUser();
    
    // Generate admission number if not provided
    if (!studentData.admission_no) {
      studentData.admission_no = await generateNumber(currentUser.school_id, 'learner');
    }
    
    // Ensure school_id is set
    studentData.school_id = currentUser.school_id;
    
    const { data, error } = await supabase
      .from('learners')
      .insert([studentData])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get student by ID
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Student record with class info
 */
export async function getStudent(studentId) {
  try {
    const { data, error } = await supabase
      .from('learners')
      .select(`
        *,
        classes (
          id,
          name,
          level
        )
      `)
      .eq('id', studentId)
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update student information
 * @param {string} studentId - Student UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated student record
 */
export async function updateStudent(studentId, updates) {
  try {
    const { data, error } = await supabase
      .from('learners')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Search students by name or admission number
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters (class_id, gender, active)
 * @returns {Promise<Array>} Matching students
 */
export async function searchStudents(query, filters = {}) {
  try {
    const currentUser = await getCurrentUser();
    
    let queryBuilder = supabase
      .from('learners')
      .select('*, classes(name)')
      .eq('school_id', currentUser.school_id);
    
    // Apply search
    if (query) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_no.ilike.%${query}%`
      );
    }
    
    // Apply filters
    if (filters.class_id) {
      queryBuilder = queryBuilder.eq('class_id', filters.class_id);
    }
    
    if (filters.gender) {
      queryBuilder = queryBuilder.eq('gender', filters.gender);
    }
    
    if (filters.active !== undefined) {
      queryBuilder = queryBuilder.eq('active', filters.active);
    }
    
    const { data, error } = await queryBuilder.order('first_name');
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get students by class
 * @param {string} classId - Class UUID
 * @param {boolean} activeOnly - Return only active students
 * @returns {Promise<Array>} Students in the class
 */
export async function getStudentsByClass(classId, activeOnly = true) {
  try {
    let query = supabase
      .from('learners')
      .select('*')
      .eq('class_id', classId)
      .order('first_name');
    
    if (activeOnly) {
      query = query.eq('active', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Promote students to next class
 * @param {string} currentClassId - Current class UUID
 * @param {string} nextClassId - Next class UUID (null for graduation)
 * @returns {Promise<Object>} Result with count
 */
export async function promoteStudents(currentClassId, nextClassId = null) {
  try {
    const currentUser = await getCurrentUser();
    
    // Get students in current class
    const { data: students } = await supabase
      .from('learners')
      .select('id')
      .eq('class_id', currentClassId)
      .eq('active', true);
    
    if (!students || students.length === 0) {
      return { success: false, error: 'No students found in this class' };
    }
    
    let updateData = {};
    
    if (nextClassId) {
      // Promote to next class
      updateData = { class_id: nextClassId };
    } else {
      // Graduate (no next class)
      updateData = {
        active: false,
        graduated: true,
        graduation_date: new Date().toISOString().split('T')[0]
      };
    }
    
    const { error } = await supabase
      .from('learners')
      .update(updateData)
      .eq('class_id', currentClassId)
      .eq('active', true);
    
    if (error) throw error;
    
    return {
      success: true,
      count: students.length,
      message: nextClassId ? 'Students promoted successfully' : 'Students graduated successfully'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get student fee summary
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Fee information
 */
export async function getStudentFeeSummary(studentId) {
  try {
    const currentUser = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('v_learner_fee_summary')
      .select('*')
      .eq('school_id', currentUser.school_id)
      .eq('learner_id', studentId)
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate student age from date of birth
 * @param {string} dateOfBirth - Date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validate student data
 * @param {Object} studentData - Student information
 * @returns {Object} Validation result
 */
export function validateStudentData(studentData) {
  const errors = [];
  
  if (!studentData.first_name || studentData.first_name.trim() === '') {
    errors.push('First name is required');
  }
  
  if (!studentData.last_name || studentData.last_name.trim() === '') {
    errors.push('Last name is required');
  }
  
  if (!studentData.gender || !['Male', 'Female'].includes(studentData.gender)) {
    errors.push('Valid gender is required (Male or Female)');
  }
  
  if (studentData.date_of_birth) {
    const age = calculateAge(studentData.date_of_birth);
    if (age < 2 || age > 25) {
      errors.push('Age must be between 2 and 25 years');
    }
  }
  
  if (studentData.parent_phone && !isValidPhoneNumber(studentData.parent_phone)) {
    errors.push('Invalid parent phone number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Bulk import students from array
 * @param {Array} studentsArray - Array of student objects
 * @param {string} classId - Class to assign all students
 * @returns {Promise<Object>} Import results
 */
export async function bulkImportStudents(studentsArray, classId) {
  try {
    const currentUser = await getCurrentUser();
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < studentsArray.length; i++) {
      const student = studentsArray[i];
      
      // Validate
      const validation = validateStudentData(student);
      if (!validation.valid) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          errors: validation.errors
        });
        continue;
      }
      
      // Prepare data
      const studentData = {
        ...student,
        school_id: currentUser.school_id,
        class_id: classId,
        admission_no: await generateNumber(currentUser.school_id, 'learner'),
        active: true
      };
      
      // Insert
      const { error } = await supabase
        .from('learners')
        .insert([studentData]);
      
      if (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          errors: [error.message]
        });
      } else {
        results.successful++;
      }
    }
    
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper function for phone validation (imported from config.js usually)
function isValidPhoneNumber(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 13;
}
