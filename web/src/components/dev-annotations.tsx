"use client";

import dynamic from "next/dynamic";

const Agentation = dynamic(
  () => import("agentation").then((module) => module.Agentation),
  { ssr: false },
);

/**
 * Click-to-annotate overlay. Runs only in dev: the annotations are meant to be
 * handed straight to the coding agent, not shipped to restaurants.
 */
export function DevAnnotations() {
  if (process.env.NODE_ENV !== "development") return null;

  const endpoint = process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT;
  return endpoint ? <Agentation endpoint={endpoint} /> : <Agentation />;
}
