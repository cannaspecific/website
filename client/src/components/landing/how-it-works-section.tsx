import { Card } from "@/components/ui/card";
import { MessageSquare, Network, Users } from "lucide-react";

// The old steps data, kept for reference if needed
// const steps = [
//   {
//     number: 1,
//     icon: MessageSquare,
//     title: "Share Your Experience",
//     description: "Tell us about the cannabis products you've used and the effects you experienced. Your insights are the missing piece of the puzzle."
//   },
//   {
//     number: 2,
//     icon: Network,
//     title: "We Connect the Dots",
//     description: "Our system links your experience to the exact chemical profile (cannabinoids and terpenes) from lab reports, building a comprehensive database."
//   },
//   {
//     number: 3,
//     icon: Users,
//     title: "Everyone Benefits",
//     description: "The community gains access to data-driven insights about what really works. Find products that match your needs based on real science and real experiences."
//   }
// ];

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 px-6 md:px-8 lg:px-12 bg-card">
      <div className="max-w-6xl mx-auto">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
          data-testid="text-how-it-works-headline"
        >
          How It Works
        </h2>
        
        <p className="text-xl text-center text-muted-foreground mb-16 max-w-3xl mx-auto" data-testid="text-how-it-works-intro">
          Join thousands in building the world's first comprehensive cannabis research database
        </p>
        
        {/* Replaced the 3-card grid with the 'How It Works' diagram */}
        <div className="max-w-4xl mx-auto">
          <img
            src="/generated/Gemini_Generated_Image_tkxzeotkxzeotkxz (6).png"
            alt="Diagram showing COA data and PRO data feeding into the CannaSpecific system, which produces insights, community benefits, and wellness."
            className="w-full h-auto rounded-xl"
            data-testid="img-how-it-works-diagram"
          />
        </div>

        {/* // Original 3-card grid layout is now replaced by the image above
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <Card className="p-8 h-full" data-testid={`card-step-${step.number}`}>
                  <div 
                    className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold flex-shrink-0"
                    data-testid={`badge-step-${step.number}`}
                  >
                    {step.number}
                  </div>
                  <step.icon className="h-8 w-8 text-primary" data-testid={`icon-step-${step.number}`} />
                </div>
                
                <h3 
                  className="text-xl font-semibold mb-4" 
                  style={{ fontFamily: 'var(--font-heading)' }}
                  data-testid={`text-step-title-${step.number}`}
                >
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed" data-testid={`text-step-desc-${step.number}`}>
                  {step.description}
                </p>
              </Card>
              
              {step.number < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30" />
              )}
            </div>
          ))}
        </div> 
        */}
      </div>
    </section>
  );
}