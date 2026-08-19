---
title: "Model Inheritance and Polymorphism"
summary: "Use inheritance to extend shared model behavior while preserving specialized data contracts for child entities."
category: "Model Design"
readingTime: "4 min read"
---

# Model Inheritance and Data Polymorphism

Object-oriented composition mechanisms map naturally to persistence layers using the declarative `inherits` configuration parameter. A subclass definition carries all parent columns automatically while adding unique attributes in an extended storage model.

```json
{
  "name": "Article",
  "id": 103,
  "inherits": "Post",
  "source": "Articles",
  "fields": [
    {
      "name": "editorNote",
      "type": "Text",
      "size": 500
    },
    {
      "name": "wordCount",
      "type": "Integer"
    }
  ]
}
```

## Why inheritance is useful

Inheritance keeps shared behavior centralized and makes specialized records easier to maintain. This is especially important in domain models where the base object is common, but child entities need unique attributes or validation logic.
