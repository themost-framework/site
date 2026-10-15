---
index: 120
title: "Model Inheritance and Relationships"
summary: "See how @themost/test connects entity types with inheritance and relationships, then exposes the model as queryable OData metadata."
category: "Data Modelling"
readingTime: "6 min read"
---

# Model Inheritance and Relationships

A domain becomes useful when its entities can describe how things fit together. Inheritance captures shared meaning between types. Relationships connect separate entities so an application can navigate the domain without rebuilding joins by hand.

The [`@themost/test`](https://github.com/themost-framework/test) project includes both patterns in a small, inspectable application. Its model classes use `@themost/data` mappings, while the test API server publishes the resulting model as an OData v4 service.

## Inheritance describes specialization

The sample models use a straightforward hierarchy:

```js
@EdmMapping.entityType('Account')
class Account extends Thing {
  constructor() {
    super()
  }
}

@EdmMapping.entityType('User')
class User extends Account {
  constructor() {
    super()
  }
}
```

`Account` inherits the common properties of `Thing`. `User` then specializes `Account` with user-specific state and behavior, including a `getMe()` function and credential validation in the test server.

This gives consumers a coherent contract. A user can be treated as an account when shared behavior is enough, or as a user when the application needs authentication and group membership. The model hierarchy carries that distinction into generated metadata and documentation.

## Relationships make navigation explicit

The sample also models membership relationships. A `User` exposes a `groups` collection, and a `Group` exposes its `members`. These properties describe the domain directly:

```js
@EdmMapping.entityType('User')
class User extends Account {
  // groups: Group[]
}

@EdmMapping.entityType('Group')
class Group extends Account {
  // members: Account[]
}
```

The exact storage representation can remain an implementation detail. At the model boundary, callers work with meaningful names such as `groups` and `members`. This is easier to understand than carrying foreign-key conventions through every part of an application.

Relationships also give the query layer enough information to support related data retrieval. For example, an application can request a user and choose whether to include related groups, depending on what the screen or workflow needs. Keeping that choice in the query avoids loading every relationship by default.

## Inspect the generated contract

When `@themost/test` starts, it creates an `ExpressDataApplication` and exposes the model layer through `/api/`. The server provides a metadata document at `/api/$metadata` and browser-friendly schema documentation at `/api/docs`.

You can inspect the metadata with curl:

```bash
curl http://localhost:3000/api/\$metadata \
  -H 'Accept: application/xml'
```

The document contains entity types and entity sets derived from the configured models. It is a useful modelling check: if an entity, inherited attribute, or relationship is not represented as expected, the model configuration should be corrected before client code is built around it.

The test server's documentation route also lists model inheritance. Its model view displays whether a type inherits from or implements another type, which makes the structure easy to verify without reading every source file.

## Query related data at the API boundary

The same model contract is available to API consumers through OData query options. A simple product request from the test project looks like this:

```bash
curl 'http://localhost:3000/api/Products?%24select=category%2Cprice%2Cmodel%2Cname' \
  -H 'Authorization: Bearer <access-token>'
```

The client asks for fields from the `Product` model, not columns from a particular SQLite table. That distinction is what lets the framework keep domain naming stable while adapters and storage evolve underneath it.

## Keep relationships purposeful

A relationship should describe a real business connection and have a clear direction. Before adding one, ask:

- Is this a one-to-one, one-to-many, or many-to-many concept?
- Which side owns the lifecycle or association?
- Should the related collection be loaded for every use case, or only on demand?
- Does the relationship name read naturally in application code?

The `User` and `Group` example is useful because it represents a real membership concept. It also demonstrates why a model is more than a list of fields: it is a navigable description of the domain.

## Model first, storage second

Inheritance and relationships are most effective when they are designed from the business vocabulary outward. Start with the entities and connections that users recognize, then map those concepts to storage and API behavior. With `@themost/test`, you can run that model immediately, inspect its metadata, and exercise it through real queries.

For more examples, explore the [`server/models`](https://github.com/themost-framework/test/tree/master/modules/test/server/models) directory and the [`@themost/test` README](https://github.com/themost-framework/test/blob/master/README.md). They show how a model-driven application can serve both as a production architecture and as a dependable test fixture.
