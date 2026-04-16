/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');

function resolveEnv(nameList) {
  for (const name of nameList) {
    const value = process.env[name];
    if (value && value.trim() !== '') return value;
  }
  return null;
}

function toIsoIfLegacy(value) {
  if (value === null || value === undefined) {
    return { kind: 'empty', iso: null };
  }

  const raw = String(value).trim();
  if (!raw) return { kind: 'empty', iso: null };

  if (/^\d+$/.test(raw)) {
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      return { kind: 'invalid', iso: null };
    }

    const milliseconds = numeric > 9999999999 ? numeric : numeric * 1000;
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) {
      return { kind: 'invalid', iso: null };
    }
    return { kind: 'legacy_numeric', iso: date.toISOString() };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return { kind: 'already_date_like', iso: null };
  }

  return { kind: 'invalid', iso: null };
}

async function run() {
  const isApply = process.argv.includes('--apply');
  const supabaseUrl = resolveEnv([
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
  ]);
  const serviceRoleKey = resolveEnv([
    'SUPABASE_SERVICE_ROLE_KEY',
    'SERVICE_ROLE_KEY',
  ]);

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing Supabase credentials. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('strava_tokens')
    .select('id,user_id,expires_at');

  if (error) {
    console.error('Failed to read strava_tokens:', error.message);
    process.exit(1);
  }

  const rows = data || [];
  const updates = [];
  let invalidCount = 0;
  let alreadyGoodCount = 0;
  let emptyCount = 0;

  for (const row of rows) {
    const result = toIsoIfLegacy(row.expires_at);
    if (result.kind === 'legacy_numeric' && result.iso) {
      updates.push({
        id: row.id,
        user_id: row.user_id,
        from: row.expires_at,
        to: result.iso,
      });
      continue;
    }

    if (result.kind === 'invalid') invalidCount += 1;
    if (result.kind === 'already_date_like') alreadyGoodCount += 1;
    if (result.kind === 'empty') emptyCount += 1;
  }

  console.log(`Total rows scanned: ${rows.length}`);
  console.log(`Legacy numeric rows to normalize: ${updates.length}`);
  console.log(`Already date-like rows: ${alreadyGoodCount}`);
  console.log(`Empty expires_at rows: ${emptyCount}`);
  console.log(`Invalid/unparseable rows: ${invalidCount}`);

  if (updates.length > 0) {
    console.log('\nPlanned updates:');
    for (const update of updates) {
      console.log(
        `- id=${update.id} user_id=${update.user_id} from=${update.from} -> ${update.to}`
      );
    }
  }

  if (!isApply) {
    console.log(
      '\nDry run only. Re-run with --apply to write normalized expires_at values.'
    );
    return;
  }

  let applied = 0;
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('strava_tokens')
      .update({ expires_at: update.to, updated_at: new Date().toISOString() })
      .eq('id', update.id);

    if (updateError) {
      console.error(
        `Failed to update row id=${update.id}: ${updateError.message}`
      );
      continue;
    }
    applied += 1;
  }

  console.log(`\nApplied updates: ${applied}/${updates.length}`);
}

run().catch(error => {
  console.error('Unexpected script failure:', error);
  process.exit(1);
});
