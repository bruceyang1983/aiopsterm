export type AgentProviderKind = 'codex' | 'opencode' | 'claudecode' | 'custom'

export type AgentProviderInfo = {
  kind: AgentProviderKind
  name: string
  displayName: string
  binaryPath?: string
  installed: boolean
  default: boolean
  version?: string
}

export type AgentSpawnInput = {
  kind?: AgentProviderKind
  productSessionId?: string
  cwd?: string
  env?: Record<string, string>
  terminalSessionId?: string
  sshTarget?: {
    host: string
    port: number
    username: string
  }
  databaseConnectionId?: string
  kubernetesContext?: string
  projectPath?: string
  prompt?: string
}

export type AgentSessionHandle = {
  id: string
  kind: AgentProviderKind
  cwd?: string
  createdAt: number
  isAlive: boolean
  binaryPath?: string
}

export type AgentDataEvent = {
  sessionId: string
  kind: AgentProviderKind
  chunk: string | Buffer
  source: 'stdout' | 'stderr'
}

export type AgentLifecycleEvent = {
  sessionId: string
  kind: AgentProviderKind
  stage: 'starting' | 'ready' | 'running' | 'failed' | 'exiting'
  message?: string
  metadata?: Record<string, unknown>
}

export type AgentExitEvent = {
  sessionId: string
  kind: AgentProviderKind
  exitCode?: number | null
  signal?: string | null
}

export interface AgentProviderAdapter {
  kind: AgentProviderKind
  info(): AgentProviderInfo
  isInstalled(): Promise<boolean>
  createSession(input: AgentSpawnInput): Promise<AgentSessionHandle>
  write(sessionId: string, data: string): Promise<void>
  resize(sessionId: string, cols: number, rows: number): Promise<void>
  kill(sessionId: string): Promise<void>

  onData(listener: (event: AgentDataEvent) => void): void
  onLifecycle(listener: (event: AgentLifecycleEvent) => void): void
  onExit(listener: (event: AgentExitEvent) => void): void
}
