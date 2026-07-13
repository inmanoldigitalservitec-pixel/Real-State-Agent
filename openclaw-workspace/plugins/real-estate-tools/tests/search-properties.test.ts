import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTrustedToolContext } from "../src/context.js";
import {
  createSearchPropertiesToolFactory,
  executeSearchProperties,
  mergeSearchFilters,
  searchPropertiesParamsSchema,
  validateSearchPropertiesParams
} from "../src/tools/search-properties.js";

const companyId = "99999999-9999-1999-8999-999999999999";
const conversationId = "88888888-8888-1888-8888-888888888888";
const propertyId = "00000000-0000-0000-0000-000000000201";

const config = {
  baseUrl: "http://127.0.0.1:8787",
  companyId,
  channel: "web" as const
};

describe("search_properties", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENCLAW_AGENT_CORE_API_KEY;
  });

  it("declares a closed visible schema with default 3 and max limit of 10", () => {
    expect(searchPropertiesParamsSchema.additionalProperties).toBe(false);
    expect(searchPropertiesParamsSchema.properties.limit.default).toBe(3);
    expect(searchPropertiesParamsSchema.properties.limit.maximum).toBe(10);
    expect(Object.keys(searchPropertiesParamsSchema.properties).sort()).toEqual([
      "amenities",
      "availability",
      "bathrooms",
      "bedrooms",
      "city",
      "currency",
      "limit",
      "location",
      "maximumPrice",
      "minimumPrice",
      "parkingSpaces",
      "propertyType",
      "sector"
    ]);
  });

  it("trims accepted arguments and rejects private ids", () => {
    expect(
      validateSearchPropertiesParams({
        location: " Santo Domingo ",
        propertyType: "apartment",
        limit: 4
      })
    ).toEqual({
      location: "Santo Domingo",
      propertyType: "apartment",
      limit: 4
    });
    expect(validateSearchPropertiesParams({ limit: 10 })).toEqual({ limit: 10 });

    expect(() => validateSearchPropertiesParams({ companyId })).toThrow("companyId");
    expect(() => validateSearchPropertiesParams({ agentId: "main" })).toThrow("agentId");
    expect(() => validateSearchPropertiesParams({ sessionKey: "agent:main:forged" })).toThrow("sessionKey");
    expect(() => validateSearchPropertiesParams({ propertyId })).toThrow("propertyId");
    expect(() => validateSearchPropertiesParams({ limit: 11 })).toThrow("limit");
  });

  it("merges explicit arguments over conversation memory", () => {
    const merged = mergeSearchFilters(
      {
        bedrooms: 2,
        propertyType: "apartment",
        limit: 3
      },
      {
        conversationId,
        currentSalesStage: "DISCOVERY",
        memory: {
          preferredLocations: ["Santo Domingo"],
          bedrooms: 3,
          bathrooms: 2,
          parkingSpaces: 1,
          propertyTypes: ["villa"],
          maximumBudget: 8000000,
          currency: "DOP",
          importantAmenities: ["piscina"]
        },
        messages: []
      }
    );

    expect(merged).toEqual({
      location: "Santo Domingo",
      bedrooms: 2,
      bathrooms: 2,
      parkingSpaces: 1,
      maximumPrice: 8000000,
      currency: "DOP",
      propertyType: "apartment",
      amenities: ["piscina"],
      limit: 3
    });
  });

  it("searches with trusted context, returns compact results, and updates state once", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resolveEnvelope({ created: true }))
      .mockResolvedValueOnce(
        successEnvelope({
          conversationId,
          currentSalesStage: "DISCOVERY",
          memory: {
            preferredLocations: ["Santo Domingo"],
            bathrooms: 2,
            parkingSpaces: 2,
            maximumBudget: 9000000,
            currency: "DOP",
            importantAmenities: ["balcon"]
          },
          messages: []
        })
      )
      .mockResolvedValueOnce(
        successEnvelope([
          {
            propertyId,
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
            summary: "Opcion real de prueba",
            features: ["balcon"],
            coverImageUrl: "https://example.test/cover.jpg",
            availableUnits: 2,
            lastVerifiedAt: new Date().toISOString()
          }
        ])
      )
      .mockResolvedValueOnce(successEnvelope({ ok: true }));

    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSearchProperties(
      {
        bedrooms: 3,
        propertyType: "apartment"
      },
      config,
      trustedContext({
        logger: createLoggerSpy()
      }),
      runtimeContext({
        logger: createLoggerSpy()
      })
    );
    const searchBody = JSON.parse(fetchMock.mock.calls[2]?.[1]?.body as string);
    const statePatch = JSON.parse(fetchMock.mock.calls[3]?.[1]?.body as string);
    const serializedResult = JSON.stringify(result);

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(searchBody).toEqual({
      location: "Santo Domingo",
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 2,
      maximumPrice: 9000000,
      currency: "DOP",
      propertyType: "apartment",
      amenities: ["balcon"],
      limit: 3,
      companyId
    });
    expect(statePatch).toMatchObject({
      preferredLocations: ["Santo Domingo"],
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 2,
      propertyTypes: ["apartment"],
      maximumBudget: 9000000,
      currency: "DOP",
      importantAmenities: ["balcon"],
      recommendedPropertyIds: [propertyId],
      recentPropertyIds: [propertyId],
      lastCustomerIntent: "property_search",
      salesStage: "RECOMMENDATION"
    });
    expect(result).toMatchObject({
      ok: true,
      zeroResults: false,
      appliedFilters: {
        location: "Santo Domingo",
        bedrooms: 3,
        propertyType: "apartment",
        limit: 3
      },
      results: [
        {
          index: 1,
          propertyId,
          name: "Apartamento Familiar 3H",
          project: "Residencial Demo",
          availableUnits: 2
        }
      ]
    });
    expect(serializedResult).not.toContain(companyId);
    expect(serializedResult).not.toContain(conversationId);
    expect(serializedResult).not.toContain("secret");
    expect(serializedResult).not.toContain("correlationId");
  });

  it("uses DISCOVERY and does not persist ids when there are zero results", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resolveEnvelope({ created: false }))
      .mockResolvedValueOnce(
        successEnvelope({
          conversationId,
          currentSalesStage: "DISCOVERY",
          memory: null,
          messages: []
        })
      )
      .mockResolvedValueOnce(successEnvelope([]))
      .mockResolvedValueOnce(successEnvelope({ ok: true }));

    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSearchProperties(
      {
        location: "Santo Domingo",
        propertyType: "apartment"
      },
      config,
      trustedContext({
        logger: createLoggerSpy()
      }),
      runtimeContext({
        logger: createLoggerSpy()
      })
    );
    const statePatch = JSON.parse(fetchMock.mock.calls[3]?.[1]?.body as string);

    expect(result.zeroResults).toBe(true);
    expect(statePatch).toEqual({
      preferredLocations: ["Santo Domingo"],
      propertyTypes: ["apartment"],
      lastCustomerIntent: "property_search",
      salesStage: "DISCOVERY"
    });
  });

  it("uses the default limit 3 when no limit is provided", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = createSearchFetchMock([
      propertySearchResult("Apartamento Familiar 3H", { propertyId: "00000000-0000-0000-0000-000000000201" }),
      propertySearchResult("Apartamento Urbano 3H Plus", { propertyId: "00000000-0000-0000-0000-000000000203" }),
      propertySearchResult("Apartamento Parque Este 2H", { propertyId: "00000000-0000-0000-0000-000000000205", bedrooms: 2 }),
      propertySearchResult("Apartamento Compacto 2H", { propertyId: "00000000-0000-0000-0000-000000000202", bedrooms: 2 })
    ]);

    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSearchProperties(
      {
        propertyType: "apartment",
        availability: "available"
      },
      config,
      trustedContext({
        logger: createLoggerSpy()
      }),
      runtimeContext({
        logger: createLoggerSpy()
      })
    );
    const searchBody = JSON.parse(fetchMock.mock.calls[2]?.[1]?.body as string);

    expect(searchBody.limit).toBe(3);
    expect(result.appliedFilters.limit).toBe(3);
    expect(result.results.map((item) => item.name)).toEqual([
      "Apartamento Familiar 3H",
      "Apartamento Urbano 3H Plus",
      "Apartamento Parque Este 2H"
    ]);
  });

  it("respects limit 4 in the final visible result set", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = createSearchFetchMock([
      propertySearchResult("Apartamento Familiar 3H", { propertyId: "00000000-0000-0000-0000-000000000201" }),
      propertySearchResult("Apartamento Urbano 3H Plus", { propertyId: "00000000-0000-0000-0000-000000000203" }),
      propertySearchResult("Apartamento Parque Este 2H", { propertyId: "00000000-0000-0000-0000-000000000205", bedrooms: 2 }),
      propertySearchResult("Apartamento Compacto 2H", { propertyId: "00000000-0000-0000-0000-000000000202", bedrooms: 2 }),
      propertySearchResult("Apartamento Extra 2H", { propertyId: "00000000-0000-0000-0000-000000000206", bedrooms: 2 })
    ]);

    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSearchProperties(
      {
        propertyType: "apartment",
        availability: "available",
        limit: 4
      },
      config,
      trustedContext({
        logger: createLoggerSpy()
      }),
      runtimeContext({
        logger: createLoggerSpy()
      })
    );
    const searchBody = JSON.parse(fetchMock.mock.calls[2]?.[1]?.body as string);

    expect(searchBody.limit).toBe(4);
    expect(result.results.map((item) => item.name)).toEqual([
      "Apartamento Familiar 3H",
      "Apartamento Urbano 3H Plus",
      "Apartamento Parque Este 2H",
      "Apartamento Compacto 2H"
    ]);
  });

  it("returns the 4 current available apartments when limit is 10", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = createSearchFetchMock([
      propertySearchResult("Apartamento Familiar 3H", { propertyId: "00000000-0000-0000-0000-000000000201" }),
      propertySearchResult("Apartamento Urbano 3H Plus", { propertyId: "00000000-0000-0000-0000-000000000203" }),
      propertySearchResult("Apartamento Parque Este 2H", { propertyId: "00000000-0000-0000-0000-000000000205", bedrooms: 2 }),
      propertySearchResult("Apartamento Compacto 2H", { propertyId: "00000000-0000-0000-0000-000000000202", bedrooms: 2 })
    ]);

    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSearchProperties(
      {
        propertyType: "apartment",
        availability: "available",
        limit: 10
      },
      config,
      trustedContext({
        logger: createLoggerSpy()
      }),
      runtimeContext({
        logger: createLoggerSpy()
      })
    );
    const searchBody = JSON.parse(fetchMock.mock.calls[2]?.[1]?.body as string);

    expect(searchBody.limit).toBe(10);
    expect(result.results.map((item) => item.name)).toEqual([
      "Apartamento Familiar 3H",
      "Apartamento Urbano 3H Plus",
      "Apartamento Parque Este 2H",
      "Apartamento Compacto 2H"
    ]);
  });

  it("never returns more than 10 results", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = createSearchFetchMock(
      Array.from({ length: 11 }, (_, index) =>
        propertySearchResult(`Apartamento ${index + 1}`, {
          propertyId: `00000000-0000-0000-0000-${String(201 + index).padStart(12, "0")}`
        })
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSearchProperties(
      {
        propertyType: "apartment",
        availability: "available",
        limit: 10
      },
      config,
      trustedContext({
        logger: createLoggerSpy()
      }),
      runtimeContext({
        logger: createLoggerSpy()
      })
    );

    expect(result.results).toHaveLength(10);
    expect(result.results.at(-1)?.name).toBe("Apartamento 10");
  });

  it("rejects missing trusted runtime context in a controlled way", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";

    await expect(
      executeSearchProperties(
        {
          location: "Santo Domingo"
        },
        config,
        unavailableTrustedContext(),
        {
          api: {
            logger: {},
            runContext: {}
          } as never,
          toolCallId: "tool-1"
        }
      )
    ).rejects.toThrow("real-estate-agent");
  });

  it("works when agentId is absent but sessionKey is valid", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resolveEnvelope({ created: true }))
      .mockResolvedValueOnce(
        successEnvelope({
          conversationId,
          currentSalesStage: "DISCOVERY",
          memory: null,
          messages: []
        })
      )
      .mockResolvedValueOnce(
        successEnvelope([
          {
            propertyId,
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
            summary: "Opcion real de prueba",
            features: ["balcon"],
            coverImageUrl: "https://example.test/cover.jpg",
            availableUnits: 2,
            lastVerifiedAt: new Date().toISOString()
          }
        ])
      )
      .mockResolvedValueOnce(successEnvelope({ ok: true }));
    const logger = createLoggerSpy();

    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSearchProperties(
      {
        location: "Santo Domingo",
        bedrooms: 3,
        propertyType: "apartment"
      },
      config,
      trustedContext({
        runContext: {
          agentId: undefined,
          sessionKey: "agent:real-estate-agent:test-session",
          runId: "run-1"
        },
        logger
      }),
      runtimeContext({
        runContext: {
          agentId: undefined,
          sessionKey: "agent:real-estate-agent:test-session",
          runId: "run-1"
        },
        logger
      })
    );

    expect(result.ok).toBe(true);
    expect(result.results[0]?.name).toBe("Apartamento Familiar 3H");
    expect(logger.info).toHaveBeenCalledWith(
      "search_properties trusted context resolved",
      expect.objectContaining({
        agentIdSource: "sessionKey",
        hasSessionKey: true,
        toolCallId: "tool-1"
      })
    );
  });

  it("rejects inconsistent explicit agentId and sessionKey", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";

    expect(() =>
      trustedContext({
        runContext: {
          agentId: "main",
          sessionKey: "agent:real-estate-agent:session"
        }
      })
    ).toThrow("inconsistent trusted agent context");
  });

  it("rejects main sessionKey through the guard", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";

    await expect(
      executeSearchProperties(
        {
          location: "Santo Domingo"
        },
        config,
        trustedContext({
          runContext: {
            agentId: undefined,
            sessionKey: "agent:main:session"
          }
        }),
        {
          api: {
            logger: {},
            runContext: {
              sessionKey: "agent:main:session"
            }
          } as never,
          toolCallId: "tool-1"
        }
      )
    ).rejects.toThrow("real-estate-agent");
  });

  it("factory returns the tool for real-estate-agent", () => {
    const tool = createSearchPropertiesToolFactory(
      factoryContext({
        toolContext: {
          agentId: "real-estate-agent",
          sessionKey: "agent:real-estate-agent:factory-session",
          sessionId: "session-id",
          workspaceDir: "/workspace"
        }
      })
    );

    expect(tool?.name).toBe("search_properties");
    expect(tool?.label).toBe("Search Properties");
    expect(tool?.description).toBeTruthy();
    expect(tool?.parameters).toBe(searchPropertiesParamsSchema);
  });

  it("factory returns null for main and missing identity", () => {
    expect(
      createSearchPropertiesToolFactory(
        factoryContext({
          toolContext: {
            agentId: "main",
            sessionKey: "agent:main:session"
          }
        })
      )
    ).toBeNull();

    expect(
      createSearchPropertiesToolFactory(
        factoryContext({
          toolContext: {}
        })
      )
    ).toBeNull();
  });

  it("factory derives real-estate-agent from sessionKey when agentId is absent", () => {
    const tool = createSearchPropertiesToolFactory(
      factoryContext({
        toolContext: {
          sessionKey: "agent:real-estate-agent:factory-session"
        }
      })
    );

    expect(tool?.name).toBe("search_properties");
  });

  it("factory rejects mismatched agentId and sessionKey", () => {
    const tool = createSearchPropertiesToolFactory(
      factoryContext({
        toolContext: {
          agentId: "main",
          sessionKey: "agent:real-estate-agent:factory-session"
        }
      })
    );

    expect(tool).toBeNull();
  });

  it("factory execute uses trusted closure identity and ignores model-supplied identity", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resolveEnvelope({ created: true }))
      .mockResolvedValueOnce(
        successEnvelope({
          conversationId,
          currentSalesStage: "DISCOVERY",
          memory: null,
          messages: []
        })
      )
      .mockResolvedValueOnce(
        successEnvelope([
          {
            propertyId,
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
            summary: "Opcion real de prueba",
            features: ["balcon"],
            coverImageUrl: "https://example.test/cover.jpg",
            availableUnits: 2,
            lastVerifiedAt: new Date().toISOString()
          }
        ])
      )
      .mockResolvedValueOnce(successEnvelope({ ok: true }));
    const logger = createLoggerSpy();
    const tool = createSearchPropertiesToolFactory(
      factoryContext({
        logger,
        toolContext: {
          sessionKey: "agent:real-estate-agent:factory-session"
        }
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await tool?.execute(
      "tool-1",
      {
        location: "Santo Domingo",
        bedrooms: 3,
        propertyType: "apartment"
      },
      new AbortController().signal
    );

    expect(result?.details).toMatchObject({
      ok: true,
      results: [
        {
          name: "Apartamento Familiar 3H"
        }
      ]
    });
    expect(result?.content[0]?.text).toContain("Apartamento Familiar 3H");
    expect(result?.content[0]?.text).toContain(propertyId);
    expect(result?.content[0]?.text).toContain("https://example.test/cover.jpg");

    const visibleContent = JSON.parse(result?.content[0]?.text ?? "{}");

    expect(visibleContent.results[0]).toMatchObject({
      propertyId,
      coverImageUrl: "https://example.test/cover.jpg"
    });

    expect(logger.info).toHaveBeenCalledWith(
      "search_properties trusted context resolved",
      expect.objectContaining({
        agentIdSource: "sessionKey",
        hasSessionKey: true,
        toolCallId: "tool-1"
      })
    );
  });

  it("factory execute can read private plugin config from runtime toolContext", async () => {
    process.env.OPENCLAW_AGENT_CORE_API_KEY = "secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resolveEnvelope({ created: true }))
      .mockResolvedValueOnce(
        successEnvelope({
          conversationId,
          currentSalesStage: "DISCOVERY",
          memory: null,
          messages: []
        })
      )
      .mockResolvedValueOnce(
        successEnvelope([
          {
            propertyId,
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
            summary: "Opcion real de prueba",
            features: ["balcon"],
            coverImageUrl: "https://example.test/cover.jpg",
            availableUnits: 2,
            lastVerifiedAt: new Date().toISOString()
          }
        ])
      )
      .mockResolvedValueOnce(successEnvelope({ ok: true }));
    const logger = createLoggerSpy();
    const tool = createSearchPropertiesToolFactory(
      factoryContext({
        logger,
        config: {
          baseUrl: config.baseUrl,
          channel: config.channel
        },
        toolContext: {
          agentId: "real-estate-agent",
          sessionKey: "agent:real-estate-agent:factory-session",
          config: {
            plugins: {
              entries: {
                "real-estate-tools": {
                  config
                }
              }
            }
          }
        }
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await tool?.execute(
      "tool-1",
      {
        location: "Santo Domingo",
        bedrooms: 3,
        propertyType: "apartment"
      },
      new AbortController().signal
    );

    expect(result?.details).toMatchObject({
      ok: true,
      results: [
        {
          name: "Apartamento Familiar 3H"
        }
      ]
    });
    expect(logger.info).toHaveBeenCalledWith(
      "search_properties private config resolved source=runtimeConfig hasCompanyId=true",
      undefined
    );
  });
});

function trustedContext(input?: {
  runContext?: Record<string, unknown>;
  logger?: {
    info?: ReturnType<typeof vi.fn>;
    debug?: ReturnType<typeof vi.fn>;
    warn?: ReturnType<typeof vi.fn>;
    error?: ReturnType<typeof vi.fn>;
  };
}) {
  return buildTrustedToolContext(runtimeContext(input));
}

function unavailableTrustedContext() {
  return buildTrustedToolContext({
    api: {
      logger: {}
    },
    toolCallId: "tool-1"
  });
}

function factoryContext(input?: {
  logger?: {
    info?: ReturnType<typeof vi.fn>;
    debug?: ReturnType<typeof vi.fn>;
    warn?: ReturnType<typeof vi.fn>;
    error?: ReturnType<typeof vi.fn>;
  };
  toolContext?: Record<string, unknown>;
  config?: Record<string, unknown>;
}) {
  return {
    api: {
      logger: input?.logger ?? {}
    },
    config: input?.config ?? config,
    toolContext: input?.toolContext ?? {}
  } as never;
}

function runtimeContext(input?: {
  runContext?: Record<string, unknown>;
  logger?: {
    info?: ReturnType<typeof vi.fn>;
    debug?: ReturnType<typeof vi.fn>;
    warn?: ReturnType<typeof vi.fn>;
    error?: ReturnType<typeof vi.fn>;
  };
}) {
  const baseRunContext: Record<string, unknown> = {
    agentId: "real-estate-agent",
    sessionKey: "agent:real-estate-agent:test-session",
    runId: "run-1"
  };
  const mergedRunContext = {
    ...baseRunContext,
    ...(input?.runContext ?? {})
  };

  if (input?.runContext && Object.hasOwn(input.runContext, "agentId") && input.runContext.agentId === undefined) {
    delete mergedRunContext.agentId;
  }

  return {
    api: {
      logger: input?.logger ?? {},
      runContext: mergedRunContext
    } as never,
    toolCallId: "tool-1",
    signal: new AbortController().signal
  };
}

function createLoggerSpy() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}

function createSearchFetchMock(results: unknown[]) {
  return vi
    .fn()
    .mockResolvedValueOnce(resolveEnvelope({ created: true }))
    .mockResolvedValueOnce(
      successEnvelope({
        conversationId,
        currentSalesStage: "DISCOVERY",
        memory: null,
        messages: []
      })
    )
    .mockResolvedValueOnce(successEnvelope(results))
    .mockResolvedValueOnce(successEnvelope({ ok: true }));
}

function propertySearchResult(name: string, overrides?: Record<string, unknown>) {
  return {
    propertyId,
    propertyCode: "APT-001",
    propertyName: name,
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
    summary: "Opcion real de prueba",
    features: ["balcon"],
    coverImageUrl: "https://example.test/cover.jpg",
    availableUnits: 2,
    lastVerifiedAt: new Date().toISOString(),
    ...overrides
  };
}

function resolveEnvelope(input: { created: boolean }) {
  return successEnvelope(
    {
      conversationId,
      companyId,
      currentSalesStage: "DISCOVERY",
      memoryVersion: 1,
      created: input.created
    },
    input.created ? 201 : 200
  );
}

function successEnvelope(data: unknown, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      metadata: {
        verifiedAt: new Date().toISOString()
      }
    }),
    { status }
  );
}
