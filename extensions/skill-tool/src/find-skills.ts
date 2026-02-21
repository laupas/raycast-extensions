import { AI } from "@raycast/api";
import { discoverSkills, type Skill } from "./helpers/skill-discovery";

/**
 * Find skills using AI LLM matching
 * Discovers all skills and uses AI to find best matches for the query
 * @param folderPaths - Paths to scan for skills
 * @param query - User's natural language query
 * @returns Array of best matching Skill objects
 */
export async function findSkillsWithAI(folderPaths: string[], query: string): Promise<Skill[]> {
  // Discover all skills
  const allSkills = await discoverSkills(folderPaths);

  if (!allSkills.length) {
    console.log("⚠️  No skills available");
    return [];
  }

  try {
    // Build skill catalog for AI
    const skillCatalog = allSkills
      .map((skill) => {
        return `- ${skill.name}: ${skill.description}${skill.compatibility ? ` (${skill.compatibility})` : ""}`;
      })
      .join("\n");

    console.log(`🤖 Using AI to find skills matching: "${query}"`);

    const prompt = `You are a skill finder assistant. Given a user query and a list of available skills, find the BEST matching skills.

Available skills:
${skillCatalog}

User query: "${query}"

Return ONLY the skill names that match, one per line. If no skills match well, return nothing.
Do not include explanations or numbering, just the skill names.`;

    const response = await AI.ask(prompt, {
      creativity: "low",
    });

    // Parse response to extract skill names
    const matchedNames = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Find matching skills from the discovered skills
    const matched = allSkills.filter((skill) =>
      matchedNames.some((name) => name.toLowerCase() === skill.name.toLowerCase()),
    );

    console.log(`✅ AI found ${matched.length} matching skills\n`);
    return matched;
  } catch (error) {
    console.error("❌ AI matching error:", error);
    throw error;
  }
}
