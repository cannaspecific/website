import { Card } from "@/components/ui/card";
import { GitMerge, Target } from "lucide-react";

export default function MissionSection() {
  return (
    <section className="py-16 md:py-24 px-6 md:px-8 lg:px-12 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
          data-testid="text-mission-headline"
        >
          That's Why CannaSpecific Was Born
        </h2>
        
        <p className="text-xl text-center text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed" data-testid="text-mission-intro">
          CannaSpecific is on a mission to do what no one else has: aggregate and standardize this fragmented data.
        </p>

        {/* --- NEW IMAGE ADDED HERE --- */}
        <div 
          className="max-w-5xl mx-auto mb-16" 
          data-testid="img-mission-banner"
        >
          <img
            src="/generated/Gemini_Generated_Image_vra45xvra45xvra4.jpg"
            alt="A visual metaphor for connecting scattered data points into a unified whole"
            className="w-full h-auto rounded-xl shadow-lg object-cover"
            style={{ maxHeight: '400px' }} // Keeps it in a nice banner shape
          />
        </div>
        {/* --- END NEW IMAGE --- */}
        
        <div className="mb-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
            <div className="bg-primary/10 rounded-lg px-6 py-4 text-center" data-testid="box-lab-reports">
              <p className="font-semibold text-lg" data-testid="text-lab-reports">Lab Reports (COAs)</p>
              <p className="text-sm text-muted-foreground" data-testid="text-chemical-profiles">Chemical Profiles</p>
            </div>
            
            <GitMerge className="h-8 w-8 text-primary rotate-90 md:rotate-0" data-testid="icon-merge-1" />
            
            <div className="bg-primary/20 rounded-lg px-8 py-6 text-center border-2 border-primary" data-testid="box-database">
              <p className="font-bold text-xl" style={{ fontFamily: 'var(--font-heading)' }} data-testid="text-database">
                CannaSpecific Database
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-connecting">Connecting the Dots</p>
            </div>
            
            <GitMerge className="h-8 w-8 text-primary rotate-90 md:rotate-0" data-testid="icon-merge-2" />
            
            <div className="bg-primary/10 rounded-lg px-6 py-4 text-center" data-testid="box-user-experiences">
              <p className="font-semibold text-lg" data-testid="text-user-experiences">User Experiences</p>
              <p className="text-sm text-muted-foreground" data-testid="text-real-world">Real-World Results</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8" data-testid="card-aggregate">
            <Target className="h-10 w-10 text-primary mb-4" data-testid="icon-aggregate" />
            <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }} data-testid="text-aggregate-title">
              Aggregate & Standardize
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4" data-testid="text-aggregate-desc-1">
              We're collecting lab reports from dispensaries nationwide and creating a unified, accessible database of cannabis chemical profiles.
            </q>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-aggregate-desc-2">
              No more hunting through different systems or being locked into one dispensary's data.
            </p>
          </Card>
          
          <Card className="p-8" data-testid="card-connect">
            <GitMerge className="h-10 w-10 text-primary mb-4" data-testid="icon-connect" />
            <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }} data-testid="text-connect-title">
              Connect & Discover
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4" data-testid="text-connect-desc-1">
              We're linking these chemical profiles to actual patient experiences, creating the missing connection between data and results.
            </p>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-connect-desc-2">
              Finally answer the question: "What really works, and why?"
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
