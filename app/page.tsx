import Image from "next/image";
import { Logo } from "./components/landing/Logo";
import { Navbar } from "./components/landing/Navbar";
import { Reveal } from "./components/landing/Reveal";
import { Tilt } from "./components/landing/Tilt";
import { MouseGlow } from "./components/landing/MouseGlow";
import { TryHi5 } from "./components/landing/TryHi5";
import { GoalExplorer } from "./components/landing/GoalExplorer";
import { FindTabs } from "./components/landing/FindTabs";
import { MatchFit } from "./components/landing/MatchFit";
import { HowItWorks } from "./components/landing/HowItWorks";
import { MutualFlow } from "./components/landing/MutualFlow";
import "./landing.css";

const marquee = [
  "Co-founders",
  "Collaborators",
  "Mentors",
  "Investors",
  "Researchers",
  "Freelancers",
  "Builders",
  "Business partners",
  "Interesting people",
];

const oldWay = [
  "Endless feeds of strangers",
  "Cold messages and sales pitches",
  "Awkward connection requests",
  "An inbox full of people selling",
];

const hi5Way = [
  "Five relevant people to consider",
  "Conversations only when both say Hi",
  "Clear profiles that show what people want",
  "No pressure. If not, nothing happens.",
];

const cardItems = [
  "What you do",
  "What you're good at",
  "What you're building",
  "Your experience",
  "Your interests",
  "Your current goals",
  "What you're looking for",
  "How you prefer to connect",
];

const audience = [
  ["🚀", "Founders", "Looking for co-founders and early team members"],
  ["🏢", "Entrepreneurs", "Looking for business partners"],
  ["💻", "Builders", "Developers and designers looking for projects"],
  ["🌐", "Professionals", "Looking to expand their network"],
  ["🎓", "Mentors & mentees", "People who give or want mentorship"],
  ["💼", "Investors", "Looking to discover interesting founders"],
  ["🛠️", "Freelancers", "Consultants looking for collaborations"],
  ["🔬", "Researchers", "Academics looking for research partners"],
  ["📚", "Students & graduates", "Starting their careers"],
  ["🔄", "Career changers", "Meeting people in a new industry"],
  ["💡", "Idea people", "Looking for others who can help make them real"],
];

const benefits = [
  "Focused professional discovery instead of endless scrolling",
  "Five relevant people worth considering",
  "Matching based on goals, skills, interests, and professional fit",
  "Mutual-interest connections before messaging",
  "No unsolicited cold messages",
  "Clear profiles showing what people actually want",
  "Local and remote networking",
  "Meeting preferences for taking connections beyond the app",
  "One place to find collaborators, co-founders, mentors, researchers, and partners",
];

