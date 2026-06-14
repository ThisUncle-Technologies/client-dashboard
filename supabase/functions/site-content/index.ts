import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const siteSlug = url.searchParams.get('site')
    const sectionSlug = url.searchParams.get('section') // optional

    if (!siteSlug) {
      return new Response(JSON.stringify({ error: 'Missing ?site= parameter' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // service_role bypasses RLS; falls back to custom secret if auto-inject unavailable
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY'))!,
    )

    // Resolve site
    const { data: site, error: siteErr } = await admin
      .from('sites')
      .select('id, name, slug')
      .eq('slug', siteSlug)
      .eq('status', 'active')
      .single()

    if (siteErr || !site) {
      return new Response(JSON.stringify({ error: 'Site not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch published sections
    let sectionsQuery = admin
      .from('gallery_sections')
      .select('id, title, slug, description, layout_type, sort_order')
      .eq('site_id', site.id)
      .eq('status', 'published')
      .order('sort_order')

    if (sectionSlug) {
      sectionsQuery = sectionsQuery.eq('slug', sectionSlug)
    }

    const { data: sections } = await sectionsQuery

    if (!sections || sections.length === 0) {
      return new Response(JSON.stringify({ site: { name: site.name, slug: site.slug }, sections: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch published items for all sections
    const sectionIds = sections.map(s => s.id)
    const { data: items } = await admin
      .from('gallery_items')
      .select('section_id, sort_order, media_assets(url, type, title, alt_text)')
      .in('section_id', sectionIds)
      .eq('status', 'published')
      .order('sort_order')

    // Group items by section
    const itemsBySectionId: Record<string, { url: string; type: string; title: string | null; alt_text: string | null }[]> = {}
    for (const item of items ?? []) {
      const asset = (item as unknown as { section_id: string; media_assets: { url: string; type: string; title: string | null; alt_text: string | null } }).media_assets
      if (!asset) continue
      const sid = (item as unknown as { section_id: string }).section_id
      if (!itemsBySectionId[sid]) itemsBySectionId[sid] = []
      itemsBySectionId[sid].push({ url: asset.url, type: asset.type, title: asset.title, alt_text: asset.alt_text })
    }

    const payload = {
      site: { name: site.name, slug: site.slug },
      sections: sections.map(s => ({
        title: s.title,
        slug: s.slug,
        description: s.description,
        layout_type: s.layout_type,
        items: itemsBySectionId[s.id] ?? [],
      })),
    }

    return new Response(JSON.stringify(payload), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
