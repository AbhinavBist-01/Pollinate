import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { usersTable } from "../../../db/schema.js";
import { RegisterSchema, LoginSchema } from "./models.js";

const JWT_SECRET = process.env.JWT_SECRET || "pollinate-jwt-secret-dev";

function signToken(user: { id: string; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export async function register(req: Request, res: Response) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });

  const { name, email, password } = parsed.data;
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing.length > 0)
    return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash })
    .returning();
  if (!user) return res.status(500).json({ message: "Failed to create user" });

  const token = signToken(user);
  return res
    .status(201)
    .json({ user: { id: user.id, name: user.name, email: user.email }, token });
}

export async function login(req: Request, res: Response) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });

  const { email, password } = parsed.data;
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  const user = existing[0];
  if (!user || !user.passwordHash)
    return res.status(401).json({ message: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid)
    return res.status(401).json({ message: "Invalid email or password" });

  const token = signToken(user);
  return res
    .status(200)
    .json({ user: { id: user.id, name: user.name, email: user.email }, token });
}

export async function me(req: Request, res: Response) {
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
      provider: usersTable.provider,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id));
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.status(200).json(user);
}

const CLIENT_URL =
  process.env.CORS_ORIGIN?.split(",")[0]?.trim() || "http://localhost:3000";
const API_URL =
  process.env.API_URL || `http://localhost:${process.env.PORT || 8000}`;

function googleRedirectUri() {
  return `${API_URL}/api/auth/google/callback`;
}

function redirectOAuthError(res: Response, message: string) {
  return res.redirect(
    `${CLIENT_URL}/auth/callback?error=${encodeURIComponent(message)}`,
  );
}

// Google OAuth
export async function googleAuth(_req: Request, res: Response) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId)
    return redirectOAuthError(res, "Google OAuth is not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(url);
}

export async function googleCallback(req: Request, res: Response) {
  const oauthError = req.query.error;
  if (oauthError) return redirectOAuthError(res, String(oauthError));

  const { code } = req.query;
  if (!code) return redirectOAuthError(res, "Authorization code required");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      error_description?: string;
    };
    if (!tokens.access_token)
      return redirectOAuthError(
        res,
        tokens.error_description || "Failed to get Google access token",
      );

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );
    const profile = (await userRes.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    if (!profile.email)
      return redirectOAuthError(res, "Google account has no email");

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, profile.email));
    let user = existing[0];

    if (user) {
      if (!user.providerId)
        await db
          .update(usersTable)
          .set({ providerId: profile.id, avatarUrl: profile.picture })
          .where(eq(usersTable.id, user.id));
    } else {
      const [newUser] = await db
        .insert(usersTable)
        .values({
          name: profile.name || profile.email.split("@")[0]!,
          email: profile.email,
          provider: "google",
          providerId: profile.id,
          avatarUrl: profile.picture,
        })
        .returning();
      user = newUser!;
    }

    const token = signToken(user);
    return res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err: any) {
    return redirectOAuthError(res, err?.message || "Google OAuth failed");
  }
}
