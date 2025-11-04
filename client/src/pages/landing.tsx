import HeroSection from "@/components/landing/hero-section";
import ProblemSection from "@/components/landing/problem-section";
import StorySection from "@/components/landing/story-section";
import MissionSection from "@/components/landing/mission-section";
import HowItWorksSection from "@/components/landing/how-it-works-section";
import CTASegmentsSection from "@/components/landing/cta-segments-section";
import InterestFormSection from "@/components/landing/interest-form-section";
import CommunityBanner from "@/components/landing/community-banner";
import Footer from "@/components/landing/footer";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProblemSection />
      <StorySection />
      <MissionSection />
      <HowItWorksSection />
      <CTASegmentsSection />
      <InterestFormSection />
      <CommunityBanner />
      <Footer />
    </div>
  );
}
