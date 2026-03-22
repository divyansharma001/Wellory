import { apiModules, designTokens } from "@health-tracker/design-tokens";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="eyebrow">Universal Frontend Foundation</div>
        <h1>Health tracking for web first, with mobile ready from day one.</h1>
        <p>
          This workspace is set up to share types, API access, and design decisions between a
          responsive website and a future mobile app. The base experience centers around logging,
          coaching, meals, voice notes, goals, and progress.
        </p>
      </section>

      <section className="grid">
        {apiModules.map((module) => (
          <article className="card" key={module.title}>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </section>

      <section className="two-up">
        <article className="card">
          <h3>Shared foundation</h3>
          <div className="stack">
            <div className="metric">
              <span>Primary accent</span>
              <strong>{designTokens.colors.accent}</strong>
            </div>
            <div className="metric">
              <span>Surface tone</span>
              <strong>{designTokens.colors.surface}</strong>
            </div>
            <div className="metric">
              <span>App base radius</span>
              <strong>{designTokens.radius.card}px</strong>
            </div>
          </div>
        </article>

        <article className="card">
          <h3>What comes next</h3>
          <ul>
            <li>Connect auth and session state to Better Auth.</li>
            <li>Build the dashboard and add-entry flows on web first.</li>
            <li>Reuse the shared API client and types from both clients.</li>
            <li>Bring the same design language into the mobile shell.</li>
          </ul>
        </article>
      </section>

      <p className="footer-note">
        Suggested first product screens: dashboard, add entry, meals, chat, goals, and progress.
      </p>
    </main>
  );
}
