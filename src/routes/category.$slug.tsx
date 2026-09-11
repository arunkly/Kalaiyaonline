import { createFileRoute } from "@tanstack/react-router";
import { articleHasCategory, byLatest } from "@/data/articles";
import { ArticleCard } from "@/components/article-card";
import { useEdition } from "@/lib/edition";
import { categoryLabel, useCategories } from "@/lib/use-categories";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const cats = useCategories();
  const edition = useEdition();
  const items = edition
    .filter((a) => articleHasCategory(a, slug, categoryLabel(cats, slug)))
    .sort(byLatest);

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.22em] text-crimson">विभाग</p>
      <h1 className="mt-2 font-display text-4xl">{categoryLabel(cats, slug)}</h1>
      <p className="mt-2 text-sm text-muted">{items.length} रिपोर्ट</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
