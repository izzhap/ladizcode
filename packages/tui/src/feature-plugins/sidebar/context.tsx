import type { AssistantMessage } from "@opencode-ai/sdk/v2"
import type { TuiPlugin, TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { BuiltinTuiPlugin } from "../builtins"
import { createMemo, Show } from "solid-js"

const id = "internal:sidebar-context"

function View(props: { api: TuiPluginApi; session_id: string }) {
  const theme = () => props.api.theme.current
  const msg = createMemo(() => props.api.state.session.messages(props.session_id))

  const creditInfo = createMemo(() => {
    const list = msg().filter((item): item is AssistantMessage => item.role === "assistant" && Boolean(item.credits))
    const last = list.at(-1)
    if (!last || !last.credits) return null
    return {
      deducted: last.credits.deducted,
      remaining: last.credits.remaining,
      totalDeducted: list.reduce((sum, item) => sum + (item.credits?.deducted ?? 0), 0),
    }
  })

  const state = createMemo(() => {
    const last = msg().findLast((item): item is AssistantMessage => item.role === "assistant" && item.tokens.output > 0)
    if (!last) {
      return {
        tokens: 0,
        percent: null,
      }
    }

    const tokens =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = props.api.state.provider.find((item) => item.id === last.providerID)?.models[last.modelID]
    return {
      tokens,
      percent: model?.limit.context ? Math.round((tokens / model.limit.context) * 100) : null,
    }
  })

  return (
    <box gap={1}>
      <Show
        when={creditInfo()}
        fallback={
          <box>
            <text fg={theme().text}>
              <b>Ladiz AI</b>
            </text>
            <Show
              when={state().tokens > 0}
              fallback={<text fg={theme().textMuted}>Siap digunakan</text>}
            >
              <text fg={theme().textMuted}>{state().tokens.toLocaleString()} tokens</text>
            </Show>
          </box>
        }
      >
        {(info) => (
          <box>
            <text fg={theme().text}>
              <b>Ladiz AI</b>
            </text>
            <text fg={theme().text}>
              Sisa Kredit:{" "}
              <span style={{ fg: info().remaining > 0 ? theme().success : theme().error }}>
                <b>{info().remaining.toLocaleString()}</b>
              </span>
            </text>
            <text fg={theme().textMuted}>
              Kredit Terpakai: {info().deducted.toLocaleString()}
              <Show when={info().totalDeducted !== info().deducted}>
                {" "}(Total Sesi: {info().totalDeducted.toLocaleString()})
              </Show>
            </text>
          </box>
        )}
      </Show>

      <Show when={state().tokens > 0}>
        <box>
          <text fg={theme().textMuted}>
            Context: {state().tokens.toLocaleString()} tokens
            <Show when={state().percent !== null}> ({state().percent}%)</Show>
          </text>
        </box>
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 100,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: BuiltinTuiPlugin = {
  id,
  tui,
}

export default plugin
