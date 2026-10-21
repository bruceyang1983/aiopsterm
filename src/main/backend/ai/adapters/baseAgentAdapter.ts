import { EventEmitter } from 'events'
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'

import type {
  AgentDataEvent,
  AgentExitEvent,
  AgentLifecycleEvent,
  AgentProviderAdapter,
  AgentProviderInfo,
  AgentProviderKind,
  AgentSessionHandle,
  AgentSpawnInput
} from '../providerTypes'

export abstract class BaseAgentAdapter implements AgentProviderAdapter {
  abstract kind: AgentProviderKind
  protected eventBus = new EventEmitter()
  protected processes = new Map<string, ChildProcessWithoutNullStreams>()

  protected emitData(event: AgentDataEvent) {
    this.eventBus.emit('data', event)
  }

  protected emitLifecycle(event: AgentLifecycleEvent) {
    this.eventBus.emit('lifecycle', event)
  }

  protected emitExit(event: AgentExitEvent) {
    this.eventBus.emit('exit', event)
  }

  public onData(listener: (event: AgentDataEvent) => void) {
    this.eventBus.on('data', listener)
  }

  public onLifecycle(listener: (event: AgentLifecycleEvent) => void) {
    this.eventBus.on('lifecycle', listener)
  }

  public onExit(listener: (event: AgentExitEvent) => void) {
    this.eventBus.on('exit', listener)
  }

  protected abstract getBinary(): string
  protected abstract buildArgs(input: AgentSpawnInput): string[]

  public abstract info(): AgentProviderInfo
  public abstract isInstalled(): Promise<boolean>

  public async createSession(input: AgentSpawnInput): Promise<AgentSessionHandle> {
    const binary = this.getBinary()
    const args = this.buildArgs(input)
    const sessionId = `${this.kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`

    const proc = spawn(binary, args, {
      cwd: input.cwd || process.cwd(),
      env: {
        ...process.env,
        ...(input.env || {})
      },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    this.processes.set(sessionId, proc)

    const session: AgentSessionHandle = {
      id: sessionId,
      kind: this.kind,
      cwd: input.cwd || process.cwd(),
      createdAt: Date.now(),
      isAlive: true,
      binaryPath: binary
    }

    this.emitLifecycle({
      sessionId,
      kind: this.kind,
      stage: 'starting',
      message: `Starting ${this.kind} session`
    })

    proc.stdout.on('data', (chunk: Buffer) => {
      this.emitData({
        sessionId,
        kind: this.kind,
        chunk,
        source: 'stdout'
      })
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      this.emitData({
        sessionId,
        kind: this.kind,
        chunk,
        source: 'stderr'
      })
    })

    proc.on('exit', (code, signal) => {
      this.processes.delete(sessionId)
      this.emitLifecycle({
        sessionId,
        kind: this.kind,
        stage: 'exiting',
        message: `Session exited with code ${code ?? 'unknown'}`
      })
      this.emitExit({
        sessionId,
        kind: this.kind,
        exitCode: code ?? null,
        signal: signal || undefined
      })
      session.isAlive = false
    })

    return session
  }

  public async write(sessionId: string, data: string): Promise<void> {
    const proc = this.processes.get(sessionId)
    if (!proc) return
    proc.stdin.write(data)
  }

  public async resize(_sessionId: string, _cols: number, _rows: number): Promise<void> {
    // hook for PTY-aware agents; leave as no-op for generic CLI providers
  }

  public async kill(sessionId: string): Promise<void> {
    const proc = this.processes.get(sessionId)
    if (!proc) return
    try {
      proc.kill('SIGTERM')
    } catch {}
    this.processes.delete(sessionId)
  }
}
