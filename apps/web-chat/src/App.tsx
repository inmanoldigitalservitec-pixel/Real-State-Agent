import { useEffect, useState } from "react";
import { appMetadata, salesStages, type HealthPayload } from "@real-estate-agent/shared";

const agentCoreUrl = import.meta.env.VITE_AGENT_CORE_URL ?? "http://localhost:8787";

export default function App() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [status, setStatus] = useState<"idle" | "online" | "offline">("idle");

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch(`${agentCoreUrl}/health`);

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }

        const payload = (await response.json()) as HealthPayload;

        if (!cancelled) {
          setHealth(payload);
          setStatus("online");
        }
      } catch {
        if (!cancelled) {
          setStatus("offline");
        }
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Real State Agent MVP</p>
        <h1>Technical scaffold ready for backend, frontend and shared packages.</h1>
        <p className="summary">
          This step only validates the monorepo foundation. Supabase, OpenClaw, tools and
          advanced UI will be layered on top in later phases.
        </p>
        <div className="status-row">
          <span className={`status-pill status-${status}`}>
            {status === "online" ? "Agent Core online" : status === "offline" ? "Agent Core offline" : "Checking core"}
          </span>
          <span className="status-pill status-neutral">Web chat on port {appMetadata.webChatPort}</span>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Workspace</h2>
          <ul>
            <li>`apps/agent-core`</li>
            <li>`apps/web-chat`</li>
            <li>`packages/shared`</li>
            <li>`openclaw-workspace`</li>
            <li>`supabase`</li>
          </ul>
        </article>

        <article className="panel">
          <h2>Shared contract</h2>
          <p>Sales stages exported from `packages/shared`:</p>
          <ul>
            {salesStages.map((stage) => (
              <li key={stage}>{stage}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Health snapshot</h2>
          {health ? (
            <dl className="health-list">
              <div>
                <dt>Service</dt>
                <dd>{health.service}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{health.status}</dd>
              </div>
              <div>
                <dt>Timestamp</dt>
                <dd>{health.timestamp}</dd>
              </div>
            </dl>
          ) : (
            <p>The frontend is ready even if the backend is not running yet.</p>
          )}
        </article>
      </section>
    </main>
  );
}
