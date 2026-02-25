import * as fs from "fs";
import * as path from "path";
import { getPreferenceValues } from "@raycast/api";

// Preferences interface is auto-generated in raycast-env.d.ts - no need to define manually

export interface SkillConfig {
  folders: string[];
  defaultFolder: string;
  allFolders: string[];
  repositories: string[];
}

const DEFAULT_SKILL_FOLDER = "~/.raycast/skills";
const DEFAULT_CACHE_FOLDER = "~/.raycast/skills/.cache";
const DEFAULT_REPOSITORIES = "https://github.com/anthropics/skills,https://github.com/ComposioHQ/awesome-claude-skills";

/**
 * Expand home directory and relative paths
 */
function expandPath(folderPath: string): string {
  if (folderPath.startsWith("~")) {
    return path.join(process.env.HOME || "", folderPath.slice(1));
  } else if (folderPath.startsWith(".")) {
    return path.resolve(process.cwd(), folderPath);
  }
  return folderPath;
}

/**
 * Get the default skill folder path (expanded)
 */
export function getDefaultSkillFolder(): string {
  return expandPath(DEFAULT_SKILL_FOLDER);
}

/**
 * Ensure default skill folder exists
 */
export function ensureDefaultSkillFolder(): void {
  const defaultFolder = getDefaultSkillFolder();
  if (!fs.existsSync(defaultFolder)) {
    fs.mkdirSync(defaultFolder, { recursive: true });
    console.log(`✅ Created default skill folder: ${defaultFolder}`);
  }
}

/**
 * Load skill configuration from Raycast preferences
 * The skillFolders preference should be a comma-separated list of folder paths
 * Supports:
 * - ~ for home directory (e.g., ~/.skills)
 * - . for relative paths (e.g., ./skills)
 * - Absolute paths (e.g., /Users/name/skills)
 */
export function getSkillConfig(): SkillConfig {
  const preferences = getPreferenceValues<Preferences>();
  const foldersString = preferences.skillFolders || "";
  const repositoriesString = preferences.skillRepositories || DEFAULT_REPOSITORIES;

  // Parse comma-separated user folders and trim whitespace
  const userFolders = foldersString
    .split(",")
    .map((folder) => folder.trim())
    .filter((folder) => folder.length > 0);

  // Get default folder
  const defaultFolder = getDefaultSkillFolder();

  // Combine default folder with user folders (default first)
  const allFolders = [defaultFolder, ...userFolders];

  // Parse repositories
  const repositories = repositoriesString
    .split(",")
    .map((repo) => repo.trim())
    .filter((repo) => repo.length > 0);

  return {
    folders: userFolders,
    defaultFolder,
    allFolders,
    repositories,
  };
}

/**
 * Get only user-configured skill folders (excludes default)
 */
export function getSkillFolders(): string[] {
  return getSkillConfig().folders;
}

/**
 * Get all skill folders including default folder
 */
export function getAllSkillFolders(): string[] {
  return getSkillConfig().allFolders;
}

/**
 * Get configured skill repositories
 */
export function getSkillRepositories(): string[] {
  return getSkillConfig().repositories;
}

/**
 * Get GitHub personal access token (if configured)
 */
export function getGithubToken(): string | undefined {
  const preferences = getPreferenceValues<Preferences>();
  return preferences.githubToken?.trim() || undefined;
}

/**
 * Get cache folder path (expanded)
 */
export function getCacheFolder(): string {
  return expandPath(DEFAULT_CACHE_FOLDER);
}

/**
 * Ensure cache folder exists
 */
export function ensureCacheFolder(): void {
  const cacheFolder = getCacheFolder();
  if (!fs.existsSync(cacheFolder)) {
    fs.mkdirSync(cacheFolder, { recursive: true });
  }
}
