import { useKeyboard } from "@opentui/react"
import { useMemo, useRef, useState } from "react"
import type { InputRenderable } from "@opentui/core"
import { useApp } from "../app-context"
import {
  newConnectionId,
  saveConnection,
} from "../config/connections"
import { createDriver } from "../drivers"
import type {
  ConnectionConfig,
  DriverKind,
} from "../drivers/types"
import { colors } from "../theme"

type FieldKey = "name" | "host" | "port" | "database" | "user" | "password"

interface FieldDef {
  key: FieldKey
  label: string
  placeholder: string
  defaultValue?: string
}

const DRIVER_LABELS: Record<DriverKind, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
}

function fieldsFor(driver: DriverKind): FieldDef[] {
  if (driver === "sqlite") {
    return [
      { key: "name", label: "Name", placeholder: "My sqlite db" },
      { key: "database", label: "Database", placeholder: "/path/to/db.sqlite" },
    ]
  }
  if (driver === "mysql") {
    return [
      { key: "name", label: "Name", placeholder: "My mysql db" },
      { key: "host", label: "Host", placeholder: "localhost", defaultValue: "localhost" },
      { key: "port", label: "Port", placeholder: "3306", defaultValue: "3306" },
      { key: "database", label: "Database", placeholder: "mysql" },
      { key: "user", label: "User", placeholder: "root", defaultValue: "root" },
      { key: "password", label: "Password", placeholder: "" },
    ]
  }
  return [
    { key: "name", label: "Name", placeholder: "My postgres db" },
    { key: "host", label: "Host", placeholder: "localhost", defaultValue: "localhost" },
    { key: "port", label: "Port", placeholder: "5432", defaultValue: "5432" },
    { key: "database", label: "Database", placeholder: "postgres" },
    { key: "user", label: "User", placeholder: "postgres", defaultValue: "postgres" },
    { key: "password", label: "Password", placeholder: "" },
  ]
}

export function ConnectionFormScreen() {
  const { goSelect, goMain, formDriverKind } = useApp()
  const driverKind: DriverKind = formDriverKind ?? "postgres"

  const fields = useMemo(() => fieldsFor(driverKind), [driverKind])

  const [values, setValues] = useState<Record<FieldKey, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of fields) init[f.key] = f.defaultValue ?? ""
    return init as Record<FieldKey, string>
  })
  const [focusIndex, setFocusIndex] = useState(0)
  const [error, setError] = useState<{ text: string; color: string }>({ text: "", color: colors.error })
  const [submitting, setSubmitting] = useState(false)

  const inputRefs = useRef<(InputRenderable | null)[]>([])

  useKeyboard((key) => {
    if (submitting) return
    if (key.name === "escape") {
      void goSelect()
      return
    }
    if (key.name === "tab") {
      const len = fields.length
      const dir = key.shift ? -1 : 1
      setFocusIndex((i) => (((i + dir) % len) + len) % len)
    }
  })

  const updateField = (k: FieldKey, v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }))
  }

  const submit = async () => {
    if (!values.database) {
      setError({ text: "Database is required", color: colors.error })
      return
    }
    const conn: ConnectionConfig = {
      id: newConnectionId(),
      name:
        values.name ||
        (driverKind === "sqlite"
          ? `sqlite@${values.database}`
          : `${driverKind}@${values.host || "localhost"}`),
      driver: driverKind,
      host: driverKind === "sqlite" ? undefined : values.host || undefined,
      port: driverKind === "sqlite" ? undefined : values.port ? Number(values.port) : undefined,
      database: values.database,
      user: driverKind === "sqlite" ? undefined : values.user || undefined,
      password: driverKind === "sqlite" ? undefined : values.password || undefined,
    }
    setSubmitting(true)
    setError({ text: "Connecting...", color: colors.warning })
    try {
      const driver = createDriver(driverKind)
      await driver.connect(conn)
      await saveConnection(conn)
      goMain(driver, conn)
    } catch (e: any) {
      setError({ text: `Error: ${e?.message ?? e}`, color: colors.error })
      setSubmitting(false)
    }
  }

  const onSubmitField = (i: number) => {
    if (i < fields.length - 1) {
      setFocusIndex(i + 1)
    } else {
      void submit()
    }
  }

  return (
    <box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
      padding={2}
    >
      <box
        borderStyle="rounded"
        borderColor={colors.panelQuery}
        padding={1}
        title={` New ${DRIVER_LABELS[driverKind]} connection `}
        titleAlignment="left"
        flexDirection="column"
        gap={1}
      >
        {fields.map((f, i) => (
          <box key={f.key} flexDirection="row" gap={1} alignItems="center">
            <text fg={focusIndex === i ? colors.section : colors.textDim}>
              {`${f.label.padEnd(9)}:`}
            </text>
            <input
              ref={(el) => {
                inputRefs.current[i] = el
              }}
              width={50}
              placeholder={f.placeholder}
              placeholderColor={colors.textMuted}
              value={values[f.key]}
              focused={focusIndex === i}
              onInput={(v) => updateField(f.key, v)}
              onSubmit={() => onSubmitField(i)}
            />
          </box>
        ))}
        {error.text ? <text fg={error.color}>{error.text}</text> : null}
        <box flexDirection="row" gap={1}>
          <text fg={colors.command}>tab</text>
          <text fg={colors.textDim}>move</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>enter</text>
          <text fg={colors.textDim}>next / connect</text>
          <text fg={colors.textMuted}>·</text>
          <text fg={colors.command}>esc</text>
          <text fg={colors.textDim}>back</text>
        </box>
      </box>
    </box>
  )
}
