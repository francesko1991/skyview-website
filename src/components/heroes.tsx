/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useState,
  useEffect,
  useRef,
  createElement,
  type CSSProperties,
} from 'react';
import { Icons } from './icons';
import { HoverButton } from './ui/hover-button';
import { useBookingModal } from './booking-modal-provider';

type HeroProps = { headline: string; lede: string; eyebrow: string };

// Live clock
function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
const fmtClock = (d: Date) => {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hh = String(h).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} ${ampm}`;
};
// Short form for casual readouts (e.g., "Auto-locked at 6:42 PM"). No seconds,
// no leading zero on the hour — matches how a phone status bar reads time.
const fmtTimeShort = (d: Date) => {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${mm} ${ampm}`;
};

// Cinematic smooth-scroll into a target element. easeInOutQuart for a slower
// entry, longer mid-flight hold, and softer landing than native smooth-scroll
// or easeInOutCubic. While the scroll runs, `body.is-explore-scrolling` is
// toggled so the global grid pattern can light up sky-blue as an environmental
// response (see styles.css). Falls back to instant jump under reduced motion.
function cinematicScrollTo(target: HTMLElement) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
    return;
  }
  const nav = document.querySelector<HTMLElement>('.nav');
  const navOffset = nav?.offsetHeight ?? 64;
  const startY = window.scrollY;
  const targetY = target.getBoundingClientRect().top + startY - navOffset - 14;
  const distance = targetY - startY;
  if (Math.abs(distance) < 4) return;

  const duration = 1400;
  const startTime = performance.now();
  // easeInOutQuart — quartic exponent for a more cinematic flight curve
  const ease = (x: number) =>
    x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;

  document.body.classList.add('is-explore-scrolling');

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    window.scrollTo(0, startY + distance * ease(t));
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // Hold the grid response a beat longer than the scroll so it fades out
      // as the destination settles, rather than snapping back on the last frame
      window.setTimeout(() => {
        document.body.classList.remove('is-explore-scrolling');
      }, 220);
    }
  };
  requestAnimationFrame(tick);
}

