"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Boxes,
  Check,
  Handshake,
  LayoutDashboard,
  LineChart,
  LucideIcon,
  Play,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

import type {
  CTA,
  LandingContent,
  FaqSection,
  FeatureCard,
  WhyUsSection,
  PricingPlan,
} from "@/types/landing";

const featureIcons: Record<string, LucideIcon> = {
  LineChart,
  Boxes,
  Handshake,
  Users,
  Workflow,
  ShieldCheck,
};

const navLinks = [
  { label: "Overview", href: "#hero" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Point of Sale", href: "/pos" },
  { label: "Sales Automation", href: "/dashboard/sales" },
  { label: "Pricing", href: "#pricing" },
];

const appShortcuts = [
  {
    title: "Mission Control",
    description: "Review KPIs, tasks, and approvals inside the dashboard.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Point of Sale",
    description: "Ring up sales and sync inventory in the POS workspace.",
    href: "/pos",
    icon: ShoppingBag,
  },
  {
    title: "Sales Automation",
    description: "Create invoices, update stock, and capture payments.",
    href: "/dashboard/sales",
    icon: Receipt,
  },
  {
    title: "Invite Your Team",
    description: "Create user accounts, assign roles, and manage access.",
    href: "/register",
    icon: Users,
  },
];

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.7, ease: "easeOut" },
  },
  viewport: { once: true, amount: 0.3 },
});

const resolveMediaUrl = (media?: string) => {
  if (!media) return "/product.jpg";
  if (media.startsWith("http://") || media.startsWith("https://")) {
    return media;
  }

  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1625";

  return `${baseUrl}${media.startsWith("/") ? media : `/${media}`}`;
};

