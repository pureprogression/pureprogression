import { ARTICLES_BY_SLUG } from "./articlesData";

export { ARTICLES_BY_SLUG };

export function getArticlesList() {
  return Object.values(ARTICLES_BY_SLUG).map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    titleEn: article.titleEn,
    excerpt: article.excerpt,
    excerptEn: article.excerptEn,
    category: article.category,
    categoryEn: article.categoryEn,
    readTime: article.readTime,
    date: article.date,
    isPremium: article.isPremium,
    image: article.image,
  }));
}

export function getArticlesForDisplay() {
  return Object.values(ARTICLES_BY_SLUG)
    .map((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      titleEn: article.titleEn,
      excerpt: article.excerpt,
      excerptEn: article.excerptEn,
      category: article.category,
      categoryEn: article.categoryEn,
      readTime: article.readTime,
      date: article.date,
      isPremium: article.isPremium,
      image: article.image,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getArticleBySlug(slug) {
  return ARTICLES_BY_SLUG[slug] || null;
}

export function getFeaturedArticles(limit = 2) {
  const prioritySlugs = ["build-first-workout", "how-to-start-training"];
  const all = getArticlesForDisplay();
  const priority = prioritySlugs
    .map((slug) => all.find((a) => a.slug === slug))
    .filter(Boolean);
  const rest = all.filter((a) => !prioritySlugs.includes(a.slug));
  return [...priority, ...rest].slice(0, limit);
}
