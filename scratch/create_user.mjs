import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Creating user...");
  const res = await supabaseAdmin.auth.admin.createUser({
    email: 'e2e_test@example.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'E2E Test User' }
  });
  console.log('User created:', res.data?.user?.email);
  if (res.error) console.error('Error:', res.error);
  process.exit(0);
}
run();
