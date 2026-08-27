"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function GradedExamReportPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  useEffect(() => {
    if (examId) {
      router.replace(`/exams/${examId}`);
    }
  }, [examId, router]);

  return null;
}
