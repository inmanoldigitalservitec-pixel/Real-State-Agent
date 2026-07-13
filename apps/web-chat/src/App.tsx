import {
  Fragment,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
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
const documentExtensionPattern = /\.(?:pdf|docx?|xlsx?|pptx?)$/i;
const videoExtensionPattern = /\.(?:m4v|mov|mp4|webm)$/i;
const trailingUrlPunctuationPattern = /[),.;!?]+$/;

const quickPrompts = [
  "Busco un apartamento de tres habitaciones.",
  "Quiero opciones para invertir en Punta Cana.",
  "Muéstrame propiedades familiares disponibles.",
  "Quiero conocer los planes de pago."
] as const;

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

type ResourceKind = "image" | "document" | "video" | "link";

type MarkdownBlock =
  | { type: "paragraph"; content: string }
  | { type: "list"; ordered: boolean; items: string[] };

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

function classifyResourceUrl(value: string): ResourceKind {
  try {
    const url = new URL(value);
    const pathname = decodeURIComponent(url.pathname).toLowerCase();
    const format = url.searchParams.get("format")?.toLowerCase();
    const mimeType = url.searchParams.get("mime")?.toLowerCase();

    if (
      imageExtensionPattern.test(pathname) ||
      ["avif", "gif", "jpg", "jpeg", "png", "webp"].includes(format ?? "") ||
      mimeType?.startsWith("image/") ||
      (pathname.includes("/storage/v1/object/public/") &&
        /(?:image|photo|gallery|cover|exterior|interior|amenit)/i.test(pathname))
    ) {
      return "image";
    }

    if (documentExtensionPattern.test(pathname) || mimeType === "application/pdf") {
      return "document";
    }

    if (videoExtensionPattern.test(pathname) || mimeType?.startsWith("video/")) {
      return "video";
    }

    return "link";
  } catch {
    return "link";
  }
}

function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    const content = paragraph.join("\n").trim();
    if (content) {
      blocks.push({ type: "paragraph", content });
    }
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", ordered: listOrdered, items: listItems });
    }
    listItems = [];
  };

  for (const line of lines) {
    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const unorderedMatch = line.match(/^\s*[-*]\s+(.+)$/);

    if (orderedMatch || unorderedMatch) {
      flushParagraph();
      const ordered = Boolean(orderedMatch);

      if (listItems.length > 0 && listOrdered !== ordered) {
        flushList();
      }

      listOrdered = ordered;
      listItems.push((orderedMatch?.[1] ?? unorderedMatch?.[1] ?? "").trim());
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g);

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }

    if (/^https?:\/\//i.test(token)) {
      const { url, trailingText } = parseUrlToken(token);

      return (
        <Fragment key={key}>
          <a href={url} target="_blank" rel="noreferrer">
            Ver enlace
          </a>
          {trailingText}
        </Fragment>
      );
    }

    return <Fragment key={key}>{token}</Fragment>;
  });
}

