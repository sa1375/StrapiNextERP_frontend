import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  Check,
  Handshake,
  LineChart,
  LucideIcon,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

type CTA = {
  label: string;
  href: string;
};

type Stat = {
  label: string;
  value: string;
};

type HeroSection = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: CTA;
  secondaryCta: CTA;
  stats: Stat[];
};

type DemoSection = {
  title: string;
  description: string;
  highlights: string[];
  media: string;
};

type FeatureCard = {
  title: string;
  description: string;
  icon: string;
  detail: string;
};

type WhyUsSection = {
  title: string;
  description: string;
  bullets: { title: string; text: string }[];
  metrics: Stat[];
};

type PricingPlan = {
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

type PricingSection = {
  title: string;
  description: string;
  plans: PricingPlan[];
  note: string;
};

type FaqSection = {
  title: string;
  description: string;
  items: { question: string; answer: string; category: string }[];
};

type LandingContent = {
  hero: HeroSection;
  demo: DemoSection;
  features: FeatureCard[];
  whyUs: WhyUsSection;
  pricing: PricingSection;
  faq: FaqSection;
};

const featureIcons: Record<string, LucideIcon> = {
  LineChart,
  Boxes,
  Handshake,
  Users,
  Workflow,
  ShieldCheck,
};

const fetchLandingContent = async (): Promise<LandingContent> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

  const response = await fetch(`${baseUrl}/api/sales/landing`, {
    next: { revalidate: 180 },
  });

  if (!response.ok) {
    throw new Error("Unable to load landing content from Strapi.");
  }

  const payload = (await response.json()) as { data: LandingContent };
  return payload.data;
};

const StatBadge = ({ label, value }: Stat) => (
  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center shadow-lg shadow-black/5 backdrop-blur">
    <div className="text-2xl font-semibold text-white">{value}</div>
    <div className="text-sm text-white/70">{label}</div>
  </div>
);

const CTAButton = ({
  cta,
  variant = "primary",
}: {
  cta: CTA;
  variant?: "primary" | "ghost";
}) => {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary"
      : "border border-white/40 text-white hover:bg-white/10 focus-visible:outline-white";

  return (
    <Link href={cta.href} className={`${base} ${styles}`}>
      {variant === "primary" ? (
        cta.label
      ) : (
        <>
          <Play className="mr-2 h-4 w-4" />
          {cta.label}
        </>
      )}
    </Link>
  );
};

const FeatureIcon = ({ name }: { name: string }) => {
  const Icon = featureIcons[name] ?? Sparkles;
  return (
    <div className="rounded-xl bg-primary/10 p-3 text-primary">
      <Icon className="h-5 w-5" />
    </div>
  );
};

const formatPrice = (value: number) => (value === 0 ? "Free" : `$${value}`);

