import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { usersTable } from "../../../db/schema.js";
import { RegisterSchema, LoginSchema } from "./models.js";

const JWT_SECRET = process.env.JWT_SECRET || "pollinate-jwt-secret-dev";

function signToken(user: { id: string; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req: Request, res: Response) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });

  const { name, email, password } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash }).returning();
  if (!user) return res.status(500).json({ message: "Failed to create user" });

  const token = signToken(user);
  return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
}

export async function login(req: Request, res: Response) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });

  const { email, password } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  const user = existing[0];
  if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid email or password" });

  const token = signToken(user);
  return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email }, token });
}

export async function me(req: Request, res: Response) {
  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, avatarUrl: usersTable.avatarUrl, provider: usersTable.provider })
    .from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.status(200).json(user);
}

// Google OAuth
export async function googleAuth(_req: Request, res: Response) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(501).json({ message: "Google OAuth not configured" });
  const redirectUri = `${process.env.OAUTH_REDIRECT_URL || "http://localhost:3000/auth/callback"}?provider=google`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
  return res.redirect(url);
}

export async function googleCallback(req: Request, res: Response) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: "Authorization code required" });

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.OAUTH_REDIRECT_URL || "http://localhost:3000/auth/callback"}?provider=google`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return res.status(400).json({ message: "Failed to get access token" });

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userRes.json();

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, profile.email));
    let user = existing[0];

    if (user) {
      if (!user.providerId) {
        await db.update(usersTable).set({ providerId: profile.id, avatarUrl: profile.picture }).where(eq(usersTable.id, user.id));
      }
    } else {
      const [newUser] = await db.insert(usersTable).values({
        name: profile.name,
        email: profile.email,
        provider: "google",
        providerId: profile.id,
        avatarUrl: profile.picture,
      }).returning();
      user = newUser!;
    }

    const token = signToken(user);
    return res.redirect(`${process.env.CORS_ORIGIN?.split(",")[0] || "http://localhost:3000"}/auth/callback?token=${token}`);
  } catch (err) {
    return res.status(500).json({ message: "Google OAuth failed" });
  }
}

// Apple OAuth
export async function appleAuth(_req: Request, res: Response) {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) return res.status(501).json({ message: "Apple OAuth not configured" });
  const redirectUri = process.env.APPLE_REDIRECT_URL || "http://localhost:3000/api/auth/apple/callback";
  const url = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code%20id_token&scope=name%20email&response_mode=form_post`;
  return res.redirect(url);
}

export async function appleCallback(req: Request, res: Response) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: "Authorization code required" });

  try {
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: process.env.APPLE_CLIENT_SECRET!,
        redirect_uri: process.env.APPLE_REDIRECT_URL!,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.id_token) return res.status(400).json({ message: "Failed to get Apple token" });

    const payload = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());
    const email = payload.email;
    const name = payload.name || email?.split("@")[0] || "User";
    const appleId = payload.sub;

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    let user = existing[0];

    if (user) {
      if (!user.providerId) {
        await db.update(usersTable).set({ providerId: appleId }).where(eq(usersTable.id, user.id));
      }
    } else {
      const [newUser] = await db.insert(usersTable).values({
        name,
        email,
        provider: "apple",
        providerId: appleId,
      }).returning();
      user = newUser!;
    }

    const token = signToken(user);
    return res.redirect(`${process.env.CORS_ORIGIN?.split(",")[0] || "http://localhost:3000"}/auth/callback?token=${token}`);
  } catch (err) {
    return res.status(500).json({ message: "Apple OAuth failed" });
  }
}
