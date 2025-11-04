import { Card } from "@/components/ui/card";
import { Database, Users, TrendingDown } from "lucide-react";

const problems = [
  {
    icon: Database,
    title: "Fragmented Data",
    description: "Lab reports are scattered across dispensaries with different processes, making it nearly impossible to access the information you need to make informed decisions."
  },
  {
    icon: Users,
    title: "Disconnected Experiences",
    description: "Your real-world results are lost in the void. There's no system connecting what actually works for patients with the products available."
  },
  {
    icon: TrendingDown,
    title: "Marketing Over Science",
    description: "Catchy strain names and vague 'Indica/Sativa' labels dominate, while the actual chemical profiles that determine effects are buried or ignored."
  }
];

export default function ProblemSection() {
  return (
    <section className="py-16 md:py-24 px-6 md:px-8 lg:px-12 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
          data-testid="text-problem-headline"
        >
          The System is Broken
        </h2>
        
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto" data-testid="text-problem-intro">
          The legal cannabis industry is sitting on a mountain of data, but no one is connecting the dots.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <Card 
              key={index}
              className="p-6 md:p-8"
              data-testid={`card-problem-${index}`}
            >
              <problem.icon className="h-8 w-8 text-primary mb-4" data-testid={`icon-problem-${index}`} />
              <h3 
                className="text-xl font-semibold mb-3" 
                style={{ fontFamily: 'var(--font-heading)' }}
                data-testid={`text-problem-title-${index}`}
              >
                {problem.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed" data-testid={`text-problem-desc-${index}`}>
                {problem.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
