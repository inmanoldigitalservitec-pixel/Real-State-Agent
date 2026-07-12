import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

function candidateRoots(startDir: string): string[] {
  const roots: string[] = [];
  let current = startDir;

  for (let index = 0; index < 8; index += 1) {
    roots.push(current);

    const parent = resolve(current, "..");
    if (parent === current) {
      break;
    }

    current = parent;
  }

  return roots;
}

function resolveMonorepoEnvPath(moduleUrl?: string): string {
  const moduleDir = moduleUrl ? dirname(fileURLToPath(moduleUrl)) : process.cwd();
  const cwd = process.cwd();
  const seen = new Set<string>();

  for (const baseDir of [...candidateRoots(moduleDir), ...candidateRoots(cwd)]) {
    if (seen.has(baseDir)) {
      continue;
    }

    seen.add(baseDir);

    const envPath = resolve(baseDir, ".env");
    const workspaceMarker = resolve(baseDir, "pnpm-workspace.yaml");

    if (existsSync(envPath) && existsSync(workspaceMarker)) {
      return envPath;
    }
  }

  return resolve(cwd, ".env");
}

let loadedEnvPath: string | null = null;

export function loadMonorepoEnv(moduleUrl?: string): string {
  if (loadedEnvPath) {
    return loadedEnvPath;
  }

  const envPath = resolveMonorepoEnvPath(moduleUrl);
  loadDotenv({ path: envPath, override: false });
  loadedEnvPath = envPath;

  return envPath;
}
