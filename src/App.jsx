import { useEffect, useId, useRef } from "react";
import "./App.css";

const BASE_URL = import.meta.env.BASE_URL;

const programs = [
  {
    id: "cosmic",
    video: "videos/cosmic-skate.mp4",
    playbackRate: 0.85,
    eyebrow: "WINGS ARENA PRESENTS",
    titleLines: ["COSMIC SKATE"],
    meta: "FRIDAYS | SATURDAYS",
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
    video: "videos/public-skate.mp4",
    logo: "images/wings-arena-blue-alt.png",
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

  {
    id: "learn",
    video: "videos/learn-to-play-skate.mp4",
    logo: "images/wings-logo.png",
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
    video: "videos/open-hockey.mp4",
    logo: "images/wings-arena-white-alt.png",
    titleLines: ["LUNCHTIME", "ADULT HOCKEY"],
    meta: "MONDAYS | THURSDAYS 11:45AM - 1:15PM",
    metaHighlight: "11:45AM - 1:15PM",
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
    video: "videos/mites-ltp-league.mp4",
    logo: "images/wings-dark-blue.png",
    registration: "REGISTRATION IS OPEN",
    titleLines: ["MITES' 'LTP' LEAGUE"],
    meta: "SUNDAYS THIS FALL & WINTER",
    bottomMeta: "AGES 4–6",
    actions: [
      {
        label: "INFO & REGISTRATION",
        href: "https://www.wingsarena.com/mites-ltp-league",
        tone: "navy",
      },
    ],
  },

  {
    id: "adult",
    video: "videos/adult-hockey-league.mp4",
    playbackRate: 0.7,
    logo: "images/wings-arena-logo-alt.png",
    registration: "REGISTRATION IS OPEN",
    titleLines: ["WINGS ARENA", "ADULT HOCKEY", "LEAGUE"],
    meta: "FALL | WINTER SEASON | SEPT - DEC",
    metaBreakBeforeLastPipe: true,
    actions: [
      {
        label: "INFO & REGISTRATION",
        href: "https://www.wingsarena.com/adulthockey",
        tone: "red",
      },
    ],
  },
];

function renderTextWithHighlight(text, highlight, keyPrefix) {
  if (!highlight) {
    return [text];
  }

  const highlightIndex = text.indexOf(highlight);

  if (highlightIndex === -1) {
    return [text];
  }

  return [
    text.slice(0, highlightIndex),
    <span
      key={`${keyPrefix}-highlight`}
      className="program-card__meta-highlight"
    >
      {highlight}
    </span>,
    text.slice(highlightIndex + highlight.length),
  ];
}

function renderMetaWithPipes(text, breakBeforeLastPipe = false, highlight) {
  return text
    .split("|")
    .flatMap((part, index, parts) => {
      const renderedPart = renderTextWithHighlight(part, highlight, index);

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

function ProgramCard({ program }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = program.playbackRate ?? 1;
    }
  }, [program.playbackRate]);

  return (
    <article className={`program-card program-card--${program.id}`}>
      <video
        ref={videoRef}
        className="program-card__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
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

        <h2 className="program-card__title">
          {program.titleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>

        <div className="program-card__divider" aria-hidden="true" />

        {program.meta && (
          <p className="program-card__meta">
            {renderMetaWithPipes(
              program.meta,
              program.metaBreakBeforeLastPipe,
              program.metaHighlight
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
              {action.label}
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