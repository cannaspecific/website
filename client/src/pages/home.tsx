import { About, Faq, Hero, Method, Problem, Science, Tiers } from "@/components/site/home-sections";
import { SignupForm } from "@/components/site/forms";
import { SiteLayout, usePageTitle } from "@/components/site/chrome";

export default function Home() {
  usePageTitle("CannaSpecific — Lab certificates, reviews, and reported effects");
  return (
    <SiteLayout>
      <Hero />
      <Problem />
      <Method />
      <Tiers />
      <Science />
      <Faq />
      <About />
      <SignupForm />
    </SiteLayout>
  );
}
