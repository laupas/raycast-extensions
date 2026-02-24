import * as fs from "fs";
import { findSkillsWithAI } from "../find-skills";
import { getAllSkillFolders, ensureDefaultSkillFolder } from "../config";

type Input = {
  query: string;
};

interface ToolResult {
  skills: Array<{
    name: string;
    description: string;
    license?: string;
    content?: string;
    folder?: string;
    filePath?: string;
    compatibility?: string;
  }>;
  count: number;
  message: string;
}

export default async function (input: Input): Promise<string> {
  try {
    ensureDefaultSkillFolder();
    const folders = getAllSkillFolders();
    const matchingSkills = await findSkillsWithAI(folders, input.query);

    const result: ToolResult = {
      skills: matchingSkills.map((skill) => {
        // Safely read SKILL.md content when available so callers get full markdown
        let content = "";
        try {
          if (skill.filePath && fs.existsSync(skill.filePath)) {
            content = fs.readFileSync(skill.filePath, "utf-8");
          }
        } catch {
          // Ignore read errors and return empty content
          content = "";
        }

        return {
          name: skill.name,
          description: skill.description,
          ...(skill.license && { license: skill.license }),
          ...(skill.compatibility && { compatibility: skill.compatibility }),
          content,
          ...(skill.folder && { folder: skill.folder }),
          ...(skill.filePath && { filePath: skill.filePath }),
        };
      }),
      count: matchingSkills.length,
      message:
        matchingSkills.length === 0
          ? `No skills found matching "${input.query}"`
          : `Found ${matchingSkills.length} skill(s) matching "${input.query}"`,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error occurred";
    return JSON.stringify(
      {
        skills: [],
        count: 0,
        message: `Error: ${msg}`,
      } as ToolResult,
      null,
      2,
    );
  }
}
