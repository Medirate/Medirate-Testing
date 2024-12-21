import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: any }) {
  try {
    // Ensure params.kindeAuth is valid
    const endpoint = params.kindeAuth;
    if (!endpoint) {
      return NextResponse.json({ error: "Missing kindeAuth parameter" }, { status: 400 });
    }

    // Call handleAuth and handle its response
    const response = await handleAuth(request, endpoint);

    // Check if response is a valid object
    if (response && typeof response === "object") {
      const { body, status = 200, headers } = response;

      // Wrap the response in NextResponse
      return new NextResponse(body || JSON.stringify({}), {
        status,
        headers,
      });
    }

    // If response is invalid
    return NextResponse.json({ error: "Invalid response from handleAuth" }, { status: 500 });
  } catch (error) {
    console.error("Error in auth handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
