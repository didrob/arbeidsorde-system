const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org_number } = await req.json();

    if (!org_number || !/^\d{9}$/.test(org_number)) {
      return new Response(
        JSON.stringify({ error: 'Ugyldig organisasjonsnummer. Må være nøyaktig 9 siffer.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(
      `https://data.brreg.no/enhetsregisteret/api/enheter/${org_number}`,
      { headers: { Accept: 'application/json' } }
    );

    if (response.status === 404) {
      return new Response(
        JSON.stringify({ error: 'Organisasjonsnummer ikke funnet i Brønnøysundregistrene.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Kunne ikke kontakte Brønnøysundregistrene. Prøv igjen senere.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    const forretningsadresse = data.forretningsadresse || {};
    const adresseLinjer = forretningsadresse.adresse || [];
    const fullAddress = [
      ...adresseLinjer,
      [forretningsadresse.postnummer, forretningsadresse.poststed].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ');

    const result = {
      name: data.navn || '',
      address: fullAddress,
      org_form: data.organisasjonsform?.beskrivelse || '',
      industry_code: data.naeringskode1?.beskrivelse || '',
      org_number,
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('lookup-organization error:', err);
    return new Response(
      JSON.stringify({ error: 'En uventet feil oppsto.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
