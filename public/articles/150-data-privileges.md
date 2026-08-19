---
title: "Data Privileges"
summary: "Learn the basics of model-level access rules in @themost/data using global, account, and self privileges."
category: "Security"
readingTime: "4 min read"
---

# Data Privileges

A model should describe not only what data looks like, but also who can access it. In `@themost/data`, privileges are declared in the model schema and define which users or accounts can perform operations on an entity.

A simple privilege definition looks like this:

```json
{
  "privileges": [
    {
      "mask": 15,
      "type": "global"
    }
  ]
}
```

Keeping access rules near the model makes them easier to understand and reuse. API routes, background jobs, and other callers can use the same model contract instead of each implementing a different permission check.

## The privilege mask

The `mask` value describes the operations granted by the privilege. It is represented as a number so several operation permissions can be combined in one rule.

The exact mask values depend on the framework's permission definitions, but the important starting point is simple: a larger combined mask can grant several operations, while a smaller mask can grant a narrower capability. Existing schemas commonly use `15` for broad administrative access and `1` for a restricted rule.

Treat the mask as part of the schema contract. Prefer the framework's named permission constants or the conventions used by your application when defining new rules, rather than scattering unexplained numbers through application code.

## Global access

A `global` privilege applies across the model without limiting access to a particular account or record:

```json
{
  "mask": 15,
  "type": "global"
}
```

This is useful for system-wide defaults. For example, a model might allow general access to authenticated users while using a more specific account or self rule for sensitive operations.

Global does not necessarily mean anonymous. Authentication and the model's privilege rules work together. The application still decides whether a request has an authenticated user and then evaluates which privileges that user can use.

## Account-specific access

A privilege can target an account by including the `account` property:

```json
{
  "mask": 15,
  "type": "global",
  "account": "Administrators"
}
```

This grants the specified operations to members of the `Administrators` account. Account-based rules are useful for roles such as administrators, editors, support agents, or managers.

The account name is part of your application's authorization vocabulary. Keep those names consistent with the accounts configured in the application, and avoid relying on a role name that exists only in one controller or route.

## Self-level access

A `self` privilege limits access to records related to the current user:

```json
{
  "mask": 1,
  "type": "self",
  "filter": "customer/user eq me()"
}
```

This pattern appears in the `Order` schema from [`@themost/test`](https://github.com/themost-framework/test/blob/master/modules/test/server/config/models/Order.json). It says that the current user can access orders whose customer is connected to that user.

The `filter` is evaluated using the model's fields and relationships. Because it follows the `customer` relationship, the rule remains aligned with the domain model instead of trusting an arbitrary customer identifier supplied by the request.

## Combine rules carefully

A model can define multiple privileges for different audiences:

```json
{
  "privileges": [
    {
      "mask": 15,
      "type": "global"
    },
    {
      "mask": 15,
      "type": "global",
      "account": "Administrators"
    },
    {
      "mask": 1,
      "type": "self",
      "filter": "customer/user eq me()"
    }
  ]
}
```

Read this as a set of access rules, not as application prose. Each entry has a target, a scope, and an operation mask. When a rule becomes difficult to explain, split it into smaller rules or give the model a clearer relationship to follow.

## Privileges and relationships

Privileges become especially useful on relational models. An `Order` is connected to a `Person` through `customer`, so the order's self rule can follow that association. Similar rules can protect documents owned by a user, tasks assigned to a user, or messages addressed to a user.

The relationship must be part of the model contract. If a filter depends on a field that is missing, ambiguously named, or mapped differently across models, the access rule will be difficult to maintain and verify.

## Start with least privilege

When designing a new model, begin with the smallest access required by each user group. Then add broader account privileges only where the workflow needs them. Test both allowed and denied cases, including a user who owns a record, a user who does not own it, and an administrator.

Privileges are one part of the security design. They should be combined with authentication, input validation, and careful response shaping. Their strength is that the model can express the data ownership rules once, close to the relationships and fields that define the domain.

For a working example, start the `@themost/test` server and inspect the model documentation at `/api/docs`. The `Order` schema shows how privileges, relationships, views, and business fields can live together in one readable definition.
