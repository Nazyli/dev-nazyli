"use client";

import dynamic from "next/dynamic";

const SpaceScene = dynamic(
  () => import("./SpaceScene").then((m) => m.SpaceScene),
  { ssr: false, loading: () => null }
);

export function SpaceSceneDynamic() {
  return <SpaceScene />;
}
