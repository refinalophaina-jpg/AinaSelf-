// Fail-closed HTTP Basic Auth gate for the whole site (runs on EVERY request,
// static assets included). If BASIC_AUTH_PASS is not configured, nobody gets in.
//
// Configure as Cloudflare Pages secrets on the project (Production):
//   BASIC_AUTH_PASS  (required)
//   BASIC_AUTH_USER  (optional, defaults to "aina")

export async function onRequest(context) {
  const { request, env, next } = context;
  const USER = env.BASIC_AUTH_USER || "aina";
  const PASS = env.BASIC_AUTH_PASS;

  const deny = (msg) =>
    new Response(msg || "Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="AinaSelf", charset="UTF-8"',
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });

  // Fail closed: no password configured => locked for everyone.
  if (!PASS) return deny("Locked.");

  const header = request.headers.get("Authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return deny();

  let decoded;
  try { decoded = atob(encoded); } catch { return deny(); }
  const i = decoded.indexOf(":");
  if (i < 0) return deny();
  const user = decoded.slice(0, i);
  const pass = decoded.slice(i + 1);

  if (!safeEqual(user, USER) || !safeEqual(pass, PASS)) return deny();
  return next();
}

// Length-aware constant-time-ish comparison.
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let n = 0; n < a.length; n++) diff |= a.charCodeAt(n) ^ b.charCodeAt(n);
  return diff === 0;
}
