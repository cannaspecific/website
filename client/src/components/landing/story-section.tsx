import founderImage from "@assets/generated_images/Founder_authentic_headshot_9479423f.png";

export default function StorySection() {
  return (
    <section id="story" className="py-16 md:py-24 px-6 md:px-8 lg:px-12 bg-card">
      <div className="max-w-6xl mx-auto">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16"
          style={{ fontFamily: 'var(--font-heading)' }}
          data-testid="text-story-headline"
        >
          Our Story
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img 
              src={founderImage} 
              alt="CannaSpecific Founder" 
              className="rounded-xl w-full max-w-md mx-auto shadow-lg"
              data-testid="img-founder"
            />
          </div>
          
          <div className="order-1 lg:order-2 space-y-6">
            <p className="text-lg leading-relaxed" data-testid="text-story-para-1">
              Our journey began with a simple but frustrating realization: the legal cannabis industry is sitting on a mountain of data, but no one is connecting the dots.
            </p>
            
            <p className="text-lg leading-relaxed" data-testid="text-story-para-2">
              As a new medical cannabis patient, I was fascinated by the detailed lab reports (Certificates of Analysis) for each product. I saw a powerful key to understanding why some products work for specific needs... and others don't.
            </p>
            
            <div className="bg-primary/5 border-l-4 border-primary pl-6 py-4 my-8">
              <p className="text-lg italic text-foreground" data-testid="text-story-quote">
                "When I moved from Virginia to Florida, I found that not only did my medical card not transfer, but every dispensary had a different, often difficult, process for accessing these vital reports."
              </p>
            </div>
            
            <p className="text-lg leading-relaxed" data-testid="text-story-para-3">
              The data was there, but it was fragmented, siloed, and completely disconnected from the most important variable: the patient's real-world experience.
            </p>
            
            <p className="text-lg leading-relaxed" data-testid="text-story-para-4">
              We're all forced to rely on catchy strain names, marketing hype, or vague "Indica/Sativa" labels, which are often inconsistent and unhelpful.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
