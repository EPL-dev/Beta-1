import { getStore } from "@netlify/blobs";

function getCookie(req, name) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export default async (req) => {
  const sessionId = getCookie(req, "drive_session");
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "no_session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const store = getStore("drive-sessions");
  const session = await store.get(sessionId, { type: "json" });
  if (!session || !session.refresh_token) {
    return new Response(JSON.stringify({ error: "no_refresh_token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: session.refresh_token,
      grant_type: "refresh_token"
    })
  });
  const tokenData = await tokenResp.json();

  if (!tokenResp.ok || !tokenData.access_token) {
    return new Response(JSON.stringify({ error: "refresh_failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(
    JSON.stringify({ access_token: tokenData.access_token, expires_in: tokenData.expires_in }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const config = {
  path: "/.netlify/functions/drive-access-token"
};
