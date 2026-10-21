import { execFileSync } from 'child_process'

import type { AgentProviderInfo, AgentProviderKind, AgentSpawnInput } from '../providerTypes'
import { BaseAgentAdapter } from './baseAgentAdapter'

export class ClaudecodeAdapter extends BaseAgentAdapter {
  public kind: AgentProviderKind = 'claudecode'

  public info(): AgentProviderInfo {
    return {
      kind: 'claudecode',
      name: 'claudecode',
      displayName: 'Claude Code',
      installed: true,
      default: false
    }
  }

  public async isInstalled(): Promise<boolean> {
    const candidates = ['claudecode', 'claude-code', 'claude']
    for (const cmd of candidates) {
      try {
        execFileSync('which', [cmd], { stdio: 'ignore' })
        return true
      } catch {}
    }
    return false
  }

  protected getBinary(): string {
    return 'claudecode'
  }

  protected buildArgs(input: AgentSpawnInput): string[] {
    const args: string[] = ['run']
    if (input.prompt) args.push(input.prompt)
    return args
  }
}
