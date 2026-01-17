let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && now < cachedToken.expiresAt - 30_000) {
    return cachedToken.accessToken; // reuse if not near expiry
  }

  const tokenUrl = process.env.OAUTH_TOKEN_URL_API!;
  const clientId = process.env.OAUTH_IM_CLIENT_ID!;
  const clientSecret = process.env.OAUTH_IM_CLIENT_SECRET!;
  const scope = process.env.OAUTH_SCOPE ?? "read";

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope,
  });

  // Most providers accept Basic auth for client credentials
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }

  const data: { access_token: string; expires_in: number } = await res.json();

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}
