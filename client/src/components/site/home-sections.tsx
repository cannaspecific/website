const PROBLEMS = [
  {
    title: "Strain names are unreliable.",
    body: "The same name can describe a different plant, a different batch, or a different seller. A name is a label. It is not a measurement.",
  },
  {
    title: "Indica and sativa are not chemistry.",
    body: "Those words are shorthand people inherited. They do not tell you the cannabinoids or terpenes in the package you are holding.",
  },
  {
    title: "Effects vary anyway.",
    body: "Dose, product form, tolerance, setting, and the person all change what gets reported. A certificate cannot erase that. It can stop the conversation from starting at the name on the jar.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Read the certificate.",
    body: "A COA is the lab's snapshot of a tested sample: cannabinoids, terpenes, and the rest of the panel. We want those numbers in a form that can be compared, instead of trapped in a one-off PDF.",
  },
  {
    n: "02",
    title: "Keep the reviews attached.",
    body: "Adults already describe what they noticed. Those reports are subjective. They are not clinical results. They are still the missing half of the record if they stay tied to the chemistry.",
  },
  {
    n: "03",
    title: "Look for patterns.",
    body: "The software we are building is meant to relate the certificate to those reports. Patterns are early, uncertain, and never an instruction. Individual responses will keep varying.",
  },
];

const TIERS = [
  {
    code: "CS-CULT",
    name: "CultivatorIQ",
    who: "Licensed cultivators",
    body: "Compare batch chemistry over time and see where a familiar name drifts from the certificate. Built for production conversations, not for a yield promise.",
  },
  {
    code: "CS-DISP",
    name: "DispensaryIQ",
    who: "Dispensary teams",
    body: "Put the COA next to aggregated, de-identified review patterns so a menu is not explained by a strain name alone. Not a script for treating any condition.",
  },
  {
    code: "CS-RSRC",
    name: "ResearchIQ",
    who: "Research groups",
    body: "Structured certificate fields plus review metadata, with the limits of self-report written down. For questions the data can actually support.",
  },
];

const FAQS = [
  {
    q: "Is this medical advice?",
    a: "No. CannaSpecific does not diagnose, treat, or recommend a product for any health purpose. A future prediction about reported effects would still not be medical advice.",
  },
  {
    q: "Do you sell cannabis?",
    a: "No. This site does not list products for sale and does not help anyone obtain cannabis.",
  },
  {
    q: "What is a COA?",
    a: "A certificate of analysis is a lab report for a tested sample. It describes chemistry measured in that sample. It is not a guarantee of how any person will feel, and it only describes the sample the lab received.",
  },
  {
    q: "Can you already predict effects?",
    a: "Not as a product you can use today. The tiers below are coming-soon. The signup form is how we learn who wants this and what a first version should hold.",
  },
  {
    q: "Why Florida first?",
    a: "The project started from the practical mess of comparing certificates across Florida dispensaries. We are beginning where that problem is familiar, not claiming a national dataset.",
  },
  {
    q: "Who can join?",
    a: "Adults 21 and older. Individuals join the list. Dispensaries, cultivators, and researchers who want a pilot choose “I'm a business” on the same signup form.",
  },
  {
    q: "What happens to my email?",
    a: "It is stored in our database. If email delivery is configured, you get a confirmation and we get a notice. If a confirmation is delayed, the signup is still kept. Details are in the privacy policy. Write cannaspecific@gmail.com to be removed.",
  },
];

