import { getStore } from "@netlify/blobs";

function getCookie(req, name) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export default async (req) => {
  const sessionId = getCookie(req, "drive_session");
  if (sessionId) {
    const store = getStore("drive-sessions");
    await store.delete(sessionId);
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.append("Set-Cookie", "drive_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};

export const config = {
  path: "/.netlify/functions/drive-disconnect"
};
