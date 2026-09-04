"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { getAccessToken } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then(setToken);
  }, [user]);

  const { profile, isLoading, updateProfile, isUpdating } = useProfile(token);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-text-base">Profile</h1>
        <p className="text-text-muted mt-1 text-sm">
          Your details are mapped to form fields automatically. Keep them complete for best results.
        </p>
      </div>

      <ProfileForm
        profile={profile}
        isLoading={isLoading}
        onSave={updateProfile}
        isSaving={isUpdating}
      />
    </div>
  );
}