const Hero = ({ hero }: { hero: HeroSection }) => (
  <section
    id="hero"
    className="relative isolate overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(107,114,128,0.35),_transparent_60%)]" />
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 pb-28 pt-32 text-center">
      <span className="rounded-full border border-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.45rem] text-white/70">
        {hero.eyebrow}
      </span>
      <div className="space-y-6">
        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          {hero.title}
        </h1>
        <p className="text-balance text-base text-white/80 sm:text-lg">
          {hero.subtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <CTAButton cta={hero.primaryCta} />
        <CTAButton cta={hero.secondaryCta} variant="ghost" />
      </div>
      <div className="grid w-full gap-4 sm:grid-cols-3">
        {hero.stats.map((stat) => (
          <StatBadge key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  </section>
);

const Demo = ({ demo }: { demo: DemoSection }) => (
  <section
    id="demo"
    className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:flex lg:items-center lg:gap-12"
  >
    <div className="flex-1 space-y-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        Demo
      </p>
      <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
        {demo.title}
      </h2>
      <p className="text-lg text-muted-foreground">{demo.description}</p>
      <ul className="space-y-3 text-base text-muted-foreground">
        {demo.highlights.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Check className="mt-1 h-4 w-4 text-green-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="mt-10 flex-1 lg:mt-0">
      <div className="relative rounded-[32px] border border-border bg-card/40 p-3 shadow-2xl ring-1 ring-primary/5">
        <div className="absolute right-6 top-6 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
          نسخه زنده محصول
        </div>
        <Image
          src={demo.media}
          alt="ERP preview"
          width={1200}
          height={800}
          className="h-auto w-full rounded-[28px] border border-border object-cover"
          priority
        />
      </div>
    </div>
  </section>
);

const Features = ({ features }: { features: FeatureCard[] }) => (
  <section className="bg-muted/40 py-20 md:py-28">
    <div className="mx-auto max-w-6xl px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Feature Highlights
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">
          ماژول‌های هوشمند برای گردش‌کارهای واقعی
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          از مالی و منابع انسانی تا تولید و توزیع، هر ماژول به‌صورت بومی برای
          کسب‌وکارهای منطقه طراحی شده است.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-3xl border bg-card/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
          >
            <FeatureIcon name={feature.icon} />
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
              <p className="text-sm text-muted-foreground/80">
                {feature.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const WhyUs = ({ whyUs }: { whyUs: WhyUsSection }) => (
  <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:flex lg:items-center lg:gap-20">
    <div className="flex-1 space-y-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        Why Us
      </p>
      <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
        {whyUs.title}
      </h2>
      <p className="text-lg text-muted-foreground">{whyUs.description}</p>
      <div className="space-y-4">
        {whyUs.bullets.map((bullet) => (
          <div key={bullet.title} className="rounded-2xl border p-4">
            <p className="font-semibold">{bullet.title}</p>
            <p className="text-muted-foreground">{bullet.text}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="mt-12 flex-1 space-y-4 lg:mt-0">
      {whyUs.metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-6"
        >
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="text-4xl font-semibold">{metric.value}</p>
        </div>
      ))}
    </div>
  </section>
);

const Pricing = ({ pricing }: { pricing: PricingSection }) => (
  <section id="pricing" className="bg-slate-950 py-20 text-white md:py-28">
    <div className="mx-auto max-w-6xl px-6">
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4rem] text-white/70">
          Pricing
        </span>
        <h2 className="text-3xl font-semibold sm:text-4xl">{pricing.title}</h2>
        <p className="text-lg text-white/80">{pricing.description}</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {pricing.plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur ${
              plan.highlighted
                ? "ring-2 ring-primary"
                : "ring-1 ring-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/60">
                  {plan.name}
                </p>
                <p className="mt-2 text-4xl font-semibold">
                  {formatPrice(plan.price)}
                </p>
                <p className="text-sm text-white/70">{plan.period}</p>
              </div>
              {plan.badge ? (
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {plan.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-6 text-white/80">{plan.description}</p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.ctaHref}
              className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-white/30 text-white hover:bg-white/10"
              }`}
            >
              {plan.ctaLabel}
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-white/70">{pricing.note}</p>
    </div>
  </section>
);

const FAQ = ({ faq }: { faq: FaqSection }) => (
  <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        FAQ
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">
        {faq.title}
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">{faq.description}</p>
    </div>
    <div className="mt-10 space-y-4">
      {faq.items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-border bg-card/80 p-6 transition"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
            <span>{item.question}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {item.category}
            </span>
          </summary>
          <p className="mt-3 text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  </section>
);

export default async function Home() {
  const landing = await fetchLandingContent();

  return (
    <div className="bg-background text-foreground">
      <Hero hero={landing.hero} />
      <Demo demo={landing.demo} />
      <Features features={landing.features} />
      <WhyUs whyUs={landing.whyUs} />
      <Pricing pricing={landing.pricing} />
      <FAQ faq={landing.faq} />
    </div>
  );
}
