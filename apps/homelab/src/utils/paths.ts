import path from "path";

export const APP_ROOT = path.normalize(path.join(import.meta.dir, "..", ".."));
export const REPO_ROOT = path.normalize(path.join(APP_ROOT, "..", ".."));
export const OUT_DIR = path.join(APP_ROOT, "dist");

export const shortAppPath = (p: string) => path.relative(APP_ROOT, p);
