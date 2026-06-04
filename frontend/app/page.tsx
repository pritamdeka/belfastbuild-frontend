"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./page.module.css";

type Conflict = {
  policy_reference: string;
  summary: string;
  filename: string;
  page_number: number;
  citation: string;
};

type Citation = {
  filename: string;
  page_number: number;
  citation: string;
  source_name: string;
};

type ScreenResponse = {
  compliance_percentage: number;
  policy_conflicts: Conflict[];
  remediation_markdown: string;
  source_citations: Citation[];
  generated_at: string;
  provider: string;
};

type HealthResponse = {
  status: string;
  indexed: boolean;
  ready_for_screening?: boolean;
  embedding_model: string;
};

type BackendState = "checking" | "ready" | "offline";

const SAMPLE_PROMPTS = [
  "Single-storey rear extension to a semi-detached home with new off-street parking.",
  "Conversion of a Victorian terrace into 4 flats with a rear dormer.",
  "Erection of a 7-storey apartment block adjacent to a conservation area.",
  "Detached garden-room outbuilding under 25 sqm for a home office.",
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://pritamdeka-belfastbuild-backend.hf.space";

export default function HomePage() {
  const [postcode, setPostcode] = useState("BT9 7AG");
  const [description, setDescription] = useState(SAMPLE_PROMPTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScreenResponse | null>(null);
  const [backendState, setBackendState] = useState<BackendState>("checking");

  const accent = useMemo(() => {
    if (!result) return "var(--accent)";
    return result.compliance_percentage >= 70 ? "var(--good)" : "var(--bad)";
  }, [result]);

  useEffect(() => {
    let cancelled = false;

    async function checkBackend() {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Health check failed with status ${res.status}`);
        }
        const health = (await res.json()) as HealthResponse;
        if (cancelled) return;
        setBackendState(
          health.ready_for_screening ?? health.indexed ? "ready" : "checking",
        );
      } catch {
        if (cancelled) return;
        setBackendState("offline");
      }
    }

    void checkBackend();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: postcode.trim(),
          description: description.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          body?.detail?.map?.((d: { msg: string }) => d.msg).join("; ") ||
          body?.detail ||
          `Request failed with status ${res.status}`;
        throw new Error(detail);
      }
      const data = (await res.json()) as ScreenResponse;
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "The request failed unexpectedly.";
      setError(
        message.includes("fetch") || message.includes("Failed to fetch")
          ? "The backend could not be reached. Confirm the API is running and try again."
          : message,
      );
      setBackendState("offline");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.shell}>
      <Header />
      <Hero />
      <GuideSection />
      <FormSection
        postcode={postcode}
        setPostcode={setPostcode}
        description={description}
        setDescription={setDescription}
        loading={loading}
        error={error}
        onSubmit={onSubmit}
        prompts={SAMPLE_PROMPTS}
        backendState={backendState}
      />
      {result && <ResultSection result={result} accent={accent} />}
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a className={styles.brand} href="#top">
          <span className={styles.brandMark} aria-hidden>
            B.B
          </span>
          <span className={styles.brandText}>
            <span className="serif">BelfastBuild</span>
            <span className={styles.brandKicker}>Planning compliance · RAG</span>
          </span>
        </a>
        <nav className={styles.nav}>
          <a href="#screen">Screen</a>
          <a href="#sources">Sources</a>
          <a href="#about">About</a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className={styles.hero} id="top">
      <div className={styles.heroInner}>
        <span className={styles.eyebrow}>
          <span className={styles.dot} /> Live - Northern Ireland planning policy
        </span>
        <h1 className={`serif ${styles.headline}`}>
          Planning permission,
          <br />
          pre-screened in seconds.
        </h1>
        <p className={styles.lede}>
          BelfastBuild AI cross-references the SPPS, the Belfast Local
          Development Plan, PPS 3 and the PPS 7 Addendum in real time, so you
          walk into your planning meeting already knowing the conflicts.
        </p>
        <div className={styles.statRow}>
          <Stat value="4" label="Authoritative PDFs indexed" />
          <Stat value="~2.9k" label="Policy chunks" />
          <Stat value="<3 s" label="Average response" />
          <Stat value="422" label="Non-NI postcodes blocked" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={styles.stat}
    >
      <span className={`serif ${styles.statValue}`}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </motion.div>
  );
}

function FormSection(props: {
  postcode: string;
  setPostcode: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  prompts: string[];
  backendState: BackendState;
}) {
  const {
    postcode,
    setPostcode,
    description,
    setDescription,
    loading,
    error,
    onSubmit,
    prompts,
    backendState,
  } = props;

  return (
    <section className={styles.formSection} id="screen">
      <div className={styles.formInner}>
        <div className={styles.formHeader}>
          <span className={styles.sectionKicker}>02 · Describe the proposal</span>
          <h2 className={`serif ${styles.sectionTitle}`}>Tell us about the site.</h2>
          <p className={styles.sectionLede}>
            A postcode grounds the spatial lookup; a short description lets the
            RAG pipeline surface the right clauses from the indexed policy set.
          </p>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Postcode</span>
            <input
              className={styles.input}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="BT9 7AG"
              autoComplete="postal-code"
              maxLength={12}
              required
            />
            <span className={styles.hint}>Northern Ireland BT-prefixed only.</span>
          </label>

          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.label}>Development description</span>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              minLength={30}
              required
              placeholder="e.g. Single-storey rear extension to a semi-detached dwelling with new off-street parking."
            />
            <span className={styles.hint}>
              30+ characters. More detail means a sharper policy match.
            </span>
          </label>

          <div className={styles.samples}>
            <span className={styles.samplesLabel}>Try a sample</span>
            {prompts.map((p) => (
              <button
                key={p}
                type="button"
                className={styles.chip}
                onClick={() => setDescription(p)}
              >
                {p.length > 44 ? `${p.slice(0, 44)}...` : p}
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.cta}
              disabled={loading || backendState === "offline"}
            >
              {loading ? (
                <span className={styles.ctaDots}>
                  <span /> <span /> <span />
                </span>
              ) : (
                <>
                  Screen proposal
                  <span className={styles.arrow} aria-hidden>
                    →
                  </span>
                </>
              )}
            </button>
            {error && <span className={styles.error}>{error}</span>}
          </div>
        </form>
      </div>
    </section>
  );
}

function ResultSection({
  result,
  accent,
}: {
  result: ScreenResponse;
  accent: string;
}) {
  return (
    <section className={styles.resultsSection} id="results">
      <div className={styles.resultsInner}>
        <div className={styles.resultsHeader}>
          <span className={styles.sectionKicker}>03 · Outcome</span>
          <h2 className={`serif ${styles.sectionTitle}`}>
            {result.compliance_percentage >= 70
              ? "Looks compliant - submit with confidence."
              : "Conflicts detected - here is the path to green."}
          </h2>
        </div>

        <div className={styles.resultGrid}>
          <ScoreCard result={result} accent={accent} />
          <div className={styles.resultCol}>
            <ConflictsCard conflicts={result.policy_conflicts} />
            <RemediationCard markdown={result.remediation_markdown} />
            <CitationsCard citations={result.source_citations} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreCard({
  result,
  accent,
}: {
  result: ScreenResponse;
  accent: string;
}) {
  const pct = result.compliance_percentage;
  const compliant = pct >= 70;
  const ring = 2 * Math.PI * 88;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={styles.scoreCard}
    >
      <span className={styles.scoreKicker}>Compliance score</span>
      <div className={styles.scoreBody}>
        <svg
          className={styles.ring}
          viewBox="0 0 200 200"
          aria-hidden
          style={{
            ["--ring-len" as string]: String(ring),
            ["--ring-fill" as string]: String(ring * (1 - pct / 100)),
          }}
        >
          <circle cx="100" cy="100" r="88" className={styles.ringTrack} />
          <circle
            cx="100"
            cy="100"
            r="88"
            className={styles.ringFill}
            style={{ stroke: accent, ["--ring-len" as string]: String(ring) }}
          />
        </svg>
        <div className={styles.scoreNumber}>
          <span className={`serif ${styles.scoreValue}`} style={{ color: accent }}>
            {pct}%
          </span>
          <span className={styles.scoreLabel}>policy alignment</span>
        </div>
      </div>
      <span
        className={styles.scorePill}
        style={{
          background: compliant ? "var(--good-soft)" : "var(--bad-soft)",
          color: accent,
          borderColor: accent,
        }}
      >
        {compliant ? "Likely compliant" : "Conflicts detected"}
      </span>
      <p className={styles.scoreNote}>
        {compliant
          ? "Your proposal aligns with the indexed policy documents. Submit a design and access statement and you are in good shape."
          : "Several policy touchpoints were flagged. Review the conflicts and remediation roadmap before submission."}
      </p>
      <small className={styles.scoreMeta}>
        Generated {new Date(result.generated_at).toLocaleString()} · via {result.provider}
      </small>
    </motion.aside>
  );
}

function ConflictsCard({ conflicts }: { conflicts: Conflict[] }) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h3 className={`serif ${styles.cardTitle}`}>Policy variance grid</h3>
        <span className={styles.pill}>{conflicts.length} flagged</span>
      </header>
      {conflicts.length === 0 ? (
        <p className="muted">No policy conflicts detected against the indexed corpus.</p>
      ) : (
        <ul className={styles.conflictList}>
          {conflicts.map((c, i) => (
            <motion.li
              key={`${c.citation}-${i}`}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={styles.conflictItem}
            >
              <div>
                <h4 className={`serif ${styles.conflictTitle}`}>{c.policy_reference}</h4>
                <p className={styles.conflictBody}>{c.summary}</p>
              </div>
              <a
                className={`mono ${styles.citationPill}`}
                href={`#${encodeURIComponent(c.citation)}`}
              >
                {c.citation}
              </a>
            </motion.li>
          ))}
        </ul>
      )}
    </article>
  );
}

