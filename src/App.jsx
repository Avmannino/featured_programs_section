import "./App.css";

const BASE_URL = import.meta.env.BASE_URL;

const programs = [
  {
    id: "cosmic",
    video: "videos/cosmic-skate.mp4",
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
    logo: "images/open-hockey-logo.png",
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
    eyebrow: "SUMMER & FALL REGISTRATION IS LIVE!",
    titleLines: [
      "LEARN TO PLAY",
      "&",
      "LEARN TO SKATE",
    ],
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
    logo: "images/open-hockey-logo.png",
    titleLines: ["OPEN HOCKEY"],
    meta: "CHECK OUR SCHEDULE BELOW FOR TIMES",
    actions: [
      {
        label: "LEARN MORE",
        href: "https://www.wingsarena.com/open-hockey",
        tone: "navy",
      },
    ],
  },

  {
    id: "mites",
    video: "videos/mites-ltp-league.mp4",
    eyebrow: "REGISTER NOW!",
    titleLines: ["MITES' 'LTP'", "LEAGUE"],
    meta: "SUNDAYS",
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
    eyebrow: "REGISTRATION IS LIVE!",
    titleLines: [
      "WINGS ARENA",
      "ADULT HOCKEY",
      "LEAGUE",
    ],
    meta: "FALL / WINTER SEASON | SEPT - DEC",
    actions: [
      {
        label: "INFO & REGISTRATION",
        href: "https://www.wingsarena.com/adulthockey",
        tone: "navy",
      },
    ],
  },
];

function ProgramCard({ program }) {
  return (
    <article
      className={`program-card program-card--${program.id}`}
    >
      <video
        className="program-card__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source
          src={`${BASE_URL}${program.video}`}
          type="video/mp4"
        />
      </video>

      <div className="program-card__overlay" />

      <div className="program-card__content">
        {program.eyebrow && (
          <p className="program-card__eyebrow">
            {program.eyebrow}
          </p>
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
            <span key={line}>
              {line}
            </span>
          ))}
        </h2>

        <div
          className="program-card__divider"
          aria-hidden="true"
        />

        {program.meta && (
          <p className="program-card__meta">
            {program.meta}
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
          <p className="program-card__bottom-meta">
            {program.bottomMeta}
          </p>
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
          <ProgramCard
            key={program.id}
            program={program}
          />
        ))}
      </section>
    </main>
  );
}

export default App;