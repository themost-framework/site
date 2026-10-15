---
index: 20
title: "Basic Data Retrieval"
summary: "Use the fluent query API to fetch, filter, sort, and shape records with readable JavaScript patterns."
category: "Querying"
readingTime: "5 min read"
---

# Basic Data Retrieval

Data fetching is initiated by calling `.asQueryable()` on any registered data model reference. `@themost/data` exposes a powerful, type-agnostic fluent API that resembles LINQ query patterns.

This allows developers to chain clear modifiers like `.where()`, `.select()`, and `.orderBy()` to dynamically formulate execution logic.

```javascript
async function fetchActiveUsers(context) {
  const users = await context.model('User')
    .asQueryable()
    .where('isActive').equal(true)
    .orderBy('lastName')
    .select('id', 'username', 'email')
    .getItems();

  console.log('Active Profiles:', users);
}
```

## Query fluency

The fluent API keeps the intent readable and close to the business logic. Instead of mixing SQL strings across the application, you express operations as a pipeline:

- filter rows
- add selection criteria
- order results
- fetch only what you need

This is one of the main reasons the framework feels maintainable at scale.
