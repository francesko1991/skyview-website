import { useEffect } from 'react';
import { Nav, Services, Trust, Proof, CTA } from '@/components/sections';
import { HeroV1, HeroV2, HeroV3 } from '@/components/heroes';
import {
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakSelect,
  useTweaks,
} from '@/components/tweaks-panel';
import { GridBackground } from '@/components/ui/grid-pattern';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { BookingModalProvider } from '@/components/booking-modal-provider';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  theme: 'dark',
  variant: 'v1',
  anim: 'medium',
  headline_choice: 'primary',
} /*EDITMODE-END*/;

const HEADLINES = {
  primary: {
    eyebrow: 'Smart home & property tech · New Haven County, CT',
    title:
      'Connected spaces,<br /><span class="accent-word accent-word-soft">built</span> <span class="accent-word accent-word-strong">properly</span>.',
    lede:
      'We integrate the technology behind modern homes and properties — security, automation, networking, access, audio, and control.',
  },
  calm: {
    eyebrow: 'White-glove install · serving Connecticut',
    title:
      'Tech you don\'t<br />have to <span class="accent-word">think about</span>.',
    lede:
      'You pick the home. We handle everything else — design, install, training, and the next ten years of support — from our shop in North Haven.',
  },
  precise: {
    eyebrow: "Connecticut's smart-home specialists",
    title:
      'We set it up.<br /><span class="accent-word">You just live in it</span>.',
    lede:
      'From a single smart lock to a full estate: planned, wired, and supported by a Connecticut team that still answers the phone in year ten.',
  },
} as const;

type HeadlineChoice = keyof typeof HEADLINES;

export default function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.anim = tweaks.anim;
  }, [tweaks.theme, tweaks.anim]);

  const headline =
    HEADLINES[tweaks.headline_choice as HeadlineChoice] || HEADLINES.primary;

  const Hero =
    tweaks.variant === 'v2' ? HeroV2 : tweaks.variant === 'v3' ? HeroV3 : HeroV1;

  // The toggle is binary (light/dark). Tweaks panel still owns the full
  // light/dusk/dark choice; toggle treats anything non-light as 'dark'.
  const toggleTheme = tweaks.theme === 'light' ? 'light' : 'dark';

  return (
    <BookingModalProvider>
      <GridBackground />
      <BackgroundPaths />
      <Nav
        theme={toggleTheme}
        onThemeChange={(next) => setTweak('theme', next)}
      />
      <Hero
        headline={headline.title}
        lede={headline.lede}
        eyebrow={headline.eyebrow}
      />
      <Services />
      <Trust />
      <Proof />
      <CTA />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Theme">
          <TweakRadio
            label="Color theme"
            value={tweaks.theme}
            onChange={(v) => setTweak('theme', v)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dusk', label: 'Dusk' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Hero variant">
          <TweakRadio
            label="Layout"
            value={tweaks.variant}
            onChange={(v) => setTweak('variant', v)}
            options={[
              { value: 'v1', label: 'Dashboard' },
              { value: 'v2', label: 'Floor plan' },
              { value: 'v3', label: 'Editorial' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Copy">
          <TweakSelect
            label="Headline"
            value={tweaks.headline_choice}
            onChange={(v) => setTweak('headline_choice', v)}
            options={[
              { value: 'primary', label: 'Live, secure, experience' },
              { value: 'calm', label: 'A home that runs itself' },
              { value: 'precise', label: 'Designed in, not bolted on' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Animation">
          <TweakRadio
            label="Intensity"
            value={tweaks.anim}
            onChange={(v) => setTweak('anim', v)}
            options={[
              { value: 'subtle', label: 'Subtle' },
              { value: 'medium', label: 'Medium' },
              { value: 'lively', label: 'Lively' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </BookingModalProvider>
  );
}
