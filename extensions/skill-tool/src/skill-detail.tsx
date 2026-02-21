import { Detail, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { getDefaultSkillFolder, getGithubToken } from "./config";
import { getSkillContent, downloadSkillFromGithub } from "./helpers/skill-downloader";

interface SkillDetailProps {
  skill: {
    name: string;
    description: string;
    path: string;
    repository: string;
  };
}

export default function SkillDetail({ skill }: SkillDetailProps) {
  const { pop } = useNavigation();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSkillContent();
  }, []);

  async function loadSkillContent() {
    try {
      setIsLoading(true);
      const githubToken = getGithubToken();
      const fullContent = await getSkillContent(skill.repository, skill.path, githubToken);
      setContent(fullContent);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load skill details";
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload() {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Downloading",
        message: `Fetching ${skill.name}...`,
      });

      const targetFolder = getDefaultSkillFolder();
      const githubToken = getGithubToken();
      await downloadSkillFromGithub(skill.repository, skill.path, targetFolder, githubToken);

      await showToast({
        style: Toast.Style.Success,
        title: "Downloaded",
        message: `${skill.name} has been downloaded to ~/.raycast/skills`,
      });

      pop();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      await showToast({
        style: Toast.Style.Failure,
        title: "Download Failed",
        message,
      });
    }
  }

  return (
    <Detail
      isLoading={isLoading}
      markdown={content}
      navigationTitle={skill.name}
      actions={
        <ActionPanel>
          <Action title="Download Skill" onAction={handleDownload} />
          <Action.OpenInBrowser title="View on GitHub" url={`${skill.repository}/tree/main/${skill.path}`} />
          <Action title="Back" onAction={pop} />
        </ActionPanel>
      }
    />
  );
}
