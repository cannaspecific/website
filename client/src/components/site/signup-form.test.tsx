import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SignupForm } from "./forms";

function markup(audience: "individual" | "business") {
  return renderToStaticMarkup(createElement(SignupForm, { initialAudience: audience }));
}

describe("unified signup form", () => {
  it("renders one section with an individual/business radiogroup", () => {
    const html = markup("individual");
    assert.equal(html.match(/<section\b/g)?.length, 1);
    assert.match(html, /id="signup"/);
    assert.match(html, /id="waitlist"/);
    assert.match(html, /id="partner"/);
    assert.match(html, /role="radiogroup"/);
    assert.match(html, /aria-label="How are you signing up\?"/);
    assert.match(html, /I&#x27;m an individual|I'm an individual/);
    assert.match(html, /I&#x27;m a business|I'm a business/);
    assert.match(html, /For dispensaries, cultivators &amp; researchers/);
    assert.match(html, /name="signup-audience"/);
    assert.doesNotMatch(html, /A separate door for businesses/);
    assert.doesNotMatch(html, /Business pilot inquiry/);
    assert.match(html, /I am a/);
    assert.match(html, /Join the list/);
    assert.match(html, /data-signup-audience="individual"/);
  });

  it("reveals the business pilot fields and hides the individual role list", () => {
    const html = markup("business");
    assert.match(html, /Business pilot inquiry/);
    assert.match(html, /Work email/);
    assert.match(html, /What do you want to try\?/);
    assert.match(html, /Business type/);
    assert.match(html, /Research group/);
    assert.match(html, /Send the inquiry/);
    assert.match(html, /data-signup-audience="business"/);
    assert.doesNotMatch(html, /<legend[^>]*>I am a<\/legend>/);
    assert.doesNotMatch(html, /Send me occasional product updates/);
    assert.doesNotMatch(html, />Join the list</);
  });
});
