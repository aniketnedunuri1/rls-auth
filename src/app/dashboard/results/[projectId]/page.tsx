import { ResultsClient } from './results-client';

export default function ResultsPage({ params }: { params: { projectId: string } }) {
  return <ResultsClient projectId={params.projectId} />;
}