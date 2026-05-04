"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiBaseUrl, getAuthHeaders, type UserProfile } from "@/lib/api";

export function SettingsForm({ user }: { user: UserProfile }) {
  const router = useRouter();

  const [name, setName] = useState(user.name || "");
  const [profilePictureUrl, setProfilePictureUrl] = useState(user.profilePictureUrl || "");
  const [bio, setBio] = useState(user.bio || "");
  const [jobTitle, setJobTitle] = useState(user.jobTitle || "");
  const [company, setCompany] = useState(user.company || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          name,
          profilePictureUrl,
          bio,
          jobTitle,
          company,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.message ?? "Could not update profile.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
        <CardDescription>
          This information will be displayed on your developer profile.
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          <FieldGroup>
            {error ? (
              <Field>
                <FieldError>{error}</FieldError>
              </Field>
            ) : null}
            {success ? (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Profile updated successfully.
              </p>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-name">Full Name</FieldLabel>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-avatar">Profile Picture URL</FieldLabel>
                <Input
                  id="profile-avatar"
                  placeholder="https://example.com/avatar.jpg"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  disabled={loading}
                />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-job">Job Title</FieldLabel>
                <Input
                  id="profile-job"
                  placeholder="e.g. Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-company">Company</FieldLabel>
                <Input
                  id="profile-company"
                  placeholder="e.g. Acme Corp"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={loading}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
              <Textarea
                id="profile-bio"
                placeholder="A short biography..."
                className="min-h-25 resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={loading}
              />
            </Field>

          </FieldGroup>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
