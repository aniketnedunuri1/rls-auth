import { ResultsClient } from './results-client';

// Define the expected shape for props.
// Renaming searchParams to _searchParams signals it's not used.
export default async function ResultsPage({
  params,
  searchParams: _searchParams,
}: {
  params: { projectId: string };
  searchParams: Record<string, string | string[]>;
}): Promise<JSX.Element> {
  return <ResultsClient projectId={params.projectId} />;
}