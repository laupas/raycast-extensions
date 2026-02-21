import * as fs from "fs";
import * as path from "path";
import { parseSkillFile, type Skill as SkillMetadata } from "./skill-parser";

export interface Skill extends SkillMetadata {
  id: string;
  filePath: string;
  folder: string;
}

/**
 * Discover skills from configured folders
 * Scans folders for subdirectories containing SKILL.md and parses them
 * @param folderPaths - Paths to scan for skills
 * @returns Array of discovered Skill objects (never throws)
 */
export async function discoverSkills(folderPaths: string[]): Promise<Skill[]> {
  const skills: Skill[] = [];

  if (!folderPaths?.length) {
    console.warn("⚠️  No skill folders configured");
    return skills;
  }

  try {
    for (const folderPath of folderPaths) {
      try {
        // Expand home and relative paths
        let expandedPath = folderPath;
        if (folderPath.startsWith("~")) {
          expandedPath = path.join(process.env.HOME || "", folderPath.slice(1));
        } else if (folderPath.startsWith(".")) {
          expandedPath = path.resolve(process.cwd(), folderPath);
        }

        console.log(`🔍 Scanning: ${expandedPath}`);

        // Check folder exists
        if (!fs.existsSync(expandedPath)) {
          console.warn(`⚠️  Folder not found: ${expandedPath}`);
          continue;
        }

        if (!fs.statSync(expandedPath).isDirectory()) {
          console.warn(`⚠️  Not a directory: ${expandedPath}`);
          continue;
        }

        // Scan for subdirectories with SKILL.md
        const entries = fs.readdirSync(expandedPath);
        console.log(`📁 Found ${entries.length} entries in ${expandedPath}`);

        for (const entry of entries) {
          try {
            console.log(`   📂 Entry: ${entry}`);
            const skillDir = path.join(expandedPath, entry);
            const stat = fs.statSync(skillDir);

            // Skip if not a directory
            if (!stat.isDirectory()) {
              console.log(`      ⊘ File (not directory), skipped`);
              continue;
            }

            console.log(`      ✓ Is directory`);

            const skillMdPath = path.join(skillDir, "SKILL.md");

            // Skip if no SKILL.md
            if (!fs.existsSync(skillMdPath)) {
              console.log(`      ⊘ No SKILL.md found`);
              continue;
            }

            console.log(`      📄 Found SKILL.md`);

            // Parse the skill
            const metadata = parseSkillFile(skillMdPath);
            if (!metadata) {
              console.warn(`      ⚠️  Failed to parse SKILL.md`);
              continue;
            }

            // Create skill with location info
            const skill: Skill = {
              ...metadata,
              id: metadata.name,
              filePath: skillMdPath,
              folder: expandedPath,
            };

            skills.push(skill);
            console.log(`      ✅ Loaded: ${skill.name}`);
          } catch (error) {
            console.warn(
              `      ⚠️  Error processing ${entry}: ${error instanceof Error ? error.message : String(error)}`,
            );
            // Continue to next entry
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error scanning ${folderPath}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue to next folder
      }
    }
  } catch (error) {
    console.error(`❌ Unexpected error in discoverSkills:`, error);
    // Still return whatever skills we found
  }

  console.log(`📊 Total skills discovered: ${skills.length}\n`);
  return skills;
}

/**
 * Get a skill by name
 */
export function getSkillByName(name: string, skills: Skill[]): Skill | undefined {
  return skills.find((skill) => skill.name === name);
}
