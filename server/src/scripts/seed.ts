import mongoose, { Types } from 'mongoose';
import { connectDB } from '@/config/database';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { UserRole, UserStatus } from '@/constants/enums/user';
import { TeamRole } from '@/constants/enums/team';
import { ProjectStatus } from '@/constants/enums/project';
import { TaskStatus, TaskPriority, TaskLabel } from '@/constants/enums/task';
import { logger } from '@/utils/logger';

/**
 * Seeds a small but realistic dataset — one cast of people, two teams, five
 * projects, and a couple dozen tasks — so the app looks like someone actually
 * uses it instead of an empty shell. Safe to re-run: everything is looked up
 * by its unique key (email/name/title) and skipped if it already exists.
 * Never run this against a production database.
 */
export const SEED_PASSWORD = 'TaskHub@123';

const daysFromNow = (offset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Also referenced by client/src/pages/auth/LoginPage.tsx's dev quick-login
// buttons — keep the ADMIN/MANAGER/TEAMLEAD/MEMBER/GUEST emails in sync.
export const SEED_USERS: SeedUser[] = [
  { email: 'ava.whitfield@taskhub.dev', firstName: 'Ava', lastName: 'Whitfield', role: UserRole.ADMIN },
  { email: 'marcus.chen@taskhub.dev', firstName: 'Marcus', lastName: 'Chen', role: UserRole.MANAGER },
  { email: 'priya.kapoor@taskhub.dev', firstName: 'Priya', lastName: 'Kapoor', role: UserRole.MANAGER },
  { email: 'sofia.novak@taskhub.dev', firstName: 'Sofia', lastName: 'Novak', role: UserRole.TEAMLEAD },
  { email: 'daniel.osei@taskhub.dev', firstName: 'Daniel', lastName: 'Osei', role: UserRole.TEAMLEAD },
  { email: 'liam.brooks@taskhub.dev', firstName: 'Liam', lastName: 'Brooks', role: UserRole.MEMBER },
  { email: 'emma.torres@taskhub.dev', firstName: 'Emma', lastName: 'Torres', role: UserRole.MEMBER },
  { email: 'noah.kim@taskhub.dev', firstName: 'Noah', lastName: 'Kim', role: UserRole.MEMBER },
  { email: 'grace.lin@taskhub.dev', firstName: 'Grace', lastName: 'Lin', role: UserRole.MEMBER },
  { email: 'ethan.silva@taskhub.dev', firstName: 'Ethan', lastName: 'Silva', role: UserRole.MEMBER },
  { email: 'mia.alvarez@taskhub.dev', firstName: 'Mia', lastName: 'Alvarez', role: UserRole.MEMBER },
  { email: 'owen.baxter@taskhub.dev', firstName: 'Owen', lastName: 'Baxter', role: UserRole.GUEST },
];

interface SeedTeam {
  name: string;
  description: string;
  teamLeadEmail: string;
  members: { email: string; role: TeamRole }[];
}

const SEED_TEAMS: SeedTeam[] = [
  {
    name: 'Platform Engineering',
    description: 'Owns the core product surface area — API, web app, and infra.',
    teamLeadEmail: 'sofia.novak@taskhub.dev',
    members: [
      { email: 'liam.brooks@taskhub.dev', role: TeamRole.CONTRIBUTOR },
      { email: 'noah.kim@taskhub.dev', role: TeamRole.CONTRIBUTOR },
      { email: 'ethan.silva@taskhub.dev', role: TeamRole.CONTRIBUTOR },
    ],
  },
  {
    name: 'Product Design',
    description: 'Design system, UX research, and marketing-facing surfaces.',
    teamLeadEmail: 'daniel.osei@taskhub.dev',
    members: [
      { email: 'emma.torres@taskhub.dev', role: TeamRole.CONTRIBUTOR },
      { email: 'grace.lin@taskhub.dev', role: TeamRole.CONTRIBUTOR },
      { email: 'mia.alvarez@taskhub.dev', role: TeamRole.VIEWER },
    ],
  },
];

interface SeedTaskChecklist {
  title: string;
  completed: boolean;
}

interface SeedTaskComment {
  authorEmail: string;
  text: string;
}

interface SeedTask {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels?: TaskLabel[];
  assigneeEmails: string[];
  reporterEmail: string;
  dueOffsetDays?: number;
  estimatedHours?: number;
  checklist?: SeedTaskChecklist[];
  comments?: SeedTaskComment[];
  dependsOnTitle?: string;
}

interface SeedProject {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: TaskPriority;
  teamName?: string;
  ownerEmail: string;
  memberEmails: string[];
  startOffsetDays: number;
  deadlineOffsetDays?: number;
  progress: number;
  tags: string[];
  tasks: SeedTask[];
}

const SEED_PROJECTS: SeedProject[] = [
  {
    name: 'Customer Portal Revamp',
    description: 'Rebuilding the self-serve customer portal on the new design system.',
    status: ProjectStatus.ACTIVE,
    priority: TaskPriority.HIGH,
    teamName: 'Platform Engineering',
    ownerEmail: 'marcus.chen@taskhub.dev',
    memberEmails: [
      'sofia.novak@taskhub.dev',
      'liam.brooks@taskhub.dev',
      'noah.kim@taskhub.dev',
      'ethan.silva@taskhub.dev',
    ],
    startOffsetDays: -20,
    deadlineOffsetDays: 30,
    progress: 45,
    tags: ['portal', 'q3'],
    tasks: [
      {
        title: 'Set up new portal routing skeleton',
        description: 'Stand up the route structure and layout shell for the revamped portal.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        labels: [TaskLabel.FEATURE],
        assigneeEmails: ['liam.brooks@taskhub.dev'],
        reporterEmail: 'sofia.novak@taskhub.dev',
        dueOffsetDays: 3,
        estimatedHours: 8,
        checklist: [
          { title: 'Scaffold route structure', completed: true },
          { title: 'Wire up layout shell', completed: true },
          { title: 'Add auth guard to protected routes', completed: false },
        ],
      },
      {
        title: 'Fix session timeout redirect loop',
        description: 'Users get stuck bouncing between /login and /portal after a session expires.',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.URGENT,
        labels: [TaskLabel.BUG],
        assigneeEmails: ['noah.kim@taskhub.dev'],
        reporterEmail: 'marcus.chen@taskhub.dev',
        dueOffsetDays: -2,
        estimatedHours: 4,
        comments: [
          {
            authorEmail: 'sofia.novak@taskhub.dev',
            text: "Blocked on the auth team's token refresh fix landing first.",
          },
        ],
      },
      {
        title: 'Migrate billing widget to new design system',
        status: TaskStatus.REVIEW,
        priority: TaskPriority.MEDIUM,
        labels: [TaskLabel.IMPROVEMENT],
        assigneeEmails: ['ethan.silva@taskhub.dev'],
        reporterEmail: 'sofia.novak@taskhub.dev',
        dueOffsetDays: 1,
        checklist: [
          { title: 'Swap in new Button/Input primitives', completed: true },
          { title: 'Re-test payment flow end to end', completed: false },
        ],
      },
      {
        title: 'Write onboarding tour copy',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        labels: [TaskLabel.DOCUMENTATION],
        assigneeEmails: ['liam.brooks@taskhub.dev'],
        reporterEmail: 'marcus.chen@taskhub.dev',
        dueOffsetDays: 10,
      },
      {
        title: 'Add dark mode support',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        labels: [TaskLabel.FEATURE],
        assigneeEmails: ['noah.kim@taskhub.dev', 'ethan.silva@taskhub.dev'],
        reporterEmail: 'sofia.novak@taskhub.dev',
        dueOffsetDays: 7,
        dependsOnTitle: 'Set up new portal routing skeleton',
      },
      {
        title: 'Audit portal for accessibility issues',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        labels: [TaskLabel.BUG, TaskLabel.IMPROVEMENT],
        assigneeEmails: [],
        reporterEmail: 'sofia.novak@taskhub.dev',
        dueOffsetDays: 14,
      },
    ],
  },
  {
    name: 'Internal Analytics Dashboard',
    description: 'Self-serve reporting so teams stop asking data eng for one-off exports.',
    status: ProjectStatus.PLANNING,
    priority: TaskPriority.MEDIUM,
    teamName: 'Platform Engineering',
    ownerEmail: 'marcus.chen@taskhub.dev',
    memberEmails: ['sofia.novak@taskhub.dev', 'ethan.silva@taskhub.dev'],
    startOffsetDays: -3,
    deadlineOffsetDays: 45,
    progress: 10,
    tags: ['internal', 'analytics'],
    tasks: [
      {
        title: 'Define north-star metrics with leadership',
        status: TaskStatus.REVIEW,
        priority: TaskPriority.HIGH,
        assigneeEmails: ['sofia.novak@taskhub.dev'],
        reporterEmail: 'marcus.chen@taskhub.dev',
        dueOffsetDays: 2,
      },
      {
        title: 'Spike: charting library evaluation',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        labels: [TaskLabel.FEATURE],
        assigneeEmails: ['ethan.silva@taskhub.dev'],
        reporterEmail: 'sofia.novak@taskhub.dev',
        dueOffsetDays: 5,
        checklist: [
          { title: 'Evaluate Recharts', completed: true },
          { title: 'Evaluate visx', completed: false },
          { title: 'Write comparison doc', completed: false },
        ],
      },
      {
        title: 'Draft data pipeline architecture',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeEmails: ['ethan.silva@taskhub.dev'],
        reporterEmail: 'marcus.chen@taskhub.dev',
        dueOffsetDays: 12,
      },
    ],
  },
  {
    name: 'Design System 2.0',
    description: 'Second-generation component library with tokens shared across every surface.',
    status: ProjectStatus.ACTIVE,
    priority: TaskPriority.HIGH,
    teamName: 'Product Design',
    ownerEmail: 'priya.kapoor@taskhub.dev',
    memberEmails: ['daniel.osei@taskhub.dev', 'emma.torres@taskhub.dev', 'grace.lin@taskhub.dev'],
    startOffsetDays: -30,
    deadlineOffsetDays: 20,
    progress: 60,
    tags: ['design-system'],
    tasks: [
      {
        title: 'Ship new Button and Input primitives',
        status: TaskStatus.REVIEW,
        priority: TaskPriority.HIGH,
        labels: [TaskLabel.FEATURE],
        assigneeEmails: ['emma.torres@taskhub.dev'],
        reporterEmail: 'daniel.osei@taskhub.dev',
        dueOffsetDays: 1,
        checklist: [
          { title: 'Design specs finalized', completed: true },
          { title: 'Build in Figma library', completed: true },
          { title: 'Implement in code', completed: true },
          { title: 'Cross-browser check', completed: false },
        ],
      },
      {
        title: 'Document color token usage guidelines',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        labels: [TaskLabel.DOCUMENTATION],
        assigneeEmails: ['grace.lin@taskhub.dev'],
        reporterEmail: 'daniel.osei@taskhub.dev',
        dueOffsetDays: 4,
      },
      {
        title: 'Fix contrast ratio failures on Badge component',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.HIGH,
        labels: [TaskLabel.BUG],
        assigneeEmails: ['emma.torres@taskhub.dev'],
        reporterEmail: 'priya.kapoor@taskhub.dev',
        dueOffsetDays: -1,
        comments: [
          {
            authorEmail: 'daniel.osei@taskhub.dev',
            text: 'Waiting on the brand team to confirm the updated palette before we touch this.',
          },
          {
            authorEmail: 'emma.torres@taskhub.dev',
            text: 'Pinged them again this morning — should have an answer by Friday.',
          },
        ],
      },
      {
        title: 'Publish Figma library v2',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assigneeEmails: ['grace.lin@taskhub.dev'],
        reporterEmail: 'daniel.osei@taskhub.dev',
        dueOffsetDays: 9,
        dependsOnTitle: 'Ship new Button and Input primitives',
      },
      {
        title: 'Component usage audit across marketing site',
        status: TaskStatus.HOLD,
        description: 'Paused until the Marketing Site Refresh project settles on final layouts.',
        priority: TaskPriority.LOW,
        labels: [TaskLabel.IMPROVEMENT],
        assigneeEmails: [],
        reporterEmail: 'priya.kapoor@taskhub.dev',
        dueOffsetDays: 20,
      },
    ],
  },
  {
    name: 'Marketing Site Refresh',
    description: 'New homepage, pricing page, and SEO cleanup ahead of the Q4 campaign.',
    status: ProjectStatus.ACTIVE,
    priority: TaskPriority.MEDIUM,
    teamName: 'Product Design',
    ownerEmail: 'priya.kapoor@taskhub.dev',
    memberEmails: [
      'daniel.osei@taskhub.dev',
      'grace.lin@taskhub.dev',
      'mia.alvarez@taskhub.dev',
      'owen.baxter@taskhub.dev',
    ],
    startOffsetDays: -10,
    deadlineOffsetDays: 25,
    progress: 25,
    tags: ['marketing', 'q4-campaign'],
    tasks: [
      {
        title: 'Redesign pricing page layout',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        labels: [TaskLabel.FEATURE],
        assigneeEmails: ['mia.alvarez@taskhub.dev'],
        reporterEmail: 'daniel.osei@taskhub.dev',
        dueOffsetDays: 6,
      },
      {
        title: 'Collect customer testimonials for homepage',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        assigneeEmails: ['grace.lin@taskhub.dev'],
        reporterEmail: 'priya.kapoor@taskhub.dev',
        dueOffsetDays: 15,
      },
      {
        title: 'Fix mobile nav overlap bug',
        status: TaskStatus.REVIEW,
        priority: TaskPriority.MEDIUM,
        labels: [TaskLabel.BUG],
        assigneeEmails: ['mia.alvarez@taskhub.dev'],
        reporterEmail: 'daniel.osei@taskhub.dev',
        dueOffsetDays: 2,
      },
      {
        title: 'SEO audit and meta tag cleanup',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        labels: [TaskLabel.IMPROVEMENT],
        assigneeEmails: ['grace.lin@taskhub.dev'],
        reporterEmail: 'priya.kapoor@taskhub.dev',
        dueOffsetDays: 11,
      },
    ],
  },
  {
    name: 'Q3 Onboarding Flow',
    description: 'Guided first-run experience for new signups. Wrapped up and shipped.',
    status: ProjectStatus.COMPLETED,
    priority: TaskPriority.MEDIUM,
    ownerEmail: 'marcus.chen@taskhub.dev',
    memberEmails: ['liam.brooks@taskhub.dev', 'emma.torres@taskhub.dev'],
    startOffsetDays: -60,
    deadlineOffsetDays: -10,
    progress: 100,
    tags: ['onboarding'],
    tasks: [
      {
        title: 'Ship guided product tour',
        status: TaskStatus.REVIEW,
        priority: TaskPriority.MEDIUM,
        labels: [TaskLabel.FEATURE],
        assigneeEmails: ['liam.brooks@taskhub.dev'],
        reporterEmail: 'marcus.chen@taskhub.dev',
        dueOffsetDays: -10,
      },
      {
        title: 'Write onboarding email sequence',
        status: TaskStatus.REVIEW,
        priority: TaskPriority.LOW,
        labels: [TaskLabel.DOCUMENTATION],
        assigneeEmails: ['emma.torres@taskhub.dev'],
        reporterEmail: 'marcus.chen@taskhub.dev',
        dueOffsetDays: -12,
      },
    ],
  },
];

const seedUsers = async (): Promise<Map<string, Types.ObjectId>> => {
  const usersByEmail = new Map<string, Types.ObjectId>();

  for (const seedUser of SEED_USERS) {
    const existing = await User.findOne({ email: seedUser.email });
    if (existing) {
      logger.info(`Skipping user ${seedUser.email} (already exists).`);
      usersByEmail.set(seedUser.email, existing._id);
      continue;
    }

    const created = await User.create({
      email: seedUser.email,
      password: SEED_PASSWORD,
      firstName: seedUser.firstName,
      lastName: seedUser.lastName,
      role: seedUser.role,
      status: UserStatus.ACTIVE,
    });
    logger.info(`Created user ${seedUser.email} (${seedUser.role}).`);
    usersByEmail.set(seedUser.email, created._id);
  }

  return usersByEmail;
};

const seedTeams = async (
  usersByEmail: Map<string, Types.ObjectId>,
): Promise<Map<string, Types.ObjectId>> => {
  const teamsByName = new Map<string, Types.ObjectId>();

  for (const seedTeam of SEED_TEAMS) {
    const existing = await Team.findOne({ name: seedTeam.name });
    if (existing) {
      logger.info(`Skipping team "${seedTeam.name}" (already exists).`);
      teamsByName.set(seedTeam.name, existing._id);
      continue;
    }

    const created = await Team.create({
      name: seedTeam.name,
      description: seedTeam.description,
      teamLead: usersByEmail.get(seedTeam.teamLeadEmail),
      members: seedTeam.members.map((m) => ({
        user: usersByEmail.get(m.email),
        role: m.role,
        joinedAt: new Date(),
      })),
      createdBy: usersByEmail.get(seedTeam.teamLeadEmail),
    });
    logger.info(`Created team "${seedTeam.name}".`);
    teamsByName.set(seedTeam.name, created._id);
  }

  return teamsByName;
};

const seedProjectsAndTasks = async (
  usersByEmail: Map<string, Types.ObjectId>,
  teamsByName: Map<string, Types.ObjectId>,
): Promise<void> => {
  for (const seedProject of SEED_PROJECTS) {
    let projectId: Types.ObjectId;
    const existingProject = await Project.findOne({ name: seedProject.name });

    if (existingProject) {
      logger.info(`Skipping project "${seedProject.name}" (already exists).`);
      projectId = existingProject._id;
    } else {
      const created = await Project.create({
        name: seedProject.name,
        description: seedProject.description,
        status: seedProject.status,
        priority: seedProject.priority,
        team: seedProject.teamName ? teamsByName.get(seedProject.teamName) : undefined,
        owner: usersByEmail.get(seedProject.ownerEmail),
        members: seedProject.memberEmails.map((email) => usersByEmail.get(email)),
        startDate: daysFromNow(seedProject.startOffsetDays),
        deadline:
          seedProject.deadlineOffsetDays !== undefined
            ? daysFromNow(seedProject.deadlineOffsetDays)
            : undefined,
        progress: seedProject.progress,
        tags: seedProject.tags,
        createdBy: usersByEmail.get(seedProject.ownerEmail),
      });
      logger.info(`Created project "${seedProject.name}".`);
      projectId = created._id;
    }

    const tasksByTitle = new Map<string, Types.ObjectId>();
    const pendingDependencies: { taskId: Types.ObjectId; dependsOnTitle: string }[] = [];

    for (const seedTask of seedProject.tasks) {
      const existingTask = await Task.findOne({ title: seedTask.title, project: projectId });
      if (existingTask) {
        logger.info(`Skipping task "${seedTask.title}" (already exists).`);
        tasksByTitle.set(seedTask.title, existingTask._id);
        continue;
      }

      const created = await Task.create({
        title: seedTask.title,
        description: seedTask.description,
        project: projectId,
        status: seedTask.status,
        priority: seedTask.priority,
        labels: seedTask.labels ?? [],
        assignees: seedTask.assigneeEmails.map((email) => usersByEmail.get(email)),
        reporter: usersByEmail.get(seedTask.reporterEmail),
        createdBy: usersByEmail.get(seedTask.reporterEmail),
        dueDate:
          seedTask.dueOffsetDays !== undefined ? daysFromNow(seedTask.dueOffsetDays) : undefined,
        estimatedHours: seedTask.estimatedHours,
        checklist: seedTask.checklist ?? [],
        comments: (seedTask.comments ?? []).map((c) => ({
          user: usersByEmail.get(c.authorEmail),
          text: c.text,
          createdAt: new Date(),
        })),
      });
      logger.info(`Created task "${seedTask.title}".`);
      tasksByTitle.set(seedTask.title, created._id);

      if (seedTask.dependsOnTitle) {
        pendingDependencies.push({ taskId: created._id, dependsOnTitle: seedTask.dependsOnTitle });
      }
    }

    for (const { taskId, dependsOnTitle } of pendingDependencies) {
      const dependsOnId = tasksByTitle.get(dependsOnTitle);
      if (dependsOnId) {
        await Task.findByIdAndUpdate(taskId, { $addToSet: { dependencies: dependsOnId } });
      }
    }
  }
};

const seed = async (): Promise<void> => {
  await connectDB();

  const usersByEmail = await seedUsers();
  const teamsByName = await seedTeams(usersByEmail);
  await seedProjectsAndTasks(usersByEmail, teamsByName);

  await mongoose.disconnect();
};

seed().catch((error: unknown) => {
  logger.error(`Seeding failed: ${error instanceof Error ? error.stack : String(error)}`);
  process.exit(1);
});
