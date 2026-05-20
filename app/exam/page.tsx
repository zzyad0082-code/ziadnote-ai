import dynamic from "next/dynamic";

const ExamClient = dynamic(() => import("./ExamClient"), {
  ssr: false,
});

export default function Page() {
  return <ExamClient />;
}
