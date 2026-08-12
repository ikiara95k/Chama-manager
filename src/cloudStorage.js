import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gixcuaeiamtnaensnzyl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lgDRQLs4JSj_JqSywEFS-Q_qfyrAM_W';
const STORAGE_KEY = 'chama-state-v1';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export async function hydrateLocalState() {
  try {
    const { data, error } = await supabase
      .from('chama_data')
      .select('id, data, updated_at')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data?.data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
    }
  } catch (error) {
    console.warn('Cloud data unavailable; using local data:', error);
  }
}

export function installCloudSync() {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  let syncing = false;

  localStorage.setItem = (key, value) => {
    originalSetItem(key, value);
    if (key !== STORAGE_KEY || syncing) return;

    try {
      const parsed = JSON.parse(value);
      syncing = true;
      supabase
        .from('chama_data')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error;
          if (data?.id) {
            return supabase.from('chama_data').update({ data: parsed }).eq('id', data.id);
          }
          return supabase.from('chama_data').insert({ data: parsed });
        })
        .then(({ error }) => {
          if (error) console.error('Cloud save failed:', error);
        })
        .catch((error) => console.error('Cloud save failed:', error))
        .finally(() => { syncing = false; });
    } catch (error) {
      console.error('Cloud sync parse failed:', error);
      syncing = false;
    }
  };
}
