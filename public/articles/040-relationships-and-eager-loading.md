---
title: "Relationships and Eager Loading"
summary: "Load related records intentionally with expansion rules that keep data retrieval efficient and expressive."
category: "Relationships"
readingTime: "5 min read"
---

# Relationships and Eager Loading

To balance network optimization with fast lookups, foreign key model relationships are evaluated lazily. When a record needs to load together with its parent or nested collections, it must be declared via the `.expand()` expression method.

```javascript
async function getPostsWithAuthors(context) {
  const articles = await context.model('Post')
    .asQueryable()
    .where('published').equal(true)
    .expand('author')
    .getItems();

  console.dir(articles, { depth: null });
}
```

## The value of expansion

Expansion lets the application request related entities in the same data fetch. This keeps the result set coherent and reduces the need for a second query cycle.

For domain-heavy apps, this is a huge win: it preserves object relationships while keeping reads efficient and predictable.
