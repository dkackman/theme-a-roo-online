const ALLOW_ORIGIN = "*"; // <-- For production, replace '*' with your frontend origin
const ALLOW_METHODS = "GET,POST,DELETE,OPTIONS";
const ALLOW_HEADERS = "Authorization,Content-Type";
const EXPOSE_HEADERS = "Content-Length,Content-Type";
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": ALLOW_METHODS,
  "Access-Control-Allow-Headers": ALLOW_HEADERS,
  "Access-Control-Expose-Headers": EXPOSE_HEADERS,
};
