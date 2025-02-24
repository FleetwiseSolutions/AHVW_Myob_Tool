import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_MYOB_CLIENT_ID!;
  const redirectUri = process.env.MYOB_REDIRECT_URI!;

  const authUrl = `https://secure.myob.com/oauth2/account/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=CompanyFile`;

  return NextResponse.redirect(authUrl);
}
