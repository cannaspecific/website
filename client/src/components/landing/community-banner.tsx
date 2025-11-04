import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CommunityBanner() {
  const scrollToForm = () => {
    document.getElementById("interest-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-24 px-6 md:px-8 lg:px-12 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
          data-testid="text-banner-headline"
        >
          This is More Than an App. It's a Movement.
        </h2>
        
        <p className="text-xl mb-8 opacity-90 leading-relaxed max-w-3xl mx-auto" data-testid="text-banner-desc">
          By contributing your experiences, you are helping to build a future where everyone can find the precise, predictable, and effective cannabis products they deserve.
        </p>
        
        <Button
          size="lg"
          onClick={scrollToForm}
          className="bg-primary-foreground text-primary border border-primary-foreground text-lg"
          data-testid="button-banner-join"
        >
          Join CannaSpecific Today
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        
        <p className="mt-6 text-sm opacity-75" data-testid="text-banner-tagline">
          Be part of the future of cannabis science
        </p>
      </div>
    </section>
  );
}
