import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
  }

  // If no code is present (implicit grant with #access_token in URL hash),
  // forward client-side to dashboard '/' where supabase-js handles the hash tokens.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authenticating...</title>
  <script>
    if (window.location.hash) {
      window.location.replace("/" + window.location.hash);
    } else {
      window.location.replace("/");
    }
  </script>
</head>
<body style="background:#07090e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Authenticating National SSO &amp; Gov ID Session...</p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}
