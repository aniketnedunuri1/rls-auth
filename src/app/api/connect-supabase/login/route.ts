import { NextResponse } from "next/server";
import pkceChallenge from "pkce-challenge";

const config = {
  clientId: process.env.SUPA_CONNECT_CLIENT_ID!,
  clientSecret: process.env.SUPA_CONNECT_CLIENT_SECRET!,
  authorizationEndpointUri: "https://api.supabase.com/v1/oauth/authorize",
  tokenUri: "https://api.supabase.com/v1/oauth/token",
  redirectUri: process.env.SUPA_CONNECT_REDIRECT_URI || "http://localhost:3000/api/connect-supabase/callback",
};

export async function GET(req: Request) {
  const { code_verifier, code_challenge } = pkceChallenge();
  const isLocal = process.env.NODE_ENV !== "production";

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    code_challenge,
    code_challenge_method: "S256",
  });
  const authorizationUrl = `${config.authorizationEndpointUri}?${params.toString()}`;

  const response = NextResponse.redirect(new URL(authorizationUrl));
  response.cookies.set("supabase_pkce", code_verifier, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: "strict",
    path: "/",
  });

  return response;
}