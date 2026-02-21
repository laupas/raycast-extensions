import * as fs from "fs";
import * as path from "path";
import { getCacheFolder, ensureCacheFolder } from "../config";

const CACHE_TTL_MINUTES = 60; // Cache for 1 hour

export interface CachedSkillData {
  timestamp: number;
  skills: Array<{
    name: string;
    description: string;
    path: string;
  }>;
}

/**
 * Get cache file path for a repository
 */
function getCacheFilePath(repoUrl: string): string {
  // Create a hash-like name from the URL (safe filename)
  const cacheName = repoUrl.replace(/[^a-zA-Z0-9]/g, "_");
  return path.join(getCacheFolder(), `${cacheName}.json`);
}

/**
 * Check if cached data is still valid (not expired)
 */
function isCacheValid(cacheFilePath: string): boolean {
  if (!fs.existsSync(cacheFilePath)) {
    return false;
  }

  try {
    const data = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8")) as CachedSkillData;
    const ageMinutes = (Date.now() - data.timestamp) / 1000 / 60;
    return ageMinutes < CACHE_TTL_MINUTES;
  } catch {
    return false;
  }
}

/**
 * Get cached skill data for a repository
 */
export function getCachedSkills(repoUrl: string): Array<{
  name: string;
  description: string;
  path: string;
}> | null {
  const cacheFile = getCacheFilePath(repoUrl);

  if (!isCacheValid(cacheFile)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(cacheFile, "utf-8")) as CachedSkillData;
    console.log(`   💾 Loaded ${data.skills.length} skills from cache`);
    return data.skills;
  } catch (error) {
    console.warn(`   ⚠️  Could not read cache: ${error}`);
    return null;
  }
}

/**
 * Save skill data to cache
 */
export function cacheSkills(
  repoUrl: string,
  skills: Array<{
    name: string;
    description: string;
    path: string;
  }>,
): void {
  try {
    ensureCacheFolder();
    const cacheFile = getCacheFilePath(repoUrl);
    const cacheData: CachedSkillData = {
      timestamp: Date.now(),
      skills,
    };
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.warn(`   ⚠️  Could not save cache: ${error}`);
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  try {
    const cacheFolder = getCacheFolder();
    if (fs.existsSync(cacheFolder)) {
      const files = fs.readdirSync(cacheFolder);
      for (const file of files) {
        fs.unlinkSync(path.join(cacheFolder, file));
      }
      console.log("✅ Cache cleared");
    }
  } catch (error) {
    console.warn(`⚠️  Could not clear cache: ${error}`);
  }
}
