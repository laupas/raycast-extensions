import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { getCachedSkills, cacheSkills } from "./cache";

/**
 * Download a skill from GitHub repository
 * @param repoUrl - GitHub repository URL (e.g., https://github.com/anthropics/skills)
 * @param skillName - Name of the skill folder in the repo
 * @param targetFolder - Where to save the skill
 */
export async function downloadSkillFromGithub(
  repoUrl: string,
  skillPath: string,
  targetFolder: string,
  githubToken?: string,
): Promise<void> {
  try {
    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }

    const [, owner, repo] = match;

    // Extract just the skill name from the path (e.g., "docx" from "skills/docx")
    const skillName = path.basename(skillPath);
    const localSkillPath = path.join(targetFolder, skillName);

    // Create target directory
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (fs.existsSync(localSkillPath)) {
      throw new Error(`Skill already exists: ${localSkillPath}`);
    }

    fs.mkdirSync(localSkillPath, { recursive: true });

    console.log(`📥 Downloading skill: ${skillName}`);

    // Detect default branch
    const defaultBranch = await getDefaultBranch(owner, repo, githubToken);

    // Download SKILL.md file using the full repo path
    const skillMdUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${skillPath}/SKILL.md`;
    await downloadFile(skillMdUrl, path.join(localSkillPath, "SKILL.md"));

    console.log(`✅ Skill downloaded successfully: ${localSkillPath}`);
  } catch (error) {
    console.error("❌ Download error:", error);
    throw error;
  }
}

/**
 * Download a file from URL
 */
function downloadFile(url: string, targetPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 404) {
          reject(new Error(`File not found: ${url}`));
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
          return;
        }

        const fileStream = fs.createWriteStream(targetPath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });

        fileStream.on("error", (err) => {
          fs.unlink(targetPath, () => {});
          reject(err);
        });
      })
      .on("error", reject);
  });
}

/**
 * Get the default branch for a GitHub repository
 */
async function getDefaultBranch(owner: string, repo: string, githubToken?: string): Promise<string> {
  try {
    const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
    console.log(`   📡 Fetching repo metadata from: ${repoUrl}`);
    const repoData = await fetchJson<{
      default_branch: string;
    }>(repoUrl, githubToken);

    if (!repoData || !repoData.default_branch) {
      console.warn(`⚠️  No default_branch in response, using fallback 'main'`);
      return "main";
    }

    console.log(`   🌿 Detected branch: ${repoData.default_branch}`);
    return repoData.default_branch;
  } catch (error) {
    console.error(`❌ Error fetching default branch for ${owner}/${repo}: ${error}`);
    console.warn(`   ⚠️  Falling back to 'main' branch`);
    return "main";
  }
}

/**
 * List skills available in a GitHub repository
 * Scans the repo for SKILL.md files and returns metadata
 * @param repoUrl - GitHub repository URL
 * @param githubToken - Optional GitHub token for higher rate limits
 * @param onProgress - Optional callback to report progress: (current, total) => void
 */
export async function listSkillsInRepository(
  repoUrl: string,
  githubToken?: string,
  onProgress?: (current: number, total: number) => void,
): Promise<
  Array<{
    name: string;
    description: string;
    path: string;
  }>
> {
  try {
    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }

    const [, owner, repo] = match;

    console.log(`🔍 Fetching skills from ${owner}/${repo}...`);

    // Check cache first
    const cachedSkills = getCachedSkills(repoUrl);
    if (cachedSkills) {
      console.log(`✅ Found ${cachedSkills.length} skills from cache`);
      return cachedSkills;
    }

    // Detect default branch dynamically
    const defaultBranch = await getDefaultBranch(owner, repo, githubToken);
    console.log(`   🌿 Using branch: ${defaultBranch}`);

    // Get repository tree API - use recursive=1 to get all files
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    console.log(`   📡 Fetching tree from: ${treeUrl}`);

    const items = await fetchJson<{
      tree: Array<{
        path: string;
        type: string;
      }>;
      truncated?: boolean;
    }>(treeUrl, githubToken);

    // Safety check
    if (!items || !items.tree || !Array.isArray(items.tree)) {
      console.warn(`⚠️  Unexpected response structure from ${treeUrl}`);
      return [];
    }

    // Log if truncated
    if (items.truncated) {
      console.warn(`⚠️  GitHub API response was truncated (too many files). Some skills may be missing.`);
    }

    // Find all SKILL.md files (case-insensitive, handle both SKILL.md and skill.md)
    const skillFiles = items.tree
      .filter((item: { path: string; type: string }) => {
        const lowerPath = item.path.toLowerCase();
        return lowerPath.endsWith("skill.md");
      })
      .map((item: { path: string }) => item.path);

    console.log(`   📋 Found ${skillFiles.length} SKILL.md files`);

    const skills: Array<{
      name: string;
      description: string;
      path: string;
    }> = [];

    // Process skills in parallel with concurrency limit
    const MAX_CONCURRENT = 8;
    let completed = 0;

    // Create tasks for all skills
    const processingTasks = skillFiles.map((skillPath) => async () => {
      const skillDir = path.dirname(skillPath);
      const skillName = path.basename(skillDir);

      try {
        const skillUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${skillPath}`;
        const content = await fetchText(skillUrl, githubToken);

        // Extract description from SKILL.md frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (match) {
          const yaml = match[1];
          const descMatch = yaml.match(/description:\s*(.+?)(?:\n|$)/);
          const nameMatch = yaml.match(/name:\s*(.+?)(?:\n|$)/);

          skills.push({
            name: nameMatch ? nameMatch[1].trim() : skillName,
            description: descMatch ? descMatch[1].trim() : "No description",
            path: skillDir,
          });
        }

        // Report progress after each skill completes
        completed++;
        if (onProgress) {
          onProgress(completed, skillFiles.length);
        }

        // Show progress in console every 100 files
        if (completed > 0 && completed % 100 === 0) {
          console.log(`   ⏳ Processing skill ${completed}/${skillFiles.length}...`);
        }
      } catch {
        console.warn(`⚠️  Could not fetch metadata for ${skillName}`);

        // Still report progress even if skill failed
        completed++;
        if (onProgress) {
          onProgress(completed, skillFiles.length);
        }
      }
    });

    // Execute tasks with concurrency limit
    for (let i = 0; i < processingTasks.length; i += MAX_CONCURRENT) {
      const batch = processingTasks.slice(i, i + MAX_CONCURRENT);
      await Promise.all(batch.map((task) => task()));
    }

    console.log(`✅ Found ${skills.length} skills in repository`);

    // Save to cache
    cacheSkills(repoUrl, skills);

    return skills;
  } catch (error) {
    console.error("❌ Repository fetch error:", error);
    throw error;
  }
}

/**
 * Fetch JSON from URL with optional authentication
 */
function fetchJson<T>(url: string, githubToken?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "User-Agent": "raycast-skill-tool",
    };
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }

    https
      .get(url, { headers }, (response) => {
        if (response.statusCode !== 200) {
          console.error(`   ❌ API returned ${response.statusCode}: ${url}`);
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
          return;
        }

        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Fetch text from URL with optional authentication
 */
function fetchText(url: string, githubToken?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "User-Agent": "raycast-skill-tool",
    };
    if (githubToken) {
      headers["Authorization"] = `token ${githubToken}`;
    }

    https
      .get(url, { headers }, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          resolve(data);
        });
      })
      .on("error", reject);
  });
}

/**
 * Get full SKILL.md content for a skill
 */
export async function getSkillContent(repoUrl: string, skillPath: string, githubToken?: string): Promise<string> {
  try {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }

    const [, owner, repo] = match;

    // Detect default branch
    const defaultBranch = await getDefaultBranch(owner, repo, githubToken);
    const skillUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${skillPath}/SKILL.md`;

    return await fetchText(skillUrl, githubToken);
  } catch (error) {
    console.error("❌ Error fetching skill content:", error);
    throw error;
  }
}
