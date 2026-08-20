import { Config } from "effect"

function getEnv(key: string) {
  const ladizKey = key.startsWith("OPENCODE_") ? key.replace(/^OPENCODE_/, "LADIZCODE_") : key
  return process.env[ladizKey] ?? process.env[key]
}

export function truthy(key: string) {
  const value = getEnv(key)?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = getEnv("OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
const fff = getEnv("OPENCODE_DISABLE_FFF")

function enabledByExperimental(key: string) {
  return getEnv(key) === undefined ? truthy("OPENCODE_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  OPENCODE_AUTO_HEAP_SNAPSHOT: truthy("OPENCODE_AUTO_HEAP_SNAPSHOT"),
  OPENCODE_GIT_BASH_PATH: getEnv("OPENCODE_GIT_BASH_PATH"),
  OPENCODE_CONFIG: getEnv("OPENCODE_CONFIG"),
  OPENCODE_CONFIG_CONTENT: getEnv("OPENCODE_CONFIG_CONTENT"),
  OPENCODE_DISABLE_AUTOUPDATE: truthy("OPENCODE_DISABLE_AUTOUPDATE"),
  OPENCODE_ALWAYS_NOTIFY_UPDATE: truthy("OPENCODE_ALWAYS_NOTIFY_UPDATE"),
  OPENCODE_DISABLE_PRUNE: truthy("OPENCODE_DISABLE_PRUNE"),
  OPENCODE_DISABLE_TERMINAL_TITLE: truthy("OPENCODE_DISABLE_TERMINAL_TITLE"),
  OPENCODE_SHOW_TTFD: truthy("OPENCODE_SHOW_TTFD"),
  OPENCODE_DISABLE_AUTOCOMPACT: truthy("OPENCODE_DISABLE_AUTOCOMPACT"),
  OPENCODE_DISABLE_MODELS_FETCH: truthy("OPENCODE_DISABLE_MODELS_FETCH"),
  OPENCODE_DISABLE_MOUSE: truthy("OPENCODE_DISABLE_MOUSE"),
  OPENCODE_FAKE_VCS: getEnv("OPENCODE_FAKE_VCS"),
  OPENCODE_SERVER_PASSWORD: getEnv("OPENCODE_SERVER_PASSWORD"),
  OPENCODE_SERVER_USERNAME: getEnv("OPENCODE_SERVER_USERNAME"),
  OPENCODE_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("OPENCODE_DISABLE_FFF"),

  // Experimental
  OPENCODE_EXPERIMENTAL_FILEWATCHER: Config.boolean("LADIZCODE_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.orElse(() => Config.boolean("OPENCODE_EXPERIMENTAL_FILEWATCHER")),
    Config.withDefault(false),
  ),
  OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("LADIZCODE_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.orElse(() => Config.boolean("OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER")),
    Config.withDefault(false),
  ),
  OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  OPENCODE_MODELS_URL: getEnv("OPENCODE_MODELS_URL"),
  OPENCODE_MODELS_PATH: getEnv("OPENCODE_MODELS_PATH"),
  OPENCODE_DB: getEnv("OPENCODE_DB"),

  OPENCODE_WORKSPACE_ID: getEnv("OPENCODE_WORKSPACE_ID"),
  OPENCODE_EXPERIMENTAL_WORKSPACES: enabledByExperimental("OPENCODE_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get OPENCODE_DISABLE_PROJECT_CONFIG() {
    return truthy("OPENCODE_DISABLE_PROJECT_CONFIG")
  },
  get OPENCODE_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("OPENCODE_EXPERIMENTAL_REFERENCES")
  },
  get OPENCODE_TUI_CONFIG() {
    return getEnv("OPENCODE_TUI_CONFIG")
  },
  get OPENCODE_CONFIG_DIR() {
    return getEnv("OPENCODE_CONFIG_DIR")
  },
  get OPENCODE_PURE() {
    return truthy("OPENCODE_PURE")
  },
  get OPENCODE_PERMISSION() {
    return getEnv("OPENCODE_PERMISSION")
  },
  get OPENCODE_PLUGIN_META_FILE() {
    return getEnv("OPENCODE_PLUGIN_META_FILE")
  },
  get OPENCODE_CLIENT() {
    return getEnv("OPENCODE_CLIENT") ?? "cli"
  },
}
