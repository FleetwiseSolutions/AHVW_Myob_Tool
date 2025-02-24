import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Buffer } from "buffer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new NextResponse(
      `
      <script>
        alert("Authorization code missing");
        window.close();
      </script>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  const tokenUrl = "https://secure.myob.com/oauth2/v1/authorize";
  const clientId = process.env.NEXT_PUBLIC_MYOB_CLIENT_ID!;
  const clientSecret = process.env.MYOB_CLIENT_SECRET!;
  const redirectUri = process.env.MYOB_REDIRECT_URI!;

  const authHeader =
    "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const bodyParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "CompanyFile",
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authHeader,
    },
    body: bodyParams,
  });

  const data = await response.json();

  if (!response.ok) {
    return new NextResponse(
      `
      <script>
        alert("Error getting access token: ${
          data.error_description || "Unknown error"
        }");
        window.close();
      </script>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  // ✅ Store access token in a secure cookie
  const cookieStore = await cookies();
  cookieStore.set("myob_access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  // ✅ Return an HTML response that closes the window
  return new NextResponse(
    `
    <script>
      window.opener?.postMessage({ success: true }, window.location.origin);
      window.close();
    </script>
  `,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}
