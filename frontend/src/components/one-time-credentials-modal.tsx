"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  clientId: string;
  clientSecret: string;
  title?: string;
  onDismiss: () => void;
};

export function OneTimeCredentialsModal({
  open,
  clientId,
  clientSecret,
  title = "Client credentials",
  onDismiss,
}: Props) {
  const [savedAck, setSavedAck] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(async (label: "id" | "secret", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cred-title"
    >
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-lg">
        <CardHeader>
          <CardTitle id="cred-title">{title}</CardTitle>
          <CardDescription>
            Copy both values now. For security, the client secret cannot be retrieved
            again after you close this dialog. You can rotate the secret later if you
            lose it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Client ID</FieldLabel>
            <div className="flex gap-2">
              <Input readOnly value={clientId} className="font-mono text-xs" />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copy("id", clientId)}
                    >
                      {copied === "id" ? "Copied" : "Copy"}
                    </Button>
                  }
                />
                <TooltipContent>Copy client ID</TooltipContent>
              </Tooltip>
            </div>
          </Field>
          <Field>
            <FieldLabel>Client secret</FieldLabel>
            <div className="flex gap-2">
              <Input readOnly value={clientSecret} className="font-mono text-xs" />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copy("secret", clientSecret)}
                    >
                      {copied === "secret" ? "Copied" : "Copy"}
                    </Button>
                  }
                />
                <TooltipContent>Copy client secret</TooltipContent>
              </Tooltip>
            </div>
          </Field>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <input
              id="cred-saved"
              type="checkbox"
              checked={savedAck}
              onChange={(e) => setSavedAck(e.target.checked)}
              className="mt-1 size-4 rounded border border-input"
            />
            <Label htmlFor="cred-saved" className="text-sm leading-snug">
              I have stored these credentials in a safe place.
            </Label>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="button" disabled={!savedAck} onClick={onDismiss}>
            Done
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
