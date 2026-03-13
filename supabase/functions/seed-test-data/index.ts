import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Site IDs from the database
const SITES = {
  tananger: '9e86b280-7968-4857-b77d-3d12a8960c63',
  mosjoen: 'bf4d8df8-d689-40a5-b85b-c188dc3436c3',
  farsund: 'd3349a3f-4d78-427b-be10-e260d4af14cf',
  sandnessjoen: 'fccb249e-82ac-45b9-8d36-66ccec8c8b36',
};
const ORG_ID = '00000000-0000-0000-0000-000000000001';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Idempotency check
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.find(u => u.email === 'admin@asco-test.no');
    if (adminExists) {
      return new Response(
        JSON.stringify({ message: 'Testdata allerede opprettet. admin@asco-test.no finnes.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const log: string[] = [];

    // ── 1. Create auth users ──
    const userDefs = [
      { email: 'admin@asco-test.no', name: 'Anders Admin', role: 'system_admin', site_id: SITES.tananger },
      { email: 'leder.tananger@asco-test.no', name: 'Linda Leder', role: 'site_manager', site_id: SITES.tananger },
      { email: 'disponent.mosjoen@asco-test.no', name: 'Jonas Disansen', role: 'site_manager', site_id: SITES.mosjoen },
      { email: 'felt.tananger@asco-test.no', name: 'Erik Eriksen', role: 'field_worker', site_id: SITES.tananger },
      { email: 'felt.farsund@asco-test.no', name: 'Marte Feltsen', role: 'field_worker', site_id: SITES.farsund },
      { email: 'kari@alcoa-test.no', name: 'Kari Koordinator', role: 'customer', site_id: null },
      { email: 'ole@equinor-test.no', name: 'Ole Driftsen', role: 'customer', site_id: null },
    ];

    const createdUsers: Record<string, string> = {};

    for (const u of userDefs) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'Test1234!',
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) throw new Error(`Failed to create user ${u.email}: ${error.message}`);
      createdUsers[u.email] = data.user.id;
      log.push(`Created user: ${u.email} (${data.user.id})`);
    }

    // ── 2. Create test customers ──
    const customerDefs = [
      { name: 'Alcoa Mosjøen', org_number: '914778271', site_id: SITES.mosjoen, status: 'approved' },
      { name: 'Equinor Tananger', org_number: '923609016', site_id: SITES.tananger, status: 'approved' },
      { name: 'Hydro Farsund', org_number: '914090206', site_id: SITES.farsund, status: 'approved' },
      { name: 'TestBedrift AS', org_number: '985985985', site_id: SITES.sandnessjoen, status: 'pending_approval' },
    ];

    const customerIds: Record<string, string> = {};

    for (const c of customerDefs) {
      const { data, error } = await supabase.from('customers').insert({
        name: c.name,
        org_number: c.org_number,
        site_id: c.site_id,
        registration_status: c.status,
        registered_by: createdUsers['admin@asco-test.no'],
      }).select('id').single();
      if (error) throw new Error(`Failed to create customer ${c.name}: ${error.message}`);
      customerIds[c.name] = data.id;
      log.push(`Created customer: ${c.name} (${data.id})`);
    }

    // Create internal customers for Tananger and Mosjøen
    const internalCustomerDefs = [
      { name: 'ASCO Intern', site_id: SITES.tananger },
      { name: 'ASCO Intern', site_id: SITES.mosjoen },
    ];

    const internalCustomerIds: Record<string, string> = {};

    for (const ic of internalCustomerDefs) {
      const { data, error } = await supabase.from('customers').insert({
        name: ic.name,
        site_id: ic.site_id,
        registration_status: 'approved',
        registered_by: 'system',
      }).select('id').single();
      if (error) throw new Error(`Failed to create internal customer: ${error.message}`);
      const key = ic.site_id === SITES.tananger ? 'intern_tananger' : 'intern_mosjoen';
      internalCustomerIds[key] = data.id;
      log.push(`Created internal customer: ${ic.name} for site ${key} (${data.id})`);
    }

    // ── 3. Update profiles with correct site_id, organization_id, customer_id ──
    for (const u of userDefs) {
      const userId = createdUsers[u.email];
      const updateData: Record<string, unknown> = {
        full_name: u.name,
        role: u.role,
        organization_id: ORG_ID,
      };
      if (u.site_id) updateData.site_id = u.site_id;

      // Link customer users to their customer record
      if (u.email === 'kari@alcoa-test.no') {
        updateData.customer_id = customerIds['Alcoa Mosjøen'];
      } else if (u.email === 'ole@equinor-test.no') {
        updateData.customer_id = customerIds['Equinor Tananger'];
      }

      const { error } = await supabase.from('profiles').update(updateData).eq('user_id', userId);
      if (error) throw new Error(`Failed to update profile for ${u.email}: ${error.message}`);
      log.push(`Updated profile: ${u.email}`);
    }

    // ── 4. Set user_roles ──
    for (const u of userDefs) {
      const userId = createdUsers[u.email];
      // handle_new_user trigger already creates field_worker role, so delete it first if different
      if (u.role !== 'field_worker') {
        await supabase.from('user_roles').delete().eq('user_id', userId);
      }
      const { error } = await supabase.from('user_roles').upsert({
        user_id: userId,
        role: u.role,
      }, { onConflict: 'user_id,role' });
      if (error) throw new Error(`Failed to set role for ${u.email}: ${error.message}`);
      log.push(`Set role: ${u.email} → ${u.role}`);
    }

    // ── 5. Set user_site_access ──
    const allSiteIds = Object.values(SITES);
    const adminId = createdUsers['admin@asco-test.no'];

    // Admin gets access to all sites
    for (const siteId of allSiteIds) {
      await supabase.from('user_site_access').insert({
        user_id: adminId,
        site_id: siteId,
        granted_by: adminId,
      });
    }
    log.push('Granted admin access to all sites');

    // Site-specific access for other users
    const siteAccessDefs = [
      { email: 'leder.tananger@asco-test.no', site_id: SITES.tananger },
      { email: 'disponent.mosjoen@asco-test.no', site_id: SITES.mosjoen },
      { email: 'felt.tananger@asco-test.no', site_id: SITES.tananger },
      { email: 'felt.farsund@asco-test.no', site_id: SITES.farsund },
    ];

    for (const sa of siteAccessDefs) {
      await supabase.from('user_site_access').insert({
        user_id: createdUsers[sa.email],
        site_id: sa.site_id,
        granted_by: adminId,
      });
    }
    log.push('Granted site access for all users');

    // ── 6. Create work orders ──
    const workOrderDefs = [
      // Alcoa (6 orders)
      { title: 'Kontainerflytting A1', customer: 'Alcoa Mosjøen', status: 'completed', price: 2400, site: SITES.mosjoen },
      { title: 'Kontainerflytting A2', customer: 'Alcoa Mosjøen', status: 'completed', price: 2400, site: SITES.mosjoen },
      { title: 'Transport Alcoa', customer: 'Alcoa Mosjøen', status: 'in_progress', price: 3800, site: SITES.mosjoen },
      { title: 'Renhold Alcoa', customer: 'Alcoa Mosjøen', status: 'completed', price: 1200, site: SITES.mosjoen },
      { title: 'Vedlikehold Alcoa', customer: 'Alcoa Mosjøen', status: 'pending', price: 5600, site: SITES.mosjoen },
      { title: 'Hasteordre Alcoa', customer: 'Alcoa Mosjøen', status: 'pending', price: 0, site: SITES.mosjoen, notes: 'HASTER – Prioriteres umiddelbart' },

      // Equinor (4 orders)
      { title: 'Brøyting Equinor 1', customer: 'Equinor Tananger', status: 'completed', price: 4000, site: SITES.tananger },
      { title: 'Brøyting Equinor 2', customer: 'Equinor Tananger', status: 'completed', price: 4000, site: SITES.tananger },
      { title: 'Kontainerflytting Equinor', customer: 'Equinor Tananger', status: 'completed', price: 2400, site: SITES.tananger },
      { title: 'Transport Equinor', customer: 'Equinor Tananger', status: 'in_progress', price: 3200, site: SITES.tananger },

      // Hydro (3 orders)
      { title: 'Renhold Hydro', customer: 'Hydro Farsund', status: 'completed', price: 1800, site: SITES.farsund },
      { title: 'Vedlikehold Hydro', customer: 'Hydro Farsund', status: 'completed', price: 7200, site: SITES.farsund },
      { title: 'Transport Hydro', customer: 'Hydro Farsund', status: 'pending', price: 3500, site: SITES.farsund },
    ];

    for (const wo of workOrderDefs) {
      const insertData: Record<string, unknown> = {
        title: wo.title,
        customer_id: customerIds[wo.customer],
        status: wo.status,
        pricing_type: 'fixed',
        pricing_model: 'fixed',
        price_value: wo.price || null,
        site_id: wo.site,
        user_id: adminId,
        notes: wo.notes || null,
      };

      // Set timestamps for completed/in_progress
      if (wo.status === 'completed') {
        insertData.started_at = new Date(Date.now() - 7 * 86400000).toISOString();
        insertData.completed_at = new Date(Date.now() - 2 * 86400000).toISOString();
      } else if (wo.status === 'in_progress') {
        insertData.started_at = new Date(Date.now() - 1 * 86400000).toISOString();
      }

      const { error } = await supabase.from('work_orders').insert(insertData);
      if (error) throw new Error(`Failed to create work order ${wo.title}: ${error.message}`);
    }
    log.push(`Created ${workOrderDefs.length} external work orders`);

    // Internal orders
    const internalOrders = [
      {
        title: 'Vedlikehold truck',
        customer_id: internalCustomerIds['intern_tananger'],
        status: 'completed',
        is_internal: true,
        cost_center: 'Vedlikehold utstyr',
        site_id: SITES.tananger,
        started_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        completed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        title: 'Klargjøring lager',
        customer_id: internalCustomerIds['intern_mosjoen'],
        status: 'in_progress',
        is_internal: true,
        cost_center: 'Klargjøring',
        site_id: SITES.mosjoen,
        started_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];

    for (const io of internalOrders) {
      const { error } = await supabase.from('work_orders').insert({
        ...io,
        pricing_type: 'hourly',
        pricing_model: 'resource_based',
        user_id: adminId,
      });
      if (error) throw new Error(`Failed to create internal order ${io.title}: ${error.message}`);
    }
    log.push('Created 2 internal work orders');

    return new Response(
      JSON.stringify({ success: true, message: 'Testdata opprettet!', log }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('seed-test-data error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
