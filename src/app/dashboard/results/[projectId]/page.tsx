import { ResultsClient } from './results-client';

interface PageProps {
  params: {
    projectId: string;
  };
}

export default function ResultsPage({ params }: PageProps) {
  return (
    <ResultsClient projectId={params.projectId} />
  );
}
