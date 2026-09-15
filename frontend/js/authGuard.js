/**
 * FarmOS — Strict Role-Based Access Control (RBAC) & Auth Guard
 * Team: NEXUS | Smart India Hackathon 2026 (PS 26132)
 * 
 * Verifies the authenticated user against Supabase Auth (getUser) and
 * verifies their actual database record in public.farmers or public.buyers.
 * Redirects unauthorized users away immediately before page renders.
 */

import { getSupabase } from './supabaseClient.js';

/**
 * Enforces authentication and role verification for a page.
 * @param {Array<string>} allowedRoles - e.g. ['farmer'], ['buyer'], or ['farmer', 'buyer']
 * @returns {Promise<{ user: Object, profile: Object, role: string, supabase: Object }>}
 */
export async function requireAuth(allowedRoles = ['farmer', 'buyer']) {
  // 1. Immediately prevent Flash of Unauthorized Content (FOUC)
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.visibility = 'hidden';
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('AuthGuard: Supabase failed to initialize:', err);
    window.location.replace('../pages/role-select.html');
    return new Promise(() => {});
  }

  // 2. Cryptographic Server-Side Auth Verification (never trust purely client-side storage)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.warn('AuthGuard: No authenticated session found. Redirecting to login.');
    localStorage.removeItem('farmos_user');
    
    // Redirect to the appropriate login page based on page requirement
    if (allowedRoles.length === 1 && allowedRoles[0] === 'farmer') {
      window.location.replace('farmer-login.html');
    } else if (allowedRoles.length === 1 && allowedRoles[0] === 'buyer') {
      window.location.replace('buyer-login.html');
    } else {
      window.location.replace('role-select.html');
    }
    return new Promise(() => {}); // Halt script execution
  }

  // 3. Real Database Verification strictly against farmers & buyers tables
  let actualRole = null;
  let profile = null;

  try {
    // Check farmers table
    const { data: farmerData, error: farmerErr } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!farmerErr && farmerData) {
      actualRole = 'farmer';
      profile = farmerData;
    } else {
      // Check buyers table
      const { data: buyerData, error: buyerErr } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!buyerErr && buyerData) {
        actualRole = 'buyer';
        profile = buyerData;
      }
    }
  } catch (dbErr) {
    console.error('AuthGuard: Database role lookup failed:', dbErr);
  }

  // 4. Strict Role Authorization Gate: User must exist in the required DB table
  if (!actualRole || !allowedRoles.includes(actualRole)) {
    console.warn(`AuthGuard: Access Denied! User role '${actualRole}' is not authorized for page requiring: [${allowedRoles.join(', ')}]`);

    // Redirect to their actual authorized home portal or role-select
    if (actualRole === 'farmer') {
      window.location.replace('farmer-dashboard.html');
    } else if (actualRole === 'buyer') {
      window.location.replace('buyer-dashboard.html');
    } else {
      window.location.replace('role-select.html');
    }
    return new Promise(() => {}); // Block execution
  }

  // 5. Update local cache with verified profile & role
  const verifiedUser = {
    ...profile,
    id: user.id,
    email: user.email,
    role: actualRole
  };
  localStorage.setItem('farmos_user', JSON.stringify(verifiedUser));

  // 6. Automatically setup UI navigation and identity display
  setupAuthenticatedUI(verifiedUser, actualRole, supabase);

  // 7. Reveal page safely
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.visibility = 'visible';
  }

  return { user, profile: verifiedUser, role: actualRole, supabase };
}

/**
 * For public or shared pages (like market-prices.html or index.html)
 * Configures navigation if logged in, but does not block visitors.
 */
export async function optionalAuth() {
  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    return { user: null, role: null, supabase: null };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, role: null, supabase };
  }

  let actualRole = null;
  let profile = null;

  const { data: farmerData } = await supabase.from('farmers').select('*').eq('id', user.id).maybeSingle();
  if (farmerData) {
    actualRole = 'farmer';
    profile = farmerData;
  } else {
    const { data: buyerData } = await supabase.from('buyers').select('*').eq('id', user.id).maybeSingle();
    if (buyerData) {
      actualRole = 'buyer';
      profile = buyerData;
    }
  }

  const verifiedUser = { ...profile, id: user.id, email: user.email, role: actualRole };
  setupAuthenticatedUI(verifiedUser, actualRole, supabase);

  return { user, profile: verifiedUser, role: actualRole, supabase };
}

/**
 * Harmonizes navigation bars, back links, and role badges with real user identity
 */
function setupAuthenticatedUI(profile, role, supabase) {
  const displayName = profile?.company_name || profile?.name || (role === 'buyer' ? 'Buyer' : 'Farmer');

  // Update nav user display
  const userNav = document.getElementById('userNavDisplay') || document.getElementById('userStatusDisplay');
  if (userNav) {
    userNav.textContent = displayName;
  }

  // Update role badge displays
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = role === 'farmer' ? '👨‍🌾 Verified Farmer' : '🏢 Verified Buyer';
    roleBadge.style.background = role === 'farmer' ? 'rgba(45, 106, 79, 0.4)' : 'rgba(180, 83, 9, 0.4)';
  }

  const offersRoleDisplay = document.getElementById('offersRoleDisplay');
  if (offersRoleDisplay) {
    offersRoleDisplay.textContent = role === 'farmer' ? '👨‍🌾 Farmer Deal Portal' : '🏢 Buyer Deal Portal';
  }

  const authActionBtn = document.getElementById('authActionBtn');
  if (authActionBtn) {
    authActionBtn.style.display = 'inline-block';
    authActionBtn.textContent = 'Sign Out';
  }

  // Update back buttons to always route to the correct verified dashboard
  const backLinks = [
    document.getElementById('portalBackLink'),
    document.getElementById('backPortalBtn'),
    document.getElementById('offersBackBtn'),
    document.getElementById('dashBackBtn'),
    document.getElementById('backNavBtn')
  ];

  backLinks.forEach(link => {
    if (link) {
      if (role === 'farmer') {
        link.href = 'farmer-dashboard.html';
        link.textContent = '← Farmer Dashboard';
      } else if (role === 'buyer') {
        link.href = 'buyer-dashboard.html';
        link.textContent = '← Buyer Portal';
      }
    }
  });

  // Attach sign out handlers
  const logoutButtons = document.querySelectorAll('#logoutBtn, .dash-btn-logout, #authActionBtn');
  logoutButtons.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await supabase.auth.signOut();
      } catch (e) {}
      localStorage.removeItem('farmos_user');
      window.location.replace('role-select.html');
    });
  });
}
