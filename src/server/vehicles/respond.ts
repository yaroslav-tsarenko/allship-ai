export function vehicleJson(body: unknown, cacheable: boolean) {
  return Response.json(body, {
    headers: {
      "Cache-Control": cacheable ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" : "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
