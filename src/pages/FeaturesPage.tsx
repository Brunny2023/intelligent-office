import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import {
  Clock, CheckSquare, MessageSquare, BarChart3, FileText,
  Shield, Briefcase, DollarSign, ArrowRight, Target, Video,
  Megaphone, Activity, Brain, Crown, Workflow, Users, Ticket,
  ShieldCheck, Settings
} from "lucide-react";

import featureAttendance from "@/assets/feature-attendance.jpg";
import featureExecution from "@/assets/feature-execution.jpg";
import featureCommunication from "@/assets/feature-communication.jpg";
import featureIntelligence from "@/assets/feature-intelligence.jpg";
import featureDocuments from "@/assets/feature-documents.jpg";
import featureHr from "@/assets/feature-hr.jpg";
import featureFinance from "@/assets/feature-finance.jpg";
import featureSecurity from "@/assets/feature-security.jpg";
import featureJobPlanning from "@/assets/feature-job-planning.jpg";
import featureMeetings from "@/assets/feature-meetings.jpg";
import featureAnnouncements from "@/assets/feature-announcements.jpg";
import featureActivity from "@/assets/feature-activity.jpg";
import featureAiInsights from "@/assets/feature-ai-insights.jpg";
import featureExecutive from "@/assets/feature-executive.jpg";
import featureWorkflows from "@/assets/feature-workflows.jpg";
import featureTeam from "@/assets/feature-team.jpg";
import featureSupport from "@/assets/feature-support.jpg";
import featureAdmin from "@/assets/feature-admin.jpg";
import featureSettings from "@/assets/feature-settings.jpg";

