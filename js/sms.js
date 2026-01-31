/**
 * SMS Functionality JavaScript Module
 * Functions for sending SMS and managing templates
 */

import { supabase, getCurrentUser, isValidPhoneNumber } from './config.js';

/**
 * Send bulk SMS
 * @param {Object} params - SMS parameters
 * @returns {Promise<Object>} Result
 */
export async function sendBulkSMS(params) {
  const { recipients, message, messageType } = params;
  
  try {
    const currentUser = await getCurrentUser();
    
    // Validate phone numbers
    const validNumbers = recipients.filter(isValidPhoneNumber);
    
    if (validNumbers.length === 0) {
      return { success: false, error: 'No valid phone numbers' };
    }
    
    // Log SMS
    const { data: logData, error: logError } = await supabase
      .from('sms_logs')
      .insert({
        school_id: currentUser.school_id,
        message_type: messageType,
        message_content: message,
        total_recipients: validNumbers.length,
        status: 'pending'
      })
      .select()
      .single();
    
    if (logError) throw logError;
    
    // Here integrate with actual SMS API (Africa's Talking or Twilio)
    // For demonstration, we'll mark as completed
    
    // Update log
    await supabase
      .from('sms_logs')
      .update({
        successful_sends: validNumbers.length,
        failed_sends: 0,
        status: 'completed'
      })
      .eq('id', logData.id);
    
    return {
      success: true,
      sent: validNumbers.length,
      logId: logData.id
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get SMS templates
 * @param {string} category - Template category (optional)
 * @returns {Promise<Array>} Templates
 */
export async function getSMSTemplates(category = null) {
  try {
    const currentUser = await getCurrentUser();
    
    let query = supabase
      .from('sms_templates')
      .select('*')
      .eq('school_id', currentUser.school_id);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    query = query.order('name');
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Process template variables
 * @param {string} template - Template string with variables
 * @param {Object} variables - Variable values
 * @returns {string} Processed message
 */
export function processTemplate(template, variables) {
  let message = template;
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key.toUpperCase()}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  
  return message;
}
