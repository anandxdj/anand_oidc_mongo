"use client";

import SettingsProfile, { type SettingsProfileData } from "@/components/ui/settings-profile";

type ExtendedSettingsProfileData = SettingsProfileData & {
  role?: string;
  isVerified?: boolean;
  termsAcceptedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ProfileSettingsCardProps = {
  profile: ExtendedSettingsProfileData;
  onSave: (data: Omit<SettingsProfileData, "email">) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<string>;
};

export function ProfileSettingsCard({ profile, onSave, onAvatarUpload }: ProfileSettingsCardProps) {
  return <SettingsProfile profile={profile} onSave={onSave} onAvatarUpload={onAvatarUpload} />;
}
