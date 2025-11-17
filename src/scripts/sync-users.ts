import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Environment variables
const API_URL = "https://mediratelocaldev.kinde.com/api/v1/users";
const API_TOKEN = process.env.KINDE_API_TOKEN;

if (!API_TOKEN) {
  throw new Error("KINDE_API_TOKEN is missing in environment variables.");
}

async function fetchAndSyncUsers(nextToken?: string) {
  try {
    const url = nextToken ? `${API_URL}?next_token=${nextToken}` : API_URL;

    // Fetch users from the API
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    const { users, next_token } = response.data;

    // Loop through each user and sync into the database
    for (const user of users) {
      const { id, email, first_name, last_name, created_on, is_suspended, last_signed_in, total_sign_ins, failed_sign_ins } = user;

      const existingUser = await prisma.user.findUnique({
        where: { KindeUserID: id },
      });

      if (existingUser) {
        // Update the existing user
        await prisma.user.update({
          where: { KindeUserID: id },
          data: {
            Email: email,
            FirstName: first_name,
            LastName: last_name,
            UpdatedAt: new Date(),
            IsSuspended: is_suspended ?? false,
            LastSignedIn: last_signed_in ? new Date(last_signed_in) : null,
            TotalSignIns: total_sign_ins ?? 0,
            FailedSignIns: failed_sign_ins ?? 0,
          },
        });
      } else {
        // Create a new user
        await prisma.user.create({
          data: {
            KindeUserID: id,
            Email: email,
            FirstName: first_name,
            LastName: last_name,
            CreatedOn: created_on ? new Date(created_on) : null,
            UpdatedAt: new Date(),
            IsSuspended: is_suspended ?? false,
            LastSignedIn: last_signed_in ? new Date(last_signed_in) : null,
            TotalSignIns: total_sign_ins ?? 0,
            FailedSignIns: failed_sign_ins ?? 0,
          },
        });
      }
    }

    // Handle pagination if there's a next_token
    if (next_token) {
      await fetchAndSyncUsers(next_token);
    }
  } catch (error) {
    // Error handling
  } finally {
    await prisma.$disconnect();
  }
}

fetchAndSyncUsers();
