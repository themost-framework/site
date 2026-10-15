---
index: 60
title: "Data Listeners"
summary: "Intercept entity flows before and after persistence to validate state and add business behavior cleanly."
category: "Event Model"
readingTime: "4 min read"
---

# Data Listeners

Data listeners intercept entity mutation lifecycles right before or directly after records reach persistence. This makes it possible to validate input, override values, or trigger side effects during the save pipeline.

```javascript
export function beforeSave(event, callback) {
  const target = event.target;

  if (target.email && target.email.endsWith('@dispostable.com')) {
    return callback(new Error('Temporary email domains are strictly blocked.'));
  }

  return callback();
}
```

## Practical value

Listeners provide a clean place for validation and cross-cutting behavior without coupling business logic to a storage implementation. They also help keep domain rules centralized rather than scattered across controllers or service methods.
