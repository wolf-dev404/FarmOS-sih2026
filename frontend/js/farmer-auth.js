/**
 * FarmOS - Farmer Authentication Logic
 * Team: NEXUS | SIH 2026 (Problem Statement 26132)
 */

import { getSupabase } from './supabaseClient.js';

// Helper to get or wait for Supabase client
function initClient() {
  try {
    return getSupabase();
  } catch (e) {
    if (window.supabaseClient) return window.supabaseClient;
    console.error('Supabase client error:', e);
    return null;
  }
}

// Password strength evaluator
export function evaluatePasswordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, label: 'None', color: '#E5E7EB' };
  
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#DC2626' };
  if (score <= 2) return { score: 2, label: 'Fair', color: '#F59E0B' };
  if (score <= 3) return { score: 3, label: 'Good', color: '#10B981' };
  return { score: 4, label: 'Strong', color: '#059669' };
}

// Helper: Parse single location field "Village, District, State"
export function parseLocationField(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') {
    return { village: '', district: '', state: 'Maharashtra' };
  }
  const parts = locationStr.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return { village: parts[0], district: parts[1], state: parts.slice(2).join(', ') };
  } else if (parts.length === 2) {
    return { village: parts[0], district: parts[1], state: 'Maharashtra' };
  } else if (parts.length === 1) {
    return { village: parts[0], district: parts[0], state: 'Maharashtra' };
  }
  return { village: '', district: '', state: 'Maharashtra' };
}

