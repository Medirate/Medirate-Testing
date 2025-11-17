import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Simple response with minimal user info for auth check
    return NextResponse.json({
      authenticated: true,
      email: user.email,
      id: user.id
    });
  } catch (error) {
    console.error("🚨 Auth check error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
} 