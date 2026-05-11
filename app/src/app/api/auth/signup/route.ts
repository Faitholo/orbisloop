import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail, createNgo } from "@/lib/db";
import { pbkdf2Sync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, role, phone, organization } = body;

  if (!email || !password || !organization || !role) {
    return NextResponse.json(
      { error: "email, password, organization, and role are required" },
      { status: 400 }
    );
  }

  if (!["ngo", "supermarket"].includes(role)) {
    return NextResponse.json(
      { error: "role must be 'ngo' or 'supermarket'" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = getUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const password_hash = hashPassword(password);
  const user = createUser({ email, password_hash, role, phone, organization });

  // Auto-create an NGO record so it appears in the admin dashboard
  if (role === "ngo") {
    createNgo({
      name: organization,
      phone: phone || "",
      location: "",
      capacity: "medium",
    });
  }

  return NextResponse.json(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
      organization: user.organization,
      created_at: user.created_at,
    },
    { status: 201 }
  );
}
