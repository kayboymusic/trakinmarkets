import { Header } from "@/components/shell/header";
import { FeedList } from "@/components/feed/feed-list";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-6">
        <FeedList />
      </main>
    </div>
  );
}
