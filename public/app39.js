/* ============================================================
   GRACECONNECT — APP39.JS (additive, non-destructive)
   COMPULSORY EMAIL VERIFICATION via Supabase + Brevo-style check:
   1) On signup: show "Check your email to verify" message
   2) On login: block unverified users with clear message
   3) Wrap doLogin + completeOnboarding in app3.js
   Non-destructive — nothing else touched.
   ============================================================ */
(function () {
  'use strict';

  var origDoLogin = window.doLogin;
  var origCompleteOnboarding = window.completeOnboarding;

  /* ---------- verification check helper ---------- */
  function isEmailVerified(u) {
    if (!u) return false;
    /* Supabase sets email_confirmed_at when user clicks verification link */
    if (u.email_confirmed_at) return true;
    /* Fallback: check confirmed_at in user_metadata */
    if (u.user_metadata && u.user_metadata.email_confirmed) return true;
    return false;
  }

  /* ---------- wrap doLogin: block unverified ---------- */
  window.doLogin = function () {
    if (!window.sb) return origDoLogin ? origDoLogin.apply(this, arguments) : alert('Supabase not ready');
    var e = document.getElementById('login-email');
    var p = document.getElementById('login-password');
    if (!e || !p) return origDoLogin ? origDoLogin.apply(this, arguments) : alert('Login form not found');
    var email = e.value.trim();
    var password = p.value;

    window.sb.auth.signInWithPassword({ email: email, password: password })
      .then(function (r) {
        if (r.error) throw r.error;
        var u = r.data.user;
        /* Block unverified users */
        if (!isEmailVerified(u)) {
          window.sb.auth.signOut(); /* force logout */
          var msg = '📧 Please verify your email address first.\n\nCheck your inbox (and spam folder) for the verification link we sent to ' + email + '.\n\nIf you didn\'t receive it, contact support.';
          alert(msg);
          return;
        }
        /* Verified — proceed with original flow */
        if (origDoLogin) return origDoLogin.apply(this, arguments);
      })
      .catch(function (err) {
        alert('Login failed: ' + (err.message || err));
      });
  };

  /* ---------- wrap completeOnboarding: send verification email ---------- */
  window.completeOnboarding = function () {
    if (!window.sb) return origCompleteOnboarding ? origCompleteOnboarding.apply(this, arguments) : alert('Supabase not ready');
    var n = document.getElementById('ob-name');
    var e = document.getElementById('ob-email');
    var p = document.getElementById('ob-password');
    if (!n || !e || !p) return origCompleteOnboarding ? origCompleteOnboarding.apply(this, arguments) : alert('Onboarding form not found');
    var name = n.value.trim();
    var email = e.value.trim();
    var password = p.value;
    if (!name || !email || !password) return alert('All fields required');

    /* Step 1: sign up (Supabase sends verification email automatically if confirmation is enabled) */
    window.sb.auth.signUp({
      email: email,
      password: password,
      options: { data: { name: name } }
    }).then(function (r) {
      if (r.error) throw r.error;
      var u = r.data.user;
      if (!u) throw new Error('User not created');

      /* Step 2: update profile with phone, ushirika, pic (same as original) */
      var phoneInput = document.getElementById('ob-phone');
      var ushSelect = document.getElementById('ob-ushirika');
      var pic = window._pm && window._pm.profilePic;

      var profileData = {};
      if (phoneInput) profileData.phone = phoneInput.value.trim();
      if (ushSelect && ushSelect.value) profileData.ushirika_id = ushSelect.value;

      var updateProfile = function (picUrl) {
        if (picUrl) profileData.profile_pic = picUrl;
        return window.sb.from('profiles').update(profileData).eq('id', u.id);
      };

      var chain = pic
        ? window.uploadMediaFile(pic).then(function (url) {
            delete window._pm.profilePic;
            return updateProfile(url);
          }).catch(function () { return updateProfile(null); })
        : updateProfile(null);

      return chain.then(function () {
        /* Step 3: show verification message instead of auto-login */
        var modal = document.getElementById('onboardingOverlay');
        if (modal) modal.classList.remove('show');
        alert(
          '🎉 Account created!\n\n' +
          'We\'ve sent a verification email to:\n' + email + '\n\n' +
          'Please click the link in that email to verify your account, then log in.\n\n' +
          '(Check your spam folder if you don\'t see it within 5 minutes.)'
        );
        /* Redirect to login */
        var decision = document.getElementById('decisionOverlay');
        if (decision) decision.style.display = 'none';
        var login = document.getElementById('loginOverlay');
        if (login) login.classList.add('show');
        var loginEmail = document.getElementById('login-email');
        if (loginEmail) loginEmail.value = email; /* prefill email */
      });
    }).catch(function (err) {
      alert('Sign up failed: ' + (err.message || err));
    });
  };

  /* ---------- refreshRole: also check verification on boot ---------- */
  var origRefreshRole = window.refreshRole;
  window.refreshRole = function () {
    if (!window.sb) return origRefreshRole ? origRefreshRole.apply(this, arguments) : Promise.resolve();
    return window.sb.auth.getUser().then(function (r) {
      var u = r.data.user;
      if (u && !isEmailVerified(u)) {
        /* Unverified session — force logout */
        window.sb.auth.signOut();
        alert('📧 Your email is not yet verified. Please check your inbox and click the verification link, then log in again.');
        location.reload();
        return;
      }
      /* Verified — continue with original flow */
      if (origRefreshRole) return origRefreshRole.apply(this, arguments);
    });
  };

  /* ---------- boot hook: check verification on page load ---------- */
  var origBoot = window.boot;
  window.boot = function () {
    if (origBoot) origBoot.apply(this, arguments);
    /* Additional check: if user is logged in but unverified, force logout */
    setTimeout(function () {
      if (window.user && !isEmailVerified(window.user)) {
        if (window.sb) window.sb.auth.signOut();
        alert('📧 Email verification required. Please verify your email and log in again.');
        location.reload();
      }
    }, 1000);
  };

  console.log('✝️ app39.js loaded — compulsory email verification via Supabase + Brevo-style enforcement');
})();