const CTAButton = ({
  cta,
  variant = "primary",
}: {
  cta: CTA;
  variant?: "primary" | "ghost";
}) => {
  const styles =
    variant === "primary"
      ? "bg-white text-slate-900 hover:bg-white/90"
      : "border border-white/40 text-white hover:bg-white/10";

  return (
    <Link
      href={cta.href}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition 
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${styles}`}
    >
      {variant === "ghost" ? (
        <>
          <Play className="mr-2 h-4 w-4" />
          {cta.label}
        </>
      ) : (
        cta.label
      )}
    </Link>
  );
};

const FeatureIcon = ({ name }: { name: string }) => {
  const Icon = featureIcons[name] ?? Sparkles;
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/30 text-primary">
      <Icon className="h-5 w-5" />
    </span>
  );
};

const GlassNav = () => (
  <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="fixed inset-x-0 top-4 z-50 px-6"
  >
    <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/15 bg-white/10 px-6 py-3 text-white shadow-lg shadow-black/20 backdrop-blur-xl">
      <Link href="/" className="text-sm font-semibold tracking-[0.3em]">
        NAVA ERP
      </Link>
      <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="transition hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/login"
          className="rounded-full border border-white/30 px-4 py-2 text-white/80 transition hover:border-white hover:text-white"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-white/90"
        >
          Launch app
        </Link>
      </div>
    </div>
  </motion.header>
);

const FloatingOrbs = () => (
  <>
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[200px]" />
      <div className="absolute right-[-15%] top-20 h-[450px] w-[450px] rounded-full bg-purple-500/20 blur-[200px]" />
      <div className="absolute bottom-[-20%] left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[200px]" />
    </div>
  </>
);

const AppShortcutCard = ({
  title,
  description,
  href,
  icon: Icon,
}: (typeof appShortcuts)[number]) => (
  <motion.div
    {...fadeIn(0.1)}
    className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
  >
    <div className="flex items-center gap-3">
      <span className="rounded-2xl bg-white/10 p-3 text-white">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-white/70">{description}</p>
      </div>
    </div>
    <Link
      href={href}
      className="mt-6 inline-flex items-center text-sm font-semibold text-white/80 transition hover:text-white"
    >
      Go to {title}
      <span className="ml-2 text-lg" aria-hidden>
        ↗
      </span>
    </Link>
  </motion.div>
);

const DemoHighlight = ({ text }: { text: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    }}
    viewport={{ once: true, amount: 0.4 }}
    className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg shadow-black/10"
  >
    <span className="h-2 w-2 rounded-full bg-emerald-500" />
    {text}
  </motion.div>
);

const FeatureCardItem = ({ feature }: { feature: FeatureCard }) => (
  <motion.div
    {...fadeIn(0.1)}
    className="group flex h-full flex-col justify-between rounded-3xl border border-slate-100/5 bg-slate-900/30 p-6 text-left shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-primary/40 hover:bg-slate-900/60"
  >
    <div>
      <FeatureIcon name={feature.icon} />
      <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
      <p className="mt-2 text-sm text-white/70">{feature.description}</p>
    </div>
    <p className="mt-6 text-sm text-white/60">{feature.detail}</p>
  </motion.div>
);

const PricingPlanCard = ({ plan }: { plan: PricingPlan }) => (
  <motion.div
    {...fadeIn(plan.highlighted ? 0.1 : 0.2)}
    className={`flex h-full flex-col rounded-3xl border bg-white/5 p-6 text-left backdrop-blur ${
      plan.highlighted
        ? "border-primary/60 shadow-2xl shadow-primary/30"
        : "border-white/10"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm uppercase tracking-widest text-white/60">
          {plan.name}
        </p>
        <p className="mt-2 text-4xl font-semibold text-white">
          {plan.price === 0 ? "Free" : `$${plan.price}`}
        </p>
        <p className="text-sm text-white/70">{plan.period}</p>
      </div>
      {plan.badge ? (
        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-white">
          {plan.badge}
        </span>
      ) : null}
    </div>
    <p className="mt-4 text-white/80">{plan.description}</p>
    <ul className="mt-5 space-y-3 text-sm text-white/80">
      {plan.features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Link
      href={plan.ctaHref}
      className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        plan.highlighted
          ? "bg-white text-slate-900 hover:bg-white/90"
          : "border border-white/30 text-white hover:bg-white/10"
      }`}
    >
      {plan.ctaLabel}
    </Link>
  </motion.div>
);

const FAQItem = ({
  question,
  answer,
  category,
}: FaqSection["items"][number]) => (
  <motion.details
    {...fadeIn(0.1)}
    className="group rounded-2xl border border-slate-900/40 bg-white/5 p-6 text-left text-white/80 transition hover:border-white/40"
  >
    <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-semibold text-white">
      <span>{question}</span>
      <span className="text-sm font-normal text-white/60">{category}</span>
    </summary>
    <p className="mt-3 text-sm text-white/70">{answer}</p>
  </motion.details>
);

const WhyUsCard = ({
  title,
  description,
  metrics,
}: Pick<WhyUsSection, "title" | "description" | "metrics">) => (
  <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
    <div className="space-y-6">
      <p className="text-sm uppercase tracking-[0.4em] text-primary">Why Us</p>
      <h2 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
      <p className="text-lg text-white/70">{description}</p>
    </div>
    <div className="grid gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white"
        >
          <p className="text-sm text-white/70">{metric.label}</p>
          <p className="text-3xl font-semibold">{metric.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const WhyUsBullets = ({ bullets }: Pick<WhyUsSection, "bullets">) => (
  <div className="mt-12 grid gap-6 lg:grid-cols-3">
    {bullets.map((bullet) => (
      <motion.div
        key={bullet.title}
        {...fadeIn(0.1)}
        className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 text-left text-white"
      >
        <p className="text-lg font-semibold">{bullet.title}</p>
        <p className="mt-2 text-sm text-white/70">{bullet.text}</p>
      </motion.div>
    ))}
  </div>
);

const AppShortcutsSection = () => (
  <section className="mx-auto max-w-6xl px-6 py-20 text-white">
    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-primary">
          Inside the app
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Launch into your workflows with one click
        </h2>
      </div>
      <p className="text-base text-white/70 lg:max-w-xl">
        Every landing action connects to a live module in the ERP suite. Replace
        marketing fluff with shortcuts that push users directly into your actual
        product.
      </p>
    </div>
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {appShortcuts.map((shortcut) => (
        <AppShortcutCard key={shortcut.title} {...shortcut} />
      ))}
    </div>
  </section>
);

type LandingPageProps = {
  data: LandingContent;
};

const LandingPage = ({ data }: LandingPageProps) => {
  const heroMedia = resolveMediaUrl(data.demo.media);
  return (
    <div className="relative overflow-hidden bg-slate-950 text-white">
      <GlassNav />
      <FloatingOrbs />
      <section
        id="hero"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 pt-32 lg:flex-row lg:items-center"
      >
        <motion.div {...fadeIn(0)} className="flex-1 space-y-6">
          <span className="inline-flex rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.45em] text-white/70">
            {data.hero.eyebrow}
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {data.hero.title}
          </h1>
          <p className="text-lg text-white/80">{data.hero.subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <CTAButton cta={data.hero.primaryCta} />
            <CTAButton cta={data.hero.secondaryCta} variant="ghost" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.hero.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                {...fadeIn(0.1 + index * 0.05)}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <p className="text-2xl font-semibold text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div {...fadeIn(0.2)} className="relative flex-1">
          <div className="absolute -left-4 -top-6 animate-pulse rounded-full bg-emerald-400/70 px-3 py-1 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-400/30">
            Realtime sync
          </div>
          <div className="absolute -right-4 top-12 rounded-3xl bg-white/10 p-4 text-xs shadow-lg shadow-black/20 backdrop-blur z-10 text-primary">
            <p className="text-xs text-white/70">Avg. go-live time</p>
            <p className="text-2xl font-semibold text-white">12 days</p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-slate-900/40 p-3 shadow-2xl shadow-black/30 backdrop-blur">
            <Image
              src={heroMedia}
              alt="ERP dashboard preview"
              width={1200}
              height={800}
              className="h-auto w-full rounded-[28px] object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-6 left-8 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80 shadow-lg shadow-black/30 backdrop-blur">
            Trusted across 5 industries
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center text-white">
        <motion.p
          {...fadeIn(0)}
          className="text-sm uppercase tracking-[0.4em] text-primary"
        >
          Demo
        </motion.p>
        <motion.h2
          {...fadeIn(0.1)}
          className="mt-3 text-3xl font-semibold sm:text-4xl"
        >
          {data.demo.title}
        </motion.h2>
        <motion.p {...fadeIn(0.15)} className="mt-4 text-lg text-white/70">
          {data.demo.description}
        </motion.p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {data.demo.highlights.map((highlight) => (
            <DemoHighlight key={highlight} text={highlight} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-2xl shadow-black/30 backdrop-blur">
          <Image
            src={heroMedia}
            alt="ERP live screenshot"
            width={1400}
            height={900}
            className="h-auto w-full rounded-[28px] object-cover"
          />
        </div>
      </section>

      <AppShortcutsSection />

      <section className="bg-slate-900/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary">
              Feature Highlights
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Intelligent modules for every workflow in your org
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Finance, supply chain, HR, and manufacturing modules are localized
              for regional compliance and tuned for high-growth operators.
              Expand later without rewrites.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {data.features.map((feature) => (
              <FeatureCardItem key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 text-white">
        <WhyUsCard
          title={data.whyUs.title}
          description={data.whyUs.description}
          metrics={data.whyUs.metrics}
        />
        <WhyUsBullets bullets={data.whyUs.bullets} />
      </section>

      <section id="pricing" className="bg-slate-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-primary">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              {data.pricing.title}
            </h2>
            <p className="mt-4 text-lg text-white/70">
              {data.pricing.description}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {data.pricing.plans.map((plan) => (
              <PricingPlanCard key={plan.name} plan={plan} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-white/60">
            {data.pricing.note}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 text-white">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            {data.faq.title}
          </h2>
          <p className="mt-4 text-lg text-white/70">{data.faq.description}</p>
        </div>
        <div className="mt-10 space-y-4">
          {data.faq.items.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
