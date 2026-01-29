// ================================================
// AUTHENTICATION MODULE
// ================================================
import { supabase, showToast, setButtonLoading } from './config.js';

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');

// Handle login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    setButtonLoading(loginBtn, true, 'Signing in...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*, schools(*)')
        .eq('id', data.user.id)
        .single();
      
      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error('User profile not found. Please contact your administrator.');
      }
      
      if (!profile.active) {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Please contact your administrator.');
      }
      
      showToast('Login successful! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
      
    } catch (error) {
      showToast(error.message, 'error');
      setButtonLoading(loginBtn, false, 'Sign In');
    }
  });
}

// Check if already logged in
async function checkExistingSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    window.location.href = '/dashboard.html';
  }
}

// Run on login page
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
  checkExistingSession();
}
