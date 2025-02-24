import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  // ✅ Retrieve the stored access token
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("myob_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in first." },
      { status: 401 }
    );
  }

  const response = await fetch(`${process.env.MYOB_API_BASE_URL}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-myobapi-key": process.env.NEXT_PUBLIC_MYOB_CLIENT_ID!,
      "x-myobapi-version": "v2",
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  console.log("MYOB Company Files:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch company files" },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
