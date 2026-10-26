import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ROBOTS_TXT, robotsRules } from "./robots";

describe("robots.txt", () => {
  it("allows the public site and blocks only admin and api", () => {
    const rules = robotsRules(ROBOTS_TXT);
    assert.deepEqual(
      rules.filter((rule) => rule.directive === "allow").map((rule) => rule.path),
      ["/"],
    );
    assert.deepEqual(
      rules.filter((rule) => rule.directive === "disallow").map((rule) => rule.path).sort(),
      ["/admin", "/api"],
    );
    assert.equal(
      rules.some((rule) => rule.directive === "disallow" && (rule.path === "/" || rule.path === "")),
      false,
    );
    assert.match(ROBOTS_TXT, /^User-agent: \*$/m);
    assert.match(ROBOTS_TXT, /^Sitemap: https:\/\/cannaspecific\.com\/sitemap\.xml$/m);
  });

  it("matches the static file Vite copies into the production build", () => {
    const file = readFileSync(new URL("../client/public/robots.txt", import.meta.url), "utf8");
    assert.equal(file, ROBOTS_TXT);
  });
});
