"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ retry }: ErrorPageProps) {
  return <ErrorScreen onRetry={retry} />;
}
