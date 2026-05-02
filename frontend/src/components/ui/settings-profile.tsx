"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Loader2, Mail, Save } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export type SettingsProfileData = {
  name: string;
  email: string;
  role?: string;
  isVerified?: boolean;
  profilePictureUrl?: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  country?: string;
  termsAcceptedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type SettingsProfileProps = {
  profile: SettingsProfileData;
  onSave: (data: Omit<SettingsProfileData, "email">) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<string>;
  className?: string;
};

export default function SettingsProfile({ profile, onSave, onAvatarUpload, className }: SettingsProfileProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(profile.name || "");
  const [profilePictureUrl, setProfilePictureUrl] = useState(profile.profilePictureUrl || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || "");
  const [company, setCompany] = useState(profile.company || "");
  const [country, setCountry] = useState(profile.country || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = useMemo(() => {
    const src = (name || profile.email || "U").trim();
    return src
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [name, profile.email]);

  const formatDate = (value?: string) => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setUploading(true);
    try {
      const url = await onAvatarUpload(file);
      setProfilePictureUrl(url);
      toast.success("Profile image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await onSave({
        name,
        profilePictureUrl,
        bio,
        jobTitle,
        company,
        country: country.trim().toUpperCase().slice(0, 2),
      });
      toast.success("Profile updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = () => {
    toast("Email change is not available yet.", {
      description: "For now, contact support to request an email update.",
    });
  };

  const handleAvatarClick = () => {
    if (saving || uploading) return;
    fileInputRef.current?.click();
  };

  return (
    <Card className={cn("mx-auto w-full max-w-4xl overflow-hidden border-border/80 bg-card/95 shadow-sm", className)}>
      <CardHeader className="gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl tracking-tight">Profile Settings</CardTitle>
            <CardDescription>Manage your profile information and avatar.</CardDescription>
          </div>
          <Button type="button" disabled={saving || uploading} onClick={handleSave}>
            <Save data-icon="inline-start" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <FieldGroup className="flex flex-col gap-7">
          <Field>
            <FieldLabel htmlFor="user-email">Email</FieldLabel>
            <FieldContent>
              <div className="flex flex-col gap-2">
                <InputGroup>
                  <Mail data-icon="inline-start" />
                  <InputGroupInput id="user-email" value={profile.email} readOnly />
                </InputGroup>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChangeEmail}
                  disabled={saving || uploading}
                  className="w-full sm:w-auto"
                >
                  Change Email
                </Button>
              </div>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Profile picture</FieldLabel>
            <FieldContent>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={saving || uploading}
                    className="relative flex size-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/80 bg-muted text-sm font-semibold text-muted-foreground shadow-sm transition hover:border-border disabled:cursor-not-allowed"
                    aria-label="Choose profile image"
                  >
                    <span className="absolute -end-0.5 -top-0.5 flex size-6 items-center justify-center rounded-full border border-border/80 bg-card">
                      <Camera className="size-3.5 text-muted-foreground" aria-hidden />
                    </span>
                    {profilePictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profilePictureUrl} alt="Profile" className="size-full object-cover" />
                    ) : (
                      initials || "U"
                    )}
                  </button>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-sm font-medium">Click the profile image to upload a new photo.</p>
                    <FieldDescription>Max size: 5MB.</FieldDescription>
                    <InputGroup className="hidden">
                      <InputGroupInput
                        ref={fileInputRef}
                        id="profile-picture-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading || saving}
                      />
                    </InputGroup>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uploading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        Uploading
                      </span>
                    ) : (
                      "PNG, JPG, WEBP"
                    )}
                  </p>
                </div>
              </div>
            </FieldContent>
          </Field>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="user-name">Full name</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    id="user-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={saving}
                    placeholder="Your full name"
                  />
                </InputGroup>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="user-country">Country code</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    id="user-country"
                    placeholder="US"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    disabled={saving}
                    maxLength={2}
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="user-job">Job title</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    id="user-job"
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    disabled={saving}
                    placeholder="Software Engineer"
                  />
                </InputGroup>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="user-company">Company</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    id="user-company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    disabled={saving}
                    placeholder="Acme Inc."
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="user-bio">Bio</FieldLabel>
            <FieldContent>
              <Textarea
                id="user-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                disabled={saving}
                className="min-h-28 resize-none"
                placeholder="Tell people a little about yourself."
              />
              <FieldDescription>A brief description about yourself (max 500 characters).</FieldDescription>
            </FieldContent>
          </Field>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="user-role">Role</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    id="user-role"
                    value={profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "User"}
                    readOnly
                  />
                </InputGroup>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="user-verified">Email status</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    id="user-verified"
                    value={profile.isVerified ? "Verified" : "Unverified"}
                    readOnly
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="user-created-at">Member since</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput id="user-created-at" value={formatDate(profile.createdAt)} readOnly />
                </InputGroup>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="user-updated-at">Last profile update</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput id="user-updated-at" value={formatDate(profile.updatedAt)} readOnly />
                </InputGroup>
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="user-terms-accepted">Terms accepted</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupInput id="user-terms-accepted" value={formatDate(profile.termsAcceptedAt)} readOnly />
              </InputGroup>
            </FieldContent>
          </Field>

          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
      </CardContent>
      <CardFooter className="border-t border-border/70 bg-muted/20 px-6 py-4">
        <div className="flex w-full items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Changes update your account profile immediately after save.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
