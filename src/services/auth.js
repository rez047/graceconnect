import { supabase } from './supabase';

// SIGN UP (new member) — profile auto-created by database trigger
export async function signUp({ name, email, password, ushirikaId }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if (error) throw error;

  // attach ushirika
  if (data.user && ushirikaId) {
    await supabase.from('profiles')
      .update({ ushirika_id: ushirikaId })
      .eq('id', data.user.id);
  }
  return data;
}

// LOGIN
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// LOGOUT
export async function signOut() {
  await supabase.auth.signOut();
}

// CURRENT USER + PROFILE (with role)
export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles')
    .select('*').eq('id', user.id).single();
  return profile; // contains role: 'member' | 'admin' | 'superadmin'
}

// WATCH LOGIN STATE (use in App.jsx)
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
}