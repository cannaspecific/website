// Added Facebook icon to the import
import { Leaf, Twitter, Linkedin, Instagram, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12 px-6 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                CannaSpecific
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed" data-testid="text-footer-tagline">
              Unlocking the true science of cannabis by connecting lab data with real patient experiences.
            </p>
            <div className="flex gap-4">
              {/* Added Facebook Link */}
              <a 
                href="https://www.facebook.com/" // Placeholder link, user should update this
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
                data-testid="link-facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
                data-testid="link-twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn"
                data-testid="link-linkedin"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
                data-testid="link-instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#story" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-about"
                >
                  About Our Mission
                </a>
              </li>
              <li>
                <a 
                  href="#interest-form" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-get-involved"
                >
                  Get Involved
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-privacy"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-terms"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Contact
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li data-testid="text-contact-email">
                Email: <a href="mailto:info@cannaspecific.com" className="hover:text-primary transition-colors" data-testid="link-email">info@cannaspecific.com</a>
              </li>
              <li data-testid="text-contact-message">
                Join our community to stay updated on our progress and cannabis research insights.
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p data-testid="text-copyright">
            © {new Date().getFullYear()} CannaSpecific. All rights reserved. Building the future of cannabis transparency.
          </p>
        </div>
      </div>
    </footer>
  );
}