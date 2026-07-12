import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appMetadata } from "@real-estate-agent/shared";
import { ServiceException } from "../../lib/errors/service-error";
import type { Database } from "./types";

let cachedClient: SupabaseClient<Database> | null = null;

function getRequiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new ServiceException("CONFIGURATION_ERROR", `Missing required environment variable: ${name}`);
  }

  return value;
}

export function createBackendSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        "x-client-info": `${appMetadata.name}/agent-core`
      }
    }
  });
}

export function getBackendSupabaseClient(): SupabaseClient<Database> {
  if (!cachedClient) {
    cachedClient = createBackendSupabaseClient();
  }

  return cachedClient;
}
