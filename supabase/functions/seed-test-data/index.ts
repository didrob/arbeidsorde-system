import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const log: string[] = [];

    // ── 1. Find or create auth users ──
    const userDefs = [
      { email: 'admin@asco-test.no', name: 'Anders Admin', role: 'system_admin', site_id: SITES.tananger },
      { email: 'leder.tananger@asco-test.no', name: 'Linda Leder', role: 'site_manager', site_id: SITES.tananger },
      { email: 'disponent.mosjoen@asco-test.no', name: 'Jonas Disansen', role: 'site_manager', site_id: SITES.mosjoen },
      { email: 'felt.tananger@asco-test.no', name: 'Erik Eriksen', role: 'field_worker', site_id: SITES.tananger },
      { email: 'felt.farsund@asco-test.no', name: 'Marte Feltsen', role: 'field_worker', site_id: SITES.farsund },
      { email: 'kari@alcoa-test.no', name: 'Kari Koordinator', role: 'customer', site_id: null },
      { email: 'ole@equinor-test.no', name: 'Ole Driftsen', role: 'customer', site_id: null },
    ];

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const createdUsers: Record<string, string> = {};

    for (const u of userDefs) {
      const existing = existingUsers?.users?.find(eu => eu.email === u.email);
      if (existing) {
        createdUsers[u.email] = existing.id;
        log.push(`Found existing user: ${u.email} (${existing.id})`);
      } else {
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
    }

    // ── 2. Find or create test customers ──
    const customerDefs = [
      { name: 'Alcoa Mosjøen', org_number: '914778271', site_id: SITES.mosjoen, status: 'approved' },
      { name: 'Equinor Tananger', org_number: '923609016', site_id: SITES.tananger, status: 'approved' },
      { name: 'Hydro Farsund', org_number: '914090206', site_id: SITES.farsund, status: 'approved' },
      { name: 'TestBedrift AS', org_number: '985985985', site_id: SITES.sandnessjoen, status: 'pending_approval' },
    ];

    const customerIds: Record<string, string> = {};

    for (const c of customerDefs) {
      const { data: existing } = await supabase.from('customers').select('id').eq('name', c.name).eq('org_number', c.org_number).maybeSingle();
      if (existing) {
        customerIds[c.name] = existing.id;
        log.push(`Found existing customer: ${c.name}`);
      } else {
        const { data, error } = await supabase.from('customers').insert({
          name: c.name,
          org_number: c.org_number,
          site_id: c.site_id,
          registration_status: c.status,
          registered_by: createdUsers['admin@asco-test.no'],
        }).select('id').single();
        if (error) throw new Error(`Failed to create customer ${c.name}: ${error.message}`);
        customerIds[c.name] = data.id;
        log.push(`Created customer: ${c.name}`);
      }
    }

    // Find existing internal customers
    const { data: existingInternals } = await supabase.from('customers')
      .select('id, site_id')
      .eq('name', 'ASCO Intern')
      .eq('registered_by', 'system')
      .in('site_id', [SITES.tananger, SITES.mosjoen]);

    const internalCustomerIds: Record<string, string> = {};
    if (existingInternals) {
      for (const ic of existingInternals) {
        if (ic.site_id === SITES.tananger && !internalCustomerIds['intern_tananger']) {
          internalCustomerIds['intern_tananger'] = ic.id;
        }
        if (ic.site_id === SITES.mosjoen && !internalCustomerIds['intern_mosjoen']) {
          internalCustomerIds['intern_mosjoen'] = ic.id;
        }
      }
    }

    // Create missing internal customers
    for (const [key, siteId] of [['intern_tananger', SITES.tananger], ['intern_mosjoen', SITES.mosjoen]] as const) {
      if (!internalCustomerIds[key]) {
        const { data, error } = await supabase.from('customers').insert({
          name: 'ASCO Intern',
          site_id: siteId,
          registration_status: 'approved',
          registered_by: 'system',
        }).select('id').single();
        if (error) throw new Error(`Failed to create internal customer: ${error.message}`);
        internalCustomerIds[key] = data.id;
        log.push(`Created internal customer for ${key}`);
      } else {
        log.push(`Found existing internal customer for ${key}`);
      }
    }

    // ── 3. Update profiles ──
    for (const u of userDefs) {
      const userId = createdUsers[u.email];
      const updateData: Record<string, unknown> = {
        full_name: u.name,
        role: u.role,
        organization_id: ORG_ID,
      };
      if (u.site_id) updateData.site_id = u.site_id;
      if (u.email === 'kari@alcoa-test.no') updateData.customer_id = customerIds['Alcoa Mosjøen'];
      if (u.email === 'ole@equinor-test.no') updateData.customer_id = customerIds['Equinor Tananger'];

      const { error } = await supabase.from('profiles').update(updateData).eq('user_id', userId);
      if (error) throw new Error(`Failed to update profile for ${u.email}: ${error.message}`);
      log.push(`Updated profile: ${u.email} → role=${u.role}`);
    }

    // ── 4. Fix user_roles (delete old, insert correct) ──
    for (const u of userDefs) {
      const userId = createdUsers[u.email];
      // Delete all existing roles for this user
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Insert the correct role
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: u.role });
      if (error) throw new Error(`Failed to set role for ${u.email}: ${error.message}`);
      log.push(`Set role: ${u.email} → ${u.role}`);
    }

    // ── 5. Set user_site_access ──
    const adminId = createdUsers['admin@asco-test.no'];
    const allSiteIds = Object.values(SITES);

    // Clear existing test user site access
    for (const u of userDefs) {
      await supabase.from('user_site_access').delete().eq('user_id', createdUsers[u.email]);
    }

    // Admin → all sites
    for (const siteId of allSiteIds) {
      await supabase.from('user_site_access').insert({ user_id: adminId, site_id: siteId, granted_by: adminId });
    }

    const siteAccessDefs = [
      { email: 'leder.tananger@asco-test.no', site_id: SITES.tananger },
      { email: 'disponent.mosjoen@asco-test.no', site_id: SITES.mosjoen },
      { email: 'felt.tananger@asco-test.no', site_id: SITES.tananger },
      { email: 'felt.farsund@asco-test.no', site_id: SITES.farsund },
    ];
    for (const sa of siteAccessDefs) {
      await supabase.from('user_site_access').insert({ user_id: createdUsers[sa.email], site_id: sa.site_id, granted_by: adminId });
    }
    log.push('Set site access for all users');

    // ── 6. Create work orders (skip if already exist) ──
    const { count: woCount } = await supabase.from('work_orders')
      .select('*', { count: 'exact', head: true })
      .or('title.like.%Alcoa%,title.like.%Equinor%,title.like.%Hydro%,title.eq.Vedlikehold truck,title.eq.Klargjøring lager');

    if ((woCount ?? 0) > 0) {
      log.push(`Work orders already exist (${woCount}), skipping creation`);
    } else {
      const workOrderDefs = [
        { title: 'Kontainerflytting A1', customer: 'Alcoa Mosjøen', status: 'completed', price: 2400, site: SITES.mosjoen },
        { title: 'Kontainerflytting A2', customer: 'Alcoa Mosjøen', status: 'completed', price: 2400, site: SITES.mosjoen },
        { title: 'Transport Alcoa', customer: 'Alcoa Mosjøen', status: 'in_progress', price: 3800, site: SITES.mosjoen },
        { title: 'Renhold Alcoa', customer: 'Alcoa Mosjøen', status: 'completed', price: 1200, site: SITES.mosjoen },
        { title: 'Vedlikehold Alcoa', customer: 'Alcoa Mosjøen', status: 'pending', price: 5600, site: SITES.mosjoen },
        { title: 'Hasteordre Alcoa', customer: 'Alcoa Mosjøen', status: 'pending', price: 0, site: SITES.mosjoen, notes: 'HASTER – Prioriteres umiddelbart' },
        { title: 'Brøyting Equinor 1', customer: 'Equinor Tananger', status: 'completed', price: 4000, site: SITES.tananger },
        { title: 'Brøyting Equinor 2', customer: 'Equinor Tananger', status: 'completed', price: 4000, site: SITES.tananger },
        { title: 'Kontainerflytting Equinor', customer: 'Equinor Tananger', status: 'completed', price: 2400, site: SITES.tananger },
        { title: 'Transport Equinor', customer: 'Equinor Tananger', status: 'in_progress', price: 3200, site: SITES.tananger },
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
        if (wo.status === 'completed') {
          insertData.started_at = new Date(Date.now() - 7 * 86400000).toISOString();
          insertData.completed_at = new Date(Date.now() - 2 * 86400000).toISOString();
        } else if (wo.status === 'in_progress') {
          insertData.started_at = new Date(Date.now() - 1 * 86400000).toISOString();
        }
        const { error } = await supabase.from('work_orders').insert(insertData);
        if (error) throw new Error(`Failed to create WO ${wo.title}: ${error.message}`);
      }
      log.push(`Created 13 external work orders`);

      // Internal orders
      const internalOrders = [
        { title: 'Vedlikehold truck', customer_id: internalCustomerIds['intern_tananger'], status: 'completed', is_internal: true, cost_center: 'Vedlikehold utstyr', site_id: SITES.tananger, started_at: new Date(Date.now() - 5 * 86400000).toISOString(), completed_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { title: 'Klargjøring lager', customer_id: internalCustomerIds['intern_mosjoen'], status: 'in_progress', is_internal: true, cost_center: 'Klargjøring', site_id: SITES.mosjoen, started_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      ];
      for (const io of internalOrders) {
        const { error } = await supabase.from('work_orders').insert({ ...io, pricing_type: 'hourly', pricing_model: 'resource_based', user_id: adminId });
        if (error) throw new Error(`Failed to create internal WO ${io.title}: ${error.message}`);
      }
      log.push('Created 2 internal work orders');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Testdata opprettet/oppdatert!', log }),
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
