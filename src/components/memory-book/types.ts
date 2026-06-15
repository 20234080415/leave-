export type MemoryBookRecord = {
  id: string;
  authorName: string;
  content: string;
  mood: string | null;
  weather: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export type MemoryBookWish = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  steps: {
    id: string;
    content: string;
    isDone: boolean;
  }[];
};

export type MemoryBookChapterData = {
  id: "spring" | "summer" | "autumn" | "winter";
  title: string;
  subtitle: string;
  records: MemoryBookRecord[];
  wishes: MemoryBookWish[];
  photos: {
    id: string;
    url: string;
    caption: string;
  }[];
};
