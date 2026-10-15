---
index: 10
title: "Connection and Data Context"
summary: "Understand the DataContext lifecycle and why every database operation starts from a managed connection scope."
category: "Core Data Layer"
readingTime: "4 min read"
---

# Connection and Data Context

Every database operation in `@themost/data` requires an active `DataContext`. This object manages your database connection lifecycle and acts as the central gateway to your application models.

To prevent memory issues or hung socket connections, a context must always be finalized at the end of its operational execution loop.

```javascript
import { FreedomDataContext } from '@themost/data';

async function connectToDatabase() {
  const context = new FreedomDataContext();

  try {
    console.log('Database context initialized successfully!');
  } catch (error) {
    console.error('Connection scope error:', error.message);
  } finally {
    await context.finalizeAsync();
  }
}
```

## Why it matters

The `DataContext` is the runtime boundary for your data access. It is responsible for:

- opening and managing the database connection
- exposing model references and query APIs
- coordinating save and transaction behavior
- releasing resources cleanly when work completes

In short, the context is the foundation on which all data operations are built.
