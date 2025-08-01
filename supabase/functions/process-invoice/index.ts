import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

serve(async (req) => {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file uploaded' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Dummy example: return a fake Tally-compatible XML download URL
  const xml = `<xml><message>This would be your Tally XML output</message></xml>`;

  return new Response(JSON.stringify({
    success: true,
    message: 'Invoice processed successfully',
    xml: xml,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
