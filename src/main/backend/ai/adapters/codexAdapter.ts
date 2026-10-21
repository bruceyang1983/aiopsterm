import { execFileSync } from 'child_process'

import type { AgentProviderInfo, AgentProviderKind, AgentSpawnInput } from '../providerTypes'
import { BaseAgentAdapter } from './baseAgentAdapter'

export class CodexAdapter extends BaseAgentAdapter {
  public kind: AgentProviderKind = 'codex'

  public info(): AgentProviderInfo {
    return {
      kind: 'codex',
      name: 'codex',
      displayName: 'Codex',
      installed: true,
      default: true
    }
  }

  public async isInstalled(): Promise<boolean> {
    try {
      execFileSync('which', ['codex'], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  protected getBinary(): string {
    return 'codex'
  }

  protected buildArgs(input: AgentSpawnInput): string[] {
    const args: string[] = ['run']
    if (input.prompt) args.push(input.prompt)
    return args
  }
}
