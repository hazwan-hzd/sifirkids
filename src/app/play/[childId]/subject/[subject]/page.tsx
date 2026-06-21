"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { CHILD_IDS, CHILD_GRADE } from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { getSubject } from "@/lib/modules";
import QuizRunner from "@/components/QuizRunner";

export default function SubjectPage({
  params,
}: {
  params: Promise<{ childId: string; subject: string }>;
}) {
  const { childId, subject: subjectKey } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const subject = getSubject(subjectKey);
  if (!subject) notFound();

  const grade = CHILD_GRADE[id];
  // A child can only open a subject offered for their grade.
  if (!subject.grades.includes(grade)) notFound();

  return <QuizRunner childId={id} subject={subject} grade={grade} />;
}
