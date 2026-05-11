import { useEffect, useRef, useState, createElement } from 'react';
import { Icons, type IconName } from './icons';
import { CurtainThemeToggle, type ToggleTheme } from './ui/curtain-theme-toggle';
import { CpuArchitecture } from './ui/cpu-architecture';
import { useBookingModal } from './booking-modal-provider';

interface NavProps {
  theme: ToggleTheme;
  onThemeChange: (next: ToggleTheme) => void;
}

export function Nav({ theme, onThemeChange }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const { open: openBooking } = useBookingModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="#" className="brand">
          <span className="brand-mark">
            <CpuArchitecture className="brand-mark-cpu" />
            <img
              className="brand-mark-light"
              src="/assets/svps_TranWhite_Logo%20Only.svg"
              alt="SkyView"
              style={{ filter: 'invert(1)' }}
            />
            <img
              className="brand-mark-dark"
              src="/assets/svps_TranWhite_Logo%20Only.svg"
              alt="SkyView"
            />
          </span>
          <span className="brand-name">
            <b>SkyView</b> <span>Property Solutions</span>
          </span>
        </a>
        <div className="nav-links">
          <a className="nav-link" href="#services">Services</a>
          <a className="nav-link" href="#process">Process</a>
          <a className="nav-link" href="#proof">Projects</a>
          <a className="nav-link" href="#trust">Why SkyView</a>
        </div>
        <div className="nav-actions">
          <a className="nav-phone mono" href="tel:+12035550184" aria-label="Call SkyView">
            <span className="dot-on" /> (203) 555-0184
          </a>
          <CurtainThemeToggle theme={theme} onChange={onThemeChange} />
          <button
            type="button"
            className="btn btn-primary nav-cta"
            onClick={openBooking}
          >
            Book a walkthrough <Icons.Arrow size={12} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export function Services() {
  const items: Array<{ num: string; title: string; desc: string; icon: IconName }> = [
    { num: '01', title: 'Smart Home Integration',     desc: 'Lights, climate, audio, locks, and shades unified into one quiet ecosystem — operated from any device, in any room.',                  icon: 'Home' },
    { num: '02', title: 'Security & Access',          desc: 'Smart locks, intrusion alarms, and time-bound entry for guests, cleaners, and contractors. Every key revocable in seconds.',         icon: 'Lock' },
    { num: '03', title: 'Lighting & Shades',          desc: 'Architectural lighting and motorized shading, choreographed across rooms and times of day for circadian comfort.',                    icon: 'Bulb' },
    { num: '04', title: 'Networking & WiFi',          desc: 'Wired backbones, enterprise mesh, and silent failover so every device stays connected without you ever thinking about it.',           icon: 'Sensor' },
    { num: '05', title: 'Audio & Media',              desc: 'Multi-room audio and reference picture, hidden in the architecture, controlled with one elegant interface.',                          icon: 'AV' },
    { num: '06', title: 'Property Automation',        desc: 'Climate, irrigation, and routines that run themselves — wake, away, evening, sleep — coordinated across every system.',               icon: 'Thermo' },
    { num: '07', title: 'Surveillance Systems',       desc: 'AI camera coverage that distinguishes people, packages, and vehicles from leaves blowing across the driveway.',                       icon: 'Camera' },
    { num: '08', title: 'Remote Management',          desc: 'Live diagnostics, silent firmware care, and 24/7 oversight from our shop. We watch so the system stays sharp.',                       icon: 'Cloud' },
    { num: '09', title: 'Short-Term Rental Tech',     desc: 'Smart locks, noise sensors, and check-in flows that protect the asset between guests and keep five-star reviews coming.',             icon: 'Building' },
  ];

  // Card cursor tracking — sets CSS vars for the spotlight gradient. Pure
  // pointer geometry, no React state (avoids re-renders on every move).
  const trackPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <section className="section" id="services" data-screen-label="02 Capabilities">
      <div className="section-head">
        <div>
          <div className="eyebrow"><span className="pulse" />Integrated capabilities · 09</div>
          <h2>Nine systems.<br /><em>One integrated property.</em></h2>
        </div>
        <div className="right">
          Each system is designed, installed, and maintained in-house — wired and tuned by one team. So every part of the property speaks the same language, runs from the same app, and answers to the same number when something needs care.
        </div>
      </div>
      <div className="services">
        {items.map((it) => (
          <div
            className="service"
            key={it.num}
            onPointerMove={trackPointer}
          >
            <span className="service-num mono">{it.num}</span>
            <div className="service-icon">
              {Icons[it.icon] && createElement(Icons[it.icon])}
            </div>
            <h3 className="service-title">{it.title}</h3>
            <p className="service-desc">{it.desc}</p>
            <span className="service-link">
              Learn more <Icons.Arrow size={12} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Trust() {
  const pillars = [
    {
      metric: 'LOCAL',
      eyebrow: 'Connecticut-based support',
      title: 'Close enough to care.',
      body: 'We serve Connecticut homes and properties with a hands-on approach, clear communication, and support from people who understand the system behind your walls.',
    },
    {
      metric: 'FAST',
      eyebrow: 'Responsive service',
      title: 'Help when it matters.',
      body: 'When access, security, WiFi, or automation needs attention, you are not routed through a generic support queue. You speak with the team that understands your install.',
    },
    {
      metric: 'CLEAN',
      eyebrow: 'White-glove installation',
      title: 'Respect for the property.',
      body: 'Clean wiring, labeled systems, careful finishes, and a walkthrough that helps the household actually use what was installed.',
    },
    {
      metric: 'LONG-TERM',
      eyebrow: 'Designed to scale',
      title: 'Built beyond the first gadget.',
      body: 'We plan for future upgrades, documented runs, smarter controls, and a connected property ecosystem that can grow over time.',
    },
  ];

  // Reveal-on-scroll — cards fade up sequentially as they enter the viewport.
  // Replaces the cursor-spotlight pattern from the dashboard sections so this
  // section reads with a softer, slower, more atmospheric motion language.
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [revealed, setRevealed] = useState<boolean[]>(() => new Array(4).fill(false));
  useEffect(() => {
    const elements = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) {
              window.setTimeout(() => {
                setRevealed((prev) => {
                  if (prev[idx]) return prev;
                  const next = [...prev];
                  next[idx] = true;
                  return next;
                });
              }, idx * 140);
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section trust-section" id="trust" data-screen-label="03 Why SkyView">
      <div className="section-head">
        <div>
          <div className="eyebrow"><span className="pulse" />Why SkyView</div>
          <h2>Smart technology,<br /><em>installed with accountability.</em></h2>
          <p className="trust-script">local, reachable, built to last.</p>
        </div>
        <div className="right">
          We do more than install devices. We design connected systems that work together — security, networking, access, lighting, audio, climate, and control — then support them with the same team that built them.
        </div>
      </div>

      <div className="trust-grid">
        {pillars.map((p, i) => (
          <div
            ref={(el) => { cardRefs.current[i] = el; }}
            className={`trust-card ${revealed[i] ? 'is-revealed' : ''}`}
            key={p.metric}
            style={{ '--card-index': i } as React.CSSProperties}
          >
            <span className="trust-card-bar" aria-hidden="true" />
            <div className="trust-card-top">
              <span className="trust-metric mono">{p.metric}</span>
              <span className="trust-card-eyebrow">{p.eyebrow}</span>
            </div>
            <h3 className="trust-title">{p.title}</h3>
            <p className="trust-body">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="trust-team">
        <div className="trust-team-photos">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="trust-avatar" data-i={i} />
          ))}
        </div>
        <div className="trust-team-text">
          <p className="trust-team-quote">
            Meet the team that designs, installs, and supports every system —
            in-house from day one, no subcontractors, no handoffs.
          </p>
          <a className="service-link">
            See the team & licensing <Icons.Arrow size={12} />
          </a>
        </div>
      </div>
    </section>
  );
}

export function Proof() {
  return (
    <>
      <div className="proof-band">
        <div className="proof-inner">
          <span className="proof-label mono">Trusted by 1,200+ homeowners, brokerages &amp; STR hosts</span>
          <span className="proof-logo serif">Larkspur Realty</span>
          <span className="proof-logo condensed">NORTHBAY HOMES</span>
          <span className="proof-logo italic">Atelier Properties</span>
          <span className="proof-logo">MERIDIAN · STR</span>
          <span className="proof-logo serif">Cypress &amp; Oak</span>
          <span className="proof-logo condensed">HARBORLINE</span>
        </div>
      </div>
      <section className="section" id="proof" data-screen-label="04 Social proof">
        <div className="section-head">
          <div>
            <div className="eyebrow"><span className="pulse" />Owners, in their own words</div>
            <h2>Proof in the quiet of<br /><em>a system that just works.</em></h2>
          </div>
        </div>
        <div className="testimonial-grid">
          <div className="testimonial">
            <p className="testimonial-quote">
              "We replaced four apps and two installers with SkyView. Six months
              in, the house has been quieter than ever — and we finally trust the
              cameras to actually catch what they're supposed to."
            </p>
            <div className="testimonial-author">
              <div className="avatar" />
              <div>
                <p className="author-name">Maya Okafor</p>
                <p className="author-role mono">HOMEOWNER · MADISON, CT · CLIENT SINCE 2024</p>
              </div>
            </div>
          </div>
          <div className="metric-stack">
            <div className="metric-card">
              <div className="metric-num">38<small>%</small></div>
              <div className="metric-label">avg. lift in 3D-tour engagement vs flat photos</div>
            </div>
            <div className="metric-card">
              <div className="metric-num">22<small>%</small></div>
              <div className="metric-label">average year-one savings on energy bill</div>
            </div>
            <div className="metric-card">
              <div className="metric-num">4.9<small>/5</small></div>
              <div className="metric-label">install rating across 380 verified reviews</div>
            </div>
          </div>
        </div>
        <div className="testimonial-grid" style={{ marginTop: 24 }}>
          <div className="testimonial">
            <p className="testimonial-quote">
              "Our 3D tours from SkyView consistently out-perform flat-photo
              listings on time-to-offer. The first listing I used theirs on
              went under contract in nine days, $40k over ask."
            </p>
            <div className="testimonial-author">
              <div className="avatar" data-i="1" />
              <div>
                <p className="author-name">Daniel Reyes</p>
                <p className="author-role mono">REALTOR · LARKSPUR REALTY · GUILFORD, CT</p>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <p className="testimonial-quote">
              "Three short-term rentals across the shoreline, zero late-night
              calls about lockouts since SkyView took over access. The noise
              sensors alone have paid for themselves twice."
            </p>
            <div className="testimonial-author">
              <div className="avatar" data-i="2" />
              <div>
                <p className="author-name">Priya Shah</p>
                <p className="author-role mono">STR HOST · OLD SAYBROOK, CT · SINCE 2023</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function CTA() {
  const { open: openBooking } = useBookingModal();
  return (
    <section data-screen-label="05 CTA" id="cta">
      <div className="cta-band">
        <div className="cta-band-grid" />
        <div className="cta-band-glow" />
        <div className="cta-band-inner">
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span className="pulse" />FREE ON-SITE WALKTHROUGH
            </div>
            <h2>Map your home in 45 minutes.<br /><em>Live with it for ten years.</em></h2>
            <p>
              A SkyView design lead walks the property, documents the existing wiring,
              and emails a same-day plan with line-item pricing. No deposit. No pressure.
              You keep the plan whether you build with us or not.
            </p>
            <div className="cta-bullets">
              <div><span className="cta-check"><Icons.Check size={10} /></span> Same-day written plan</div>
              <div><span className="cta-check"><Icons.Check size={10} /></span> Line-item pricing, no surprise charges</div>
              <div><span className="cta-check"><Icons.Check size={10} /></span> No deposit to start</div>
            </div>
          </div>
          <div className="cta-actions">
            <button type="button" className="btn btn-cta btn-lg" onClick={openBooking}>
              Book a walkthrough <Icons.Arrow />
            </button>
            <button type="button" className="btn btn-outline-light btn-lg">
              Request a written quote
            </button>
            <span className="cta-meta mono">Typical reply within 2 business hours · M–F</span>
          </div>
        </div>
      </div>
      <footer className="footer mono">
        <span>© 2026 SkyView Property Solutions</span>
        <span className="footer-sep" />
        <span>CT HIC #0651234 · E-1 #190148</span>
        <span className="footer-sep" />
        <span>New Haven · Fairfield · Litchfield Counties</span>
        <span className="footer-sep" />
        <span>(203) 555-0184</span>
      </footer>
    </section>
  );
}
