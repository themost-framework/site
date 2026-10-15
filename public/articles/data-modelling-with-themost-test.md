---
index: 110
title: "Data Modelling with @themost/test"
summary: "Use the @themost/test API server as a practical learning environment for modelling entities, attributes, and business domains with @themost-framework."
category: "Data Modelling"
readingTime: "6 min read"
---

# Data Modelling with @themost/test

A good data model gives an application a stable vocabulary. Instead of scattering table names and storage details throughout the codebase, you describe the business objects your application understands and let the framework expose them consistently.

The [`@themost/test`](https://github.com/themost-framework/test) package is a useful place to explore these ideas. It ships a runnable test API server, a temporary SQLite database, and a small CRM-style domain with customers, products, offers, and orders. You can install it without creating a complete application first:

```bash
npm install @themost/test
npx @themost/test
```

The server exposes the model layer through an OData v4 API. That makes the model visible both in application code and at the HTTP boundary.

## Start with domain objects

The test project defines model classes under `modules/test/server/models`. A model class represents an entity type and can carry the relationships and behavior that belong to that entity. The `Thing` model is a useful base for common descriptive fields such as `name`, `description`, `url`, and audit dates:

```js
import { DataObject, EdmMapping } from '@themost/data'

@EdmMapping.entityType('Thing')
class Thing extends DataObject {
  constructor() {
    super()
  }
}
```

The `@EdmMapping.entityType()` decorator gives the class a public entity type name. The model can then participate in schema loading, querying, and OData metadata generation.

This separation is valuable because the class describes the domain while the configured data adapter handles persistence. A caller works with a `Thing` model rather than having to know which table, connection, or SQL dialect stores it.

## Reuse meaning through inheritance

The test server builds a small inheritance chain:

```text
Thing
  └── Account
        └── User
```

`Account` extends `Thing`, and `User` extends `Account`. This means shared identity and descriptive attributes can live in one place while specialized models add only what they need. `User` can add authentication-oriented fields such as `enabled`, `lastLogon`, and `logonCount` without duplicating the base account definition.

Inheritance is most useful when the relationship is semantic, not merely convenient. A `User` really is a specialized `Account`, so the hierarchy communicates something meaningful to the rest of the application. If two objects only happen to share a few columns, a reusable model definition or a relationship may be clearer than inheritance.

## Let the model drive queries

Once an application has a configured `DataContext`, it can query a model by name. The query expresses what the application wants and remains independent of the underlying provider:

```js
const users = await context.model('User')
  .select('id', 'name', 'enabled')
  .where('enabled').equal(true)
  .orderBy('name')
  .getItems()
```

The important detail is that the query starts from the model and its attributes. It does not need to embed a table name or manually assemble a SQL statement. That gives the application a consistent query language as the domain grows and makes provider changes less invasive.

## A model is a contract

A model should answer a few practical questions clearly:

- What does this entity represent?
- Which attributes are required to identify and describe it?
- Which other entities does it relate to?
- Which rules belong to the entity or its lifecycle?
- Which parts should be shared with a base model?

The `@themost/test` project is deliberately approachable because its model classes, configuration, and database can be inspected together. Start with the model definitions, run the server, and compare the code with the generated API metadata. That feedback loop turns modelling from an abstract exercise into something you can query and verify.

## Next steps

Run the test API server and open its schema documentation at `/api/docs`. The generated model list shows entity types and their inheritance relationships. You can also request the machine-readable metadata document at `/api/$metadata`.

The [@themost/test repository](https://github.com/themost-framework/test) is a practical companion to the framework: it provides a known domain, real queries, and a working API surface while you learn how models become application behavior.
