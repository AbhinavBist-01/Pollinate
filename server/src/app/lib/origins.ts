import type { Request } from "express";

const LOCAL_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];

function normalizeOrigin(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    return url.origin;
  } catch {
    return null;
  }
}

function railwayOrigin() {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (!domain) return null;
  return normalizeOrigin(
    domain.startsWith("http") ? domain : `https://${domain}`,
  );
}

export function getAllowedOrigins() {
  const configuredOrigins = [
    process.env.CORS_ORIGIN,
    process.env.CLIENT_ORIGIN,
    process.env.APP_URL,
    process.env.API_URL,
  ]
    .flatMap((value) => value?.split(",") ?? [])
    .map(normalizeOrigin)
    .filter(Boolean);

  return [
    ...new Set(
      [...LOCAL_ORIGINS, ...configuredOrigins, railwayOrigin()].filter(Boolean),
    ),
  ];
}

export function isAllowedHttpOrigin(origin: string | undefined, req: Request) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  const host = req.get("x-forwarded-host") ?? req.get("host");
  const protocol = req.get("x-forwarded-proto") ?? req.protocol;
  const requestOrigin = host ? normalizeOrigin(`${protocol}://${host}`) : null;

  return (
    getAllowedOrigins().includes(normalizedOrigin) ||
    normalizedOrigin === requestOrigin
  );
}

export function isAllowedSocketOrigin(origin: string | undefined) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  return getAllowedOrigins().includes(normalizedOrigin);
}
