import { PageIntro, SiteLayout, usePageTitle } from "@/components/site/chrome";

export default function Terms() {
  usePageTitle("Terms — CannaSpecific");
  return (
    <SiteLayout>
      <PageIntro
        kicker="Terms"
        title="Rules for using this site."
        lede="These terms cover the public website, the waitlist, and pilot inquiries. They are not a contract for software you cannot buy yet."
      />
      <article className="mx-auto max-w-3xl space-y-8 px-5 py-14 text-[#24312c] md:px-8">
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Adults only</h2>
          <p className="mt-3 leading-relaxed">
            You must be 21 or older to submit a form. The site is not directed at anyone younger.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">No medical advice and no cannabis sales</h2>
          <p className="mt-3 leading-relaxed">
            Content on this site is general information about a software project. It is not medical, legal, or compliance advice. It does not diagnose, treat, or recommend a product for any health purpose. CannaSpecific does not sell cannabis and does not arrange for anyone else to sell it to you.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Early access is not a product launch</h2>
          <p className="mt-3 leading-relaxed">
            CultivatorIQ, DispensaryIQ, and ResearchIQ are names for offerings we plan to build. Joining the waitlist or sending a pilot inquiry does not reserve a feature, a price, or a delivery date. We may change or drop an idea.
          </p>
          <p className="mt-3 leading-relaxed">
            A pilot inquiry is a conversation starter. It is not a statement of work, a partnership, or a promise that we will take the project.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Your responsibility</h2>
          <p className="mt-3 leading-relaxed">
            Cannabis law depends on where you are. You are responsible for following it. Do not submit information you do not have the right to share. Do not use the forms to send spam, malware, or unlawful requests.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">The site is provided as-is</h2>
          <p className="mt-3 leading-relaxed">
            We work to keep the site available and to store submissions reliably. We do not warrant that it will be uninterrupted or error-free. To the extent the law allows, CannaSpecific is not liable for decisions you make from material on this site, including decisions about cannabis products.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Contact</h2>
          <p className="mt-3 leading-relaxed">
            Questions about these terms:{" "}
            <a className="underline underline-offset-4" href="mailto:cannaspecific@gmail.com">cannaspecific@gmail.com</a>.
          </p>
          <p className="mt-3 text-sm">Last updated October 24, 2026.</p>
        </section>
      </article>
    </SiteLayout>
  );
}