// === Hero v1 — split layout with live dashboard ===
export function HeroV1({ headline, lede, eyebrow }: HeroProps) {
  const t = useClock();
  const ref = useRef<HTMLDivElement | null>(null);
  const tiltTargetRef = useRef<HTMLDivElement | null>(null);
  const { open: openBooking } = useBookingModal();

  // Land the user on the live dashboard (the interactive skyview.app surface).
  // On mobile this scrolls down from the hero copy to the stacked dashboard;
  // on desktop where the dashboard already sits beside the copy, it nudges
  // the page so the dashboard reads as the focal point.
  const handleExplore = () => {
    const target = tiltTargetRef.current;
    if (target) cinematicScrollTo(target);
  };

  const [locked, setLocked] = useState(true);
  const [locking, setLocking] = useState(false);
  const toggleLock = () => {
    if (locking) return;
    setLocking(true);
    setTimeout(() => {
      setLocked((l) => !l);
      setLocking(false);
    }, 900);
  };

  // === Smart-home scripted scene state ===
  const [motion, setMotion] = useState<'idle' | 'motion' | 'cleared'>('idle');
  const [feedActive, setFeedActive] = useState(false);
  const [activeCam, setActiveCam] = useState<'front' | 'driveway'>('front');
  const [camSwitching, setCamSwitching] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [events, setEvents] = useState<Array<{ id: number; text: string; time: string }>>([]);
  const eventIdRef = useRef(0);
  const userOverrodeCamRef = useRef(false);
  const pushEvent = (text: string) => {
    const time = new Date();
    let h = time.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const hh = String(h).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    const id = ++eventIdRef.current;
    setEvents((prev) => [{ id, text, time: `${hh}:${mm} ${ampm}` }, ...prev].slice(0, 2));
  };

  const camTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const clearCamTimers = () => {
    camTimersRef.current.forEach(clearTimeout);
    camTimersRef.current = [];
  };

  const selectCam = (cam: 'front' | 'driveway') => {
    const sameCam = cam === activeCam;
    if (sameCam && cam !== 'driveway') return;

    clearCamTimers();

    if (!sameCam) {
      userOverrodeCamRef.current = true;
      setCamSwitching(true);
      setActiveCam(cam);
      setEvents([]);
      eventIdRef.current = 0;
      cycleSeededRef.current = false;
      setMotion('motion');
    }

    const after = (ms: number, fn: () => void) =>
      camTimersRef.current.push(setTimeout(fn, ms));

    if (!sameCam) {
      after(700, () => setCamSwitching(false));
      if (cam === 'driveway') {
        after(600, () => pushEvent('Vehicle detected · Driveway'));
        after(2400, () => pushEvent('Clip saved · 12s'));
      }
      after(5000, () => setMotion('cleared'));
      after(9000, () => setMotion('idle'));
    }

    if (cam === 'driveway') {
      setShowPush(false);
      after(900, () => setShowPush(true));
      after(3700, () => setShowPush(false));
    }
  };

  useEffect(() => {
    const ts: Array<ReturnType<typeof setTimeout>> = [];
    const at = (ms: number, fn: () => void) => ts.push(setTimeout(fn, ms));
    at(2000, () => setFeedActive(true));
    at(3000, () => setMotion('motion'));
    at(14000, () => {
      if (!userOverrodeCamRef.current) setMotion('cleared');
    });
    at(18000, () => {
      if (!userOverrodeCamRef.current) setMotion('idle');
    });
    return () => {
      ts.forEach(clearTimeout);
      clearCamTimers();
    };
  }, []);

  // === Realistic step-based human walk (rAF tick) ===
  const camTileRef = useRef<HTMLDivElement | null>(null);
  const figureRef = useRef<HTMLDivElement | null>(null);
  const detectBoxRef = useRef<HTMLDivElement | null>(null);
  const drivewayBgRef = useRef<HTMLDivElement | null>(null);
  const drivewayBoxRef = useRef<HTMLDivElement | null>(null);
  const legLRef = useRef<SVGGElement | null>(null);
  const legRRef = useRef<SVGGElement | null>(null);

  const [walkPhase, setWalkPhase] = useState<'enter' | 'step' | 'hold' | 'exit' | 'idle'>('idle');
  const [lingerActive, setLingerActive] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  void interpretation;
  const phaseRef = useRef<typeof walkPhase>('idle');
  const phaseStartRef = useRef(performance.now());
  const lingerRef = useRef(false);
  const cycleSeededRef = useRef(false);
  const cycleStartRef = useRef(performance.now());
  const cycleIdRef = useRef(0);

  const pushEventRef = useRef<((text: string) => void) | null>(null);
  const activeCamRef = useRef<'front' | 'driveway'>('front');
  const feedActiveRef = useRef(false);
  pushEventRef.current = pushEvent;
  activeCamRef.current = activeCam;
  feedActiveRef.current = feedActive;

  useEffect(() => {
    let raf: number;
    let bx = -300, by = 0;
    let microX = 0, microY = 0;
    let nextMicro = performance.now() + 2200 + Math.random() * 1800;

    let cycle: any = null;
    let cycleStart = 0;

    const STRIDE = 0;
    const LEG_EASE = 0.10;
    let legL = 0, legR = 0;
    let legLTarget = 0, legRTarget = 0;
    let lastSegIdx = -1;

    const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    const ease = (t: number) => t * t * (3 - 2 * t);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const measureFrame = () => {
      const el = camTileRef.current;
      return el ? el.getBoundingClientRect().width : 500;
    };

    const buildSegments = () => [
      { kind: 'hold' as const, dx: 0, dy: 0, dur: rand(11, 14), kind2: 'standing' as const },
    ];

    const planCycle = (now: number) => {
      const W = measureFrame();
      const standY = rand(-2, 6);
      const standScale = rand(0.96, 1.0);
      const standX = 0;
      const segments = buildSegments();
      const enterDur = rand(1.6, 2.2);
      const exitDur = rand(1.6, 2.2);
      const idleDur = rand(2.4, 3.6);
      const stand = { x: standX, y: standY, s: standScale };
      const waypoints = [stand];
      for (let i = 0; i < segments.length; i++) waypoints.push(stand);
      return {
        startTime: now,
        enterDur, exitDur, idleDur,
        frameW: W,
        p0: { x: standX, y: standY, s: standScale - 0.03 },
        p1: stand,
        segments,
        waypoints,
        pExit: { x: standX, y: standY, s: standScale - 0.02 },
      };
    };

    cycle = planCycle(performance.now());
    cycleStart = cycle.startTime;
    bx = cycle.p0.x;
    by = cycle.p0.y;

    const tick = (now: number) => {
      const t = (now - cycleStart) / 1000;
      const c = cycle;

      const tEnter = c.enterDur;
      let segTotal = 0;
      for (const s of c.segments) segTotal += s.dur;
      const tWalkEnd = tEnter + segTotal;
      const tExit = tWalkEnd + c.exitDur;
      const tIdle = tExit + c.idleDur;

      let pos: any = { x: 0, y: 0, s: 1 };
      let visible = 1;
      let phase: string = 'hold';

      if (t < tEnter) {
        const u = ease(t / c.enterDur);
        pos = {
          x: lerp(c.p0.x, c.p1.x, u),
          y: lerp(c.p0.y, c.p1.y, u),
          s: lerp(c.p0.s, c.p1.s, u),
          roll: 0,
        };
        visible = Math.min(1, t / (c.enterDur * 0.6));
        phase = 'enter';
      } else if (t < tWalkEnd) {
        let acc = tEnter;
        let segIdx = 0;
        for (segIdx = 0; segIdx < c.segments.length; segIdx++) {
          if (t < acc + c.segments[segIdx].dur) break;
          acc += c.segments[segIdx].dur;
        }
        const seg = c.segments[segIdx];
        const wpEnd = c.waypoints[segIdx + 1];

        if (segIdx !== lastSegIdx) {
          lastSegIdx = segIdx;
        }

        const ts = now * 0.001;
        const driftX = Math.sin(ts * 0.37) * (c.frameW * 0.18);
        const weightX = Math.sin(ts * 1.74) * 1.0 + Math.sin(ts * 0.99) * 0.4;
        const breathY = Math.sin(ts * 1.36) * 0.45;
        const swayRoll = Math.sin(ts * 1.21 + 0.7) * 0.55;
        pos = {
          x: wpEnd.x + driftX + weightX,
          y: wpEnd.y + breathY,
          s: wpEnd.s,
          sway: 0,
          roll: swayRoll,
        };
        phase = 'hold';
        visible = 1;
      } else if (t < tExit) {
        const u = ease((t - tWalkEnd) / c.exitDur);
        const last = c.waypoints[c.waypoints.length - 1];
        pos = {
          x: lerp(last.x, c.pExit.x, u),
          y: lerp(last.y, c.pExit.y, u),
          s: lerp(last.s, c.pExit.s, u),
          roll: 0,
        };
        pos.y += -Math.sin(u * Math.PI * 1.6) * 1.4;
        visible = Math.max(0, 1 - Math.max(0, (u - 0.55)) / 0.45);
        phase = 'exit';
      } else if (t < tIdle) {
        pos = { ...c.pExit, roll: 0 };
        visible = 0;
        phase = 'idle';
      } else {
        cycle = planCycle(now);
        cycleStart = cycle.startTime;
        bx = cycle.p0.x;
        by = cycle.p0.y;
        microX = 0;
        microY = 0;
        cycleIdRef.current++;
        pos = { ...cycle.p0, roll: 0 };
        visible = 0;
        phase = 'idle';
        lastSegIdx = -1;
        legLTarget = 0;
        legRTarget = 0;
      }

      if (phase === 'enter' || phase === 'exit' || phase === 'idle') {
        legLTarget = 0;
        legRTarget = 0;
      }
      legL += (legLTarget - legL) * LEG_EASE;
      legR += (legRTarget - legR) * LEG_EASE;

      const followFactor =
        phase === 'hold'  ? 0.18 :
        phase === 'step'  ? 0.06 :
        phase === 'enter' ? 0.09 :
        phase === 'exit'  ? 0.085 :
                            0.10;
      bx += (pos.x - bx) * followFactor;
      by += (pos.y - by) * followFactor;

      if (phase === 'hold') {
        microX *= 0.6;
        microY *= 0.6;
      } else if (now > nextMicro && visible > 0.4) {
        microX = (Math.random() - 0.5) * 1.4;
        microY = (Math.random() - 0.5) * 1.0;
        nextMicro = now + 2400 + Math.random() * 2400;
      }
      microX *= 0.92;
      microY *= 0.92;

      const prevPhase = phaseRef.current;
      if (prevPhase !== phase) {
        phaseRef.current = phase as typeof phaseRef.current;
        phaseStartRef.current = now;
        setWalkPhase(phase as typeof walkPhase);
        if (phase === 'idle') {
          cycleSeededRef.current = false;
          cycleStartRef.current = now;
          if (lingerRef.current) {
            lingerRef.current = false;
            setLingerActive(false);
            setInterpretation('');
          }
        }
        if (prevPhase === 'hold' && lingerRef.current) {
          lingerRef.current = false;
          setLingerActive(false);
          setInterpretation('');
        }
        if (phase === 'step' && !cycleSeededRef.current && activeCamRef.current === 'front') {
          if (pushEventRef.current) pushEventRef.current('Motion detected · Front door');
        }
      } else if (phase === 'hold' && !lingerRef.current) {
        const heldFor = (now - phaseStartRef.current) / 1000;
        if (heldFor >= 1.2) {
          lingerRef.current = true;
          setLingerActive(true);
          const x = pos.x;
          const interp =
            x < -10 ? 'Approaching entry' :
            x < 14  ? 'At front door' :
                      'Stationary near entrance';
          setInterpretation(interp);
          if (!cycleSeededRef.current && activeCamRef.current === 'front') {
            cycleSeededRef.current = true;
            const push = pushEventRef.current;
            if (push) {
              push('Person identified');
              const presenceStart = cycleStartRef.current;
              const cycleAtSchedule = cycleIdRef.current;
              const stillSameCycle = () =>
                cycleIdRef.current === cycleAtSchedule && activeCamRef.current === 'front';
              camTimersRef.current.push(setTimeout(() => {
                if (!stillSameCycle()) return;
                if (phaseRef.current !== 'hold' && phaseRef.current !== 'step') return;
                const presSec = Math.round((performance.now() - presenceStart) / 1000);
                if (pushEventRef.current) pushEventRef.current(`Presence sustained · ${presSec}s`);
              }, 4200));
              camTimersRef.current.push(setTimeout(() => {
                if (!stillSameCycle()) return;
                if (pushEventRef.current) pushEventRef.current('Clip saved · 12s');
              }, 8800));
            }
          }
        }
      }

      const subjX = pos.x + (pos.sway || 0);
      const subjY = pos.y;
      const subjS = pos.s;
      const subjRoll = pos.roll || 0;
      const sceneOn = feedActiveRef.current;
      const fig = figureRef.current;
      if (fig) {
        fig.style.transform = `translate3d(${subjX}px, ${subjY}px, 0) scale(${subjS})`;
        fig.style.opacity = sceneOn ? String(visible) : '0';
        const sil = fig.querySelector('.cam-figure-silhouette') as SVGElement | null;
        if (sil) sil.style.transform = `rotate(${subjRoll}deg)`;
      }
      const strideDiv = STRIDE || 1;
      const legLNorm = Math.max(-1, Math.min(1, legL / strideDiv));
      const legRNorm = Math.max(-1, Math.min(1, legR / strideDiv));
      if (legLRef.current) {
        legLRef.current.setAttribute('transform', `translate(${legL.toFixed(2)} 0)`);
        legLRef.current.style.opacity = (0.94 + 0.06 * legLNorm).toFixed(3);
      }
      if (legRRef.current) {
        legRRef.current.setAttribute('transform', `translate(${legR.toFixed(2)} 0)`);
        legRRef.current.style.opacity = (0.94 + 0.06 * legRNorm).toFixed(3);
      }
      const box = detectBoxRef.current;
      if (box) {
        box.style.transform = `translate3d(${bx + microX}px, ${by + microY}px, 0)`;
        box.style.opacity = sceneOn && visible > 0.15 ? '1' : '0';
      }
      if (activeCamRef.current === 'driveway') {
        const dbg = drivewayBgRef.current;
        if (dbg && dbg.style.transform) dbg.style.transform = '';
        const dbox = drivewayBoxRef.current;
        if (dbox && dbox.style.transform) dbox.style.transform = '';
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // === Confidence ticker ===
  const [confidence, setConfidence] = useState(0.92);
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const phase = phaseRef.current;
      const stable = phase === 'hold';
      setConfidence((prev) => {
        let target;
        if (phase === 'idle' || phase === 'exit') {
          target = 0;
        } else if (stable) {
          target = 0.945 + Math.random() * 0.018;
        } else {
          target = 0.91 + Math.random() * 0.022;
        }
        if (target === 0) return prev * 0.6;
        return prev + (target - prev) * 0.55;
      });
      id = setTimeout(tick, 580 + Math.random() * 380);
    };
    id = setTimeout(tick, 700);
    return () => clearTimeout(id);
  }, []);

  // Lock micro-toast
  const [lockToast, setLockToast] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (locking) return;
    setLockToast(true);
    const id = setTimeout(() => setLockToast(false), 2400);
    return () => clearTimeout(id);
  }, [locked, locking]);

  // Climate state — `climate` is the live room temperature (drifts toward
  // target each tick, simulating HVAC working). `targetTemp` is the user-set
  // value, adjustable via +/- buttons or by dragging the bar.
  const TEMP_MIN = 60;
  const TEMP_MAX = 80;
  const [climate, setClimate] = useState(68);
  const [targetTemp, setTargetTemp] = useState(70);
  const [thermoDragging, setThermoDragging] = useState(false);
  const targetTempRef = useRef(targetTemp);
  targetTempRef.current = targetTemp;

  // HVAC drift — every ~5s the room steps toward the target. When already
  // within ±1 of the target, drift randomly within that band so the
  // readout still feels live (real thermostats do exactly this).
  useEffect(() => {
    const id = setInterval(() => {
      setClimate((c) => {
        const target = targetTempRef.current;
        const diff = target - c;
        if (diff >= 1) return c + 1;
        if (diff <= -1) return c - 1;
        const drift = Math.random() > 0.5 ? 1 : -1;
        return Math.max(target - 1, Math.min(target + 1, c + drift));
      });
    }, 5200);
    return () => clearInterval(id);
  }, []);

  // HVAC mode — derived live from current vs target
  const hvacMode: 'heating' | 'cooling' | 'idle' =
    climate < targetTemp ? 'heating' :
    climate > targetTemp ? 'cooling' :
    'idle';
  const hvacLabel = hvacMode === 'heating' ? 'Heating' : hvacMode === 'cooling' ? 'Cooling' : 'Holding';

  // Bar slider interaction (pointer capture for drag-anywhere)
  const thermoBarRef = useRef<HTMLDivElement | null>(null);
  const setTargetFromPointer = (clientX: number) => {
    const rect = thermoBarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const next = Math.round(TEMP_MIN + pct * (TEMP_MAX - TEMP_MIN));
    setTargetTemp(next);
  };
  const onThermoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setThermoDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setTargetFromPointer(e.clientX);
  };
  const onThermoPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!thermoDragging) return;
    setTargetFromPointer(e.clientX);
  };
  const onThermoPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setThermoDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  const targetPct = ((targetTemp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;
  const adjustTarget = (delta: number) => {
    setTargetTemp((t) => Math.max(TEMP_MIN, Math.min(TEMP_MAX, t + delta)));
  };

  // Multi-mode control surface — climate / lighting / audio
  type TileMode = 'climate' | 'lighting' | 'audio';
  type LightingScene = 'welcome' | 'evening' | 'movie' | 'off';
  const [tileMode, setTileMode] = useState<TileMode>('climate');
  const [brightness, setBrightness] = useState(62);
  const [volume, setVolume] = useState(38);
  const [scene, setScene] = useState<LightingScene>('evening');

  // Brightness no longer drifts ambiently — it's user-driven via the scene
  // picker and the dimmer bar. The number and the glow respond directly.
  // Volume is fully user-driven now (transport buttons + draggable bar) so
  // ambient drift would just fight what the user set.

  const tileStatus =
    tileMode === 'climate' ? 'Comfort' :
    tileMode === 'lighting' ? scene.charAt(0).toUpperCase() + scene.slice(1) :
    'Now Playing';

  // Scenes are now just brightness presets — picking one drives brightness,
  // and the glow visualization derives from brightness, so dragging the
  // dimmer bar updates the bulb in real time too. One source of truth.
  const SCENE_BRIGHTNESS: Record<LightingScene, number> = {
    welcome: 88,
    evening: 62,
    movie:   24,
    off:     0,
  };

  // Bulb glow → live function of brightness. Linear mapping:
  //   brightness   0 → opacity 0.06, scale 0.50  (residual / "off")
  //   brightness 100 → opacity 1.00, scale 1.20  (full diffuse)
  const glowIntensity = 0.06 + (brightness / 100) * 0.94;
  const glowScale     = 0.50 + (brightness / 100) * 0.70;

  const handleSceneChange = (s: LightingScene) => {
    setScene(s);
    setBrightness(SCENE_BRIGHTNESS[s]);
  };

  // Dimmer bar — pointer-capture drag (matches the thermostat pattern)
  const [lightingDragging, setLightingDragging] = useState(false);
  const lightingBarRef = useRef<HTMLDivElement | null>(null);
  const setBrightnessFromPointer = (clientX: number) => {
    const rect = lightingBarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setBrightness(Math.round(pct * 100));
  };
  const onLightingPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setLightingDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setBrightnessFromPointer(e.clientX);
  };
  const onLightingPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lightingDragging) return;
    setBrightnessFromPointer(e.clientX);
  };
  const onLightingPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setLightingDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // ── Audio mode state ─────────────────────────────────────────────────────
  type AudioSource = 'sonos' | 'vinyl' | 'tv' | 'stream';
  type AudioZone = 'living' | 'kitchen' | 'patio';
  const TRACKS = [
    { name: 'Late Riser',       artist: 'Khruangbin' },
    { name: 'Maple Syrup',      artist: 'Khruangbin' },
    { name: 'Lavender',         artist: 'BADBADNOTGOOD' },
    { name: 'Cantaloupe Island', artist: 'Herbie Hancock' },
  ];
  const SOURCE_LABELS: Record<AudioSource, string> = {
    sonos: 'Sonos',
    vinyl: 'Vinyl',
    tv: 'TV',
    stream: 'Stream',
  };
  const ZONE_LABELS: Record<AudioZone, string> = {
    living: 'Living Room',
    kitchen: 'Kitchen',
    patio: 'Patio',
  };
  const ZONE_ORDER: AudioZone[] = ['living', 'kitchen', 'patio'];

  const [isPlaying, setIsPlaying] = useState(true);
  const [trackIdx, setTrackIdx] = useState(0);
  const [audioSource, setAudioSource] = useState<AudioSource>('sonos');
  const [audioZone, setAudioZone] = useState<AudioZone>('living');
  const currentTrack = TRACKS[trackIdx];

  const prevTrack = () => setTrackIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
  const nextTrack = () => setTrackIdx((i) => (i + 1) % TRACKS.length);
  const cycleZone = () => {
    setAudioZone((z) => ZONE_ORDER[(ZONE_ORDER.indexOf(z) + 1) % ZONE_ORDER.length]);
  };

  // Volume bar — drag with pointer capture
  const [audioDragging, setAudioDragging] = useState(false);
  const audioBarRef = useRef<HTMLDivElement | null>(null);
  const setVolumeFromPointer = (clientX: number) => {
    const rect = audioBarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(Math.round(pct * 100));
  };
  const onAudioPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setAudioDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setVolumeFromPointer(e.clientX);
  };
  const onAudioPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!audioDragging) return;
    setVolumeFromPointer(e.clientX);
  };
  const onAudioPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setAudioDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Auto re-lock after 6s if user unlocked
  useEffect(() => {
    if (!locked && !locking) {
      const id = setTimeout(() => setLocked(true), 6000);
      return () => clearTimeout(id);
    }
  }, [locked, locking]);

  const applyTilt = (x: number, y: number) => {
    const node = tiltTargetRef.current;
    if (!node) return;
    node.style.transform = `perspective(1600px) rotateY(${x * -2}deg) rotateX(${y * 2}deg)`;
  };
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    applyTilt((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => applyTilt(0, 0);

  return (
    <section className="hero hero-v1" data-screen-label="01 Hero / Split Dashboard">
      <div className="hero-grid-bg" />
      <div className="hero-glow" style={{ top: '-200px', right: '-200px' }} />
      <div className="hero-signal" aria-hidden="true">
        <span className="hero-signal-line" />
        <span className="hero-signal-pulse" />
      </div>

      <div className="left">
        <div className="eyebrow">
          <span className="pulse" />
          <span>{eyebrow || 'SkyView Property Solutions · 2026'}</span>
        </div>
        <h1 className="headline" dangerouslySetInnerHTML={{ __html: headline }} />
        <p className="lede">{lede}</p>
        <div className="cta-row">
          <HoverButton className="btn-primary btn-lg" onClick={openBooking}>
            Book a free walkthrough <Icons.Arrow />
          </HoverButton>
          <HoverButton
            className="btn-lg explore-cta"
            onClick={handleExplore}
            aria-label="Explore a connected home — scroll into the live dashboard"
          >
            <span className="explore-scan" aria-hidden />
            <span className="explore-text">Explore a connected home</span>
            <span className="explore-arrow" aria-hidden>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                {/* Dual chevron: phase-offset bob creates a "ripple downward"
                    that reads as descent into the experience, not a dropdown */}
                <path
                  className="explore-arrow-tip-1"
                  d="M3 4 L7 8 L11 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  className="explore-arrow-tip-2"
                  d="M3 12 L7 16 L11 12"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </HoverButton>
        </div>
        <div className="trust-row">
          <div className="item">
            <span className="item-index">01</span>
            <span className="item-title">Integrated Technology</span>
            <span className="item-desc">Built properly from the start</span>
          </div>
          <div className="item">
            <span className="item-index">02</span>
            <span className="item-title">Invisible Automation</span>
            <span className="item-desc">Technology designed to disappear into the space</span>
          </div>
          <div className="item">
            <span className="item-index">03</span>
            <span className="item-title">One Team. One System.</span>
            <span className="item-desc">Security, networking, audio, and control</span>
          </div>
        </div>
      </div>

      <div
        className="right"
        ref={(node) => {
          ref.current = node;
          tiltTargetRef.current = node;
        }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform: 'perspective(1600px) rotateY(0deg) rotateX(0deg)',
          transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)',
          willChange: 'transform',
        }}
      >
        <div className="dash-frame">
          {showPush && (
            <div className="dash-push" role="status" aria-live="polite">
              <div className="dash-push-app">
                <div className="dash-push-app-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l9 4v6c0 4.5-3.5 7.5-9 8-5.5-.5-9-3.5-9-8V7l9-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="dash-push-app-name">SkyView</div>
                <div className="dash-push-time">now</div>
              </div>
              <div className="dash-push-title">Person detected at driveway</div>
              <div className="dash-push-sub">Tap to view live · clip saved to cloud</div>
            </div>
          )}

          <div className="dash-frame-bar">
            <div className="dash-frame-dots">
              <span className="is-active" /><span /><span />
            </div>
            <div className="dash-frame-title">
              <span className="mono dash-frame-host">
                skyview<span className="dash-frame-tld">.app</span>
              </span>
              <span className="dash-frame-sub">/ home / 412 larkspur</span>
            </div>
            <div className="dash-frame-meta mono">
              <span className="dash-frame-live" aria-hidden />
              {fmtClock(t)}
            </div>
          </div>

          <div className="dash">
            <div ref={camTileRef} className={`tile tile-camera ${camSwitching ? 'is-switching' : ''} cam-on-${activeCam}`}>
              <div className={`cam-feed cam-feed-front ${activeCam === 'front' ? 'is-active' : ''}`}>
                <div
                  ref={figureRef}
                  className={`cam-figure ${feedActive ? 'is-visible' : ''} ${(walkPhase === 'step' || walkPhase === 'enter') ? 'is-walking' : ''}`}
                  aria-hidden="true"
                  style={{
                    transform: 'translate3d(-300px, 0, 0) scale(0.96)',
                    opacity: 0,
                    willChange: 'transform, opacity',
                  }}
                >
                  <div className="cam-figure-glow" />
                  <svg className="cam-figure-svg" viewBox="35 65 30 135" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <defs>
                      <radialGradient id="silhouetteFill" cx="50" cy="125" r="62" gradientUnits="userSpaceOnUse">
                        <stop offset="0%"   stopColor="oklch(0.09 0.003 260)" stopOpacity="1.00" />
                        <stop offset="50%"  stopColor="oklch(0.14 0.005 260)" stopOpacity="0.96" />
                        <stop offset="85%"  stopColor="oklch(0.22 0.007 260)" stopOpacity="0.86" />
                        <stop offset="100%" stopColor="oklch(0.30 0.008 260)" stopOpacity="0.70" />
                      </radialGradient>
                      <filter id="silhouetteBlur" x="-30%" y="-30%" width="160%" height="160%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="edgeNoise" />
                        <feDisplacementMap in="SourceGraphic" in2="edgeNoise" scale="0.9" result="displaced" />
                        <feComponentTransfer in="displaced" result="cohesive">
                          <feFuncA type="gamma" amplitude="1" exponent="0.4" offset="0" />
                        </feComponentTransfer>
                        <feGaussianBlur in="cohesive" stdDeviation="2.6 3.0" result="blurred" />
                        <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="1" seed="11" result="grain" />
                        <feColorMatrix in="grain" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" result="grainAlpha" />
                        <feComposite in="grainAlpha" in2="blurred" operator="in" result="grainMasked" />
                        <feMerge>
                          <feMergeNode in="blurred" />
                          <feMergeNode in="grainMasked" />
                        </feMerge>
                      </filter>
                      <filter id="feetShadow" x="-50%" y="-100%" width="200%" height="400%">
                        <feGaussianBlur stdDeviation="2.6" />
                      </filter>
                      <radialGradient id="silhouetteMask" cx="50%" cy="50%" r="60%">
                        <stop offset="0%"   stopColor="white" stopOpacity="1" />
                        <stop offset="70%"  stopColor="white" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                      </radialGradient>
                      <mask id="silhouetteEdgeMask">
                        <rect x="35" y="65" width="30" height="135" fill="url(#silhouetteMask)" />
                      </mask>
                    </defs>
                    <ellipse cx="50" cy="171" rx="10" ry="1.8" fill="oklch(0.05 0 0)" opacity="0.5" filter="url(#feetShadow)" />
                    <g className="cam-figure-silhouette" filter="url(#silhouetteBlur)" fill="#000" mask="url(#silhouetteEdgeMask)">
                      <ellipse cx="50" cy="83" rx="7.5" ry="8" />
                      <path d="M 47.5 90 Q 50 92, 52.5 90 L 52.5 95 Q 50 96, 47.5 95 Z" />
                      <path d="M 38.5 95 C 37.5 104, 37.5 113, 42.5 119 C 42.5 127, 41.5 132, 41 136 Q 50 138, 59 136 C 58.5 132, 57.5 127, 57.5 119 C 62.5 113, 62.5 104, 61.5 95 C 60 92, 56 91, 50 91 C 44 91, 40 92, 38.5 95 Z" />
                      <path d="M 38.5 95 C 37 102, 36 112, 36 128 Q 36 132, 38 132 C 38.5 122, 39.5 112, 40 97 Z" />
                      <path d="M 61.5 95 C 63 102, 64 112, 64 128 Q 64 132, 62 132 C 61.5 122, 60.5 112, 60 97 Z" />
                      <g ref={legLRef} className="cam-leg cam-leg-l">
                        <path d="M 41 135 L 44 168 Q 46.5 169, 48.5 168 L 49.9 135 Q 45 133, 41 135 Z" />
                      </g>
                      <g ref={legRRef} className="cam-leg cam-leg-r">
                        <path d="M 50.1 135 L 51.5 168 Q 53.5 169, 56 168 L 59 135 Q 55 133, 50.1 135 Z" />
                      </g>
                    </g>
                  </svg>
                </div>
                <div className="cam-grain" aria-hidden="true" />
                <div className="cam-vignette" aria-hidden="true" />
              </div>
              <div className={`cam-feed cam-feed-driveway ${activeCam === 'driveway' ? 'is-active' : ''}`}>
                <div className="cam-driveway-path" />
                <div ref={drivewayBgRef} className="cam-driveway-bg" aria-hidden="true" style={{ willChange: 'transform' }}>
                  <svg className="cam-driveway-car" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <defs>
                      <linearGradient id="carFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%"   stopColor="oklch(0.07 0.004 250)" stopOpacity="0.92" />
                        <stop offset="55%"  stopColor="oklch(0.12 0.006 250)" stopOpacity="0.90" />
                        <stop offset="100%" stopColor="oklch(0.20 0.008 250)" stopOpacity="0.86" />
                      </linearGradient>
                      <filter id="carBlur" x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur stdDeviation="1.5 1.7" />
                      </filter>
                      <filter id="carGround" x="-50%" y="-100%" width="200%" height="400%">
                        <feGaussianBlur stdDeviation="2.0" />
                      </filter>
                    </defs>
                    <ellipse cx="50" cy="56" rx="40" ry="2.5" fill="oklch(0.04 0 0)" opacity="0.55" filter="url(#carGround)" />
                    <path d="M 32 12 Q 32 8, 50 8 Q 68 8, 68 12 L 70 18 Q 75 23, 80 30 Q 86 38, 88 44 L 88 50 Q 89 56, 86 56 L 14 56 Q 11 56, 12 50 L 12 44 Q 14 38, 20 30 Q 25 23, 30 18 L 32 12 Z" fill="url(#carFill)" filter="url(#carBlur)" />
                    <ellipse cx="50" cy="20" rx="13" ry="5.5" fill="oklch(0.04 0 0)" opacity="0.42" filter="url(#carBlur)" />
                  </svg>
                </div>
                <div className="cam-grain" aria-hidden="true" />
                <div className="cam-vignette" aria-hidden="true" />
              </div>
              <div className="cam-scanline" />

              <div className="cam-selector" role="tablist" aria-label="Choose camera">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCam === 'front'}
                  className={`cam-selector-opt ${activeCam === 'front' ? 'is-active' : ''}`}
                  onClick={() => selectCam('front')}
                >
                  Front Door
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCam === 'driveway'}
                  className={`cam-selector-opt ${activeCam === 'driveway' ? 'is-active' : ''}`}
                  onClick={() => selectCam('driveway')}
                >
                  Driveway
                </button>
                <span
                  className="cam-selector-thumb"
                  style={{ transform: activeCam === 'driveway' ? 'translateX(100%)' : 'translateX(0)' }}
                  aria-hidden="true"
                />
              </div>

              {feedActive && activeCam === 'front' && (
                <>
                  <div
                    ref={detectBoxRef}
                    className="cam-detect cam-detect-front"
                    style={{
                      transform: 'translate3d(-300px, 0, 0)',
                      opacity: 0,
                      willChange: 'transform, opacity',
                    } as CSSProperties}
                  >
                    <span className="cam-detect-corner cam-detect-corner-tl" />
                    <span className="cam-detect-corner cam-detect-corner-tr" />
                    <span className="cam-detect-corner cam-detect-corner-bl" />
                    <span className="cam-detect-corner cam-detect-corner-br" />
                    <span className={`cam-detect-linger ${lingerActive ? 'is-on' : ''}`}>
                      Presence sustained
                    </span>
                  </div>
                  {/* Static AI status panel — anchored to the camera viewport's
                      lower-right corner, OUTSIDE the detection box. Doesn't track
                      the figure; reads as a fixed corner readout (Verkada/Eufy
                      convention). */}
                  <span className="cam-detect-label">
                    person · {confidence > 0.05 ? confidence.toFixed(2) : '—'}
                  </span>
                </>
              )}
              {activeCam === 'driveway' && (
                <>
                  <div ref={drivewayBoxRef} className="cam-detect cam-detect-driveway" style={{ willChange: 'transform' }}>
                    <span className="cam-detect-corner cam-detect-corner-tl" />
                    <span className="cam-detect-corner cam-detect-corner-tr" />
                    <span className="cam-detect-corner cam-detect-corner-bl" />
                    <span className="cam-detect-corner cam-detect-corner-br" />
                  </div>
                  <span className="cam-detect-label">vehicle · 0.91</span>
                </>
              )}

              <div className="cam-badge cam-badge-status">
                <span className="cam-badge-dot" />
                <span>All systems online</span>
              </div>

              <div className="cam-overlay">
                <div className="cam-top">
                  <span className="cam-label">
                    <span className="rec" />
                    LIVE · {activeCam === 'front' ? 'FRONT DOOR' : 'DRIVEWAY'}
                    <span className="cam-time-inline">{fmtClock(t)}</span>
                  </span>
                </div>
                <div className="cam-bottom">
                  <div>
                    <div className="cam-name">
                      {activeCam === 'front' ? 'Front Entrance · 4K' : 'Driveway · 4K'}
                    </div>
                    <div className="cam-meta" style={{ textAlign: 'left', marginTop: 4 }}>
                      Recording · 14-day cloud
                    </div>
                  </div>
                  {(motion !== 'idle' || walkPhase === 'idle' || !feedActive || activeCam !== 'front') && (
                    <div
                      className={`cam-badge cam-badge-feed cam-badge-feed-${motion}`}
                      key={motion}
                      style={{ padding: '4px 9px', fontSize: '9.5px', gap: '6px', justifyContent: 'flex-start' }}
                    >
                      <span className="cam-feed-icon" aria-hidden="true">
                        {motion === 'motion' ?
                          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="currentColor" /></svg> :
                          motion === 'cleared' ?
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg> :
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" /></svg>
                        }
                      </span>
                      <span className="cam-feed-text">
                        {motion === 'motion' ? `Motion detected · ${activeCam === 'front' ? 'front door' : 'driveway'}` :
                          motion === 'cleared' ? 'Clear' :
                            'No activity'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <ul className="cam-timeline" aria-label="Recent events">
                {events.map((ev, i) => (
                  <li key={ev.id} className="cam-timeline-item" style={{ '--i': i } as CSSProperties}>
                    <span className="cam-timeline-dot" />
                    <span className="cam-timeline-text">{ev.text}</span>
                    <span className="cam-timeline-time">{ev.time}</span>
                  </li>
                ))}
              </ul>

              <div className="cam-switch-flash" aria-hidden="true" />
            </div>

            <button
              className={`tile tile-lock ${locked ? 'is-locked' : 'is-unlocked'} ${locking ? 'is-pending' : ''}`}
              onClick={toggleLock}
              aria-label={locked ? 'Unlock front door' : 'Lock front door'}
            >
              <div className="tile-head">
                <span className="tile-title">Front Door</span>
                <span className={`tile-status ${locked ? '' : 'warn'}`}>
                  <span className="status-dot" />
                  {locking ? 'Working…' : locked ? 'Secured' : 'Unlocked'}
                </span>
              </div>
              <div className="lock-stage">
                <div className="lock-rings" aria-hidden="true">
                  <span /><span /><span />
                </div>
                <div className="lock-icon-lg">
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <rect x="9" y="20" width="26" height="17" rx="3" stroke="currentColor" strokeWidth="2" />
                    <path className="lock-shackle" d="M14 20v-7a8 8 0 0 1 16 0v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <circle cx="22" cy="28" r="2" fill="currentColor" />
                    <line x1="22" y1="30" x2="22" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="lock-text">
                <p className="lock-state">{locking ? 'Engaging lock…' : locked ? 'Auto-locked' : 'Tap to lock'}</p>
                <p className="lock-meta">{locked ? `${fmtTimeShort(t)} · Maya · iPhone` : 'Front door · ready'}</p>
              </div>
              {lockToast && (
                <div className="lock-micro-toast" key={locked ? 'locked' : 'unlocked'}>
                  <span className="lock-micro-dot" />
                  <span>{locked ? 'Auto-locked' : 'Unlocked'}</span>
                </div>
              )}
              <div className="lock-tap-hint mono">{locked ? 'Tap to unlock' : 'Tap to lock'} →</div>
            </button>

            <div className={`tile tile-climate tile-control is-mode-${tileMode}`}>
              <div className="tile-head">
                <span className="tile-title">Living Room</span>
                <span className="tile-status">
                  <span className="tile-status-pulse" aria-hidden="true" />
                  {tileStatus}
                </span>
              </div>

              {/* Mode selector — Climate / Lighting / Audio */}
              <div className="tile-mode-tabs" role="tablist" aria-label="Control mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tileMode === 'climate'}
                  className={`tile-mode-tab ${tileMode === 'climate' ? 'is-active' : ''}`}
                  onClick={() => setTileMode('climate')}
                >Climate</button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tileMode === 'lighting'}
                  className={`tile-mode-tab ${tileMode === 'lighting' ? 'is-active' : ''}`}
                  onClick={() => setTileMode('lighting')}
                >Lighting</button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tileMode === 'audio'}
                  className={`tile-mode-tab ${tileMode === 'audio' ? 'is-active' : ''}`}
                  onClick={() => setTileMode('audio')}
                >Audio</button>
                <span
                  className="tile-mode-thumb"
                  style={{
                    transform:
                      tileMode === 'lighting' ? 'translateX(100%)' :
                      tileMode === 'audio' ? 'translateX(200%)' :
                      'translateX(0)',
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Mode panel — re-keyed on mode change so the fade-in fires */}
              <div className="mode-panel" key={tileMode}>
                {tileMode === 'climate' && (
                  <>
                    <div className="climate-row">
                      <div className="climate-temp climate-temp-current">
                        {/* Primary: live room temperature. Keyed on value so
                            each HVAC step triggers the digit-settle animation. */}
                        <span className="climate-num" key={climate}>{climate}</span><sup>°F</sup>
                      </div>
                      {/* Secondary: target temperature with [-] [+] adjusters */}
                      <div className="climate-target" aria-label="Target temperature">
                        <button
                          type="button"
                          className="climate-target-btn"
                          onClick={() => adjustTarget(-1)}
                          aria-label="Lower target temperature"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </button>
                        <div className="climate-target-value">
                          <span className="climate-target-num" key={targetTemp}>
                            {targetTemp}<sup>°</sup>
                          </span>
                          <span className="climate-target-label">Set</span>
                        </div>
                        <button
                          type="button"
                          className="climate-target-btn"
                          onClick={() => adjustTarget(1)}
                          aria-label="Raise target temperature"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="climate-chips">
                      <span className={`climate-chip climate-hvac climate-hvac-${hvacMode}`}>
                        <span className="climate-hvac-dot" />
                        {hvacLabel}
                      </span>
                      <span className="climate-chip"><span className="cc-k">HUM</span> 42%</span>
                      <span className="climate-chip"><span className="cc-k">FAN</span> Auto</span>
                    </div>
                    <div
                      ref={thermoBarRef}
                      className={`climate-bar climate-bar-thermo ${thermoDragging ? 'is-dragging' : ''}`}
                      role="slider"
                      aria-label="Target temperature"
                      aria-valuemin={TEMP_MIN}
                      aria-valuemax={TEMP_MAX}
                      aria-valuenow={targetTemp}
                      tabIndex={0}
                      onPointerDown={onThermoPointerDown}
                      onPointerMove={onThermoPointerMove}
                      onPointerUp={onThermoPointerUp}
                      onPointerCancel={onThermoPointerUp}
                    >
                      <div className="climate-bar-fill" style={{ width: `${targetPct}%` }} />
                      <div className="climate-bar-pin" style={{ left: `calc(${targetPct}% - 1px)` }} />
                    </div>
                  </>
                )}

                {tileMode === 'lighting' && (
                  <>
                    <div className="climate-row">
                      <div className="climate-temp">
                        <span className="climate-num" key={brightness}>{brightness}</span><sup>%</sup>
                      </div>
                      {/* Glow responds to the active scene — opacity drives perceived
                          intensity, transform: scale drives the diffusion spread.
                          Both transition smoothly between scenes; the inner SVG carries
                          the constant 4s breath so the two motions compose cleanly. */}
                      <div
                        className="lighting-glow"
                        style={{
                          opacity: glowIntensity,
                          transform: `scale(${glowScale})`,
                        }}
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 60 36" preserveAspectRatio="none">
                          <defs>
                            <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
                              <stop offset="55%" stopColor="currentColor" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="bulbCore" cx="50%" cy="50%" r="22%">
                              <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </radialGradient>
                          </defs>
                          <ellipse cx="30" cy="18" rx="26" ry="15" fill="url(#bulbGlow)" />
                          <ellipse cx="30" cy="18" rx="9" ry="5.5" fill="url(#bulbCore)" />
                        </svg>
                      </div>
                    </div>
                    <div className="climate-chips lighting-scenes">
                      {(['welcome', 'evening', 'movie', 'off'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`climate-chip scene-chip ${scene === s ? 'is-active' : ''}`}
                          onClick={() => handleSceneChange(s)}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div
                      ref={lightingBarRef}
                      className={`climate-bar lighting-bar ${lightingDragging ? 'is-dragging' : ''}`}
                      role="slider"
                      aria-label="Brightness"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={brightness}
                      tabIndex={0}
                      onPointerDown={onLightingPointerDown}
                      onPointerMove={onLightingPointerMove}
                      onPointerUp={onLightingPointerUp}
                      onPointerCancel={onLightingPointerUp}
                    >
                      <div className="lighting-bar-fill" style={{ width: `${brightness}%` }} />
                      <div className="climate-bar-pin" style={{ left: `calc(${brightness}% - 1px)` }} />
                    </div>
                  </>
                )}

                {tileMode === 'audio' && (
                  <>
                    <div className="climate-row">
                      <div className="audio-track">
                        {/* Track name re-keyed on prev/next so the change settles in */}
                        <span className="audio-track-name" key={trackIdx}>
                          {currentTrack.name}
                        </span>
                        <span className="audio-track-artist">
                          {currentTrack.artist} · <span className="audio-zone">{ZONE_LABELS[audioZone]}</span>
                        </span>
                      </div>
                      <div
                        className={`audio-eq ${isPlaying ? 'is-playing' : 'is-paused'}`}
                        aria-hidden="true"
                      >
                        <span /><span /><span /><span /><span /><span /><span />
                      </div>
                    </div>

                    {/* Transport row — prev / play-pause / next, plus zone toggle */}
                    <div className="audio-transport">
                      <button
                        type="button"
                        className="audio-transport-btn"
                        onClick={prevTrack}
                        aria-label="Previous track"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M3 2v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M12 2v10L4.5 7L12 2z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`audio-transport-btn audio-transport-play ${isPlaying ? 'is-playing' : ''}`}
                        onClick={() => setIsPlaying((p) => !p)}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                        aria-pressed={isPlaying}
                      >
                        {isPlaying ? (
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <rect x="3" y="2" width="2.6" height="10" rx="0.4" fill="currentColor" />
                            <rect x="8.4" y="2" width="2.6" height="10" rx="0.4" fill="currentColor" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <path d="M3.5 2L11.5 7L3.5 12V2z" fill="currentColor" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        className="audio-transport-btn"
                        onClick={nextTrack}
                        aria-label="Next track"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M11 2v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M2 2v10L9.5 7L2 2z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="audio-zone-btn"
                        onClick={cycleZone}
                        aria-label="Switch zone"
                      >
                        <span className="audio-zone-dot" />
                        <span className="audio-zone-label" key={audioZone}>{ZONE_LABELS[audioZone]}</span>
                      </button>
                    </div>

                    {/* Source selector — Sonos / Vinyl / TV / Stream */}
                    <div className="climate-chips audio-sources">
                      {(['sonos', 'vinyl', 'tv', 'stream'] as const).map((src) => (
                        <button
                          key={src}
                          type="button"
                          className={`climate-chip scene-chip ${audioSource === src ? 'is-active' : ''}`}
                          onClick={() => setAudioSource(src)}
                        >
                          {SOURCE_LABELS[src]}
                        </button>
                      ))}
                    </div>

                    {/* Draggable volume slider */}
                    <div
                      ref={audioBarRef}
                      className={`climate-bar audio-bar ${audioDragging ? 'is-dragging' : ''}`}
                      role="slider"
                      aria-label="Volume"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={volume}
                      tabIndex={0}
                      onPointerDown={onAudioPointerDown}
                      onPointerMove={onAudioPointerMove}
                      onPointerUp={onAudioPointerUp}
                      onPointerCancel={onAudioPointerUp}
                    >
                      <div className="audio-bar-fill" style={{ width: `${volume}%` }} />
                      <div className="climate-bar-pin" style={{ left: `calc(${volume}% - 1px)` }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {!locked && (
          <div className="event-toast">
            <span className="event-dot" />
            <span className="mono">Front door unlocked · auto-lock in 6s</span>
          </div>
        )}
      </div>
    </section>
  );
}

// === Hero v2 — Floor plan with hotspots ===
export function HeroV2({ headline, lede, eyebrow }: HeroProps) {
  const [active, setActive] = useState(2);
  const hotspots: Array<{ id: number; x: number; y: number; label: string; icon: keyof typeof Icons }> = [
    { id: 0, x: 14, y: 28, label: '4K Camera · Front', icon: 'Camera' },
    { id: 1, x: 36, y: 18, label: 'Smart Lock · Entry', icon: 'Lock' },
    { id: 2, x: 56, y: 52, label: 'AV · Living Room', icon: 'AV' },
    { id: 3, x: 78, y: 30, label: 'Thermostat · Hub', icon: 'Thermo' },
    { id: 4, x: 82, y: 72, label: 'Sensor · Patio', icon: 'Sensor' },
    { id: 5, x: 28, y: 70, label: 'Camera · Driveway', icon: 'Camera' },
  ];

  return (
    <section className="hero hero-v2" data-screen-label="01 Hero / Floor Plan">
      <div className="top">
        <div className="left">
          <div className="eyebrow"><span className="pulse" />{eyebrow || 'Connected home, mapped'}</div>
          <h1 className="headline" dangerouslySetInnerHTML={{ __html: headline }} />
          <p className="lede">{lede}</p>
        </div>
        <div className="right">
          <HoverButton className="btn-primary btn-lg">Map my home <Icons.Arrow /></HoverButton>
          <HoverButton className="btn-lg"><Icons.Play /> See it work</HoverButton>
        </div>
      </div>

      <div className="floorplan-wrap">
        <div className="floorplan-grid" />
        <svg className="fp-svg" viewBox="0 0 1000 460" preserveAspectRatio="xMidYMid meet">
          <path className="fp-wall" d="M40 60 H960 V400 H40 Z" />
          <line className="fp-wall" x1="40" y1="220" x2="380" y2="220" />
          <line className="fp-wall" x1="380" y1="60" x2="380" y2="280" />
          <line className="fp-wall" x1="380" y1="280" x2="700" y2="280" />
          <line className="fp-wall" x1="700" y1="60" x2="700" y2="400" />
          <line className="fp-wall" x1="700" y1="200" x2="960" y2="200" />
          <text className="fp-label" x="60" y="90">FOYER</text>
          <text className="fp-label" x="60" y="250">KITCHEN</text>
          <text className="fp-label" x="400" y="90">LIVING</text>
          <text className="fp-label" x="400" y="310">DINING</text>
          <text className="fp-label" x="720" y="90">BEDROOM</text>
          <text className="fp-label" x="720" y="230">BATH</text>
          <text className="fp-label" x="720" y="310">PATIO</text>
        </svg>

        {hotspots.map((h) => (
          <div
            key={h.id}
            className={`hotspot ${active === h.id ? 'active' : ''}`}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            onMouseEnter={() => setActive(h.id)}
            onClick={() => setActive(h.id)}
          >
            {Icons[h.icon] && createElement(Icons[h.icon], { size: 14 })}
            <span className="ring" />
            <span className="hotspot-label">{h.label}</span>
          </div>
        ))}

        <div className="fp-foot">
          <div className="fp-stats">
            <span><b>06</b>&nbsp;DEVICES</span>
            <span><b>04</b>&nbsp;ROOMS</span>
            <span><b>1,840</b>&nbsp;FT²</span>
          </div>
          <div className="fp-status">
            <span className="fp-status-dot" />
            All systems online · sync 7:42 PM
          </div>
        </div>
      </div>
    </section>
  );
}

// === Hero v3 — editorial, layered glass cards ===
export function HeroV3({ headline, lede, eyebrow }: HeroProps) {
  const t = useClock();
  return (
    <section className="hero hero-v3" data-screen-label="01 Hero / Editorial">
      <div className="hero-grid-bg" />
      <div className="hero-glow" style={{ top: '10%', left: '50%', transform: 'translateX(-50%)' }} />
      <div className="eyebrow" style={{ justifyContent: 'center', display: 'flex' }}>
        <span className="pulse" />
        <span>{eyebrow || 'The connected home, refined'}</span>
      </div>
      <h1 className="headline" dangerouslySetInnerHTML={{ __html: headline }} />
      <p className="lede">{lede}</p>
      <div className="cta-row">
        <HoverButton className="btn-primary btn-lg">Start your design plan <Icons.Arrow /></HoverButton>
        <HoverButton className="btn-lg"><Icons.Play /> 90-second overview</HoverButton>
      </div>

      <div className="scene">
        <div className="scene-stage">
          <div className="scene-photo" />
        </div>

        <div className="scene-card scene-glass" style={{ left: '4%', top: '14%', width: 240 }}>
          <div className="tile-head">
            <span className="tile-title"><Icons.Camera size={12} />&nbsp; LIVE FEED</span>
            <span className="tile-status">Online</span>
          </div>
          <div style={{
            height: 100, borderRadius: 8, marginTop: 6,
            background: 'linear-gradient(135deg, oklch(0.3 0.04 240), oklch(0.12 0.02 240))',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)',
            }} />
            <span style={{
              position: 'absolute', top: 8, left: 10,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em',
            }}>● BACKYARD · 4K · {fmtClock(t).slice(0, 5)}</span>
          </div>
        </div>

        <div className="scene-card scene-glass" style={{ right: '4%', top: '8%', width: 220 }}>
          <div className="tile-head">
            <span className="tile-title">CLIMATE</span>
            <span className="tile-status">Eco</span>
          </div>
          <div className="climate-temp" style={{ fontSize: 38 }}>
            68<sup>°</sup>
          </div>
          <div className="climate-meta">SET 70° · HUM 42%</div>
          <div className="climate-bar" />
        </div>

        <div className="scene-card scene-glass" style={{ left: '8%', bottom: '8%', width: 260 }}>
          <div className="lock-visual" style={{ marginTop: 0 }}>
            <div className="lock-icon"><Icons.Lock size={20} /></div>
            <div className="lock-text">
              <p className="lock-state" style={{ fontSize: 16 }}>Front door · Locked</p>
              <p className="lock-meta">Auto-locked 6:42 PM</p>
            </div>
          </div>
        </div>

        <div className="scene-card scene-glass" style={{ right: '6%', bottom: '12%', width: 240 }}>
          <div className="tile-head">
            <span className="tile-title"><Icons.Tour size={12} />&nbsp; 3D TOUR</span>
            <span className="tile-status warn">Featured</span>
          </div>
          <p style={{ margin: '6px 0 4px', fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>412 Larkspur · published</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            4.2K VIEWS · +38% ENGAGEMENT
          </p>
        </div>
      </div>
    </section>
  );
}
