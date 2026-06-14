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

  const [membershipResult, questionCountResult] = await Promise.all([
    supabase
      .from("space_members")
      .select("space_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("question_bank")
      .select("question_index", { count: "exact", head: true }),
  ]);
  const membership = membershipResult.data;

  if (!membership) {
    redirect("/onboarding");
  }

  const { count: questionCount, error: countError } = questionCountResult;

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
    const imagePaths = answers
      .map((answer) => answer.image_url)
      .filter((path): path is string => Boolean(path));
    const [profileResult, signedImageResult] = await Promise.all([
      userIds.length
        ? supabase
            .from("profiles")
            .select("id, nickname, avatar_url")
            .in("id", userIds)
        : Promise.resolve({ data: [] }),
      imagePaths.length
        ? supabase.storage
            .from("record-images")
            .createSignedUrls(imagePaths, 60 * 60)
        : Promise.resolve({ data: [] }),
    ]);
    const profileData = profileResult.data;
    const signedImages = new Map(
      (signedImageResult.data ?? []).map((image) => [
        image.path,
        image.signedUrl,
      ]),
    );
    const profiles = new Map(
      ((profileData ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile,
      ]),
    );

    revealedAnswers = answers.map((answer) => {
        const profile = profiles.get(answer.user_id);

        return {
          id: answer.id,
          userId: answer.user_id,
          authorName: profile?.nickname ?? "留白用户",
          avatarUrl: profile?.avatar_url ?? null,
          answer: answer.answer,
          imageUrl: answer.image_url
            ? signedImages.get(answer.image_url) ?? null
            : null,
          createdAt: answer.created_at,
        };
      });
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
