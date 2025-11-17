import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

// This handles all Kinde Auth API routes dynamically
export const GET = handleAuth();
export const POST = handleAuth();
