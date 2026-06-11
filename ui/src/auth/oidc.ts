interface OidcDiscovery {
  authorization_endpoint: string;
  token_endpoint: string;
}

const VERIFIER_KEY = "podforge.oidc.verifier";
const STATE_KEY = "podforge.oidc.state";
const TOKEN_ENDPOINT_KEY = "podforge.oidc.token_endpoint";

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomString(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(digest);
}

async function discover(issuer: string): Promise<OidcDiscovery> {
  const url = issuer.replace(/\/$/, "") + "/.well-known/openid-configuration";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OIDC discovery failed (${res.status})`);
  return res.json();
}

function redirectUri(): string {
  return window.location.origin + "/login";
}

export async function beginOidcLogin(issuer: string, clientId: string): Promise<void> {
  const discovery = await discover(issuer);
  const verifier = randomString();
  const state = randomString();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(TOKEN_ENDPOINT_KEY, discovery.token_endpoint);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: "openid profile email",
    state,
    code_challenge: base64Url(await sha256(verifier)),
    code_challenge_method: "S256"
  });
  window.location.assign(`${discovery.authorization_endpoint}?${params}`);
}

export async function completeOidcLogin(
  clientId: string,
  code: string,
  state: string
): Promise<string> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const expectedState = sessionStorage.getItem(STATE_KEY);
  const tokenEndpoint = sessionStorage.getItem(TOKEN_ENDPOINT_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(TOKEN_ENDPOINT_KEY);

  if (!verifier || !tokenEndpoint) throw new Error("Login session expired, please try again");
  if (state !== expectedState) throw new Error("OIDC state mismatch");

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: clientId,
      code_verifier: verifier
    })
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  const data: { id_token?: string } = await res.json();
  if (!data.id_token) throw new Error("Token response is missing id_token");
  return data.id_token;
}
