import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentCoreClient } from "../src/client/agent-core-client.js";
import { createLogger } from "../src/telemetry/logger.js";

describe("AgentCoreClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENCLAW_AGENT_CORE_API_KEY;
  });

  it("returns parsed health payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "ok",
            service: "agent-core",
            timestamp: new Date().toISOString(),
            version: "0.1.0"
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      )
    );

    const client = new AgentCoreClient(
      {
        baseUrl: "http://127.0.0.1:8787",
        internalApiKeyEnvVar: "OPENCLAW_AGENT_CORE_API_KEY",
        channel: "web",
        timeoutMs: 1000,
        logLevel: "info"
      },
      createLogger({})
    );

    const result = await client.getHealth({ correlationId: "corr-1" });

    expect(result.service).toBe("agent-core");
  });

  it("resolves conversations through the internal API with auth", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            conversationId: "88888888-8888-1888-8888-888888888888",
            companyId: "99999999-9999-1999-8999-999999999999",
            currentSalesStage: "NEW",
            memoryVersion: 1,
            created: true
          },
          metadata: {
            verifiedAt: new Date().toISOString()
          }
        }),
        { status: 201 }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = new AgentCoreClient(
      {
        baseUrl: "http://127.0.0.1:8787",
        internalApiKeyEnvVar: "OPENCLAW_AGENT_CORE_API_KEY",
        companyId: "99999999-9999-1999-8999-999999999999",
        channel: "web",
        timeoutMs: 1000,
        logLevel: "info"
      },
      createLogger({})
    );

    const result = await client.resolveConversation({
      correlationId: "corr-resolve",
      payload: {
        companyId: "99999999-9999-1999-8999-999999999999",
        channel: "web",
        externalSessionId: "agent:real-estate-agent:main",
        metadata: {
          runId: "run-1"
        }
      }
    });

    expect(result.created).toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:8787/internal/conversations/resolve");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer secret",
        "X-Correlation-Id": "corr-resolve"
      })
    });
  });

  it("loads conversation context and saves messages", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              conversationId: "88888888-8888-1888-8888-888888888888",
              currentSalesStage: "NEW",
              memory: null,
              messages: []
            },
            metadata: {
              verifiedAt: new Date().toISOString()
            }
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: "11111111-1111-1111-1111-111111111111",
              conversationId: "88888888-8888-1888-8888-888888888888",
              companyId: "99999999-9999-1999-8999-999999999999",
              role: "user",
              content: "Hola",
              salesStage: null,
              toolName: null,
              assetIds: [],
              createdAt: new Date().toISOString()
            },
            metadata: {
              verifiedAt: new Date().toISOString()
            }
          }),
          { status: 201 }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const client = new AgentCoreClient(
      {
        baseUrl: "http://127.0.0.1:8787",
        internalApiKeyEnvVar: "OPENCLAW_AGENT_CORE_API_KEY",
        companyId: "99999999-9999-1999-8999-999999999999",
        channel: "web",
        timeoutMs: 1000,
        logLevel: "info"
      },
      createLogger({})
    );

    const context = await client.getConversationContext({
      conversationId: "88888888-8888-1888-8888-888888888888",
      messageLimit: 5,
      correlationId: "corr-context"
    });
    const message = await client.saveConversationMessage({
      correlationId: "corr-message",
      payload: {
        conversationId: "88888888-8888-1888-8888-888888888888",
        companyId: "99999999-9999-1999-8999-999999999999",
        role: "user",
        content: "Hola",
        clientMessageId: "client-1"
      }
    });

    expect(context.messages).toEqual([]);
    expect(message.role).toBe("user");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/context?messageLimit=5");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/messages");
  });

  it("searches properties through the internal API with sanitized diagnostics", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              propertyId: "00000000-0000-0000-0000-000000000201",
              propertyCode: "APT-001",
              propertyName: "Apartamento Familiar 3H",
              propertyType: "apartment",
              developmentId: "00000000-0000-0000-0000-000000000101",
              developmentName: "Residencial Demo",
              locationLabel: "Santo Domingo",
              sector: "Ensanche Naco",
              city: "Santo Domingo",
              bedrooms: 3,
              bathrooms: 2,
              parkingSpaces: 2,
              areaFromM2: 110,
              areaToM2: 125,
              priceFrom: 7000000,
              priceTo: 7600000,
              currency: "DOP",
              summary: "Opcion de prueba",
              features: ["balcon"],
              coverImageUrl: "https://example.test/cover.jpg",
              availableUnits: 2,
              lastVerifiedAt: new Date().toISOString()
            }
          ],
          metadata: {
            verifiedAt: new Date().toISOString()
          }
        }),
        { status: 200 }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = new AgentCoreClient(
      {
        baseUrl: "http://127.0.0.1:8787",
        internalApiKeyEnvVar: "OPENCLAW_AGENT_CORE_API_KEY",
        companyId: "99999999-9999-1999-8999-999999999999",
        channel: "web",
        timeoutMs: 1000,
        logLevel: "info"
      },
      createLogger({})
    );

    const result = await client.searchProperties({
      correlationId: "corr-search",
      payload: {
        companyId: "99999999-9999-1999-8999-999999999999",
        location: "Santo Domingo",
        bedrooms: 3,
        propertyType: "apartment",
        limit: 3
      }
    });
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);

    expect(result).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:8787/internal/properties/search");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer secret",
        "X-Correlation-Id": "corr-search"
      })
    });
    expect(body).toMatchObject({
      companyId: "99999999-9999-1999-8999-999999999999",
      location: "Santo Domingo",
      bedrooms: 3,
      propertyType: "apartment",
      limit: 3
    });
  });
});
