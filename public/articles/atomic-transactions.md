---
index: 50
title: "Atomic Transactions"
summary: "Protect dependent data updates with transaction boundaries that roll back cleanly on failure."
category: "Data Integrity"
readingTime: "4 min read"
---

# Atomic Transactions

When implementing multi-step mutation pipelines where multiple writes are dependent, wrapping instructions inside a structured transaction block is mandatory. The framework-level `executeInTransaction` loop guarantees automated rollback if any child operation fails.

```javascript
async function processOrderTransaction(context, orderPayload, itemPayload) {
  try {
    await context.db.executeInTransaction(async () => {
      await context.model('Order').save(orderPayload);
      await context.model('OrderItem').save(itemPayload);
    });

    console.log('Transaction safely committed to the database!');
  } catch (error) {
    console.error('Transaction failed. Database rolled back cleanly:', error.message);
  }
}
```

## Why transactions matter

Transactions preserve consistency across dependent updates. If one save fails, the earlier state is rolled back so the system does not end up half-written.

For business-critical flows such as order processing, payments, or record migrations, this is essential.
