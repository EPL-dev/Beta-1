export default async (req) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecretCheck = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecretCheck) {
    return new Response(
      "Configuration manquante : GOOGLE_CLIENT_ID et/ou GOOGLE_CLIENT_SECRET ne sont pas définis dans les variables d'environnement Netlify.",
      { status: 500 }
    );
  }

  const redirectUri = new URL("/.netlify/functions/drive-auth-callback", req.url).toString();
  const scope = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true"
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
};

export const config = {
  path: "/.netlify/functions/drive-auth-start"
};
