export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type SpecStatus = "drafting" | "review" | "approved";
export type ReleaseStatus = "draft" | "canary" | "released";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  initials: string;
  status: "online" | "away" | "offline";
  activeTasksCount: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  sprint: string;
  progressPercent: number;
  cycleTime: string;
  velocity: string;
  activeBranch: string;
  repository: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: {
    id: string;
    name: string;
    avatar: string;
    initials: string;
  };
  tags: string[];
  branch?: string;
  estimate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Spec {
  id: string;
  key: string;
  projectId: string;
  title: string;
  summary: string;
  content: string;
  status: SpecStatus;
  author: {
    id: string;
    name: string;
    initials: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PreflightCheck {
  id: string;
  name: string;
  category: "test" | "security" | "database" | "build" | "e2e";
  status: "passed" | "running" | "failed" | "pending";
  duration: string;
  details: string;
}

export interface Release {
  id: string;
  version: string;
  projectId: string;
  status: ReleaseStatus;
  canaryPercentage: number;
  checksPassed: number;
  totalChecks: number;
  checks: PreflightCheck[];
  changelog: string[];
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: "task_status" | "task_created" | "spec_approved" | "commit" | "release" | "member_joined";
  actor: {
    name: string;
    initials: string;
  };
  action: string;
  target: string;
  timestamp: string;
  meta?: Record<string, string | number | boolean>;
}

export interface AnalyticsData {
  cycleTimeDays: number;
  cycleTimeDelta: string;
  velocitySprintDelta: string;
  reviewLatencyHours: number;
  throughputPerSprint: number;
  chartPoints: {
    label: string;
    completed: number;
    velocity: number;
    throughput: number;
  }[];
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
}

export interface WorkspaceDB {
  projects: Project[];
  tasks: Task[];
  specs: Spec[];
  releases: Release[];
  team: TeamMember[];
  activities: ActivityItem[];
  settings: {
    workspaceName: string;
    slug: string;
    defaultBranch: string;
    githubConnected: boolean;
    gitlabConnected: boolean;
    linearSync: boolean;
    autoAssignReviewers: boolean;
  };
}

export interface OutgoingWebhook {
  id: string;
  name: string;
  target: "slack" | "discord" | "custom";
  url: string;
  events: string[];
  status: "active" | "paused" | "failed";
  lastDelivery?: string;
  deliverySuccessRate: number;
}
