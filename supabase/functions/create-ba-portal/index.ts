import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, localData, baUserData, tier, token } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the invite token is valid and unused
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('ba_invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: 'Invalid or expired invite token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create the local record
    const { data: local, error: localError } = await supabaseAdmin
      .from('locals')
      .insert({ ...localData, subscription_tier: tier })
      .select()
      .single()

    if (localError) {
      return new Response(JSON.stringify({ error: localError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create the ba_users record
    const { error: baError } = await supabaseAdmin
      .from('ba_users')
      .insert({ ...baUserData, id: userId, local_id: local.id })

    if (baError) {
      // Rollback: delete the local we just created
      await supabaseAdmin.from('locals').delete().eq('id', local.id)
      return new Response(JSON.stringify({ error: baError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mark invite as used
    await supabaseAdmin
      .from('ba_invites')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token)

    return new Response(JSON.stringify({ success: true, localId: local.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
