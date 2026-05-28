"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const adminSignupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().trim().min(2, "Name must be at least 2 characters"),
  inviteCode: z.string().min(1, "Invite code is required"),
});

export async function createAdminAccount(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = adminSignupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password, displayName, inviteCode } = parsed.data;

  // Verify the invite code against the server environment variable
  const expectedCode = process.env.ADMIN_INVITE_CODE;
  if (!expectedCode || expectedCode.trim() === "") {
    return { error: "Server is misconfigured: Missing ADMIN_INVITE_CODE." };
  }

  if (inviteCode !== expectedCode) {
    return { error: "Invalid admin invite code." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: "Server is misconfigured: Missing Supabase credentials." };
  }

  // Create a Supabase client with the service role key to bypass RLS and securely create users
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: user, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for admins created this way
    user_metadata: {
      display_name: displayName,
      role: "admin",
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  return { success: true };
}