function RemediationCard({ markdown }: { markdown: string }) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h3 className={`serif ${styles.cardTitle}`}>Strategic remediation vector</h3>
        <span className={styles.pill}>Action plan</span>
      </header>
      <div className={styles.markdown}>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </article>
  );
}

function CitationsCard({ citations }: { citations: Citation[] }) {
  return (
    <article className={styles.card} id="sources">
      <header className={styles.cardHeader}>
        <h3 className={`serif ${styles.cardTitle}`}>Source-citation footnotes</h3>
        <span className={styles.pill}>Human-in-the-loop audit</span>
      </header>
      <ul className={styles.citationList}>
        {citations.map((c, i) => (
          <li
            id={encodeURIComponent(c.citation)}
            key={c.citation + i}
            className={styles.citationItem}
          >
            <span className={`mono ${styles.citationPill}`}>{c.citation}</span>
            <span className={styles.citationName}>{c.source_name}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Footer() {
  return (
    <footer className={styles.footer} id="about">
      <div className={styles.footerInner}>
        <div className={styles.footerCopy}>
          <p className={`serif ${styles.footerMark}`}>BelfastBuild</p>
          <p className={styles.footerNote}>
            BelfastBuild is a Northern Ireland planning pre-screening tool for
            homeowners, architects, developers and consultants who want an
            early read on likely policy friction before submitting an
            application.
          </p>
          <p className={styles.footerNote}>
            It reviews a proposal against the Strategic Planning Policy
            Statement, the Belfast Local Development Plan, PPS 3 and the PPS 7
            Addendum, then returns a compliance score, likely conflict points,
            practical remediation guidance and source citations you can inspect.
          </p>
          <p className={styles.footerNote}>
            The result is designed to support better preparation, not replace a
            formal planning determination. Final decisions still rest with the
            relevant planning authority.
          </p>
        </div>
        <div className={styles.footerLinks}>
          <a href="#top">Top</a>
          <a href="#screen">Screen</a>
          <a href="#results">Results</a>
        </div>
      </div>
      <p className={styles.footerFineprint}>
        Compliance scores are advisory; final determinations are made by the
        relevant planning authority.
      </p>
    </footer>
  );
}

function GuideSection() {
  return (
    <section className={styles.guideSection} aria-labelledby="guide-title">
      <div className={styles.guideInner}>
        <div className={styles.guideHeader}>
          <span className={styles.sectionKicker}>01 · User guide</span>
          <h2 id="guide-title" className={`serif ${styles.sectionTitle}`}>
            How to use BelfastBuild well.
          </h2>
          <p className={styles.sectionLede}>
            A little detail goes a long way. The better the proposal summary,
            the more useful the screening result will be.
          </p>
        </div>
        <div className={styles.guideGrid}>
          <article className={styles.guideCard}>
            <span className={styles.guideStep}>1</span>
            <h3 className={`serif ${styles.guideTitle}`}>Enter the site postcode</h3>
            <p className={styles.guideText}>
              Use a valid Northern Ireland BT postcode so the app can anchor
              the proposal to the right local context.
            </p>
          </article>
          <article className={styles.guideCard}>
            <span className={styles.guideStep}>2</span>
            <h3 className={`serif ${styles.guideTitle}`}>Describe the proposal clearly</h3>
            <p className={styles.guideText}>
              Include the type of development, number of units or storeys,
              parking changes, extensions, access changes and any nearby
              sensitive context such as a conservation area.
            </p>
          </article>
          <article className={styles.guideCard}>
            <span className={styles.guideStep}>3</span>
            <h3 className={`serif ${styles.guideTitle}`}>Review the flagged policies</h3>
            <p className={styles.guideText}>
              Use the conflict summaries and citations to understand which
              planning clauses may affect the proposal and where those clauses
              come from.
            </p>
          </article>
          <article className={styles.guideCard}>
            <span className={styles.guideStep}>4</span>
            <h3 className={`serif ${styles.guideTitle}`}>Refine before you submit</h3>
            <p className={styles.guideText}>
              Treat the remediation guidance as a pre-application checklist to
              strengthen drawings, parking layouts, density choices and design
              rationale before moving forward.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}