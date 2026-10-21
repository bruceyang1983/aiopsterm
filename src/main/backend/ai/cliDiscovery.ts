import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

import type { AgentProviderInfo, AgentProviderKind } from './providerTypes'

const PROVIDER_BIN_NAMES: Record<AgentProviderKind, string[]> = {
  codex: ['codex', 'codex-cli'],
  opencode: ['opencode', 'opencode-cli'],
  claudecode: ['claudecode', 'claude-code', 'claude'],
  custom: []
}

const candidatePaths = (): string[] => {
  const home = homedir()
  const values = new Set<string>([
    process.env.PATH || '',
    join(home, '.local', 'bin'),
    join(home, '.nvm', 'versions', 'node'),
    '/usr/local/bin',
    '/opt/homebrew/bin',
    '/usr/bin'
  ])

  const flattened: string[] = []
  for (const value of values) {
    if (!value) continue
    const parts = value.split(':')
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed) flattened.push(trimmed)
    }
  }
  return flattened
}

const which = (binaryName: string): string | null => {
  try {
    const result = execFileSync('which', [binaryName], {
      stdio: ['ignore', 'pipe', 'pipe']
    }).toString().trim()
    return result || null
  } catch {
    return null
  }
}

const discoverBinary = (binaryNames: string[]): string | null => {
  for (const name of binaryNames) {
    const found = which(name)
    if (found) return found
  }
  return null
}

const discoverFromCommonPaths = (binaryNames: string[]): string | null => {
  const paths = candidatePaths()
  for (const base of paths) {
    for (const name of binaryNames) {
      const full = join(base, name)
      if (existsSync(full)) return full
    }
  }
  return null
}

export const normalizeProviderName = (raw: string): AgentProviderKind => {
  const value = raw.trim().toLowerCase()
  if (value.includes('opencode')) return 'opencode'
  if (value.includes('claudecode') || value.includes('claude-code')) return 'claudecode'
  if (value.includes('codex')) return 'codex'
  return 'custom'
}

export const detectInstalledAgents = async (): Promise<AgentProviderInfo[]> => {
  const discovered: AgentProviderInfo[] = []

  for (const [kind, names] of Object.entries(PROVIDER_BIN_NAMES) as Array<[AgentProviderKind, string[]]>) {
    if (!names.length) continue

    const binaryPath = discoverBinary(names) || discoverFromCommonPaths(names)
    if (!binaryPath) continue

    discovered.push({
      kind,
      name: names[0],
      displayName:
        kind === 'codex'
          ? 'Codex'
          : kind === 'opencode'
            ? 'OpenCode'
            : kind === 'claudecode'
              ? 'Claude Code'
              : 'Custom',
      binaryPath,
      installed: true,
      default: kind === 'codex'
    })
  }

  return discovered
}

export const detectProviderByKind = async (kind: AgentProviderKind): Promise<AgentProviderInfo | null> => {
  const installed = await detectInstalledAgents()
  return installed.find((item) => item.kind === kind) || null
}
