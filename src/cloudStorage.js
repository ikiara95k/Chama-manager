import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gixcuaeiamtnaensnzyl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lgDRQLs4JSj_JqSywEFS-Q_qfyrAM_W';
const STORAGE_KEY = 'chama-state-v1';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function saveToCloud(parsed) {
  const { data: existing, error: readError } = await supabase
    .from('chama_data')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (readError) throw readError;

  if (existing?.id) {
    const { error } = await supabase.from('chama_data').update({ data: parsed }).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('chama_data').insert({ data: parsed });
    if (error) throw error;
  }
}

export async function hydrateLocalState() {
  try {
    const { data, error } = await supabase
      .from('chama_data')
      .select('id, data, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data?.data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
  } catch (error) {
    console.warn('Cloud data unavailable; using local data:', error);
  }
}

export function installCloudSync() {
  if (window.__chamaCloudSyncInstalled) return;
  window.__chamaCloudSyncInstalled = true;

  const originalSetItem = Storage.prototype.setItem;
  let syncing = false;

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (key !== STORAGE_KEY || syncing || this !== localStorage) return;

    let parsed;
    try { parsed = JSON.parse(value); }
    catch (error) { console.error('Cloud sync parse failed:', error); return; }

    syncing = true;
    saveToCloud(parsed)
      .catch(error => console.error('Cloud save failed:', error))
      .finally(() => { syncing = false; });
  };

  // Upload the current state immediately after the cloud connection is installed.
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      syncing = true;
      saveToCloud(JSON.parse(current))
        .catch(error => console.error('Initial cloud save failed:', error))
        .finally(() => { syncing = false; });
    }
  } catch (error) {
    console.error('Initial cloud sync failed:', error);
    syncing = false;
  }
}
