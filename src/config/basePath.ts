export type DeployEnv = Record<string, string | undefined>

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim()

  if (!trimmed || trimmed === '/') {
    return '/'
  }

  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, '')
  return `/${withoutSlashes}/`
}

export function resolveBasePath(env: DeployEnv): string {
  const explicitBasePath = env.PUBLIC_BASE_PATH

  if (explicitBasePath) {
    return normalizeBasePath(explicitBasePath)
  }

  if (env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY) {
    const [, repoName = ''] = env.GITHUB_REPOSITORY.split('/')

    if (repoName && !repoName.toLowerCase().endsWith('.github.io')) {
      return normalizeBasePath(repoName)
    }
  }

  return '/'
}
