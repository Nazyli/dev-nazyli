"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";
import "./globals.css";
import { fontVariables } from "./fonts";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function GlobalError({ retry }: GlobalErrorProps) {
  return (
    <html lang="en" className={`${fontVariables} antialiased`}>
      <head>
        <title>Signal interrupted · Evry Nazyli</title>
      </head>
      <body className="min-h-dvh bg-void text-starlight">
        <ErrorScreen onRetry={retry} />
      </body>
    </html>
  );
}
