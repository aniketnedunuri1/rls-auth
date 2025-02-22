"use client";

import React from "react";
import { ResultsClient } from "./results-client";

interface PageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export default function ResultsPage({ 
  params,
  searchParams
}: PageProps) {
  const resolvedParams = React.use(params);
  const _resolvedSearchParams = React.use(searchParams);
  return <ResultsClient projectId={resolvedParams.projectId} />;
}
