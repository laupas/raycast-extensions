import { List, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { getSkillRepositories, ensureDefaultSkillFolder, getGithubToken } from "./config";
import { listSkillsInRepository } from "./helpers/skill-downloader";
import SkillDetail from "./skill-detail";

interface RepositorySkill {
  name: string;
  description: string;
  path: string;
  repository: string;
}

export default function FindAndDownloadSkillsCommand() {
  const [repositorySkills, setRepositorySkills] = useState<RepositorySkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      setIsLoading(true);
      setError("");

      await showToast({
        style: Toast.Style.Animated,
        title: "Loading skills",
        message: "Fetching from repositories...",
      });

      ensureDefaultSkillFolder();
      const repositories = getSkillRepositories();
      const githubToken = getGithubToken();

      console.log(`🔧 Configured repositories: ${repositories.length}`);
      repositories.forEach((repo, idx) => console.log(`   [${idx + 1}] ${repo}`));

      if (githubToken) {
        console.log(`✅ GitHub token is configured (higher rate limits enabled)`);
      } else {
        console.log(`⚠️  No GitHub token configured (60 req/hour limit)`);
      }

      if (!repositories.length) {
        setError("No skill repositories configured. Update preferences to add repositories.");
        setIsLoading(false);
        return;
      }

      const allSkills: RepositorySkill[] = [];
      const errors: string[] = [];

      for (let i = 0; i < repositories.length; i++) {
        const repo = repositories[i];
        try {
          console.log(`📚 Loading skills from: ${repo}`);

          let lastProgressUpdate = 0;

          const skills = await listSkillsInRepository(repo, githubToken, (current, total) => {
            // Update UI progress every 50 skills to avoid spamming
            if (current - lastProgressUpdate >= 50 || current === total) {
              showToast({
                style: Toast.Style.Animated,
                title: `Loading ${repo.split("/").pop()}`,
                message: `Processed ${current}/${total} skills...`,
              });
              lastProgressUpdate = current;
            }
          });

          allSkills.push(
            ...skills.map((skill) => ({
              ...skill,
              repository: repo,
            })),
          );
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.warn(`⚠️  Could not load from ${repo}: ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      if (allSkills.length === 0) {
        // Check if it's a rate limit issue
        const isRateLimit = errors.some((e) => e.includes("403") || e.includes("rate"));
        if (isRateLimit) {
          setError(
            "GitHub API rate limit reached. Try again later, or add a GitHub personal access token in preferences for higher limits.",
          );
        } else {
          setError(
            "No skills found in repositories. Check that repositories are reachable and contain SKILL.md files.",
          );
        }
      } else {
        setRepositorySkills(allSkills);
        await showToast({
          style: Toast.Style.Success,
          title: "Skills loaded",
          message: `Found ${allSkills.length} skills`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load skills";
      setError(message);
      await showToast({
        style: Toast.Style.Failure,
        title: "Error Loading Skills",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search skills by name or description...">
      {error && (
        <List.EmptyView
          icon="❌"
          title="Unable to Load Skills"
          description={error}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={() => loadSkills()} />
            </ActionPanel>
          }
        />
      )}

      {!error && repositorySkills.length === 0 && !isLoading && (
        <List.EmptyView
          icon="🔍"
          title="No Skills Found"
          description="No skills available in the configured repositories"
        />
      )}

      {!error &&
        repositorySkills.map((skill) => (
          <List.Item
            key={`${skill.repository}${skill.path}`}
            title={skill.name}
            subtitle={skill.description}
            icon="⚙️"
            accessories={[
              {
                text: new URL(skill.repository).hostname.replace("github.com", "GitHub"),
              },
            ]}
            actions={
              <ActionPanel>
                <Action.Push title="View & Download" target={<SkillDetail skill={skill} />} />
                <Action.OpenInBrowser title="View on GitHub" url={`${skill.repository}/tree/main/${skill.path}`} />
                <Action.CopyToClipboard title="Copy Skill Name" content={skill.name} />
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}
