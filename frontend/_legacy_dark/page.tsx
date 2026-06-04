"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
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

const SAMPLE_PROMPTS = [
  "Single-storey rear extension to a semi-detached home with new off-street parking.",
  "Conversion of a Victorian terrace into 4 flats with a rear dormer.",
  "Erection of a 7-storey apartment block adjacent to a conservation area.",
  "Detached garden-room outbuilding under 25 sqm for a home office.",
];

export default function HomePage() {
  const [postcode, setPostcode] = useState("BT9 7AG");
  const [description, setDescription] = useState(SAMPLE_PROMPTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScreenResponse | null>(null);

  const complianceColor = useMemo(() => {
    if (!result) return "var(--ink-500)";
    return result.compliance_percentage >= 70 ? "var(--emerald-400)" : "var(--rose-400)";
  }, [result]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: postcode.trim(), description: description.trim() }),
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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Hero />
      <Section>
        <FormCard
          postcode={postcode}
          setPostcode={setPostcode}
          description={description}
          setDescription={setDescription}
          loading={loading}
          error={error}
          onSubmit={onSubmit}
          prompts={SAMPLE_PROMPTS}
        />
      </Section>

      {result && (
        <Section>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: "grid", gap: "1.25rem" }}
          >
            <ScoreCard result={result} accent={complianceColor} />
            <ConflictsCard conflicts={result.policy_conflicts} />
            <RemediationCard markdown={result.remediation_markdown} />
            <CitationsCard citations={result.source_citations} />
          </motion.div>
        </Section>
      )}

      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <header className={styles.hero}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.heroInner}
      >
        <span className="pill">
          <span className={styles.dot} /> Live — RAG over NI planning policy
        </span>
        <h1>
          Planning permission,
          <br />
          <span className={styles.gradient}>pre-screened in seconds.</span>
        </h1>
        <p className={styles.lede}>
          BelfastBuild AI cross-references the SPPS, the Belfast Local
          Development Plan, PPS 3 and the PPS 7 Addendum in real time — so you
          walk into your planning meeting already knowing the conflicts.
        </p>
        <div className={styles.statRow}>
          <Stat value="4" label="Authoritative PDFs indexed" />
          <Stat value="2.8k" label="Policy chunks" />
          <Stat value="<3 s" label="Average response" />
          <Stat value="422" label="Non-NI postcodes blocked" />
        </div>
      </motion.div>
      <BackgroundOrbs />
    </header>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
      className={`stat glass ${styles.stat}`}
    >
      <strong>{value}</strong>
      <span>{label}</span>
    </motion.div>
  );
}

function BackgroundOrbs() {
  return (
    <div aria-hidden className={styles.orbs}>
      <span className={`${styles.orb} ${styles.orb1}`} />
      <span className={`${styles.orb} ${styles.orb2}`} />
      <span className={`${styles.orb} ${styles.orb3}`} />
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className={styles.container}>{children}</section>;
}

type FormProps = {
  postcode: string;
  setPostcode: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  prompts: string[];
};

function FormCard(props: FormProps) {
  const {
    postcode,
    setPostcode,
    description,
    setDescription,
    loading,
    error,
    onSubmit,
    prompts,
  } = props;
  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`glass ${styles.formCard}`}
    >
      <div className={styles.formGrid}>
        <label>
          <span>Postcode</span>
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="BT9 7AG"
            inputMode="text"
            autoComplete="postal-code"
            required
            maxLength={12}
            className={styles.input}
          />
          <em>Northern Ireland BT-prefixed postcodes only.</em>
        </label>
        <label className={styles.full}>
          <span>Describe the proposed development</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="e.g. Single-storey rear extension to a semi-detached dwelling with new off-street parking."
            minLength={30}
            required
            className={styles.textarea}
          />
          <em>30+ characters. The more detail, the sharper the policy match.</em>
        </label>
      </div>

      <div className={styles.promptRow}>
        <span className={styles.promptLabel}>Try a sample:</span>
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            className={styles.promptChip}
            onClick={() => setDescription(p)}
          >
            {p.length > 40 ? `${p.slice(0, 40)}…` : p}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.cta} type="submit" disabled={loading}>
          {loading ? (
            <span className={styles.dots}>
              <span /> <span /> <span />
            </span>
          ) : (
            "Screen proposal →"
          )}
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </motion.form>
  );
}

function ScoreCard({ result, accent }: { result: ScreenResponse; accent: string }) {
  const pct = result.compliance_percentage;
  const compliant = pct >= 70;
  return (
    <div className={`glass ${styles.scoreCard}`}>
      <div
        className={styles.scoreRing}
        style={{ background: `conic-gradient(${accent} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
      >
        <div className={styles.scoreRingInner}>
          <motion.span
            key={pct}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className={styles.scoreValue}
            style={{ color: accent }}
          >
            {pct}
          </motion.span>
          <span className={styles.scoreSuffix}>/ 100</span>
        </div>
      </div>
      <div className={styles.scoreText}>
        <span
          className="pill"
          style={{
            background: compliant ? "rgba(16,185,129,0.18)" : "rgba(244,63,94,0.18)",
            borderColor: accent,
            color: accent,
          }}
        >
          {compliant ? "Likely compliant" : "Conflicts detected"}
        </span>
        <h2>Compliance score</h2>
        <p>
          {compliant
            ? "Your proposal aligns with the indexed policy documents. Submit a design & access statement and you're in good shape."
            : "Several policy touchpoints were flagged. Review the conflicts and remediation roadmap below before submission."}
        </p>
        <small>
          Generated {new Date(result.generated_at).toLocaleString()} · via {result.provider}
        </small>
      </div>
    </div>
  );
}

function ConflictsCard({ conflicts }: { conflicts: Conflict[] }) {
  return (
    <div className={`glass ${styles.card}`}>
      <header className={styles.cardHeader}>
        <h3>Policy variance grid</h3>
        <span className="pill">{conflicts.length} flagged</span>
      </header>
      {conflicts.length === 0 ? (
        <p className={styles.muted}>No policy conflicts detected against the indexed corpus.</p>
      ) : (
        <ul className={styles.conflictList}>
          {conflicts.map((c, i) => (
            <motion.li
              key={`${c.citation}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={styles.conflictItem}
            >
              <div>
                <h4>{c.policy_reference}</h4>
                <p>{c.summary}</p>
              </div>
              <a className={styles.citation} href={`#${encodeURIComponent(c.citation)}`}>
                {c.citation}
              </a>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RemediationCard({ markdown }: { markdown: string }) {
  return (
    <div className={`glass ${styles.card}`}>
      <header className={styles.cardHeader}>
        <h3>Strategic remediation vector</h3>
        <span className="pill">Markdown · action plan</span>
      </header>
      <div className={styles.markdown}>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}

function CitationsCard({ citations }: { citations: Citation[] }) {
  return (
    <div className={`glass ${styles.card}`}>
      <header className={styles.cardHeader}>
        <h3>Source-citation footnotes</h3>
        <span className="pill">Human-in-the-loop audit</span>
      </header>
      <ul className={styles.citationList}>
        {citations.map((c, i) => (
          <li id={encodeURIComponent(c.citation)} key={c.citation + i}>
            <span className={styles.citationPill}>{c.citation}</span>
            <span className={styles.citationName}>{c.source_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className={styles.siteFooter}>
      <p>
        BelfastBuild AI · Agentic RAG over Northern Ireland planning policy.
        Built with FastAPI + Next.js 14. Source PDFs published by DfI and
        Belfast City Council.
      </p>
    </footer>
  );
}
