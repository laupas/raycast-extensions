import { List, ActionPanel, Action, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { useEffect, useState } from "react";
import { discoverSkills, type Skill } from "./helpers/skill-discovery";
import { getAllSkillFolders, ensureDefaultSkillFolder, getDefaultSkillFolder } from "./config";

export default function ListSkillsCommand() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      setIsLoading(true);
      setError("");
      ensureDefaultSkillFolder();
      const folders = getAllSkillFolders();

      console.log(`\n📂 LIST-SKILLS: Scanning folders:`);
      folders.forEach((f) => console.log(`   - ${f}`));

      const discovered = await discoverSkills(folders);

      console.log(`\n📊 LIST-SKILLS: Found ${discovered.length} skills`);
      if (discovered.length > 0) {
        discovered.forEach((s) => console.log(`   ✅ ${s.name} (${s.folder})`));
        setSkills(discovered);
        setError("");
      } else {
        console.warn(`⚠️  LIST-SKILLS: No skills discovered`);
        setSkills([]);
        setError(
          "No skills found. Download skills using 'Find and Download Skills' command or configure 'Skill Folders' in preferences (⚙️).",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load skills";
      console.error("LIST-SKILLS: Error loading skills:", err);
      setError(message);
      setSkills([]);
      await showToast({
        style: Toast.Style.Failure,
        title: "Error Loading Skills",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteSkill(skill: Skill) {
    const confirmed = await confirmAlert({
      title: "Delete Skill?",
      message: `Are you sure you want to delete "${skill.name}"? This cannot be undone.`,
      icon: "❌",
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
      dismissAction: {
        title: "Cancel",
      },
    });

    if (!confirmed) {
      return;
    }

    const skillPath = path.dirname(skill.filePath);
    try {
      fs.rmSync(skillPath, { recursive: true, force: true });
      await showToast({
        style: Toast.Style.Success,
        title: "Deleted",
        message: `${skill.name} has been removed`,
      });
      await loadSkills();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      await showToast({
        style: Toast.Style.Failure,
        title: "Delete Failed",
        message: msg,
      });
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search skills by name or description...">
      {error && (
        <List.EmptyView
          icon="❌"
          title="No Skills Found"
          description={error}
          actions={
            <ActionPanel>
              <Action title="Refresh" onAction={() => loadSkills()} />
            </ActionPanel>
          }
        />
      )}
      {!error &&
        skills.map((skill) => {
          const isDefaultFolder = skill.folder === getDefaultSkillFolder();
          const folderName = isDefaultFolder ? "Default (~/.raycast/skills)" : skill.folder;

          return (
            <List.Item
              key={skill.id}
              title={skill.name}
              subtitle={skill.description}
              icon="⚙️"
              accessories={[
                { text: folderName, tooltip: skill.folder },
                ...(skill.license ? [{ tag: skill.license }] : []),
                ...(skill.compatibility ? [{ tag: "⚙️", tooltip: skill.compatibility }] : []),
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Open Skill Folder"
                    onAction={() => {
                      execSync(`open "${skill.folder}"`);
                    }}
                  />
                  <Action
                    title="Delete Skill"
                    style={Action.Style.Destructive}
                    onAction={() => handleDeleteSkill(skill)}
                  />
                  <Action.CopyToClipboard title="Copy Skill Name" content={skill.name} />
                  <Action.CopyToClipboard title="Copy Full Description" content={skill.description} />
                  {skill.compatibility && (
                    <Action.CopyToClipboard title="Copy Compatibility Info" content={skill.compatibility} />
                  )}
                </ActionPanel>
              }
            />
          );
        })}
    </List>
  );
}
