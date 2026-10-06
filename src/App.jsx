import { useEffect, useId, useRef, useState } from "react";
import "./App.css";

const BASE_URL = import.meta.env.BASE_URL;

const programs = [
  {
    id: "learn",
    video: "videos/optimized/learn-to-play-skate.mp4",
    logo: "images/optimized/wings-logo.webp",
    registration: "REGISTRATION IS OPEN",
    titleLines: ["LEARN TO PLAY", "&", "LEARN TO SKATE"],
    meta: "FALL SEASON",
    actions: [
      {
        label: "LEARN TO PLAY",
        href: "https://www.wingsarena.com/learntoplay",
        tone: "red",
      },
      {
        label: "LEARN TO SKATE",
        href: "https://www.wingsarena.com/learntoskate",
        tone: "navy",
      },
    ],
  },

  {
    id: "open",
    video: "videos/optimized/open-hockey.mp4",
    logo: "images/optimized/wings-arena-white-alt.webp",
    registration: "REGISTRATION IS OPEN",
    titleLines: ["LUNCHTIME", "ADULT", "HOCKEY"],
    meta: "MONDAYS | THURSDAYS 11:45AM - 1:15PM",
    metaTime: "11:45AM - 1:15PM",
    bottomMeta: "BEGINNING SEPT 11TH",
    actions: [
      {
        label: "INFO & REGISTRATION",
        href: "https://www.wingsarena.com/adult-lunchtime-hockey",
        tone: "red",
      },
    ],
  },

  {
    id: "mites",
    video: "videos/optimized/birthday.mp4",
    balloonLogo: "images/optimized/wings-arena-blue-alt.webp",
    bannerLines: ["BIRTHDAY", "PARTIES"],
    // "<line index>-<letter index>": flag color, replacing the rotation
    bannerFlagColors: { "1-0": "#5b9cf2", "1-1": "#5ce1d2" },
    actions: [
      {
        label: "LEARN MORE",
        href: "https://www.wingsarena.com/party-inquiries",
        tone: "cake",
      },
    ],
  },

  {
    id: "adult",
    video: "videos/optimized/adult-hockey-classes.mp4",
    playbackRate: 0.5,
    logo: "images/optimized/wings-arena-logo-alt.webp",
    registration: "REGISTRATION IS OPEN",
    titleLines: ["ADULT HOCKEY", "CLASSES"],
    meta: "TUESDAY MORNINGS | SEPT - NOV",
    metaBreakBeforeLastPipe: true,
    actions: [
      {
        label: "INFO & REGISTRATION",
        href: "https://www.wingsarena.com/adult-hockey-classes",
        tone: "red",
      },
    ],
  },

  {
    id: "cosmic",
    video: "videos/optimized/cosmic-skate.mp4",
    playbackRate: 0.85,
    eyebrow: "WINGS ARENA PRESENTS",
    titleLines: ["COSMIC SKATE"],
    meta: "CHECK OUR SCHEDULE BELOW FOR TIMES",
    actions: [
      {
        label: "LEARN MORE",
        href: "https://www.wingsarena.com/cosmic-skate",
        tone: "navy",
      },
    ],
  },

  {
    id: "public",
    video: "videos/optimized/public-skate.mp4",
    logo: "images/optimized/wings-arena-white-alt.webp",
    titleLines: ["PUBLIC SKATE"],
    meta: "CHECK OUR SCHEDULE BELOW FOR TIMES",
    actions: [
      {
        label: "LEARN MORE",
        href: "https://www.wingsarena.com/publicskate",
        tone: "red",
      },
    ],
  },
];

function renderTextWithTime(text, time, keyPrefix) {
  if (!time) {
    return [text];
  }

  const timeIndex = text.indexOf(time);

  if (timeIndex === -1) {
    return [text];
  }

  return [
    text.slice(0, timeIndex),
    <span
      key={`${keyPrefix}-time`}
      className="program-card__meta-time"
    >
      {time}
    </span>,
    text.slice(timeIndex + time.length),
  ];
}

