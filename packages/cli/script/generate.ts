import { LADIZAI_CATALOG } from "@opencode-ai/core/models-dev"

const modelsUrl = process.env.OPENCODE_MODELS_URL

export const modelsData = process.env.MODELS_DEV_API_JSON
  ? await Bun.file(process.env.MODELS_DEV_API_JSON).text()
  : modelsUrl
    ? await fetch(`${modelsUrl}/api.json`).then((response) => response.text())
    : JSON.stringify(LADIZAI_CATALOG)

console.log("Loaded Ladiz AI models snapshot")
