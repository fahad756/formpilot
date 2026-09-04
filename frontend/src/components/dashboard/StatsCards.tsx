import { Card } from "@/components/ui/Card";
import type { JobApplication, ApplicationStatus } from "@/types";
import { Briefcase, CheckCircle2, Clock, XCircle } from "lucide-react";

interface StatsCardsProps {
  applications: JobApplication[];
}

export function StatsCards({ applications }: StatsCardsProps) {
  const total = applications.length;
  const count = (s: ApplicationStatus) => applications.filter((a) => a.status === s).length;
  const interviewing = count("interviewing");
  const offers = count("offer");
  const rejected = count("rejected");

  const stats = [
    { label: "Total Applied",   value: total,        icon: Briefcase,    color: "text-primary-500",  bg: "bg-primary-50" },
    { label: "Interviewing",    value: interviewing, icon: Clock,        color: "text-amber-500",    bg: "bg-amber-50" },
    { label: "Offers",          value: offers,       icon: CheckCircle2, color: "text-emerald-500",  bg: "bg-emerald-50" },
    { label: "Rejected",        value: rejected,     icon: XCircle,      color: "text-rose-500",     bg: "bg-rose-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-base">{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
