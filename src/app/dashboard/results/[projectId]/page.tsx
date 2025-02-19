import { ResultsClient } from './results-client';

interface ResultsPageProps {
  params: { projectId: string };
  searchParams: Record<string, string | string[]>;
}

export default async function ResultsPage({
  params,
  searchParams: _searchParams,
}: ResultsPageProps): Promise<JSX.Element> {
  return <ResultsClient projectId={params.projectId} />;
}