export default function Home() {
  return (
    <>
      <div className="bg-orbs" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>
      <MouseGlow />
      <Navbar />

      <main id="top" className="landing">
        {/* ---------- Hero ---------- */}
        <section className="hero container-page">
          <div className="hero-copy">
            <Reveal>
              <span className="eyebrow">Professional matchmaking</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="h-display">
                Meet <span className="text-gradient">5 people</span> worth saying Hi to.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="lead hero-lead">
                Hi5 is a professional matchmaking app for people who want to meet the right
                people, not collect connections. Co-founder, collaborator, mentor, investor or
                someone simply worth knowing.
              </p>
            </Reveal>
            <Reveal delay={240} className="hero-ctas">
              <a href="/signup" className="btn btn-primary btn-lg">
                Get started
              </a>
              <a href="#try" className="btn btn-glass btn-lg">
                <span aria-hidden="true">▶</span> Try it now
              </a>
            </Reveal>
            <Reveal delay={320} className="hero-stats">
              <div className="glass">
                <strong>5</strong>
                <span>people a day</span>
              </div>
              <div className="glass">
                <strong>2-way</strong>
                <span>interest to chat</span>
              </div>
              <div className="glass">
                <strong>0</strong>
                <span>cold messages</span>
              </div>
            </Reveal>
          </div>

          <Reveal direction="scale" delay={150} className="hero-visual">
            <Tilt max={7}>
              <div className="phones">
                <div className="phone phone-back">
                  <Image
                    src="/assets/landing/mockup-home-2.png"
                    alt=""
                    width={452}
                    height={677}
                    sizes="260px"
                  />
                </div>
                <div className="phone phone-front">
                  <Image
                    src="/assets/landing/mockup-home-1.png"
                    alt="The Hi5 home screen showing a profile card with Pass, Say Hi and More buttons"
                    width={456}
                    height={685}
                    sizes="320px"
                    priority
                  />
                </div>
                <div className="float-chip chip-a glass">
                  <span className="chip-dot" /> 87% match
                </div>
                <div className="float-chip chip-b glass">🙌 It&apos;s a match!</div>
                <div className="float-chip chip-c glass">👋 Say Hi</div>
              </div>
            </Tilt>
          </Reveal>
        </section>

        {/* ---------- Marquee ---------- */}
        <div className="marquee" aria-label="People you can meet on Hi5">
          <div className="marquee-track">
            {[...marquee, ...marquee].map((m, i) => (
              <span key={i} className="marquee-item">
                {m}
                <i aria-hidden="true">✦</i>
              </span>
            ))}
          </div>
        </div>

        {/* ---------- Without the noise ---------- */}
        <section id="why" className="section container-page">
          <Reveal className="section-head">
            <span className="eyebrow">Networking without the noise</span>
            <h2 className="h-section">
              Built around finding the <span className="text-gradient">right</span> connections.
            </h2>
            <p className="lead">
              Traditional professional networks are built around having as many connections as
              possible. Hi5 is built around finding the right ones.
            </p>
          </Reveal>

          <div className="versus">
            <Reveal direction="left" className="versus-card versus-old glass">
              <h3>The usual way</h3>
              <ul>
                {oldWay.map((t) => (
                  <li key={t}>
                    <span className="mark mark-no">✕</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="versus-vs" aria-hidden="true">
              VS
            </div>
            <Reveal direction="right" className="versus-card versus-new glass glass-strong">
              <h3>
                The <span className="text-gradient">Hi5</span> way
              </h3>
              <ul>
                {hi5Way.map((t) => (
                  <li key={t}>
                    <span className="mark mark-yes">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal className="saysteps">
            <p className="saysteps-intro">See someone interesting?</p>
            <div className="saysteps-row">
              <span className="saystep glass">Say Hi.</span>
              <span className="saystep-arrow">→</span>
              <span className="saystep glass">They say Hi too.</span>
              <span className="saystep-arrow">→</span>
              <span className="saystep saystep-win">It&apos;s a match.</span>
            </div>
            <p className="saysteps-foot">If not, nothing happens. Simple.</p>
          </Reveal>
        </section>

        {/* ---------- Try it ---------- */}
        <section id="try" className="section container-page">
          <div className="split">
            <Reveal direction="left" className="split-copy">
              <span className="eyebrow">Your Hi5</span>
              <h2 className="h-section">Five people. One decision each.</h2>
              <p className="lead">
                Networking shouldn&apos;t feel like scrolling through hundreds of strangers. Your
                Hi5 gives you a focused selection of people worth discovering.
              </p>
              <ul className="actions-list">
                <li>
                  <span className="action-badge">✕</span>
                  <div>
                    <strong>Pass</strong>
                    <p>They&apos;re not the right connection for you.</p>
                  </div>
                </li>
                <li>
                  <span className="action-badge action-hi">👋</span>
                  <div>
                    <strong>Say Hi</strong>
                    <p>You&apos;d be interested in talking.</p>
                  </div>
                </li>
                <li>
                  <span className="action-badge">•••</span>
                  <div>
                    <strong>More</strong>
                    <p>Learn about their experience, projects, goals and interests first.</p>
                  </div>
                </li>
              </ul>
              <p className="quiet">
                The goal isn&apos;t to see everyone. It&apos;s to find the few people who could
                actually matter.
              </p>
            </Reveal>
            <Reveal direction="right" className="split-visual">
              <TryHi5 />
            </Reveal>
          </div>
        </section>

        {/* ---------- Match with purpose ---------- */}
        <section id="goals" className="section container-page">
          <div className="split split-reverse">
            <Reveal direction="left" className="split-visual">
              <Tilt max={6}>
                <div className="showcase showcase-tall glass">
                  <Image
                    src="/assets/landing/Hi5 Discover and Filters UI.png"
                    alt="Hi5 Discover screen next to the filters screen"
                    width={1312}
                    height={1199}
                    sizes="(max-width: 900px) 92vw, 560px"
                  />
                </div>
              </Tilt>
            </Reveal>
            <Reveal direction="right" className="split-copy">
              <span className="eyebrow">Match with purpose</span>
              <h2 className="h-section">Your goals matter more than your job title.</h2>
              <p className="lead">
                Hi5 isn&apos;t just matching people by job title or industry. Tell Hi5 what
                you&apos;re looking for and discover people with compatible intentions.
              </p>
              <GoalExplorer />
            </Reveal>
          </div>
        </section>

        {/* ---------- Find your people ---------- */}
        <section className="section container-page">
          <Reveal className="section-head">
            <span className="eyebrow">Find your people</span>
            <h2 className="h-section">Whoever you need, they are on Hi5.</h2>
          </Reveal>
          <Reveal>
            <FindTabs />
          </Reveal>
        </section>

        {/* ---------- See why you fit ---------- */}
        <section className="section container-page">
          <div className="split">
            <Reveal direction="left" className="split-copy">
              <span className="eyebrow">See why you fit</span>
              <h2 className="h-section">A job title doesn&apos;t tell you who should talk.</h2>
              <p className="lead">
                Profiles can include skills, industries, experience, interests, projects, goals,
                location, availability, and what each person is hoping to find.
              </p>
              <p className="lead">
                Hi5 uses this to show how well two profiles align, so you understand why someone
                appeared in your Hi5 before you decide to connect.
              </p>
            </Reveal>
            <Reveal direction="right" className="split-visual">
              <MatchFit target={87} />
            </Reveal>
          </div>
        </section>

        {/* ---------- Your card ---------- */}
        <section className="section container-page">
          <Reveal className="section-head">
            <span className="eyebrow">Your Hi5 Card</span>
            <h2 className="h-section">
              Your introduction, <span className="text-gradient">before you say a word.</span>
            </h2>
            <p className="lead">
              Preview your card at any time to see how other people see you. No empty connection
              request. No generic &ldquo;I&apos;d like to add you to my professional network.&rdquo;
            </p>
          </Reveal>

          <ul className="card-items">
            {cardItems.map((c, i) => (
              <Reveal as="li" key={c} delay={i * 60} className="card-item glass glass-hover">
                <span className="card-item-tick">✓</span>
                {c}
              </Reveal>
            ))}
          </ul>

          <Reveal direction="scale" className="wide-showcase">
            <Tilt max={4}>
              <div className="showcase glass">
                <Image
                  src="/assets/landing/Glassmorphism Matches App Mockup.png"
                  alt="Hi5 matches list, a profile with match score, and private notes screen"
                  width={1536}
                  height={1024}
                  sizes="(max-width: 1180px) 92vw, 1100px"
                />
              </div>
            </Tilt>
          </Reveal>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how" className="section container-page">
          <Reveal className="section-head">
            <span className="eyebrow">How Hi5 works</span>
            <h2 className="h-section">Six simple steps from hello to conversation.</h2>
          </Reveal>
          <HowItWorks />
        </section>

        {/* ---------- Mutual interest ---------- */}
        <section className="section container-page">
          <div className="split">
            <Reveal direction="left" className="split-copy">
              <span className="eyebrow">Mutual interest first</span>
              <h2 className="h-section">
                A conversation begins when <span className="text-gradient">both people choose it.</span>
              </h2>
              <p className="lead">
                Hi5 doesn&apos;t believe access to someone&apos;s inbox should be for sale. Only
                after a match does messaging open. That means fewer cold pitches, fewer unwanted
                messages, and fewer conversations where only one person wants to be there.
              </p>
              <p className="pull">You both wanted to talk.</p>
            </Reveal>
            <Reveal direction="right" className="split-visual">
              <MutualFlow />
            </Reveal>
          </div>
        </section>

        {/* ---------- Who is it for ---------- */}
        <section id="for-you" className="section container-page">
          <Reveal className="section-head">
            <span className="eyebrow">Who is Hi5 for?</span>
            <h2 className="h-section">For people who believe the right connection can change what happens next.</h2>
          </Reveal>
          <div className="audience">
            {audience.map(([icon, title, text], i) => (
              <Reveal key={title} delay={(i % 4) * 70} className="audience-card glass glass-hover">
                <span className="audience-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- What you get ---------- */}
        <section className="section container-page">
          <Reveal className="section-head">
            <span className="eyebrow">What you get</span>
            <h2 className="h-section">Everything you need. Nothing you don&apos;t.</h2>
          </Reveal>
          <ul className="benefits">
            {benefits.map((b, i) => (
              <Reveal as="li" key={b} delay={(i % 3) * 80} className="benefit glass">
                <span className="mark mark-yes">✓</span>
                {b}
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ---------- Final call ---------- */}
        <section id="cta" className="section container-page">
          <Reveal direction="scale" className="cta glass glass-strong">
            <div className="cta-glow" aria-hidden="true" />
            <h2 className="h-section">
              Your network doesn&apos;t need to be bigger.
              <br />
              It needs to be <span className="text-gradient">better.</span>
            </h2>
            <p className="lead">Meet 5 people worth saying Hi to.</p>
            <div className="cta-buttons">
              <a href="/signup" className="btn btn-primary btn-lg">Get started</a>
              <a href="#try" className="btn btn-glass btn-lg">
                Try the demo again
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="footer container-page">
        <Logo height={32} />
        <p>Meet 5 people worth saying Hi to.</p>
        <p className="footer-small">© 2026 Hi5. Demo with made-up profiles.</p>
      </footer>
    </>
  );
}
