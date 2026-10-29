import { SiteLayout, usePageTitle } from "@/components/site/chrome";

export default function NotFound() {
  usePageTitle("Page not found — CannaSpecific");
  return (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-5 py-24 md:px-8">
        <p className="kicker text-[#0f4d3a]">404</p>
        <h1 className="mt-3 font-heading text-4xl">That page is not on this site.</h1>
        <p className="mt-4 leading-relaxed text-[#24312c]">
          The address does not match a page we publish. The homepage has one signup form for individuals and for businesses.
        </p>
        <a href="/" className="mt-8 inline-flex rounded-full bg-[#0f4d3a] px-5 py-3 text-sm font-semibold text-[#f7f4ec]">
          Back to the homepage
        </a>
      </div>
    </SiteLayout>
  );
}
