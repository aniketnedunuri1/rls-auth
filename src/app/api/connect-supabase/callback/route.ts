import { NextResponse } from "next/server";
import { parse } from "cookie";

const config = {
  clientId: process.env.SUPA_CONNECT_CLIENT_ID!,
  clientSecret: process.env.SUPA_CONNECT_CLIENT_SECRET!,
  authorizationEndpointUri: "https://api.supabase.com/v1/oauth/authorize",
  tokenUri: "https://api.supabase.com/v1/oauth/token",
  redirectUri: process.env.SUPA_CONNECT_REDIRECT_URI || "http://localhost:3000/api/connect-supabase/callback",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const code_verifier = cookies.supabase_pkce;

  console.log("Cookie Header:", cookieHeader);
  console.log("Parsed Cookies:", cookies);
  console.log("Code Verifier:", code_verifier);

  if (!code_verifier) {
    return NextResponse.json({ error: "Missing PKCE code verifier" }, { status: 400 });
  }

  const tokenResponse = await fetch(config.tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      code_verifier,
    }),
  });

  const tokens = await tokenResponse.json();
  if (tokens.error) {
    return NextResponse.json(tokens, { status: 400 });
  }

  return NextResponse.redirect("http://localhost:3000/dashboard");
}