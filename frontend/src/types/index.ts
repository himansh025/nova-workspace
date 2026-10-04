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

export interface ServiceNode {
  id: string;
  name: string;
  type: "edge" | "service" | "database" | "cache" | "ai";
  runtime: string;
  version: string;
  region: string;
  status: "healthy" | "degraded" | "maintenance";
  p99Latency: string;
  requestsPerSec: string;
  errorRate: string;
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  dependencies: string[];
  dependents: string[];
  linkedTasks: string[];
  x: number;
  y: number;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    initials: string;
  };
  branch: string;
  targetBranch: string;
  status: "open" | "merged" | "draft";
  commitsCount: number;
  filesChangedCount: number;
  additions: number;
  deletions: number;
  createdAt: string;
  linkedIssueKey?: string;
  diff: {
    filename: string;
    oldPath: string;
    newPath: string;
    chunks: {
      header: string;
      lines: {
        type: "add" | "del" | "normal";
        oldLine?: number;
        newLine?: number;
        content: string;
      }[];
    }[];
  }[];
  aiReview?: {
    score: number;
    securityStatus: "PASSED" | "WARNING" | "CRITICAL";
    performanceImpact: string;
    summary: string;
    findings: {
      id: string;
      type: "security" | "performance" | "suggestion";
      filename: string;
      lineNumber: number;
      title: string;
      message: string;
      suggestion?: string;
    }[];
  };
}

export interface SprintDayBurndown {
  day: number;
  date: string;
  idealRemaining: number;
  actualRemaining: number | null;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: "active" | "planned" | "completed";
  startDate: string;
  endDate: string;
  totalDays: number;
  currentDay: number;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  taskIds: string[];
  burndown: SprintDayBurndown[];
}

export interface VelocityHistory {
  sprintId: string;
  sprintName: string;
  committedPoints: number;
  completedPoints: number;
  completionRate: number;
}

export interface PokerVote {
  taskId: string;
  voter: string;
  points: number;
  timestamp: string;
}
