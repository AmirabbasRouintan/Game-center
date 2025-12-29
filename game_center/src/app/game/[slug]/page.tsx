import games from "@/data/games";
import { notFound } from "next/navigation";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return games.map((g) => ({ slug: g.slug }));
}

export default function GameDetailsPage({ params }: Props) {
  const { slug } = params;
  const game = games.find((g) => g.slug === slug);
  if (!game) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-bold">{game.title}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{game.genre}</p>

      <section className="mt-6 space-y-2">
        <p>{game.description}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Score: {game.score}/100</p>
        <a href="/trending" className="text-sm text-blue-600 hover:underline">Back to Trending</a>
      </section>
    </main>
  );
}
