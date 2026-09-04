"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Trash2 } from "lucide-react";
import { ApiClient } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ApplicationStatus, JobApplication } from "@/types";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "applied", "interviewing", "offer", "rejected", "withdrawn",
];

interface ApplicationsTableProps {
  applications: JobApplication[];
  isLoading: boolean;
  token: string | null;
}

export function ApplicationsTable({ applications, isLoading, token }: ApplicationsTableProps) {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      new ApiClient(token!).updateApplicationStatus(id, status),
    onSettled: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });

  const deleteApp = useMutation({
    mutationFn: (id: string) => new ApiClient(token!).deleteApplication(id),
    onSettled: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-text-muted text-sm">No applications logged yet.</p>
        <p className="text-text-muted text-xs mt-1">
          Install the extension and start autofilling to see your history here.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs">
              <th className="text-left px-5 py-3 font-medium">Company</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Applied</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-5 py-3.5 font-medium text-text-base">
                  {app.company_name ?? "—"}
                </td>
                <td className="px-5 py-3.5 text-text-muted truncate max-w-[180px]">
                  {app.job_title ?? "—"}
                </td>
                <td className="px-5 py-3.5">
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus.mutate({ id: app.id, status: e.target.value })}
                    className="text-xs border border-border rounded-lg px-2 py-1 bg-surface focus:outline-none focus:ring-1 focus:ring-primary-500 capitalize"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3.5 text-text-muted text-xs">
                  {app.applied_at
                    ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })
                    : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-primary-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => deleteApp.mutate(app.id)}
                      className="text-text-muted hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
