"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientFetch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function CreateProjectWizard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const nameErr =
    !name.trim() ? "Project name is required." : name.trim().length > 120
      ? "Max 120 characters."
      : null;
  const agreedErr = !agreed ? "You must confirm the policies to create a project." : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowErrors(true);
    if (nameErr || agreedErr) return;
    setLoading(true);
    try {
      const res = await clientFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim(),
          description: description.trim(),
          supportEmail: supportEmail.trim(),
          agreedPolicies: true,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: { _id?: string };
      };
      if (!res.ok || json.success === false) {
        const msg = json.message ?? "Could not create project.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Project created.");
      const id = json.data?._id;
      setShowErrors(false);
      if (id) router.push(`/projects/${id}`);
      else router.push("/projects");
      router.refresh();
    } catch {
      const msg = "Network error. Is the API running?";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project details</CardTitle>
        <CardDescription>
          Use names your team will recognize. Support email is optional and may be shown
          in internal tooling only.
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Could not create project</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <Field data-invalid={showErrors && !!nameErr}>
              <FieldLabel htmlFor="proj-name">Project name</FieldLabel>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My product"
                disabled={loading}
                aria-invalid={showErrors && !!nameErr}
              />
              {showErrors && nameErr ? <FieldError>{nameErr}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="proj-company">Company or team (optional)</FieldLabel>
              <Input
                id="proj-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="proj-desc">Description (optional)</FieldLabel>
              <Input
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this project is for"
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="proj-support">Support email (optional)</FieldLabel>
              <Input
                id="proj-support"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                disabled={loading}
              />
            </Field>
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-muted/30 p-4",
                showErrors && agreedErr ? "border-destructive" : "border-border",
              )}
            >
              <input
                id="proj-policies"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 size-4 rounded border border-input"
                disabled={loading}
                aria-invalid={showErrors && !!agreedErr}
              />
              <div className="grid gap-1">
                <Label htmlFor="proj-policies" className="text-sm font-medium leading-snug">
                  I confirm redirect URI and security policies for this project.
                </Label>
                <FieldDescription>
                  You are responsible for registering only trusted redirect URIs and
                  rotating client secrets when needed.
                </FieldDescription>
                {showErrors && agreedErr ? (
                  <FieldError className="mt-1">{agreedErr}</FieldError>
                ) : null}
              </div>
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2">
          <Link
            href="/projects"
            className={cn(buttonVariants({ variant: "outline" }), "no-underline")}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create project"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
