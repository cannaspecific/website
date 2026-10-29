import { PageIntro, SiteLayout, usePageTitle } from "@/components/site/chrome";

export default function Privacy() {
  usePageTitle("Privacy policy — CannaSpecific");
  return (
    <SiteLayout>
      <PageIntro
        kicker="Privacy"
        title="What we collect, and what we do with it."
        lede="This policy covers cannaspecific.com. It is written for the signup form, including the waitlist and business pilot inquiries. It is not a description of a future product's data practices."
      />
      <article className="mx-auto max-w-3xl space-y-8 px-5 py-14 text-[#24312c] md:px-8">
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Who we are</h2>
          <p className="mt-3 leading-relaxed">
            CannaSpecific operates this website. The contact for privacy requests is{" "}
            <a className="underline underline-offset-4" href="mailto:cannaspecific@gmail.com">cannaspecific@gmail.com</a>.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">What we collect</h2>
          <p className="mt-3 leading-relaxed">
            If you join the waitlist or send a pilot inquiry, we store the fields you submit: name, email, role, an age confirmation, and any company, state, or message you choose to include. We also store whether a confirmation email and an owner notification were sent, skipped, or failed, and the time of the submission.
          </p>
          <p className="mt-3 leading-relaxed">
            The site host records ordinary server logs, such as IP address, browser, and the page requested, to operate and protect the service. We use a hidden form field and a request limit to reduce spam. We do not run a third-party advertising tracker on this site.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Why we collect it</h2>
          <p className="mt-3 leading-relaxed">
            We use submissions to reply, to tell the two groups apart (waitlist and pilot), and to see which roles are interested. We do not sell personal information. We do not use it to make health assessments.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Where it goes</h2>
          <p className="mt-3 leading-relaxed">
            Submissions are stored in a Postgres database hosted by Neon. The site runs on Render. Confirmation and notification email, when configured, is sent through SendGrid. Those companies process the data needed to provide that service.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">How long we keep it</h2>
          <p className="mt-3 leading-relaxed">
            We keep submissions until you ask us to delete them or until we no longer need them to run the early-access list. Email us and we will remove your address from the list.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Age</h2>
          <p className="mt-3 leading-relaxed">
            This site is for adults 21 and older. We do not want information from anyone younger. If you believe a minor submitted a form, email us and we will delete it.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-2xl text-[#14211c]">Changes</h2>
          <p className="mt-3 leading-relaxed">
            If this policy changes in a material way, we will update this page. The date below is the latest revision.
          </p>
          <p className="mt-3 text-sm">Last updated October 24, 2026.</p>
        </section>
      </article>
    </SiteLayout>
  );
}
