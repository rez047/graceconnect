import { supabase } from './supabase';

// ---------- DEPARTMENTS ----------
export const getDepartments = () =>
  supabase.from('departments').select('*').order('name');

export const createDepartment = (dept) =>
  supabase.from('departments').insert([dept]).select().single();

export const getMyDepartments = (userId) =>
  supabase.from('department_members')
    .select('role, departments(*)')
    .eq('user_id', userId);

export const joinDepartmentRequest = (req) =>
  supabase.from('pending_requests').insert([{ ...req, type: 'join_department' }]);

export const addDeptMember = (departmentId, userId, role) =>
  supabase.from('department_members').insert([{ department_id: departmentId, user_id: userId, role }]);

export const removeDeptMember = (departmentId, userId) =>
  supabase.from('department_members').delete().eq('department_id', departmentId).eq('user_id', userId);

// ---------- USHIRIKAS ----------
export const getUshirikas = () =>
  supabase.from('ushirikas').select('*').order('name');

export const createUshirika = (u) =>
  supabase.from('ushirikas').insert([u]).select().single();

// ---------- CUSTOM TITLES ----------
export const getTitles = (category) =>
  supabase.from('titles').select('*').eq('category', category);

export const addTitle = (name, category) =>
  supabase.from('titles').insert([{ name, category }]);

// ---------- WEEKLY MEETINGS ----------
export const getWeeklyMeeting = (deptId) =>
  supabase.from('weekly_meetings').select('*')
    .eq('department_id', deptId).order('created_at', { ascending: false }).limit(1).single();

export const updateWeeklyMeeting = (meeting) =>
  supabase.from('weekly_meetings').insert([meeting]).select().single();

// ---------- POSTS ----------
export const getPosts = (departmentId = null) =>
  departmentId
    ? supabase.from('posts').select('*, profiles(name, profile_pic)').eq('department_id', departmentId).order('created_at', { ascending: false })
    : supabase.from('posts').select('*, profiles(name, profile_pic)').is('department_id', null).order('created_at', { ascending: false });

export const createPost = (post) =>
  supabase.from('posts').insert([post]).select().single();

export const deletePost = (id) =>
  supabase.from('posts').delete().eq('id', id);

// ---------- EMOTIONAL SUPPORT VERSES ----------
export const getVerses = (category) =>
  supabase.from('verses').select('*').eq('category', category);

// ---------- CHAT (with LIVE realtime) ----------
export const getConversation = (myId, otherId) =>
  supabase.from('messages').select('*')
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
    .order('created_at');

export const sendMessage = (msg) =>
  supabase.from('messages').insert([msg]).select().single();

export const markRead = (messageId) =>
  supabase.from('messages').update({ read: true }).eq('id', messageId);

// LIVE listener — new messages appear instantly
export function listenForMessages(callback) {
  return supabase.channel('messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => callback(payload.new))
    .subscribe();
}

// ---------- MEDIA UPLOAD (all formats) ----------
export async function uploadMedia(file, folder) {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('media').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}