"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ApiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable";
import type { JobApplication } from "@/types";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then(setToken);
  }, [user]);

  const { data: applications = [], isLoading } = useQuery<JobApplication[]>({
    queryKey: ["applications"],
    queryFn: () => new ApiClient(token!).listApplications({ page_size: 50 }),
    enabled: !!token,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-base">Dashboard</h1>
        <p className="text-text-muted mt-1 text-sm">
          Track every application filled with FormPilot.
        </p>
      </div>

      <StatsCards applications={applications} />

      <div>
        <h2 className="section-title mb-4">Recent Applications</h2>
        <ApplicationsTable
          applications={applications}
          isLoading={isLoading}
          token={token}
        />
      </div>
    </div>
  );
}
