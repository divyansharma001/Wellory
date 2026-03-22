export default function HomePage() {
  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="brand-lockup">The Editorial Sanctuary</div>

        <div className="hero-copy">
          <p className="hero-kicker">Restorative wellness, curated daily.</p>
          <h1>
            The art of restorative <span>wellness.</span>
          </h1>
          <p className="hero-description">
            Begin your journey into a calmer routine. Our AI does more than track your habits. It
            learns your rhythm and shapes each reflection around the life you are actually living.
          </p>
        </div>

        <div className="insight-card">
          <div className="insight-icon" aria-hidden="true">
            ✦
          </div>
          <div>
            <p className="insight-label">Daily Insight</p>
            <p className="insight-text">
              Your stress markers are easing into balance. This is a good window for tea, a slow
              walk, or ten quiet minutes.
            </p>
          </div>
        </div>

        <div className="hero-orb hero-orb-primary" aria-hidden="true" />
        <div className="hero-orb hero-orb-secondary" aria-hidden="true" />
      </section>

      <section className="auth-panel">
        <div className="brand-lockup brand-lockup-mobile">The Editorial Sanctuary</div>

        <div className="auth-content">
          <div className="auth-tabs" aria-label="Authentication mode">
            <button className="auth-tab auth-tab-active" type="button">
              Sign In
            </button>
            <button className="auth-tab" type="button">
              Sign Up
            </button>
          </div>

          <div className="auth-actions">
            <button className="social-button" type="button">
              <span className="social-icon" aria-hidden="true">
                A
              </span>
              <span>Continue with Apple</span>
            </button>

            <button className="social-button" type="button">
              <span className="social-icon" aria-hidden="true">
                G
              </span>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="auth-divider" aria-hidden="true">
            <span />
            <p>Or with email</p>
            <span />
          </div>

          <form className="auth-form">
            <label className="field">
              <span>Email Address</span>
              <input placeholder="name@example.com" type="email" />
            </label>

            <label className="field">
              <div className="field-heading">
                <span>Password</span>
                <a href="/">Forgot?</a>
              </div>
              <input placeholder="••••••••" type="password" />
            </label>

            <button className="primary-button" type="submit">
              Enter Sanctuary
            </button>
          </form>

          <p className="legal-copy">
            By continuing, you agree to our <a href="/">Terms of Service</a> and{" "}
            <a href="/">Privacy Policy</a>.
          </p>
        </div>
      </section>

      <div className="paper-grain" aria-hidden="true" />
    </main>
  );
}
