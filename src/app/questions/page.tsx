import { redirect } from "next/navigation";
import {
  QuestionView,
  type RevealedAnswer,
} from "@/components/question-view";
import {
  formatQuestionDate,
  getDailyQuestionIndex,
  getQuestionDateKey,
} from "@/lib/daily-question";
import { createClient } from "@/lib/supabase/server";

type QuestionAnswerRow = {
  id: string;
  user_id: string;
  answer: string;
  image_url: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export default async function QuestionsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect("/auth");
  }

  const { data: membership } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { count: questionCount, error: countError } = await supabase
    .from("question_bank")
    .select("question_index", { count: "exact", head: true });

  if (countError || !questionCount) {
    return (
      <QuestionView
        question={null}
        questionIndex={0}
        questionDate={formatQuestionDate()}
        spaceId={membership.space_id}
        userId={userId}
        currentUserAnswered={false}
        answerCount={0}
        memberCount={0}
        revealedAnswers={[]}
        loadError="今日问题尚未部署，请先执行最新的 Supabase migration。"
      />
    );
  }

  const questionIndex = getDailyQuestionIndex(questionCount);
  const questionDateKey = getQuestionDateKey();
  const [{ data: question }, { data: statusRows, error: statusError }] =
    await Promise.all([
      supabase
        .from("question_bank")
        .select("question")
        .eq("question_index", questionIndex)
        .single(),
      supabase.rpc("get_question_answer_status", {
        target_question_index: questionIndex,
      }),
    ]);

  const status = statusRows?.[0];
  const isRevealed = (status?.answer_count ?? 0) >= 2;
  let revealedAnswers: RevealedAnswer[] = [];

  if (isRevealed) {
    const { data: answerData } = await supabase
      .from("question_answers")
      .select("id, user_id, answer, image_url, created_at")
      .eq("space_id", membership.space_id)
      .eq("question_index", questionIndex)
      .eq("answer_date", questionDateKey)
      .order("created_at", { ascending: true });
    const answers = (answerData ?? []) as QuestionAnswerRow[];
    const userIds = answers.map((answer) => answer.user_id);
    const { data: profileData } = userIds.length
      ? await supabase
          .from("profiles")
          .select("id, nickname, avatar_url")
          .in("id", userIds)
      : { data: [] };
    const profiles = new Map(
      ((profileData ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile,
      ]),
    );

    revealedAnswers = await Promise.all(
      answers.map(async (answer) => {
        const profile = profiles.get(answer.user_id);
        let imageUrl: string | null = null;

        if (answer.image_url) {
          const { data: signedImage } = await supabase.storage
            .from("record-images")
            .createSignedUrl(answer.image_url, 60 * 60);
          imageUrl = signedImage?.signedUrl ?? null;
        }

        return {
          id: answer.id,
          userId: answer.user_id,
          authorName: profile?.nickname ?? "留白用户",
          avatarUrl: profile?.avatar_url ?? null,
          answer: answer.answer,
          imageUrl,
          createdAt: answer.created_at,
        };
      }),
    );
  }

  return (
    <QuestionView
      question={question?.question ?? null}
      questionIndex={questionIndex}
      questionDate={formatQuestionDate()}
      spaceId={membership.space_id}
      userId={userId}
      currentUserAnswered={status?.current_user_answered ?? false}
      answerCount={status?.answer_count ?? 0}
      memberCount={status?.member_count ?? 0}
      revealedAnswers={revealedAnswers}
      loadError={
        statusError
          ? "今日问题尚未部署，请先执行最新的 Supabase migration。"
          : null
      }
    />
  );
}