function renderMetaWithPipes(text, breakBeforeLastPipe = false, time) {
  return text
    .split("|")
    .flatMap((part, index, parts) => {
      const renderedPart = renderTextWithTime(part, time, index);

      if (index >= parts.length - 1) {
        return renderedPart;
      }

      const isLastPipe = index === parts.length - 2;

      return [
        ...renderedPart,
        <span
          key={index}
          className={`program-card__meta-pipe${
            breakBeforeLastPipe && isLastPipe
              ? " program-card__meta-pipe--last"
              : ""
          }`}
        >
          |
        </span>,
        breakBeforeLastPipe && isLastPipe && (
          <br key={`${index}-break`} className="program-card__meta-linebreak" />
        ),
      ];
    });
}

/*
  The laser is built from tightly overlapping strokes.

  Every stroke has the exact same head position.
  Each following stroke is slightly shorter.

  Because they overlap instead of being offset from one
  another, they visually merge into ONE continuous beam.

  More layers = smoother opacity transition.
*/
const LASER_FADE_LAYERS = Array.from({ length: 28 }, (_, index) => {
  const longestLength = 28;
  const shortestLength = 1.5;

  const progress = index / 27;

  return {
    length:
      longestLength -
      (longestLength - shortestLength) * progress,
    opacity: 0.055,
  };
});

