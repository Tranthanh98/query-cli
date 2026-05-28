import { PostgresDriver } from "./postgres"
import { SqliteDriver } from "./sqlite"
import { MysqlDriver } from "./mysql"
import type { DatabaseDriver, DriverKind } from "./types"

const registry: Record<DriverKind, () => DatabaseDriver> = {
  postgres: () => new PostgresDriver(),
  sqlite: () => new SqliteDriver(),
  mysql: () => new MysqlDriver(),
}

export function createDriver(kind: DriverKind): DatabaseDriver {
  const factory = registry[kind]
  if (!factory) throw new Error(`Unknown driver: ${kind}`)
  return factory()
}

export const AVAILABLE_DRIVERS: DriverKind[] = ["postgres", "sqlite", "mysql"]

export * from "./types"