// UI Alert Helper
function showAlert(alertEl, message, type = 'error') {
  if (!alertEl) return;
  alertEl.className = `auth-alert ${type}`;
  alertEl.innerHTML = `
    <span style="font-weight: 700;">${type === 'error' ? '⚠ ' : '✓ '}</span>
    <span>${message}</span>
  `;
  alertEl.style.display = 'flex';
  alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAlert(alertEl) {
  if (!alertEl) return;
  alertEl.style.display = 'none';
  alertEl.innerHTML = '';
}

// Initialize Farmer Registration Form
export function initFarmerRegister() {
  const form = document.getElementById('farmerRegisterForm');
  const alertEl = document.getElementById('authAlert');
  const passwordInput = document.getElementById('password');
  const strengthBars = document.querySelectorAll('.strength-bar');
  const strengthText = document.getElementById('strengthText');
  const submitBtn = document.getElementById('submitBtn');
  const submitSpinner = document.getElementById('submitSpinner');
  const submitText = document.getElementById('submitText');

  if (!form) return;

  // Live Password Strength Indicator
  if (passwordInput && strengthBars.length > 0) {
    passwordInput.addEventListener('input', () => {
      const { score, label, color } = evaluatePasswordStrength(passwordInput.value);
      strengthBars.forEach((bar, idx) => {
        bar.style.backgroundColor = idx < score ? color : '#E5E7EB';
      });
      if (strengthText) {
        strengthText.textContent = label === 'None' ? '' : `Strength: ${label}`;
        strengthText.style.color = color;
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert(alertEl);

    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const password = passwordInput?.value;
    const locationInput = document.getElementById('location')?.value.trim();
    const fpoName = document.getElementById('fpo_name')?.value.trim();

    // Client-side Validations
    if (!name || !email || !phone || !password || !locationInput) {
      showAlert(alertEl, 'Please fill in all required fields marked with an asterisk (*).', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(alertEl, 'Please enter a valid email address.', 'error');
      return;
    }

    if (phone.replace(/[^0-9]/g, '').length < 10) {
      showAlert(alertEl, 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert(alertEl, 'Password must be at least 6 characters long.', 'error');
      return;
    }

    const { village, district, state } = parseLocationField(locationInput);

    const client = initClient();
    if (!client) {
      showAlert(alertEl, 'Database connection is initializing. Please try again in a moment.', 'error');
      return;
    }

    // Set Loading State
    submitBtn.disabled = true;
    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitText) submitText.textContent = 'Creating Farmer Account...';

    try {
      // 1. Supabase Auth Sign Up
      const { data, error: authError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'farmer',
            name,
            phone,
            village,
            district,
            state,
            fpo_name: fpoName || null
          }
        }
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered') || authError.status === 422) {
          showAlert(alertEl, 'An account with this email already exists. Please log in instead.', 'error');
        } else if (authError.message.toLowerCase().includes('weak password')) {
          showAlert(alertEl, 'Password is too weak. Please include letters, numbers, and symbols.', 'error');
        } else {
          showAlert(alertEl, authError.message || 'Registration failed. Please check your details.', 'error');
        }
        return;
      }

      const user = data?.user;
      if (!user) {
        showAlert(alertEl, 'Registration could not be completed. Please try again.', 'error');
        return;
      }

      // 2. Insert into 'farmers' table
      const { error: dbError } = await client
        .from('farmers')
        .upsert({
          id: user.id,
          name,
          phone,
          village,
          district,
          state
        });

      if (dbError) {
        console.warn('Profile table insert warning (trigger will handle if authenticated):', dbError);
      }

      // Cache user details locally for snappy display
      localStorage.setItem('farmos_user', JSON.stringify({
        id: user.id,
        name,
        email,
        phone,
        village,
        district,
        state,
        role: 'farmer'
      }));

      showAlert(alertEl, 'Account created successfully! Redirecting to your dashboard...', 'success');
      
      setTimeout(() => {
        window.location.href = 'farmer-dashboard.html';
      }, 1200);

    } catch (err) {
      console.error('Registration exception:', err);
      showAlert(alertEl, 'An unexpected error occurred during registration. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (submitSpinner) submitSpinner.style.display = 'none';
      if (submitText) submitText.textContent = 'Create Farmer Account';
    }
  });
}

// Initialize Farmer Login Form
export function initFarmerLogin() {
  const form = document.getElementById('farmerLoginForm');
  const alertEl = document.getElementById('authAlert');
  const submitBtn = document.getElementById('submitBtn');
  const submitSpinner = document.getElementById('submitSpinner');
  const submitText = document.getElementById('submitText');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert(alertEl);

    const emailOrPhone = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!emailOrPhone || !password) {
      showAlert(alertEl, 'Please enter both your email and password.', 'error');
      return;
    }

    const client = initClient();
    if (!client) {
      showAlert(alertEl, 'Database connection is initializing. Please try again.', 'error');
      return;
    }

    submitBtn.disabled = true;
    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitText) submitText.textContent = 'Logging in...';

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: emailOrPhone,
        password: password
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          showAlert(alertEl, 'Invalid email or password. Please verify your credentials and try again.', 'error');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          showAlert(alertEl, 'Your email has not been verified yet. Please check your inbox for confirmation link.', 'error');
        } else {
          showAlert(alertEl, error.message || 'Login failed. Please try again.', 'error');
        }
        return;
      }

      const user = data.user;
      let farmerName = user.user_metadata?.name || 'Farmer';

      // Fetch farmer record from public.farmers
      try {
        const { data: profile } = await client
          .from('farmers')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile && profile.name) {
          farmerName = profile.name;
          localStorage.setItem('farmos_user', JSON.stringify({ ...profile, email: user.email, role: 'farmer' }));
        } else {
          localStorage.setItem('farmos_user', JSON.stringify({ id: user.id, name: farmerName, email: user.email, role: 'farmer' }));
        }
      } catch (err) {
        localStorage.setItem('farmos_user', JSON.stringify({ id: user.id, name: farmerName, email: user.email, role: 'farmer' }));
      }

      showAlert(alertEl, `Welcome back, ${farmerName}! Redirecting...`, 'success');

      setTimeout(() => {
        window.location.href = 'farmer-dashboard.html';
      }, 1000);

    } catch (err) {
      console.error('Login exception:', err);
      showAlert(alertEl, 'An unexpected network error occurred. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (submitSpinner) submitSpinner.style.display = 'none';
      if (submitText) submitText.textContent = 'Login to FarmOS';
    }
  });
}
