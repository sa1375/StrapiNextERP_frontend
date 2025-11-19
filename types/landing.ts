export type CTA = {
  label: string;
  href: string;
};

export type Stat = {
  label: string;
  value: string;
};

export type HeroSection = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: CTA;
  secondaryCta: CTA;
  stats: Stat[];
};

export type DemoSection = {
  title: string;
  description: string;
  highlights: string[];
  media: string;
};

export type FeatureCard = {
  title: string;
  description: string;
  icon: string;
  detail: string;
};

export type WhyUsSection = {
  title: string;
  description: string;
  bullets: { title: string; text: string }[];
  metrics: Stat[];
};

export type PricingPlan = {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
};

export type PricingSection = {
  title: string;
  description: string;
  plans: PricingPlan[];
  note: string;
};

export type FaqSection = {
  title: string;
  description: string;
  items: { question: string; answer: string; category: string }[];
};

export type LandingContent = {
  hero: HeroSection;
  demo: DemoSection;
  features: FeatureCard[];
  whyUs: WhyUsSection;
  pricing: PricingSection;
  faq: FaqSection;
};
