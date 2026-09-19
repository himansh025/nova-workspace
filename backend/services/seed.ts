import { WorkspaceDB } from "./types";

export const initialWorkspaceDB: WorkspaceDB = {
  projects: [],
  tasks: [],
  specs: [],
  releases: [],
  team: [],
  activities: [],
  settings: {
    workspaceName: "Nova Workspace",
    slug: "nova-workspace",
    defaultBranch: "main",
    githubConnected: false,
    gitlabConnected: false,
    linearSync: false,
    autoAssignReviewers: false,
  },
};
