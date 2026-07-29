import type { Argv } from "yargs"
import { Effect, Option } from "effect"
import { Auth } from "@/auth"
import { CliError, effectCmd, fail } from "../effect-cmd"
import * as Prompt from "../effect/prompt"
import { UI } from "../ui"

export const LADIZAI_BASE_URL = "https://ladizai.chinafezz.my.id/api"

const promptValue = <Value>(value: Option.Option<Value>) => {
  if (Option.isNone(value)) return Effect.die(new UI.CancelledError())
  return Effect.succeed(value.value)
}

const loginEffect = Effect.fn("Cli.auth.login")(function* (args: { email?: string; password?: string }) {
  const authSvc = yield* Auth.Service

  yield* Prompt.intro("Log in to LadizAI Gateway")

  const email = args.email
    ? args.email
    : yield* promptValue(
        yield* Prompt.text({
          message: "Enter your email",
          validate: (x) => (x && x.includes("@") ? undefined : "Valid email is required"),
        }),
      )

  const password = args.password
    ? args.password
    : yield* promptValue(
        yield* Prompt.password({
          message: "Enter your password",
          validate: (x) => (x && x.length > 0 ? undefined : "Password is required"),
        }),
      )

  const spinner = Prompt.spinner()
  yield* spinner.start("Authenticating with LadizAI...")

  type LoginResponse = {
    token?: string
    user?: {
      id: number
      name: string
      email: string
      api_key: string
    }
  }

  let response: LoginResponse
  try {
    response = yield* Effect.tryPromise({
      try: async () => {
        const res = await fetch(`${LADIZAI_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const errText = await res.text().catch(() => "")
          throw new Error(res.status === 401 ? "Invalid email or password" : `Login failed (${res.status}): ${errText}`)
        }
        return (await res.json()) as LoginResponse
      },
      catch: (error) => new CliError({ message: String(error instanceof Error ? error.message : error) }),
    })
  } catch (err: unknown) {
    yield* spinner.stop("Authentication failed", 1)
    const msg = err instanceof CliError ? err.message : String(err)
    return yield* fail(msg)
  }

  const apiKey = response.user?.api_key || response.token
  if (!apiKey) {
    yield* spinner.stop("Failed", 1)
    return yield* fail("API Key was not returned by server")
  }

  yield* Effect.orDie(
    authSvc.set("ladizai", {
      type: "api",
      key: apiKey,
      metadata: {
        email: response.user?.email ?? email,
        name: response.user?.name ?? "",
      },
    }),
  )

  yield* spinner.stop(`Successfully logged in as ${response.user?.name || email}!`)
  yield* Prompt.log.info(`API Key saved. Default model set to ladiz-apex`)
  yield* Prompt.outro("You can now use ladizcode directly!")
})

export const LoginAuthCommand = effectCmd({
  command: "login",
  describe: "log in to LadizAI Gateway",
  instance: false,
  builder: (yargs: Argv) =>
    yargs
      .option("email", {
        describe: "user email",
        type: "string",
      })
      .option("password", {
        describe: "user password",
        type: "string",
      }),
  handler: Effect.fn("Cli.auth.loginCommand")(function* (args) {
    UI.empty()
    yield* loginEffect({ email: args.email, password: args.password })
  }),
})
