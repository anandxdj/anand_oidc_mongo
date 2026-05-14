"use client";

import { clientFetch } from "@/lib/client-api";
import { ProfileSettingsCard } from "./profile-settings-card";

type ImagekitAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  folder: string;
};

type UploadedAsset = {
  url?: string;
};

async function uploadToImagekit(file: File): Promise<string> {
  const authRes = await clientFetch("/api/auth/imagekit/upload-auth", {
  });
  const authJson = (await authRes.json()) as ApiJson<ImagekitAuth>;
  if (!authRes.ok || !authJson.data) {
    throw new Error(authJson.message || "Image upload auth failed");
  }

  const formData = new FormData();
  formData.set("file", file);
  formData.set("fileName", file.name);
  formData.set("publicKey", authJson.data.publicKey);
  formData.set("token", authJson.data.token);
  formData.set("expire", String(authJson.data.expire));
  formData.set("signature", authJson.data.signature);
  formData.set("folder", authJson.data.folder);
  formData.set("useUniqueFileName", "true");

  const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });
  const uploadJson = (await uploadRes.json()) as UploadedAsset & { message?: string };
  if (!uploadRes.ok || !uploadJson.url) {
    throw new Error(uploadJson.message || "Image upload failed");
  }

  return uploadJson.url;
}

export function UserProfileForm({ user }: { user: UserProfile }) {
  const onSave = async (data: {
    name: string;
    profilePictureUrl?: string;
    bio?: string;
    jobTitle?: string;
    company?: string;
    country?: string;
  }) => {
    const res = await clientFetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as ApiJson<UserProfile>;
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Could not update profile.");
    }
  };

  return (
    <ProfileSettingsCard
      profile={{
        name: user.name || "",
        email: user.email,
        profilePictureUrl: user.profilePictureUrl || "",
        bio: user.bio || "",
        jobTitle: user.jobTitle || "",
        company: user.company || "",
        country: user.country || "",
      role: user.role || "user",
      isVerified: Boolean(user.isVerified),
      termsAcceptedAt: user.termsAcceptedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      }}
      onAvatarUpload={uploadToImagekit}
      onSave={onSave}
    />
  );
}
