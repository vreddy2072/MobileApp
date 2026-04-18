/**
 * Account lifecycle helpers (Supabase Edge Functions).
 */

import { callEdgeFunction } from './supabaseApi';
import { getAccessToken } from '../utils/userId';

export async function deleteUserAccount(): Promise<{ ok: boolean; error?: string }> {
  const token = getAccessToken();
  if (!token?.trim()) {
    return { ok: false, error: 'Not signed in. Sign in again and try deleting your account.' };
  }

  const { data, error } = await callEdgeFunction('ai-delete-user-account-function', {}, token);

  if (error) {
    return { ok: false, error: error.message ?? 'Account deletion failed' };
  }

  if (data && typeof data === 'object' && (data as { ok?: boolean }).ok === true) {
    return { ok: true };
  }

  const msg =
    data && typeof data === 'object' && typeof (data as { error?: string }).error === 'string'
      ? (data as { error: string }).error
      : 'Account deletion failed';
  return { ok: false, error: msg };
}
