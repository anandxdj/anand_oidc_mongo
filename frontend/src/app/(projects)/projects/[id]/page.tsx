import { ProjectDashboard } from "./project-dashboard";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProjectDashboard projectId={id} />;
}
