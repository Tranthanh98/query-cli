import type { DriverKind } from "../../drivers/types"

// Wrap an identifier in driver-appropriate quotes when the bare form would not
// round-trip — most importantly, Postgres folds unquoted names to lowercase,
// so `ClientId` typed without quotes resolves to `clientid` and fails.
export function quoteIdentifier(kind: DriverKind, name: string): string {
  if (!needsQuoting(kind, name)) return name
  if (kind === "mysql") return "`" + name.replace(/`/g, "``") + "`"
  // Postgres / SQLite both accept double-quoted identifiers; escape any
  // embedded quote by doubling it.
  return '"' + name.replace(/"/g, '""') + '"'
}

function needsQuoting(kind: DriverKind, name: string): boolean {
  if (!name) return false
  // Postgres is the strict one: anything that isn't already lowercase ident
  // shape needs quoting, otherwise the server folds it and a mixed-case
  // column like `ClientId` won't be found.
  if (kind === "postgres") {
    return !/^[a-z_][a-z0-9_$]*$/.test(name)
  }
  // MySQL and SQLite treat identifiers case-insensitively, so we only quote
  // when there are characters that wouldn't parse as a bare identifier.
  return !/^[A-Za-z_][A-Za-z0-9_$]*$/.test(name)
}
