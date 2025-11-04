import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_community_collaboration_scene_5722db3a.png";

export default function HeroSection() {
  const scrollToForm = () => {
    document.getElementById("interest-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToStory = () => {
    document.getElementById("story")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 lg:px-12 py-24 text-center">
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
          data-testid="text-hero-headline"
        >
          Tired of the Guessing Game?
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed" data-testid="text-hero-subheadline">
          We're Ending "Strain Roulette." Join Us to Unlock the True Science of Cannabis.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button
            size="lg"
            onClick={scrollToForm}
            className="bg-primary/90 backdrop-blur-sm text-primary-foreground border border-primary-border text-lg"
            data-testid="button-join-movement"
          >
            Join the Movement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={scrollToStory}
            className="bg-white/10 backdrop-blur-md text-white border-white/30 text-lg"
            data-testid="button-learn-story"
          >
            Learn Our Story
          </Button>
        </div>
        
        <p className="text-white/70 text-sm" data-testid="text-trust-indicator">
          Building the future with our early supporters
        </p>
      </div>
    </section>
  );
}
