export const CURRENT_VERSION = "1.3.0";

export interface UpdatePolicy {
  latestVersion: string;
  minSupportedVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
}

export interface VersionComparison {
  major: number;
  minor: number;
  patch: number;
}

export function parseVersion(version: string): VersionComparison {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);
  
  if (vA.major !== vB.major) return vA.major - vB.major;
  if (vA.minor !== vB.minor) return vA.minor - vB.minor;
  return vA.patch - vB.patch;
}

export function isVersionLessThan(current: string, target: string): boolean {
  return compareVersions(current, target) < 0;
}

export function isUpdateRequired(policy: UpdatePolicy): boolean {
  return isVersionLessThan(CURRENT_VERSION, policy.minSupportedVersion);
}

export function isUpdateAvailable(policy: UpdatePolicy): boolean {
  return isVersionLessThan(CURRENT_VERSION, policy.latestVersion);
}
