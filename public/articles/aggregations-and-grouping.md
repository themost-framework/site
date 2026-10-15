---
index: 70
title: "Aggregations and Grouping"
summary: "Summarize datasets with grouping and aggregate expressions that remain readable and portable."
category: "Analytics"
readingTime: "5 min read"
---

# Aggregations and Grouping

When combining operational vectors for counting, summary totals, or evaluating arithmetic averages, `@themost/data` handles backend groupings with a readable query pattern. The framework binds analytical projection clauses directly into JavaScript expressions.

```javascript
async function getAuthorStatsReport(context) {
  const stats = await context.model('Post')
    .asQueryable()
    .groupBy('authorId')
    .select(
      'authorId',
      x => Object.assign(x, {
        totalViews: minxs.sum(x.views),
        articleCount: minxs.count(x.id)
      })
    )
    .getItems();

  console.log('Author Statistics:', stats);
}
```

## Why it matters

Analytics use cases often require summary data, not just record-level retrieval. Grouping and aggregation let the application compute business signals without writing custom database-specific SQL paths for every report.
