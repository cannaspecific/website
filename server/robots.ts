// Served for GET /robots.txt. Also copied to client/public/robots.txt
// so the built static file matches the route. Keep the two in sync.
export const ROBOTS_TXT = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /api

Sitemap: https://cannaspecific.com/sitemap.xml
`;

export type RobotsRule = { directive: "allow" | "disallow"; path: string };

export function robotsRules(body: string): RobotsRule[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => line.length > 0 && !line.toLowerCase().startsWith("user-agent:") && !line.toLowerCase().startsWith("sitemap:"))
    .map((line) => {
      const match = line.match(/^(allow|disallow)\s*:\s*(.*)$/i);
      if (!match) {
        throw new Error(`Unrecognized robots.txt rule: ${line}`);
      }
      return {
        directive: match[1].toLowerCase() as "allow" | "disallow",
        path: match[2].trim(),
      };
    });
}
