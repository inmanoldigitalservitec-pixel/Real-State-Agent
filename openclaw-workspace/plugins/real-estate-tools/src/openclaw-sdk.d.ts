declare module "openclaw/plugin-sdk/tool-plugin" {
  export type OpenClawPluginToolContext = {
    config?: Record<string, unknown>;
    runtimeConfig?: Record<string, unknown>;
    getRuntimeConfig?: () => Record<string, unknown> | undefined;
    workspaceDir?: string;
    agentDir?: string;
    agentId?: string;
    sessionKey?: string;
    sessionId?: string;
    messageChannel?: string;
    oneShotCliRun?: boolean;
  };

  export type ToolPluginExecutionContext = {
    api: {
      logger?: {
        debug?: (message: string, payload?: unknown) => void;
        info?: (message: string, payload?: unknown) => void;
        warn?: (message: string, payload?: unknown) => void;
        error?: (message: string, payload?: unknown) => void;
      };
    };
    signal?: AbortSignal;
    toolCallId: string;
    onUpdate?: (payload: unknown) => void;
  };

  export type AgentToolResult<T = unknown> = {
    content: Array<{ type: "text"; text: string }>;
    details: T;
    terminate?: boolean;
  };

  export type AnyAgentTool = {
    name: string;
    label: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (
      toolCallId: string,
      params: unknown,
      signal?: AbortSignal,
      onUpdate?: (payload: AgentToolResult) => void
    ) => Promise<AgentToolResult>;
  };

  export type ToolPluginFactoryContext<TConfig = Record<string, unknown>> = {
    api: ToolPluginExecutionContext["api"];
    config: TConfig;
    toolContext: OpenClawPluginToolContext;
  };

  export type DefinedTool = {
    name: string;
    label?: string;
    description: string;
    parameters: Record<string, unknown>;
    optional?: boolean;
    execute?: (params: unknown, config: unknown, context: ToolPluginExecutionContext) => unknown;
    factory?: (context: ToolPluginFactoryContext<unknown>) => AnyAgentTool | AnyAgentTool[] | null | undefined;
  };

  export function defineToolPlugin(options: {
    id: string;
    name: string;
    description: string;
    activation?: {
      onStartup?: boolean;
    };
    configSchema?: Record<string, unknown>;
    tools: (tool: <T extends DefinedTool>(definition: T) => T) => readonly DefinedTool[];
  }): unknown;
}
