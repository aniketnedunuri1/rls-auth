import { ResultsClient } from './results-client';

// Define the expected shape for props.
// Including searchParams (even if unused) satisfies Next.js's PageProps type.
export default async function ResultsPage({
  params,
  searchParams, 
}: {
  params: { projectId: string };
  searchParams: Record<string, string | string[]>;
}): Promise<JSX.Element> {
  return <ResultsClient projectId={params.projectId} />;
}