const features = [
  {
    id: "attendance",
    icon: Clock,
    title: "Attendance & Workforce Presence",
    headline: "Know who's working, from where, at all times.",
    description: "Digital clock-in/out with precise timestamps, geo-validation for remote teams, and automatic attendance calculations. Employees can request leave, managers approve with one click, and HR gets real-time dashboards showing presence across the entire organization. Late arrivals, early departures, and overtime are tracked automatically.",
    bullets: [
      "One-click clock in/out with timestamp records",
      "Leave request & approval workflows",
      "Monthly attendance rate calculations",
      "Real-time presence dashboard for managers",
    ],
    image: featureAttendance,
    align: "right" as const,
  },
  {
    id: "job-planning",
    icon: Target,
    title: "Job Planning & KPI Targets",
    headline: "Set goals. Track progress. Hit targets.",
    description: "Define structured job plans for every role with measurable targets tied to weekly, monthly, or quarterly periods. Employees track progress against KPIs in real-time, while managers monitor completion rates and intervene early when targets are at risk. Automatic reminders ensure nothing falls through the cracks.",
    bullets: [
      "Role-based job plan creation with descriptions",
      "Measurable targets with progress tracking",
      "Period-based goals: weekly, monthly, quarterly",
      "Automated reminders and due date alerts",
    ],
    image: featureJobPlanning,
    align: "left" as const,
  },
  {
    id: "execution",
    icon: CheckSquare,
    title: "Project Execution Engine",
    headline: "Every task tracked from assignment to completion.",
    description: "A powerful kanban-style task board with drag-and-drop status transitions across To Do, In Progress, Review, and Done columns. Create projects, assign tasks with priorities and due dates, add subtasks, and track completion rates. Managers get visibility into team workload and bottlenecks at a glance.",
    bullets: [
      "Kanban board with drag-and-drop task management",
      "Priority levels: low, medium, high, urgent",
      "Task comments, subtasks, and due dates",
      "Project-level progress tracking and reporting",
    ],
    image: featureExecution,
    align: "right" as const,
  },
  {
    id: "communication",
    icon: MessageSquare,
    title: "Corporate Communication Hub",
    headline: "Real-time messaging built for organizations.",
    description: "Channel-based messaging inspired by the best team chat tools, but designed specifically for corporate environments. Create department channels, project-specific rooms, or direct messages. Every conversation is searchable, threaded, and organized. Real-time delivery means your team stays connected without switching apps.",
    bullets: [
      "Public, private, and direct message channels",
      "Real-time message delivery with presence indicators",
      "Organization-wide announcements with read receipts",
      "Searchable message history across all channels",
    ],
    image: featureCommunication,
    align: "left" as const,
  },
  {
    id: "meetings",
    icon: Video,
    title: "Virtual Meetings & Video Conferencing",
    headline: "Face-to-face collaboration, anywhere.",
    description: "Launch video meetings directly from the platform with integrated audio/video conferencing powered by LiveKit. Schedule meetings, invite participants, and collaborate in real-time without switching to third-party tools. Perfect for distributed teams who need reliable, low-latency communication.",
    bullets: [
      "One-click video meeting creation",
      "HD audio and video with screen sharing",
      "Integrated with team channels and projects",
      "No external app installation required",
    ],
    image: featureMeetings,
    align: "right" as const,
  },
  {
    id: "announcements",
    icon: Megaphone,
    title: "Organization-Wide Announcements",
    headline: "Important updates that never get missed.",
    description: "Broadcast critical information across your entire organization or target specific departments. Announcements support priority levels, mandatory acknowledgement, and read receipts so you always know who has seen your message. Draft, schedule, and publish with full editorial control.",
    bullets: [
      "Priority-based announcements (low, medium, high, critical)",
      "Mandatory acknowledgement with tracking",
      "Department-targeted or organization-wide delivery",
      "Draft, schedule, and publish workflows",
    ],
    image: featureAnnouncements,
    align: "left" as const,
  },
  {
    id: "activity",
    icon: Activity,
    title: "Activity Logs & Audit Trail",
    headline: "Complete visibility into every action.",
    description: "Every action on the platform is automatically logged — from task updates and document uploads to attendance changes and approval decisions. Filter by user, entity type, or date range to investigate issues, ensure compliance, and maintain a complete organizational audit trail.",
    bullets: [
      "Automatic logging of all platform actions",
      "Filter by user, entity type, and date range",
      "Exportable audit trail for compliance",
      "Real-time activity feed for managers",
    ],
    image: featureActivity,
    align: "right" as const,
  },
  {
    id: "documents",
    icon: FileText,
    title: "Secure Document Management",
    headline: "Your organization's knowledge, organized.",
    description: "Centralized file storage with automatic categorization, version control, and powerful search. Upload contracts, SOPs, policies, and project files. Organize by department, project, or custom tags. Every document has a complete audit trail showing who uploaded, viewed, and modified it.",
    bullets: [
      "Drag-and-drop file upload with auto-categorization",
      "Version history and change tracking",
      "Department and project-based organization",
      "Full-text search across all documents",
    ],
    image: featureDocuments,
    align: "left" as const,
  },
  {
    id: "intelligence",
    icon: BarChart3,
    title: "Executive Intelligence & KPI Dashboards",
    headline: "Data-driven decisions at executive speed.",
    description: "Comprehensive KPI dashboards that aggregate data from every module — attendance rates, task completion, budget utilization, and team performance — into a single executive view. Create custom KPIs with target values, track trends over time, and compare department-level performance at a glance.",
    bullets: [
      "Organization health score with trend analysis",
      "Department-level performance comparisons",
      "Custom KPI creation with target tracking",
      "Period-based reporting with visual charts",
    ],
    image: featureAiInsights,
    align: "right" as const,
  },
  {
    id: "ai-insights",
    icon: Brain,
    title: "AI-Powered Insights",
    headline: "Intelligent analysis, automatically generated.",
    description: "Leverage AI to automatically detect anomalies, flag risks, and surface trends that would take hours to find manually. AI-generated briefs summarize organizational health, highlight underperforming areas, and recommend actions — giving executives and managers a strategic advantage.",
    bullets: [
      "AI-generated anomaly detection and alerts",
      "Automated organizational health briefs",
      "Risk flagging with severity classification",
      "Actionable recommendations for improvement",
    ],
    image: featureExecutive,
    align: "left" as const,
  },
  {
    id: "executive",
    icon: Crown,
    title: "Executive Dashboard",
    headline: "The CEO's command center.",
    description: "A high-level executive view consolidating the most critical metrics from across the platform. See staff count, active projects, pending approvals, and financial summaries in one unified dashboard designed for C-suite decision-making. Drill down into any area for deeper analysis.",
    bullets: [
      "Consolidated C-suite metrics overview",
      "Staff and department performance summary",
      "Pending approvals and escalation tracking",
      "One-click drill-down into any module",
    ],
    image: featureIntelligence,
    align: "right" as const,
  },
  {
    id: "workflows",
    icon: Workflow,
    title: "Automated Workflows",
    headline: "Automate repetitive processes across your org.",
    description: "Design multi-step workflows with configurable triggers, approval chains, and escalation rules. Automate leave approvals, document sign-offs, onboarding checklists, and more. Each workflow instance is tracked with full step-by-step logs showing who acted, when, and what happened.",
    bullets: [
      "Visual workflow builder with step configuration",
      "Trigger-based automation (manual, scheduled, event)",
      "Multi-level approval chains with escalation",
      "Complete instance tracking with step logs",
    ],
    image: featureWorkflows,
    align: "left" as const,
  },
  {
    id: "hr",
    icon: Briefcase,
    title: "HR & Recruitment",
    headline: "Hire, onboard, and manage your talent pipeline.",
    description: "Post job openings, track candidates through customizable pipeline stages, manage performance reviews, and handle employee terminations — all in one place. The HR module connects directly to attendance and task data to generate automatic performance metrics for each team member.",
    bullets: [
      "Job posting creation and candidate tracking",
      "Multi-stage recruitment pipeline (Applied → Hired)",
      "Performance review system with auto-populated metrics",
      "Employee onboarding checklists and termination workflows",
    ],
    image: featureTeam,
    align: "right" as const,
  },
  {
    id: "finance",
    icon: DollarSign,
    title: "Finance & Payroll",
    headline: "Payroll, expenses, and budgets under control.",
    description: "Manage employee payroll with base salary, bonuses, deductions, and net pay calculations. Employees can submit expense reports with receipt attachments, and managers approve or reject with notes. All financial data is organized by period and exportable for accounting software integration.",
    bullets: [
      "Payroll management with salary breakdowns",
      "Expense report submission and approval workflow",
      "Multi-currency support (USD, EUR, NGN, GBP)",
      "Period-based financial reporting and exports",
    ],
    image: featureFinance,
    align: "left" as const,
  },
  {
    id: "team",
    icon: Users,
    title: "Team Management",
    headline: "See your people. Manage your structure.",
    description: "View your entire organizational roster with department assignments, job titles, and contact details. Invite new members via email, manage department structures, and maintain an up-to-date directory. Team data feeds into every other module for seamless cross-platform integration.",
    bullets: [
      "Organization-wide team directory",
      "Department-based team structure",
      "Email invitation system with role assignment",
      "Profile management with job titles and contact info",
    ],
    image: featureHr,
    align: "right" as const,
  },
  {
    id: "support",
    icon: Ticket,
    title: "Support Ticketing System",
    headline: "Get help fast. Resolve issues faster.",
    description: "A built-in help desk where employees can submit support tickets with priority levels, track status updates, and communicate with admins through threaded replies. Admins see all tickets in a unified queue, can assign, escalate, and resolve issues efficiently with full conversation history.",
    bullets: [
      "Ticket creation with priority and description",
      "Threaded conversation between users and admins",
      "Status tracking: open, in-progress, resolved, closed",
      "Admin queue with filtering and assignment",
    ],
    image: featureDocuments,
    align: "left" as const,
  },
  {
    id: "admin",
    icon: ShieldCheck,
    title: "Admin Dashboard & User Management",
    headline: "Full control over your organization.",
    description: "A comprehensive admin panel with organization-wide metrics, user role management, and operational oversight. View active staff counts, project statistics, and task completion rates. Manage user roles (owner, executive, manager, staff, contractor, auditor) and ensure the right people have the right access.",
    bullets: [
      "Organization-wide metrics and health overview",
      "Role-based user management with 6 role levels",
      "Real-time notification system for admins",
      "Audit trail access and compliance monitoring",
    ],
    image: featureIntelligence,
    align: "right" as const,
  },
  {
    id: "security",
    icon: Shield,
    title: "Security & Compliance",
    headline: "Enterprise-grade security, built in.",
    description: "Toggle GDPR and NDPR compliance, enforce multi-factor authentication, restrict access by IP address, and maintain complete audit trails. Every action on the platform is logged with timestamps and user identification. Data retention policies are configurable per organization.",
    bullets: [
      "GDPR/NDPR compliance toggles",
      "Multi-factor authentication enforcement",
      "IP restriction with allowlist management",
      "Complete audit trail with searchable logs",
    ],
    image: featureSecurity,
    align: "left" as const,
  },
  {
    id: "settings",
    icon: Settings,
    title: "Organization Settings & Branding",
    headline: "Make Soteria yours.",
    description: "Customize your organization's identity with logo uploads, brand taglines, mission statements, and core values. Every aspect of your workspace reflects your brand. Settings are managed by organization owners and propagate across the entire platform instantly.",
    bullets: [
      "Logo upload with instant preview",
      "Brand tagline and mission statement",
      "Core values management",
      "Organization-wide branding propagation",
    ],
    image: featureSecurity,
    align: "right" as const,
  },
];

const FeatureBlock = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isLeft = feature.align === "left";

  return (
    <section
      ref={ref}
      className={`py-16 md:py-24 ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className={`flex flex-col ${isLeft ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-8 lg:gap-16`}>
          <motion.div
            initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 max-w-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-accent" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">{feature.title}</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {feature.headline}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>
            <ul className="space-y-3">
              {feature.bullets.map((b, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-foreground/90">{b}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isLeft ? 40 : -40, y: 20 }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full max-w-2xl"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              <img
                src={feature.image}
                alt={`${feature.title} dashboard screenshot`}
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const FeaturesPage = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section ref={heroRef} className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Platform Features</span>
              <h1 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
                Everything your office needs.<br />
                <span className="text-accent">Digitally.</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                From attendance tracking to executive analytics, Soteria replaces 12+ separate tools with one unified platform designed for African businesses.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {features.length} powerful modules — zero app-switching.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/signup">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2">
                    Start Free Trial <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/#pricing">
                  <Button size="lg" variant="outline">View Pricing</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {features.map((f, i) => (
          <FeatureBlock key={f.id} feature={f} index={i} />
        ))}

        <section className="py-20 md:py-28 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to transform your workplace?</h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8">
              Join hundreds of organizations already using Soteria to streamline operations.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
