---
index: 90
title: "Model Associations"
summary: "Model one-to-many and many-to-many relationships with declarative field configuration and implicit joins."
category: "Relations"
readingTime: "5 min read"
---

# Model Associations

Declaring relational architecture fields is done within the schema definition by matching a field `type` to a target model object token. This can represent a single foreign reference or a many-to-many collection through an implicit junction relationship.

```json
{
  "name": "Order",
  "id": 102,
  "source": "Orders",
  "fields": [
    {
      "name": "id",
      "type": "Counter",
      "primary": true
    },
    {
      "name": "customer",
      "type": "User",
      "nullable": false,
      "description": "Establishes a many-to-one foreign key mapping to the User model"
    },
    {
      "name": "tags",
      "type": "Tag",
      "many": true,
      "description": "Creates an implicit many-to-many junction relationship table"
    }
  ]
}
```

## Why associations matter

Most real systems have relationships, not isolated records. Modeling associations cleanly helps keep domain logic accurate while still allowing the runtime to translate these relationships into underlying storage constructs.