function Certificate() {
  const rows = [
    ["Delta-9 THC", "21.2%", "18.7%"],
    ["CBD", "0.4%", "0.5%"],
    ["Myrcene", "0.9%", "0.2%"],
    ["Limonene", "0.2%", "0.8%"],
    ["Caryophyllene", "0.3%", "0.3%"],
  ];
  return (
    <figure className="certificate relative rounded-2xl p-5 text-[#14211c] shadow-xl md:p-6">
      <figcaption className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker text-[#6f2e24]">Illustrative example</p>
          <p className="mt-2 font-heading text-2xl leading-tight">Same jar name. Two invented certificates.</p>
        </div>
        <p className="rounded-full border border-[#6f2e24] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6f2e24]">
          Not a real product
        </p>
      </figcaption>
      <p className="mt-3 text-sm leading-relaxed text-[#3d4a44]">
        The name on both jars is “Moonstone.” The figures below are made up so the layout has something to show. They are not a lab result and not a prediction.
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-left text-sm">
          <caption className="sr-only">Made-up cannabinoid and terpene figures for two imaginary batches that share a name</caption>
          <thead>
            <tr className="border-b border-[#ddd4c4] font-mono text-xs uppercase tracking-wider text-[#3d4a44]">
              <th scope="col" className="py-2 pr-3 font-medium">Analyte</th>
              <th scope="col" className="py-2 pr-3 font-medium">Batch A</th>
              <th scope="col" className="py-2 font-medium">Batch B</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, a, b]) => (
              <tr key={name} className="border-b border-[#eee6d8]">
                <th scope="row" className="py-2.5 pr-3 font-medium">{name}</th>
                <td className="py-2.5 pr-3 font-mono">{a}</td>
                <td className="py-2.5 font-mono">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[#24312c]">
        A model might one day compare patterns in reviews attached to columns like these. This page does not make that comparison and does not say either batch will feel a certain way.
      </p>
    </figure>
  );
}

export function Hero() {
  return (
    <section className="band-ink overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="kicker text-[#d7f25c]">Florida-first · Early-stage</p>
          <h1 className="mt-5 font-heading text-[2.7rem] leading-[0.98] tracking-tight md:text-7xl">
            The name on the jar is <span className="italic text-[#d7f25c]">not</span> the chemistry.
          </h1>
          <p className="ink-muted mt-6 max-w-xl text-lg leading-relaxed md:text-xl">
            CannaSpecific is building software that relates cannabis lab certificates to real-world reviews. The aim is a clearer picture of reported effects than a strain name can give. Nothing here is medical advice.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/#waitlist" className="inline-flex items-center justify-center rounded-full bg-[#d7f25c] px-6 py-3 text-base font-semibold text-[#14210f]">
              Join the list
            </a>
            <a href="/#partner" className="inline-flex items-center justify-center rounded-full border border-[#c9d2cb] px-6 py-3 text-base font-semibold text-[#f4f1e8]">
              Ask about a pilot
            </a>
          </div>
          <p className="ink-muted mt-5 text-sm">For adults 21 and older. The product tiers are not available yet.</p>
        </div>
        <div className="lg:col-span-5">
          <Certificate />
        </div>
      </div>
    </section>
  );
}

export function Problem() {
  return (
    <section id="problem" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <p className="kicker text-[#0f4d3a]">The problem</p>
        <h2 className="mt-3 max-w-3xl font-heading text-4xl leading-tight md:text-5xl">
          People are choosing from a story, while the measurement sits in a PDF.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PROBLEMS.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#ddd4c4] bg-[#f7f4ec] p-6">
              <h3 className="font-heading text-2xl leading-snug">{item.title}</h3>
              <p className="mt-4 leading-relaxed text-[#24312c]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Method() {
  return (
    <section id="method" className="scroll-mt-24 border-y border-[#ddd4c4] bg-[#f7f4ec]">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <p className="kicker text-[#0f4d3a]">How it works</p>
        <h2 className="mt-3 max-w-3xl font-heading text-4xl leading-tight md:text-5xl">
          Certificate, review, then a pattern. In that order.
        </h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="border-t-2 border-[#0f4d3a] pt-5">
              <p className="font-mono text-sm text-[#0f4d3a]">{step.n}</p>
              <h3 className="mt-3 font-heading text-2xl">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-[#24312c]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Tiers() {
  return (
    <section id="tiers" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker text-[#0f4d3a]">Coming soon</p>
            <h2 className="mt-3 font-heading text-4xl leading-tight md:text-5xl">Three offerings. None of them shipping yet.</h2>
          </div>
          <a href="/#partner" className="text-sm font-semibold underline underline-offset-4">
            Talk about a pilot
          </a>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <article key={tier.code} className="flex flex-col rounded-2xl bg-[#101714] p-6 text-[#f4f1e8]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs tracking-widest text-[#d7f25c]">{tier.code}</p>
                <p className="rounded-full border border-[#d7f25c] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#d7f25c]">
                  Coming soon
                </p>
              </div>
              <h3 className="mt-6 font-heading text-3xl">{tier.name}</h3>
              <p className="ink-muted mt-2 text-sm">{tier.who}</p>
              <p className="ink-muted mt-4 flex-1 leading-relaxed">{tier.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Science() {
  return (
    <section id="science" className="scroll-mt-24 border-y border-[#ddd4c4] bg-[#f7f4ec]">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-2">
        <div>
          <p className="kicker text-[#0f4d3a]">The science, said plainly</p>
          <h2 className="mt-3 font-heading text-4xl leading-tight md:text-5xl">A certificate is a snapshot. A review is a story. Neither is a clinical trial.</h2>
          <p className="mt-5 leading-relaxed text-[#24312c]">
            Labs already measure what is in a sample. People already say what they noticed. Those two records rarely meet, and when they do the meeting is anecdotal. We think the relationship is worth studying. We do not think it is settled.
          </p>
        </div>
        <div className="space-y-4">
          {[
            ["What we will treat as input", "Cannabinoid and terpene values from a COA, plus what adults report about that chemistry. Reported effects are self-report."],
            ["What we will not claim", "That a product treats a condition, that two people will have the same experience, or that a strain name predicts either."],
            ["What stays uncertain", "Dose, form, tolerance, set and setting, lab methods, and how a person describes a feeling. A model does not cancel those."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-[#ddd4c4] bg-[#f3efe6] p-5">
              <h3 className="font-heading text-xl">{title}</h3>
              <p className="mt-2 leading-relaxed text-[#24312c]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24">
      <div className="mx-auto max-w-3xl px-5 py-20 md:px-8">
        <p className="kicker text-[#0f4d3a]">FAQ</p>
        <h2 className="mt-3 font-heading text-4xl md:text-5xl">Short answers.</h2>
        <div className="mt-10 divide-y divide-[#ddd4c4] border-y border-[#ddd4c4]">
          {FAQS.map((item) => (
            <details key={item.q} className="faq group py-1">
              <summary className="flex items-center justify-between gap-4 py-4 text-left text-lg font-semibold">
                {item.q}
                <span className="faq-icon font-mono text-xl text-[#0f4d3a]" aria-hidden="true">+</span>
              </summary>
              <p className="pb-5 leading-relaxed text-[#24312c]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="scroll-mt-24 border-t border-[#ddd4c4] bg-[#f7f4ec]">
      <div className="mx-auto max-w-3xl px-5 py-20 md:px-8">
        <p className="kicker text-[#0f4d3a]">About</p>
        <h2 className="mt-3 font-heading text-4xl leading-tight md:text-5xl">A Florida project about the record, not the slogan.</h2>
        <div className="mt-6 space-y-4 text-lg leading-relaxed text-[#24312c]">
          <p>
            CannaSpecific is an early-stage software and data company. The work started when certificates of analysis were real, detailed, and still hard to compare from one dispensary process to the next, including after a move from Virginia to Florida. The names on the jars did not explain the difference.
          </p>
          <p>
            We are building toward effect patterns that start from chemistry and from what people report. We are not a clinic, a dispensary, or a lab. We do not invent customer counts, testimonials, or partner logos to look further along than we are.
          </p>
          <p>
            If you want in early, <a className="font-semibold underline underline-offset-4" href="/#waitlist">join the list</a>. If you operate a business and want to shape a pilot, choose “I'm a business” on <a className="font-semibold underline underline-offset-4" href="/#partner">that same form</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