function MarkdownText({ text }: { text: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(text), [text]);

  return (
    <div className="message-text">
      {blocks.map((block, index) =>
        block.type === "paragraph" ? (
          <p key={`paragraph-${index}`}>
            {block.content.split("\n").map((line, lineIndex) => (
              <Fragment key={`line-${index}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInlineMarkdown(line, `paragraph-${index}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        ) : block.ordered ? (
          <ol key={`list-${index}`}>
            {block.items.map((item, itemIndex) => (
              <li key={`item-${index}-${itemIndex}`}>
                {renderInlineMarkdown(item, `item-${index}-${itemIndex}`)}
              </li>
            ))}
          </ol>
        ) : (
          <ul key={`list-${index}`}>
            {block.items.map((item, itemIndex) => (
              <li key={`item-${index}-${itemIndex}`}>
                {renderInlineMarkdown(item, `item-${index}-${itemIndex}`)}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

function ImageResource({ url, onLoad }: { url: string; onLoad?: () => void }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <a className="resource-link" href={url} target="_blank" rel="noreferrer">
        Abrir imagen
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
        onLoad={onLoad}
        onError={() => setFailed(true)}
      />
    </a>
  );
}

function ResourceCard({ url, onImageLoad }: { url: string; onImageLoad?: () => void }) {
  const kind = classifyResourceUrl(url);

  if (kind === "image") {
    return <ImageResource url={url} onLoad={onImageLoad} />;
  }

  const label =
    kind === "document"
      ? "Abrir documento"
      : kind === "video"
        ? "Ver video"
        : "Abrir recurso";

  return (
    <a className={`resource-link resource-${kind}`} href={url} target="_blank" rel="noreferrer">
      <span className="resource-icon" aria-hidden="true">
        {kind === "document" ? "PDF" : kind === "video" ? "▶" : "↗"}
      </span>
      <span>{label}</span>
    </a>
  );
}

function extractTextUrls(text: string): string[] {
  const matches = text.match(urlPattern) ?? [];

  return matches.map((match) => parseUrlToken(match).url);
}

function removeEmbeddedImageUrls(text: string, structuredUrls: Set<string>): string {
  return text.replace(urlPattern, (match) => {
    const { url, trailingText } = parseUrlToken(match);
    const kind = classifyResourceUrl(url);

    if (kind === "image" || structuredUrls.has(url)) {
      return trailingText;
    }

    return match;
  });
}

function MessageContent({
  message,
  onImageLoad
}: {
  message: ChatMessage;
  onImageLoad: () => void;
}) {
  const structuredUrls = useMemo(
    () =>
      (message.payloads ?? [])
        .filter(
          (
            payload
          ): payload is Extract<PublicChatPayload, { type: "media" }> =>
            payload.type === "media"
        )
        .map((payload) => payload.url),
    [message.payloads]
  );

  const textUrls = useMemo(() => extractTextUrls(message.text), [message.text]);
  const allResourceUrls = useMemo(
    () => Array.from(new Set([...structuredUrls, ...textUrls.filter((url) => classifyResourceUrl(url) === "image")])),
    [structuredUrls, textUrls]
  );
  const structuredUrlSet = useMemo(() => new Set(structuredUrls), [structuredUrls]);
  const visibleText = useMemo(
    () => removeEmbeddedImageUrls(message.text, structuredUrlSet).trim(),
    [message.text, structuredUrlSet]
  );

  return (
    <>
      {visibleText ? <MarkdownText text={visibleText} /> : null}
      {allResourceUrls.length > 0 ? (
        <div className="message-resources">
          {allResourceUrls.map((url) => (
            <ResourceCard key={url} url={url} onImageLoad={onImageLoad} />
          ))}
        </div>
      ) : null}
    </>
  );
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      role: "assistant",
      text: "Hola, soy Carlos. Cuéntame qué tipo de propiedad buscas y en qué zona."
    }
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(getSavedSessionId);
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesRef = useRef<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const isInitialConversation = messages.length === 1 && messages[0]?.role === "assistant";

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const response = await fetch(`${agentCoreUrl}/public/health`, {
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }

        const payload = publicHealthResponseSchema.parse(await response.json());

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
    if (shouldStickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isSending]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [input]);

  function updateScrollIntent(): void {
    const element = messagesRef.current;
    if (!element) return;

    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 120;
  }

  function handleImageLoad(): void {
    if (shouldStickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    }
  }

  async function sendMessage(forcedMessage?: string): Promise<void> {
    const message = (forcedMessage ?? input).trim();

    if (!message || isSending) {
      return;
    }

    shouldStickToBottomRef.current = true;
    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: "user", text: message }
    ]);
    setInput("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${agentCoreUrl}/public/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          ...(sessionId ? { sessionId } : {}),
          message
        })
      });

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
        error instanceof Error ? error.message : "Ocurrió un error inesperado."
      );
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function startNewConversation(): void {
    clearSavedSessionId();
    setSessionId(undefined);
    setErrorMessage(null);
    setInput("");
    shouldStickToBottomRef.current = true;
    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        text: "Iniciamos una conversación nueva. ¿Qué tipo de propiedad estás buscando?"
      }
    ]);
  }

  return (
    <main className="app-shell">
      <section className="chat-layout">
        <header className="chat-header">
          <div className="agent-identity">
            <div className="agent-avatar" aria-hidden="true">C</div>
            <div className="agent-copy">
              <h1>Carlos</h1>
              <div className="connection-status">
                <span className={`status-dot status-${healthStatus}`} />
                <span>
                  {healthStatus === "online"
                    ? "Disponible"
                    : healthStatus === "offline"
                      ? "Sin conexión"
                      : "Conectando"}
                </span>
              </div>
            </div>
          </div>

          <button
            className="new-chat-button"
            type="button"
            onClick={startNewConversation}
            disabled={isSending}
            aria-label="Nueva conversación"
          >
            <span className="new-chat-icon" aria-hidden="true">＋</span>
            <span className="new-chat-label">Nueva conversación</span>
          </button>
        </header>

        <section
          ref={messagesRef}
          className="messages"
          aria-live="polite"
          aria-label="Conversación con Carlos"
          onScroll={updateScrollIntent}
        >
          <div className="messages-inner">
            {isInitialConversation ? (
              <section className="welcome-panel">
                <div className="welcome-mark" aria-hidden="true">C</div>
                <h2>¿Qué propiedad estás buscando?</h2>
                <p>
                  Describe la zona, el tipo de propiedad o lo que necesitas. Carlos te ayudará a revisar opciones reales.
                </p>
                <div className="quick-prompts">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="quick-prompt"
                      onClick={() => void sendMessage(prompt)}
                      disabled={isSending}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {messages.map((message, index) => (
              <article
                key={message.id}
                className={`message-row message-${message.role} ${index === 0 && isInitialConversation ? "message-intro" : ""}`}
              >
                {message.role === "assistant" ? (
                  <div className="message-avatar" aria-hidden="true">C</div>
                ) : null}
                <div className="message-content">
                  {message.role === "assistant" ? (
                    <div className="message-author">Carlos</div>
                  ) : null}
                  <MessageContent message={message} onImageLoad={handleImageLoad} />
                </div>
              </article>
            ))}

            {isSending ? (
              <article className="message-row message-assistant">
                <div className="message-avatar" aria-hidden="true">C</div>
                <div className="message-content">
                  <div className="message-author">Carlos</div>
                  <div className="typing-indicator" aria-label="Carlos está escribiendo">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            ) : null}

            <div ref={messagesEndRef} className="messages-end" />
          </div>
        </section>

        <div className="composer-area">
          {errorMessage ? (
            <div className="error-banner" role="alert">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} aria-label="Cerrar error">×</button>
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
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
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
              <span aria-hidden="true">↑</span>
            </button>
          </form>

          <p className="chat-disclaimer">
            Verifica precios, disponibilidad y condiciones antes de tomar una decisión.
          </p>
        </div>
      </section>
    </main>
  );
}
