import * as fs from "fs";
import YAML from "js-yaml";

export interface Skill {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  "allowed-tools"?: string;
}

/**
 * Parse a SKILL.md file and extract the YAML frontmatter
 * Returns a Skill object or null if parsing fails
 */
export function parseSkillFile(filePath: string): Skill | null {
  try {
    console.log(`🔍 Parsing: ${filePath}`);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Check for frontmatter start
    if (!lines[0]?.startsWith("---")) {
      console.warn(`   ⚠️  First line: "${lines[0]}" (no frontmatter)`);
      return null;
    }

    // Find frontmatter end
    let endIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith("---")) {
        endIdx = i;
        break;
      }
    }

    if (endIdx === -1) {
      console.warn(`   ⚠️  Unclosed frontmatter`);
      return null;
    }

    // Parse YAML
    const frontmatterStr = lines.slice(1, endIdx).join("\n");
    console.log(`   📋 YAML content:\n${frontmatterStr}`);
    let skill: Record<string, unknown> | undefined;

    try {
      skill = YAML.load(frontmatterStr) as Record<string, unknown>;
      console.log(`   ✅ YAML parsed:`, skill);
    } catch (e) {
      console.warn(`   ⚠️  Invalid YAML: ${e}`);
      return null;
    }

    // Validate required fields
    if (!skill?.name || typeof skill.name !== "string") {
      console.warn(`   ⚠️  Missing/invalid name:`, skill?.name);
      return null;
    }

    if (!skill?.description || typeof skill.description !== "string") {
      console.warn(`   ⚠️  Missing/invalid description:`, skill?.description);
      return null;
    }

    console.log(`   ✅ Parsed skill: ${skill.name}`);
    return skill as unknown as Skill;
  } catch (error) {
    console.warn(`   ⚠️  Error parsing file: ${error}`);
    return null;
  }
}
