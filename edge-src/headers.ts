// Use environment variable for production origin, default to '*' for development
const ALLOW_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const ALLOW_METHODS = "GET,POST,DELETE,OPTIONS";
const ALLOW_HEADERS = "Authorization,Content-Type";
const EXPOSE_HEADERS = "Content-Length,Content-Type";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": ALLOW_METHODS,
  "Access-Control-Allow-Headers": ALLOW_HEADERS,
  "Access-Control-Expose-Headers": EXPOSE_HEADERS,
};

export const JSON_HEADERS = {
  "Content-Type": "application/json",
  ...CORS_HEADERS,
};
