import { randomUUID } from "node:crypto";
import {
  publicChatRequestSchema,
  publicChatResponseSchema,
  type PublicChatRequest,
  type PublicChatResponse
} from "@real-estate-agent/shared";
import {
  OpenClawAgentClientError,
  type OpenClawAgentClient,
  type OpenClawAgentResponse
} from "../integrations/openclaw/openclaw-agent.client";
import { ServiceException } from "../lib/errors/service-error";

export type PublicChatAgentClient = Pick<
  OpenClawAgentClient,
  "sendMessage"
>;

export type PublicChatServiceOptions = {
  createSessionId?: () => string;
};

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255
    )
  ) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
}

function isUnsafeHostname(hostname: string): boolean {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

  if (!normalized) {
    return true;
  }

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "0.0.0.0" ||
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  return isPrivateIpv4(normalized);
}

export function isSafePublicMediaUrl(value: string): boolean {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    return false;
  }

  if (parsed.username || parsed.password) {
    return false;
  }

  return !isUnsafeHostname(parsed.hostname);
}

function normalizeAgentResponse(
  response: OpenClawAgentResponse
): Pick<PublicChatResponse["data"], "message" | "payloads"> {
  const payloads: PublicChatResponse["data"]["payloads"] = [];

  for (const payload of response.payloads) {
    if (payload.type === "text") {
      const text = payload.text.trim();

      if (text) {
        payloads.push({
          type: "text",
          text
        });
      }

      continue;
    }

    const url = payload.url.trim();

    if (isSafePublicMediaUrl(url)) {
      payloads.push({
        type: "media",
        url
      });
    }
  }

  const textPayloads = payloads.filter(
    (
      payload
    ): payload is Extract<
      PublicChatResponse["data"]["payloads"][number],
      { type: "text" }
    > => payload.type === "text"
  );

  const message =
    textPayloads.length > 0
      ? textPayloads.map((payload) => payload.text).join("\n\n")
      : response.message.trim();

  if (!message && payloads.length === 0) {
    throw new ServiceException(
      "EXTERNAL_ERROR",
      "The chat agent returned no public content"
    );
  }

  return {
    message,
    payloads
  };
}

export class PublicChatService {
  private readonly createSessionId: () => string;

  constructor(
    private readonly agentClient: PublicChatAgentClient,
    options: PublicChatServiceOptions = {}
  ) {
    this.createSessionId =
      options.createSessionId ?? randomUUID;
  }

  async chat(input: PublicChatRequest): Promise<PublicChatResponse> {
    const request = publicChatRequestSchema.parse(input);
    const sessionId =
      request.sessionId ?? this.createSessionId();

    try {
      const agentResponse =
        await this.agentClient.sendMessage({
          sessionId,
          message: request.message
        });

      const normalized =
        normalizeAgentResponse(agentResponse);

      return publicChatResponseSchema.parse({
        success: true,
        data: {
          sessionId,
          message: normalized.message,
          payloads: normalized.payloads
        }
      });
    } catch (error) {
      if (error instanceof ServiceException) {
        throw error;
      }

      if (error instanceof OpenClawAgentClientError) {
        throw new ServiceException(
          "EXTERNAL_ERROR",
          "The chat agent is temporarily unavailable"
        );
      }

      throw new ServiceException(
        "EXTERNAL_ERROR",
        "The chat agent request failed"
      );
    }
  }
}
