import MatchDetailClient from '../../../components/MatchDetailClient';

export default async function MatchDetailPage({ params }) {
  const { id } = await params;
  return <MatchDetailClient id={id} />;
}
