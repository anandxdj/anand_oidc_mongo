"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const STEPS = ["Your name", "Email", "Password", "Review"] as const;

function passwordRuleMessage() {
  return "At least 8 characters, one uppercase letter, and one digit.";
}

function validatePassword(value: string): string | null {
  if (value.length < 8) return passwordRuleMessage();
  if (!/(?=.*[A-Z])(?=.*\d)/.test(value)) return passwordRuleMessage();
  return null;
}

function passwordStrengthScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s += 25;
  if (pw.length >= 12) s += 15;
  if (/[A-Z]/.test(pw)) s += 15;
  if (/[a-z]/.test(pw)) s += 10;
  if (/\d/.test(pw)) s += 15;
  if (/[^A-Za-z0-9]/.test(pw)) s += 20;
  return Math.min(100, s);
}

export function RegisterForm() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  /** Step index where user last clicked Continue / Create and validation failed — field errors show only then. */
  const [blameStep, setBlameStep] = useState<number | null>(null);

  const nameError = useMemo(() => {
    if (!name.trim()) return "Name is required.";
    if (name.trim().length < 2 || name.trim().length > 50) {
      return "Name must be between 2 and 50 characters.";
    }
    return null;
  }, [name]);

  const emailError = useMemo(() => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address.";
    }
    return null;
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password.trim()) return "Password is required.";
    return validatePassword(password);
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirmPassword.trim()) return "Confirm your password.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return null;
  }, [confirmPassword, password]);

  const strength = useMemo(() => passwordStrengthScore(password), [password]);

  const canAdvanceFromStep0 = !nameError;
  const canAdvanceFromStep1 = !emailError;
  const canAdvanceFromStep2 = !passwordError && !confirmError;

  const goNext = () => {
    setFormError(null);
    if (step === 0 && !canAdvanceFromStep0) {
      setBlameStep(0);
      return;
    }
    if (step === 1 && !canAdvanceFromStep1) {
      setBlameStep(1);
      return;
    }
    if (step === 2 && !canAdvanceFromStep2) {
      setBlameStep(2);
      return;
    }
    setBlameStep(null);
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setFormError(null);
    setBlameStep(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setFormError(null);
    if (!termsAccepted) {
      setBlameStep(3);
      return;
    }
    setBlameStep(null);
    if (!canAdvanceFromStep2 || nameError || emailError) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "customer",
        termsAccepted: true,
      };
      if (country.trim().length === 2) {
        body.country = country.trim().toUpperCase();
      }
      const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: unknown;
      };
      if (!res.ok || json.success === false) {
        setFormError(json.message ?? "Registration failed.");
        return;
      }
      setSuccessMessage(
        json.message ??
          "Registration successful. Check your email to verify your account.",
      );
    } catch {
      setFormError(
        "Could not reach the server. Is the API running and NEXT_PUBLIC_API_URL set?",
      );
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>{successMessage}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex text-center no-underline",
            )}
          >
            Go to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <Badge
              key={label}
              variant={i === step ? "default" : "secondary"}
              className="h-auto rounded-full px-3 py-1 font-normal"
            >
              <span className="me-1.5 tabular-nums opacity-70">{i + 1}</span>
              {label}
            </Badge>
          ))}
        </div>
        <CardTitle className="mt-2">Create your account</CardTitle>
        <CardDescription>
          A few quick steps — then verify your email before you sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formError ? (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </div>
        ) : null}

        {step === 0 ? (
          <FieldGroup>
            <Field data-invalid={blameStep === 0 && !!nameError}>
              <FieldLabel htmlFor="reg-name">Full name</FieldLabel>
              <Input
                id="reg-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                aria-invalid={blameStep === 0 && !!nameError}
              />
              {blameStep === 0 && nameError ? (
                <FieldError>{nameError}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
        ) : null}

        {step === 1 ? (
          <FieldGroup>
            <Field data-invalid={blameStep === 1 && !!emailError}>
              <FieldLabel htmlFor="reg-email">Email</FieldLabel>
              <Input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={blameStep === 1 && !!emailError}
              />
              {blameStep === 1 && emailError ? (
                <FieldError>{emailError}</FieldError>
              ) : null}
              <FieldDescription>You&apos;ll use this to sign in.</FieldDescription>
            </Field>
          </FieldGroup>
        ) : null}

        {step === 2 ? (
          <FieldGroup>
            <Field data-invalid={blameStep === 2 && !!passwordError}>
              <FieldLabel htmlFor="reg-password">Password</FieldLabel>
              <Input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={blameStep === 2 && !!passwordError}
              />
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${strength}%` }}
                />
              </div>
              <FieldDescription>{passwordRuleMessage()}</FieldDescription>
              {blameStep === 2 && passwordError ? (
                <FieldError>{passwordError}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={blameStep === 2 && !!confirmError}>
              <FieldLabel htmlFor="reg-confirm">Confirm password</FieldLabel>
              <Input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={blameStep === 2 && !!confirmError}
              />
              {blameStep === 2 && confirmError ? (
                <FieldError>{confirmError}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
        ) : null}

        {step === 3 ? (
          <FieldGroup className="gap-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">Name</span>{" "}
                <span className="font-medium text-foreground">{name.trim()}</span>
              </p>
              <p className="mt-2">
                <span className="text-muted-foreground">Email</span>{" "}
                <span className="font-medium text-foreground">{email.trim().toLowerCase()}</span>
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="reg-country">Country (optional)</FieldLabel>
              <Input
                id="reg-country"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="US"
                maxLength={2}
                className="max-w-[6rem] font-mono uppercase"
              />
              <FieldDescription>Two-letter ISO code, if you want to share it.</FieldDescription>
            </Field>
            <div className="flex items-start gap-3">
              <Checkbox
                id="reg-terms"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(v === true)}
                className="mt-1"
                aria-invalid={blameStep === 3 && !termsAccepted}
              />
              <label htmlFor="reg-terms" className="cursor-pointer text-sm leading-snug">
                I agree to the terms of this identity service and understand how my data will be
                used to operate sign-in and security features.
              </label>
            </div>
            {blameStep === 3 && !termsAccepted ? (
              <FieldError>You must accept the terms to create your account.</FieldError>
            ) : null}
          </FieldGroup>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={goBack} disabled={loading}>
              Back
            </Button>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex text-center no-underline",
              )}
            >
              Already have an account?
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {step < 3 ? (
            <Button type="button" onClick={goNext} disabled={loading}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
