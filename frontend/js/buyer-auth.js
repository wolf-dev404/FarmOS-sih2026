/**
 * FarmOS - Buyer Authentication Logic
 * Team: NEXUS | SIH 2026 (Problem Statement 26132)
 */

import { getSupabase } from './supabaseClient.js';
import { evaluatePasswordStrength } from './farmer-auth.js';

function initClient() {
  try {
    return getSupabase();
  } catch (e) {
    if (window.supabaseClient) return window.supabaseClient;
    console.error('Supabase client error:', e);
    return null;
  }
}

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

// Initialize Buyer Registration Form
export function initBuyerRegister() {
  const form = document.getElementById('buyerRegisterForm');
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

    const companyName = document.getElementById('company_name')?.value.trim();
    const contactName = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const password = passwordInput?.value;
    const officeLocation = document.getElementById('office_location')?.value.trim();
    const buyerType = document.getElementById('buyer_type')?.value;

    // Validation
    if (!companyName || !contactName || !email || !phone || !password || !officeLocation || !buyerType) {
      showAlert(alertEl, 'Please fill in all required fields marked with an asterisk (*).', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(alertEl, 'Please enter a valid business email address.', 'error');
      return;
    }

    if (phone.replace(/[^0-9]/g, '').length < 10) {
      showAlert(alertEl, 'Please enter a valid 10-digit business phone number.', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert(alertEl, 'Password must be at least 6 characters long.', 'error');
      return;
    }

    const validTypes = ['individual', 'trader', 'FPO', 'processor'];
    if (!validTypes.includes(buyerType)) {
      showAlert(alertEl, 'Please select a valid buyer category.', 'error');
      return;
    }

    const client = initClient();
    if (!client) {
      showAlert(alertEl, 'Database connection is initializing. Please try again.', 'error');
      return;
    }

    submitBtn.disabled = true;
    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitText) submitText.textContent = 'Creating Buyer Account...';

    try {
      // 1. Supabase Auth Sign Up
      const { data, error: authError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'buyer',
            name: contactName,
            phone,
            company_name: companyName,
            buyer_type: buyerType,
            office_location: officeLocation
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

      // 2. Insert into 'buyers' table
      const { error: dbError } = await client
        .from('buyers')
        .upsert({
          id: user.id,
          name: contactName,
          phone,
          company_name: companyName,
          buyer_type: buyerType
        });

      if (dbError) {
        console.warn('Buyer profile table insert warning (trigger will handle if authenticated):', dbError);
      }

      // Cache buyer session details
      localStorage.setItem('farmos_user', JSON.stringify({
        id: user.id,
        name: contactName,
        company_name: companyName,
        email,
        phone,
        buyer_type: buyerType,
        role: 'buyer'
      }));

      showAlert(alertEl, 'Buyer account created successfully! Redirecting to buyer portal...', 'success');

      setTimeout(() => {
        window.location.href = 'buyer-dashboard.html';
      }, 1200);

    } catch (err) {
      console.error('Buyer registration error:', err);
      showAlert(alertEl, 'An unexpected error occurred during registration. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (submitSpinner) submitSpinner.style.display = 'none';
      if (submitText) submitText.textContent = 'Create Buyer Account';
    }
  });
}

// Initialize Buyer Login Form
export function initBuyerLogin() {
  const form = document.getElementById('buyerLoginForm');
  const alertEl = document.getElementById('authAlert');
  const submitBtn = document.getElementById('submitBtn');
  const submitSpinner = document.getElementById('submitSpinner');
  const submitText = document.getElementById('submitText');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert(alertEl);

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
      showAlert(alertEl, 'Please enter both your business email and password.', 'error');
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
        email,
        password
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          showAlert(alertEl, 'Invalid business email or password. Please try again.', 'error');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          showAlert(alertEl, 'Your email has not been verified yet. Please check your inbox.', 'error');
        } else {
          showAlert(alertEl, error.message || 'Login failed. Please try again.', 'error');
        }
        return;
      }

      const user = data.user;
      let contactName = user.user_metadata?.name || 'Procurement Partner';
      let companyName = user.user_metadata?.company_name || '';

      // Fetch buyer profile from public.buyers
      try {
        const { data: profile } = await client
          .from('buyers')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          contactName = profile.name || contactName;
          companyName = profile.company_name || companyName;
          localStorage.setItem('farmos_user', JSON.stringify({ ...profile, email: user.email, role: 'buyer' }));
        } else {
          localStorage.setItem('farmos_user', JSON.stringify({ id: user.id, name: contactName, company_name: companyName, email: user.email, role: 'buyer' }));
        }
      } catch (err) {
        localStorage.setItem('farmos_user', JSON.stringify({ id: user.id, name: contactName, company_name: companyName, email: user.email, role: 'buyer' }));
      }

      showAlert(alertEl, `Welcome back, ${contactName}! Redirecting...`, 'success');

      setTimeout(() => {
        window.location.href = 'buyer-dashboard.html';
      }, 1000);

    } catch (err) {
      console.error('Buyer login error:', err);
      showAlert(alertEl, 'An unexpected network error occurred. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (submitSpinner) submitSpinner.style.display = 'none';
      if (submitText) submitText.textContent = 'Login to Buyer Portal';
    }
  });
}
