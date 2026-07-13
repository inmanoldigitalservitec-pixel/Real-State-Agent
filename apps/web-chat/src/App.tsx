import { useEffect, useMemo, useRef, useState } from "react";
import {
  publicChatResponseSchema,
  publicHealthResponseSchema,
  type PublicChatPayload
} from "@real-estate-agent/shared";

const agentCoreUrl = (
  import.meta.env.VITE_AGENT_CORE_URL ?? ""
).replace(/\/+$/, "");

const sessionStorageKey = "real-estate-agent-public-session-id";
const urlPattern = /(https?:\/\/[^\s]+)/g;
const imageExtensionPattern = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const trailingUrlPunctuationPattern = /[),.;!?]+$/;

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  payloads?: PublicChatPayload[];
};

type ParsedUrl = {
  url: string;
  trailingText: string;
};

function createMessageId(): string {
  return crypto.randomUUID();
}

function getSavedSessionId(): string | undefined {
  try {
    return localStorage.getItem(sessionStorageKey) || undefined;
  } catch {
    return undefined;
  }
}

function saveSessionId(sessionId: string): void {
  try {
    localStorage.setItem(sessionStorageKey, sessionId);
  } catch {
    // The conversation still works if browser storage is unavailable.
  }
}

function clearSavedSessionId(): void {
  try {
    localStorage.removeItem(sessionStorageKey);
  } catch {
    // Ignore storage failures.
  }
}

function parseUrlToken(value: string): ParsedUrl {
  const trailingText = value.match(trailingUrlPunctuationPattern)?.[0] ?? "";

  return {
    url: trailingText ? value.slice(0, -trailingText.length) : value,
    trailingText
  };
}

function isLikelyImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const format = url.searchParams.get("format")?.toLowerCase();

    return (
      imageExtensionPattern.test(url.pathname) ||
      format === "avif" ||
      format === "gif" ||
      format === "jpg" ||
      format === "jpeg" ||
      format === "png" ||
      format === "webp"
    );
  } catch {
    return false;
  }
}

function ImageCard({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        Ver imagen
      </a>
    );
  }

  return (
    <a
      className="media-card"
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir imagen en una pestaña nueva"
    >
      <img
        src={url}
        alt="Imagen de una propiedad compartida por Carlos"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

function MessageText({
  text,
  structuredMediaUrls
}: {
  text: string;
  structuredMediaUrls: Set<string>;
}) {
  const parts = useMemo(() => text.split(urlPattern), [text]);

  return (
    <div className="message-text">
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        const { url, trailingText } = parseUrlToken(part);
        const alreadyRendered = structuredMediaUrls.has(url);

        return (
          <span key={`${part}-${index}`}>
            {alreadyRendered ? null : isLikelyImageUrl(url) ? (
              <ImageCard url={url} />
            ) : (
              <a href={url} target="_blank" rel="noreferrer">
                Ver enlace
              </a>
            )}
            {trailingText ? <span>{trailingText}</span> : null}
          </span>
        );
      })}
    </div>
  );
}

function MessageContent({ message }: { message: ChatMessage }) {
  const mediaUrls = useMemo(
    () =>
      Array.from(
        new Set(
          (message.payloads ?? [])
            .filter(
              (
                payload
              ): payload is Extract<
                PublicChatPayload,
                { type: "media" }
              > => payload.type === "media"
            )
            .map((payload) => payload.url)
        )
      ),
    [message.payloads]
  );

  const structuredMediaUrls = useMemo(
    () => new Set(mediaUrls),
    [mediaUrls]
  );

  return (
    <>
      <MessageText
        text={message.text}
        structuredMediaUrls={structuredMediaUrls}
      />

      {mediaUrls.map((url) =>
        isLikelyImageUrl(url) ? (
          <ImageCard key={url} url={url} />
        ) : (
          <a
            className="resource-link"
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Ver recurso
          </a>
        )
      )}
    </>
  );
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      role: "assistant",
      text:
        "Hola, soy Carlos. Cuéntame qué tipo de propiedad buscas, en qué zona y cuál es tu presupuesto."
    }
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(
    getSavedSessionId
  );
  const [healthStatus, setHealthStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const response = await fetch(
          `${agentCoreUrl}/public/health`,
          {
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }

        const payload = publicHealthResponseSchema.parse(
          await response.json()
        );

        if (!cancelled && payload.data.status === "ok") {
          setHealthStatus("online");
        }
      } catch {
        if (!cancelled) {
          setHealthStatus("offline");
        }
      }
    }

    void checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, isSending]);

  async function sendMessage(): Promise<void> {
    const message = input.trim();

    if (!message || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      text: message
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${agentCoreUrl}/public/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            ...(sessionId ? { sessionId } : {}),
            message
          })
        }
      );

      const body: unknown = await response.json();

      if (!response.ok) {
        const publicError =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "object" &&
          body.error !== null &&
          "message" in body.error &&
          typeof body.error.message === "string"
            ? body.error.message
            : "No fue posible contactar a Carlos.";

        throw new Error(publicError);
      }

      const parsed = publicChatResponseSchema.parse(body);

      setSessionId(parsed.data.sessionId);
      saveSessionId(parsed.data.sessionId);

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          text: parsed.data.message,
          payloads: parsed.data.payloads
        }
      ]);

      setHealthStatus("online");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setIsSending(false);
    }
  }

  function startNewConversation(): void {
    clearSavedSessionId();
    setSessionId(undefined);
    setErrorMessage(null);
    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        text:
          "Iniciamos una conversación nueva. ¿Qué tipo de propiedad estás buscando?"
      }
    ]);
  }

  return (
    <main className="app-shell">
      <section className="chat-card">
        <header className="chat-header">
          <div className="agent-identity">
            <div className="agent-avatar" aria-hidden="true">
              C
            </div>

            <div>
              <p className="eyebrow">Asesor inmobiliario</p>
              <h1>Carlos</h1>

              <div className="connection-status">
                <span
                  className={`status-dot status-${healthStatus}`}
                />

                <span>
                  {healthStatus === "online"
                    ? "Disponible"
                    : healthStatus === "offline"
                      ? "Sin conexión"
                      : "Verificando conexión"}
                </span>
              </div>
            </div>
          </div>

          <button
            className="new-chat-button"
            type="button"
            onClick={startNewConversation}
            disabled={isSending}
          >
            Nueva conversación
          </button>
        </header>

        <section
          className="messages"
          aria-live="polite"
          aria-label="Conversación con Carlos"
        >
          {messages.map((message) => (
            <article
              key={message.id}
              className={`message-row message-${message.role}`}
            >
              <div className="message-bubble">
                <MessageContent message={message} />
              </div>
            </article>
          ))}

          {isSending ? (
            <article className="message-row message-assistant">
              <div className="message-bubble typing-bubble">
                <span />
                <span />
                <span />
              </div>
            </article>
          ) : null}

          <div ref={messagesEndRef} />
        </section>

        {errorMessage ? (
          <div className="error-banner" role="alert">
            <span>{errorMessage}</span>

            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Cerrar mensaje de error"
            >
              ×
            </button>
          </div>
        ) : null}

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            maxLength={4000}
            rows={1}
            placeholder="Escribe qué propiedad estás buscando..."
            aria-label="Mensaje para Carlos"
            disabled={isSending}
          />

          <button
            className="send-button"
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Enviar mensaje"
          >
            Enviar
          </button>
        </form>

        <footer className="chat-footer">
          Carlos puede ayudarte a buscar propiedades, comparar opciones
          y revisar información disponible.
        </footer>
      </section>
    </main>
  );
}
