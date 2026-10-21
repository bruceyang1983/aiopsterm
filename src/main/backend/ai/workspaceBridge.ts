export type WorkspaceContext = {
  terminalSessionId?: string
  sshTarget?: {
    host: string
    port: number
    username: string
  }
  databaseConnectionId?: string
  kubernetesContext?: string
  projectPath?: string
  cwd?: string
  mcpServers?: string[]
}

export const buildWorkspaceContext = (input: {
  terminalSessionId?: string
  sshTarget?: WorkspaceContext['sshTarget']
  databaseConnectionId?: string
  kubernetesContext?: string
  projectPath?: string
  cwd?: string
  mcpServers?: string[]
}): WorkspaceContext => ({
  terminalSessionId: input.terminalSessionId,
  sshTarget: input.sshTarget,
  databaseConnectionId: input.databaseConnectionId,
  kubernetesContext: input.kubernetesContext,
  projectPath: input.projectPath,
  cwd: input.cwd,
  mcpServers: input.mcpServers || []
})

export const workspaceContextEnv = (context: WorkspaceContext): Record<string, string> => ({
  AIOPSTERM_WORKSPACE_CONTEXT: JSON.stringify(context),
  AIOPSTERM_TERMINAL_SESSION_ID: context.terminalSessionId || '',
  AIOPSTERM_SSH_TARGET: context.sshTarget ? JSON.stringify(context.sshTarget) : '',
  AIOPSTERM_DATABASE_CONNECTION_ID: context.databaseConnectionId || '',
  AIOPSTERM_KUBERNETES_CONTEXT: context.kubernetesContext || '',
  AIOPSTERM_PROJECT_PATH: context.projectPath || '',
  AIOPSTERM_CWD: context.cwd || ''
})
