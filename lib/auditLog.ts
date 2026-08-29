import { supabase } from '@/lib/supabase';

export async function logAdminAction(adminUsername: string, action: string, details: string = '') {
  try {
    const { error } = await supabase.from('audit_logs').insert([
      {
        admin_username: adminUsername,
        action: action,
        details: details
      }
    ]);

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (err) {
    console.error('Error logging admin action:', err);
  }
}
