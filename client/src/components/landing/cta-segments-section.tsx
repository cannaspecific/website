import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Handshake, Microscope, Heart } from "lucide-react";

const segments = [
  {
    icon: FileText,
    title: "Patients & Users",
    description: "Your experience matters. Share your cannabis journey and help build a database that benefits everyone.",
    cta: "Contribute Your Data",
    interestType: "contribute"
  },
  {
    icon: Handshake,
    title: "Dispensary Partners",
    description: "Join our network of forward-thinking dispensaries committed to transparency and patient outcomes.",
    cta: "Explore Partnership",
    interestType: "partnership"
  },
  {
    icon: Microscope,
    title: "Researchers",
    description: "Access aggregated data for groundbreaking cannabis research. Let's advance the science together.",
    cta: "Collaborate With Us",
    interestType: "research"
  },
  {
    icon: Heart,
    title: "Supporters",
    description: "Believe in our mission? Your support helps us build a transparent future for cannabis.",
    cta: "Support the Mission",
    interestType: "donation"
  }
];

export default function CTASegmentsSection() {
  const scrollToForm = (interestType: string) => {
    const formElement = document.getElementById("interest-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const radioButton = document.querySelector(`input[value="${interestType}"]`) as HTMLInputElement;
        if (radioButton) {
          radioButton.click();
        }
      }, 500);
    }
  };

  return (
    <section className="py-16 md:py-24 px-6 md:px-8 lg:px-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
          data-testid="text-cta-segments-headline"
        >
          Get Involved
        </h2>
        
        <p className="text-xl text-center text-muted-foreground mb-16 max-w-3xl mx-auto" data-testid="text-cta-segments-intro">
          Whether you're a patient, partner, researcher, or supporter—there's a place for you in our community
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {segments.map((segment, index) => (
            <Card 
              key={index}
              className="p-6 flex flex-col h-full"
              data-testid={`card-segment-${index}`}
            >
              <segment.icon className="h-10 w-10 text-primary mb-4" data-testid={`icon-segment-${index}`} />
              
              <h3 
                className="text-xl font-semibold mb-3" 
                style={{ fontFamily: 'var(--font-heading)' }}
                data-testid={`text-segment-title-${index}`}
              >
                {segment.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-6 flex-grow" data-testid={`text-segment-desc-${index}`}>
                {segment.description}
              </p>
              
              <Button
                onClick={() => scrollToForm(segment.interestType)}
                variant="outline"
                className="w-full"
                data-testid={`button-cta-${segment.interestType}`}
              >
                {segment.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
