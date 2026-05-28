export interface SlashCommand {
  name: string
  description: string
  confirm?: { title?: string; message: string }
  handler: () => void | Promise<void>
}

export class CommandRegistry {
  private commands = new Map<string, SlashCommand>()

  register(cmd: SlashCommand): void {
    this.commands.set(cmd.name, cmd)
  }

  unregister(name: string): void {
    this.commands.delete(name)
  }

  get(name: string): SlashCommand | undefined {
    return this.commands.get(name)
  }

  list(): SlashCommand[] {
    return [...this.commands.values()]
  }

  clear(): void {
    this.commands.clear()
  }

  async execute(name: string): Promise<void> {
    const cmd = this.commands.get(name)
    if (!cmd) return
    await cmd.handler()
  }
}
