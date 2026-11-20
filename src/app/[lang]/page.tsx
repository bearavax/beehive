import { Feed } from "@/components/feed";
import { cards, syncedAt } from "@/lib/data";

export default function HomePage() {
  return <Feed items={cards()} syncedAt={syncedAt} />;
}
