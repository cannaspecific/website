# CannaSpecific Landing Page - Design Guidelines

## Design Approach

**Reference-Based Approach** drawing inspiration from mission-driven platforms that blend science with community:
- **Notion** (community building, approachable professionalism)
- **Stripe** (trust, credibility, clean data presentation)
- **Modern Healthcare Platforms** (authority without sterility)

This landing page must balance scientific credibility with grassroots movement energy, creating trust while inspiring action.

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN)
- Accent/Headlines: Space Grotesk (via Google Fonts CDN)

**Hierarchy:**
- Hero Headline: Space Grotesk, 3.5rem (mobile: 2.25rem), font-weight 700
- Section Headlines: Space Grotesk, 2.5rem (mobile: 1.875rem), font-weight 700
- Subheadlines: Inter, 1.25rem (mobile: 1.125rem), font-weight 500
- Body Text: Inter, 1rem, font-weight 400, leading-relaxed
- CTA Buttons: Inter, 1rem, font-weight 600
- Form Labels: Inter, 0.875rem, font-weight 500
- Captions/Meta: Inter, 0.875rem, font-weight 400

## Layout System

**Spacing Primitives:**
Use Tailwind units: 4, 6, 8, 12, 16, 20, 24, 32 for consistent rhythm
- Component padding: p-6 (mobile), p-8 (tablet), p-12 (desktop)
- Section spacing: py-16 (mobile), py-24 (desktop)
- Element gaps: gap-4, gap-6, gap-8

**Container Structure:**
- Full-width sections with max-w-7xl inner containers
- Content-focused sections: max-w-4xl
- Form sections: max-w-2xl
- Consistent px-6 (mobile), px-8 (tablet), px-12 (desktop) horizontal padding

**Grid Strategy:**
- Hero: Full-width single column
- Story Section: Single column, max-w-3xl for readability
- Mission/Features: 2-column on md+, single on mobile
- CTA Segments: 3-column grid on lg+, 2-column on md, single on mobile
- Form Section: Single column with max-w-2xl

## Page Structure & Sections

### 1. Hero Section (80vh minimum)
- Full-width background image showing diverse cannabis patients/community in professional setting
- Centered content overlay with subtle gradient backdrop
- Headline: "Tired of the Guessing Game?"
- Subheadline: "We're Ending 'Strain Roulette.' Join Us to Unlock the True Science of Cannabis."
- Primary CTA button with blurred background: "Join the Movement"
- Secondary link-style CTA: "Learn Our Story"
- Trust indicator below CTAs: "Building the future with 10,000+ early supporters"

### 2. Problem Statement Section
- Single column, centered, max-w-3xl
- Bold opening: "The System is Broken"
- Three-point grid highlighting key pain points:
  - Fragmented Data
  - Disconnected Experiences
  - Marketing Over Science
- Each point with icon (use Heroicons), bold title, description paragraph

### 3. Founder Story Section
- Two-column layout (lg+): Image left, narrative right
- Founder photo or relevant imagery
- First-person narrative from the attached content
- Pull quote highlighting the VA to FL transfer frustration
- Conversational, authentic tone throughout

### 4. The Solution - CannaSpecific Mission
- Section headline: "That's Why CannaSpecific Was Born"
- Visual diagram/infographic section showing data flow:
  - Lab Reports (COAs) → CannaSpecific Database → User Experiences
- Two-column feature breakdown:
  - "Aggregate & Standardize" (left column)
  - "Connect & Discover" (right column)
- Each with supporting details and benefits

### 5. How It Works
- Numbered three-step process with visual progression
- Step 1: "Share Your Experience" - form icon
- Step 2: "We Connect the Dots" - database/network icon
- Step 3: "Everyone Benefits" - community icon
- Each step in card format with icon, title, description

