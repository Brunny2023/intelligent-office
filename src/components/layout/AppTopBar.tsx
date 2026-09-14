import { useOrganization } from "@/hooks/useOrganization";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import { PersonAvatar } from "@/components/dashboard/kit";
import { Building2, LogOut } from "lucide-react";

/**
 * Sticky command bar shown above every module page: org identity on the left,
 * live date, notifications and the signed-in member on the right.
 */
const AppTopBar = ({ title }: { title?: string }) => {
  const { org, profile } = useOrganization();
  const { role } = useUserRole();
  const { signOut } = useAuth();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="hidden md:flex sticky top-0 z-30 items-center gap-4 px-6 lg:px-8 h-16 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        {org?.logo_url ? (
          <img src={org.logo_url} alt={org.name} className="w-9 h-9 rounded-xl object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--svo-navy))] flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-[hsl(var(--svo-gold))]" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{org?.name || "Intelligent Office"}</p>
          {title && <p className="text-[11px] text-muted-foreground truncate">{title}</p>}
        </div>
      </div>

      <div className="flex-1" />

      <span className="text-xs text-muted-foreground hidden lg:inline">{today}</span>
      <NotificationBell className="text-foreground/70 hover:bg-muted hover:text-foreground border border-border/60" />
      <div className="flex items-center gap-2 pl-3 border-l border-border/60">
        <PersonAvatar name={profile?.full_name} src={(profile as any)?.avatar_url} size={32} />
        <div className="hidden lg:block leading-tight">
          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
            {profile?.full_name || "Member"}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">{role?.replace("_", " ") || ""}</p>
        </div>
        <button
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
          className="ml-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-foreground/70 border border-border/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default AppTopBar;
