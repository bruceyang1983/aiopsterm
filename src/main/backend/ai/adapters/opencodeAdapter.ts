import { execFileSync } from 'child_process'

import type { AgentProviderInfo, AgentProviderKind, AgentSpawnInput } from '../providerTypes'
import { BaseAgentAdapter } from './baseAgentAdapter'

export class OpencodeAdapter extends BaseAgentAdapter {
  public kind: AgentProviderKind = 'opencode'

  public info(): AgentProviderInfo {
    return {
      kind: 'opencode',
      name: 'opencode',
      displayName: 'OpenCode',
      installed: true,
      default: false
    }
  }

  public async isInstalled(): Promise<boolean> {
    try {
      execFileSync('which', ['opencode'], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  protected getBinary(): string {
    return 'opencode'
  }

  protected buildArgs(input: AgentSpawnInput): string[] {
    const args: string[] = ['run']
    if (input.prompt) args.push(input.prompt)
    return args
  }
}
