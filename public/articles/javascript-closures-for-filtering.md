---
index: 30
title: "JavaScript Closures for Filtering"
summary: "Use native JavaScript predicates inside queries to express secure, readable filters without writing manual SQL."
category: "Querying"
readingTime: "4 min read"
---

# JavaScript Closures for Filtering

A standout feature of `@themost/data` is its ability to parse native JavaScript arrow functions inside a `.where()` constraint. The runtime analyzes the closure and converts it into a parameterized query plan.

```javascript
async function filterWithClosures(context) {
  const premiumArticles = await context.model('Post')
    .asQueryable()
    .where(x => x.isPremium === true && x.views > 1000 && x.title.includes('Node'))
    .getItems();

  console.log('Filtered Premium Posts:', premiumArticles);
}
```

## Why closures are useful

This pattern keeps filtering logic close to the model and easy to read. It preserves the developer experience of writing plain JavaScript while still letting the framework translate the expression to a secure underlying query.

This is a strong example of the model-first design: behavior is explicit, but storage details remain abstracted.
