import type { Argv } from "yargs"
import { Effect, Option } from "effect"
import { Auth } from "@/auth"
import { CliError, effectCmd, fail } from "../effect-cmd"
import * as Prompt from "../effect/prompt"
import { UI } from "../ui"

export const LADIZAI_BASE_URL = "https://ladiz.web.id/api/v1"

const promptValue = <Value>(value: Option.Option<Value>) => {
  if (Option.isNone(value)) return Effect.die(new UI.CancelledError())
  return Effect.succeed(value.value)
}

const loginEffect = Effect.fn("Cli.auth.login")(function* (args: { key?: string }) {
  const authSvc = yield* Auth.Service

  yield* Prompt.intro("Log in to Ladiz AI")

  const apiKey = args.key
    ? args.key
    : yield* promptValue(
        yield* Prompt.password({
          message: "Enter your Ladiz AI API key",
          validate: (x) => (x && x.trim().length > 0 ? undefined : "API key is required"),
        }),
      )

  yield* Effect.orDie(
    authSvc.set("ladizai", {
      type: "api",
      key: apiKey.trim(),
    }),
  )

  yield* Prompt.log.info("API Key saved successfully. Default model set to ladiz-core")
  yield* Prompt.outro("You can now use ladizcode directly!")
})

export const LoginAuthCommand = effectCmd({
  command: "login",
  describe: "log in with your Ladiz AI API key",
  instance: false,
  builder: (yargs: Argv) =>
    yargs.option("key", {
      describe: "Ladiz AI API key",
      type: "string",
    }),
  handler: Effect.fn("Cli.auth.loginCommand")(function* (args) {
    UI.empty()
    yield* loginEffect({ key: args.key })
  }),
})
