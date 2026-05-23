export {
  buildVernoManifestForInit as buildVernoManifest,
  detectVernoManifest,
  writeVernoManifest,
} from "../shared/manifest";
export type { VernoManifest } from "../shared/manifest";
export {
  detectPackageJson,
  detectProjectState,
  detectShadcn,
  detectUltracite,
  detectMonorepo,
  detectPackageManager,
  safeParsePackageJson,
} from "./detect";
export type { DetectedState } from "./detect";
export { restructureForTurborepo } from "./restructure";