function RegistrationTag({ label }) {
  const rawGlowId = useId();
  const glowId = `registration-laser-glow-${rawGlowId.replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  )}`;

  return (
    <div className="program-card__registration-tag" aria-label={label}>
      <svg
        className="program-card__registration-laser"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={glowId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="1"
              result="laserBlurSmall"
            />

            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="2.4"
              result="laserBlurLarge"
            />

            <feMerge>
              <feMergeNode in="laserBlurLarge" />
              <feMergeNode in="laserBlurSmall" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          className="program-card__registration-laser-runner"
          filter={`url(#${glowId})`}
        >
          {LASER_FADE_LAYERS.map((layer, index) => (
            <rect
              key={index}
              className="program-card__registration-laser-line"
              x="2.25"
              y="2.25"
              width="95.5"
              height="95.5"
              pathLength="100"
              style={{
                strokeDasharray: `${layer.length} ${100 - layer.length}`,
                opacity: layer.opacity,
              }}
            />
          ))}

          <rect
            className="program-card__registration-laser-head"
            x="2.25"
            y="2.25"
            width="95.5"
            height="95.5"
            pathLength="100"
          />
        </g>
      </svg>

      <span className="program-card__registration-tag-line program-card__registration-tag-line--top">
        REGISTRATION
      </span>

      <span className="program-card__registration-tag-line program-card__registration-tag-line--bottom">
        OPEN
      </span>
    </div>
  );
}

const CAKE_CANDLE_COUNT = 3;

function CakeDecorations() {
  return (
    <>
      <span className="program-button__candles" aria-hidden="true">
        {Array.from({ length: CAKE_CANDLE_COUNT }, (_, index) => (
          <span key={index} className="program-button__candle" />
        ))}
      </span>

      <span className="program-button__sparkles" aria-hidden="true">
        <span>+</span>
        <span>+</span>
        <span>+</span>
      </span>

      <span className="program-button__frosting" aria-hidden="true" />
      <span className="program-button__plate" aria-hidden="true" />
    </>
  );
}

const BANNER_FLAG_COLORS = [
  "#e44fc6",
  "#a78bfa",
  "#ffd43b",
  "#5ce1d2",
  "#5b9cf2",
  "#d56be0",
];

/*
  The rope SVG runs a little past the outer flags on both
  sides. Each flag drops and tilts to follow the rope's
  curve at its own position.
*/
const BANNER_ROPE_OVERHANG = 0.06;
const BANNER_MAX_TILT_DEG = 8;

const BANNER_FONT = '900 100px "Lulo Clean One Bold", Arial, Helvetica, sans-serif';

function BirthdayBanner({ lines, flagColors = {} }) {
  const [inkOffsets, setInkOffsets] = useState({});

  // Measure each letter's visible ink so it can be centered on its flag,
  // rather than centering the glyph's (lopsided) advance width.
  useEffect(() => {
    let isCancelled = false;

    document.fonts.load(BANNER_FONT).then(() => {
      if (isCancelled) {
        return;
      }

      const context = document.createElement("canvas").getContext("2d");
      context.font = BANNER_FONT;
      context.textAlign = "center";

      const offsets = {};

      for (const letter of new Set(lines.join(""))) {
        const {
          actualBoundingBoxLeft,
          actualBoundingBoxRight,
          actualBoundingBoxAscent,
          actualBoundingBoxDescent,
          fontBoundingBoxAscent,
          fontBoundingBoxDescent,
        } = context.measureText(letter);

        // Offsets are in em (font size is 100px).
        // x: ink spans -left..+right around the center; shift it back by
        // half the imbalance.
        // y: with line-height 1, the line box's center sits
        // (fontAscent - fontDescent) / 2 above the baseline; shift the ink's
        // center onto it.
        offsets[letter] = {
          x: (actualBoundingBoxLeft - actualBoundingBoxRight) / 200,
          y:
            fontBoundingBoxAscent === undefined
              ? 0
              : (actualBoundingBoxAscent -
                  actualBoundingBoxDescent -
                  fontBoundingBoxAscent +
                  fontBoundingBoxDescent) /
                200,
        };
      }

      setInkOffsets(offsets);
    });

    return () => {
      isCancelled = true;
    };
  }, [lines]);

  return (
    <h2 className="birthday-banner" aria-label={lines.join(" ")}>
      {lines.map((line, lineIndex) => {
        const letters = [...line];

        return (
          <span key={line} className="birthday-banner__row" aria-hidden="true">
            <svg
              className="birthday-banner__rope"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path d="M0 1 Q50 19 100 1" />
            </svg>

            {letters.map((letter, index) => {
              const flagPosition = (index + 0.5) / letters.length;
              const ropePosition =
                (BANNER_ROPE_OVERHANG + flagPosition) /
                (1 + BANNER_ROPE_OVERHANG * 2);
              const flagColor =
                flagColors[`${lineIndex}-${index}`] ??
                BANNER_FLAG_COLORS[
                  (index + lineIndex * 3) % BANNER_FLAG_COLORS.length
                ];

              return (
                <span
                  key={index}
                  className="birthday-banner__flag"
                  style={{
                    "--flag-drop": 4 * ropePosition * (1 - ropePosition),
                    "--flag-tilt": `${
                      (1 - 2 * ropePosition) * BANNER_MAX_TILT_DEG
                    }deg`,
                    "--flag-color": flagColor,
                  }}
                >
                  <span className="birthday-banner__flag-face">
                    <span
                      className="birthday-banner__letter"
                      style={{
                        "--ink-offset-x": inkOffsets[letter]?.x ?? 0,
                        "--ink-offset-y": inkOffsets[letter]?.y ?? 0,
                      }}
                    >
                      {letter}
                    </span>
                  </span>
                </span>
              );
            })}
          </span>
        );
      })}
    </h2>
  );
}

function FloatingBalloon({ logo }) {
  const balloonRef = useRef(null);
  const [isReleased, setIsReleased] = useState(false);

  // Hold the balloon below the card until the card scrolls into view,
  // so the float-up isn't over before anyone sees it.
  useEffect(() => {
    const card = balloonRef.current?.closest(".program-card");

    if (!card) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsReleased(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(card);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={balloonRef}
      className={`birthday-balloon${
        isReleased ? " birthday-balloon--released" : ""
      }`}
      aria-hidden="true"
    >
      <div className="birthday-balloon__body">
        <img
          className="birthday-balloon__logo"
          src={`${BASE_URL}${logo}`}
          alt=""
        />
      </div>

      <svg
        className="birthday-balloon__string"
        viewBox="0 0 10 40"
        preserveAspectRatio="none"
      >
        <path d="M5 0 C1 10 9 20 5 30 S3 38 5 40" />
      </svg>
    </div>
  );
}

// Whether the element is at least partly on screen. Starts false; the
// observer reports the real state right after mount.
function useIsOnScreen(ref) {
  const [isOnScreen, setIsOnScreen] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsOnScreen(entry.isIntersecting);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return isOnScreen;
}

// Browsers can pause background videos on their own (power saving, tab
// switches). Don't retry more often than this if one keeps doing it.
const VIDEO_RESUME_INTERVAL_MS = 1000;

function ProgramCard({ program }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const isOnScreen = useIsOnScreen(cardRef);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      // Set the default too: the browser resets playbackRate to it if it
      // ever reloads the video.
      video.defaultPlaybackRate = program.playbackRate ?? 1;
      video.playbackRate = program.playbackRate ?? 1;
    }
  }, [program.playbackRate]);

  // Only decode the video while its card is on screen, and keep it going
  // while it is.
  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return undefined;
    }

    if (!isOnScreen) {
      video.pause();
      return undefined;
    }

    let lastAttempt = -Infinity;

    const resume = () => {
      const now = performance.now();

      if (
        !video.paused ||
        document.visibilityState !== "visible" ||
        now - lastAttempt < VIDEO_RESUME_INTERVAL_MS
      ) {
        return;
      }

      lastAttempt = now;

      // Rejected when the browser won't allow playback right now (e.g. a
      // battery saver); the video then just holds its current frame.
      video.play()?.catch(() => {});
    };

    resume();

    video.addEventListener("pause", resume);
    document.addEventListener("visibilitychange", resume);

    return () => {
      video.removeEventListener("pause", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [isOnScreen]);

  return (
    <article
      ref={cardRef}
      className={`program-card program-card--${program.id}${
        isOnScreen ? "" : " program-card--offscreen"
      }`}
    >
      <video
        ref={videoRef}
        className="program-card__video"
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={`${BASE_URL}${program.video}`} type="video/mp4" />
      </video>

      <div className="program-card__overlay" />

      {program.registration && (
        <RegistrationTag label={program.registration} />
      )}

      <div className="program-card__content">
        {program.eyebrow && (
          <p className="program-card__eyebrow">{program.eyebrow}</p>
        )}

        {program.logo && (
          <img
            className="program-card__logo"
            src={`${BASE_URL}${program.logo}`}
            alt=""
            aria-hidden="true"
          />
        )}

        {program.balloonLogo && <FloatingBalloon logo={program.balloonLogo} />}

        {program.bannerLines ? (
          <BirthdayBanner
            lines={program.bannerLines}
            flagColors={program.bannerFlagColors}
          />
        ) : (
          <h2 className="program-card__title">
            {program.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
        )}

        <div className="program-card__divider" aria-hidden="true" />

        {program.meta && (
          <p className="program-card__meta">
            {renderMetaWithPipes(
              program.meta,
              program.metaBreakBeforeLastPipe,
              program.metaTime
            )}
          </p>
        )}

        <div
          className={`program-card__actions ${
            program.actions.length > 1
              ? "program-card__actions--multiple"
              : ""
          }`}
        >
          {program.actions.map((action) => (
            <a
              key={action.href}
              className={`program-button program-button--${action.tone}`}
              href={action.href}
              target="_top"
              aria-label={action.label}
            >
              {action.tone === "cake" && <CakeDecorations />}
              <span className="program-button__label">{action.label}</span>
            </a>
          ))}
        </div>

        {program.bottomMeta && (
          <p className="program-card__bottom-meta">{program.bottomMeta}</p>
        )}
      </div>
    </article>
  );
}

function App() {
  return (
    <main className="featured-programs-section">
      <header className="featured-programs-header">
        <div className="featured-programs-header__brand">
          <span
            className="featured-programs-header__rule"
            aria-hidden="true"
          />

          <img
            className="featured-programs-header__logo"
            src={`${BASE_URL}images/wings-arena-logo.png`}
            alt="Wings Arena"
          />

          <span
            className="featured-programs-header__rule"
            aria-hidden="true"
          />
        </div>

        <p className="featured-programs-header__title">
          FEATURED PROGRAMS
        </p>
      </header>

      <section
        className="featured-programs-grid"
        aria-label="Wings Arena Featured Programs"
      >
        {programs.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
      </section>
    </main>
  );
}

export default App;