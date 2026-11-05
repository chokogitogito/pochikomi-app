import SurveyFlow from "@/components/survey/SurveyFlow";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return <SurveyFlow storeId={storeId} />;
}
