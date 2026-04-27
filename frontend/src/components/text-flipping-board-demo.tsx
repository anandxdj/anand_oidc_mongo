"use client";
import React, { useState, useEffect, useCallback } from "react";
import { TextFlippingBoard } from "@/components/ui/text-flipping-board";

const MESSAGES: string[] = [
  "OpenID Connect\n· discovery · JWKS",
  "OAuth clients\nredirect URIs · secrets",
  "Authorization code\n· consent · tokens",
  "Projects console\nmanage it all in one place",
  "Standards-first identity\nfor your next app",
];

export default function TextFlippingBoardDemo() {
  const [msgIdx, setMsgIdx] = useState(0);

  const next = useCallback(
    () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
    [],
  );

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-8 py-6 sm:py-8">
      <TextFlippingBoard text={MESSAGES[msgIdx]} />
    </div>
  );
}