### 6. Call-to-Action Segments
- Four-card grid (3 columns on lg+, 2 on md, 1 on mobile)
- Segment cards for:
  1. **Patients & Users**: "Contribute Your Data" - Form-focused CTA
  2. **Dispensary Partners**: "Join Our Network" - Partnership inquiry
  3. **Researchers**: "Collaborate With Us" - Research collaboration
  4. **Supporters**: "Donate to the Mission" - Donation/support
- Each card with icon, headline, description, and action button

### 7. Multi-Purpose Interest Form Section
- Section headline: "Get Involved"
- Centered form, max-w-2xl
- Radio button selection for interest type:
  - Contribute as a User
  - Explore Partnership
  - Research Collaboration
  - Make a Donation
  - General Inquiry
- Form fields:
  - Full Name (required)
  - Email Address (required)
  - Phone Number (optional)
  - Interest Type (radio selection, required)
  - Message/Details (textarea, required)
- Checkbox: "Subscribe to CannaSpecific updates"
- Submit button: "Submit Your Interest"
- Privacy reassurance text below form

### 8. Final CTA / Community Banner
- Full-width, contrasting background treatment
- Centered content: "This is More Than an App. It's a Movement."
- Supporting text about community research impact
- Large primary CTA: "Join CannaSpecific Today"
- Social proof: "Be part of the future of cannabis science"

### 9. Footer
- Three-column layout (stacks on mobile)
- Column 1: CannaSpecific logo, mission tagline, social media icons
- Column 2: Quick Links (About, Mission, Privacy Policy, Terms)
- Column 3: Contact info, email subscription mini-form
- Bottom bar: Copyright, additional legal links

## Component Library

**Buttons:**
- Primary: Solid style, medium rounded corners, px-8 py-3
- Secondary: Outlined style, same sizing
- Ghost/Link: Underline on hover, no background
- All buttons implement hover/active states automatically

**Cards:**
- Rounded corners (rounded-xl)
- Subtle border or shadow for elevation
- Padding: p-6 on mobile, p-8 on desktop
- Hover effect: subtle lift/shadow increase

**Form Inputs:**
- Rounded borders (rounded-lg)
- Clear focus states with border emphasis
- Consistent padding: px-4 py-3
- Labels above inputs with 2-unit gap
- Error states with message below field

**Icons:**
- Heroicons via CDN (outline style for most, solid for emphasis)
- Consistent sizing: w-6 h-6 for standard, w-8 h-8 for feature highlights
- Always paired with text labels for accessibility

## Images

**Hero Image:**
Large, full-width background image showing:
- Diverse group of people in a modern, professional setting
- Cannabis-related context (subtle: perhaps people reviewing documents, using tablets)
- Bright, inviting, community-focused atmosphere
- High quality, professionally shot
- Placement: Full hero section background with gradient overlay

**Founder/Story Image:**
- Professional headshot or authentic candid photo
- Placement: Story section, left side of two-column layout
- Portrait orientation preferred

**Optional Supporting Images:**
- Abstract data visualization graphics in "How It Works" section
- Community/collaboration stock photos in CTA segment cards

## Accessibility & Interaction

- Minimum touch target: 44x44px for all interactive elements
- Clear focus indicators on all form inputs and buttons
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for all images
- ARIA labels for icon-only buttons
- Form validation with clear error messaging
- Smooth scroll for anchor link navigation

## Animations

Use sparingly, only for:
- Subtle fade-in on scroll for section headlines
- Form submission success confirmation
- No parallax, no complex scroll-triggered effects

## Content Density

Each section is purposeful and complete:
- Hero: Immediate value proposition + trust signal
- Problem: Establishes context and pain points
- Story: Builds personal connection and credibility
- Solution: Shows how CannaSpecific addresses problems
- Process: Demystifies participation
- CTAs: Clear paths for different audience types
- Form: Streamlined but comprehensive capture
- Footer: Complete navigation and contact options

This creates a comprehensive, mission-driven landing page that inspires action while establishing scientific credibility and community trust.