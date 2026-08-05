import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return new Response(`Autorisation refusée par Google : ${oauthError}`, { status: 400 });
  }
  if (!code) {
    return new Response("Code d'autorisation manquant.", { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = new URL("/.netlify/functions/drive-auth-callback", req.url).toString();

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  const tokenData = await tokenResp.json();

  if (!tokenResp.ok || !tokenData.refresh_token) {
    return new Response(
      "Autorisation incomplète — Google n'a pas renvoyé d'accès permanent. " +
      "Ceci arrive si vous avez déjà autorisé cette app avant sans avoir retiré l'accès depuis. " +
      "Allez sur myaccount.google.com/permissions, retirez l'accès à cette application, puis recommencez la connexion permanente.",
      { status: 400 }
    );
  }

  const sessionId = crypto.randomUUID();
  const store = getStore("drive-sessions");
  await store.setJSON(sessionId, {
    refresh_token: tokenData.refresh_token,
    created: Date.now()
  });

  const headers = new Headers();
  headers.set("Location", "/");
  headers.append(
    "Set-Cookie",
    `drive_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
  );
  return new Response(null, { status: 302, headers });
};

export const config = {
  path: "/.netlify/functions/drive-auth-callback"
};
