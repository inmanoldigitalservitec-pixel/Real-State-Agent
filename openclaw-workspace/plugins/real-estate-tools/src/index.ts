import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";
import { pluginConfigSchema } from "./config.js";
import {
  createGetPropertyAssetsToolFactory,
  getPropertyAssetsDescription,
  getPropertyAssetsParamsSchema
} from "./tools/get-property-assets.js";
import { emptyParamsSchema, executeAgentCoreHealth } from "./tools/agent-core-health.js";
import {
  createSearchPropertiesToolFactory,
  searchPropertiesDescription,
  searchPropertiesParamsSchema
} from "./tools/search-properties.js";

const plugin = defineToolPlugin({
  id: "real-estate-tools",
  name: "Real Estate Tools",
  description: "Private agent-core integration tools for the Real State Agent workspace.",
  activation: {
    onStartup: true
  },
  configSchema: pluginConfigSchema,
  tools: (tool) => [
    tool({
      name: "agent_core_health",
      label: "Agent Core Health",
      description: "Check whether the local agent-core service is reachable and healthy.",
      parameters: emptyParamsSchema,
      async execute(params, config, context) {
        return executeAgentCoreHealth(
          (params ?? {}) as Record<string, never>,
          (config ?? {}) as Record<string, unknown>,
          context
        );
      }
    }),
    tool({
      name: "search_properties",
      label: "Search Properties",
      description: searchPropertiesDescription,
      parameters: searchPropertiesParamsSchema,
      factory(factoryContext) {
        return createSearchPropertiesToolFactory({
          ...factoryContext,
          config: (factoryContext.config ?? {}) as Record<string, unknown>
        });
      }
    }),
    tool({
      name: "get_property_assets",
      label: "Get Property Assets",
      description: getPropertyAssetsDescription,
      parameters: getPropertyAssetsParamsSchema,
      factory(factoryContext) {
        return createGetPropertyAssetsToolFactory({
          ...factoryContext,
          config: (factoryContext.config ?? {}) as Record<string, unknown>
        });
      }
    })
  ]
});

export default plugin;
