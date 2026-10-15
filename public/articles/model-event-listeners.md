---
index: 160
title: "Model Event Listeners"
summary: "Learn how @themost/data model eventListeners run during save, remove, query, and upgrade operations."
category: "Event Model"
readingTime: "5 min read"
---

# Model Event Listeners

A model event listener is a small module that runs when something happens to a data model. It can validate an object before saving, react after a new record is created, prevent a delete, or observe a query before it reaches the data provider.

Listeners are useful when a rule belongs to the model and should run no matter which part of the application performs the operation. A web controller, a background job, and a test can all use the same model lifecycle.

## Register a listener in the schema

A model declares its listeners with the `eventListeners` property. Each entry points to a module and may include a readable name:

```json
{
  "name": "Order",
  "eventListeners": [
    {
      "name": "New Order Notification",
      "type": "/app/controllers/new-order-listener"
    }
  ]
}
```

When the model is loaded, `@themost/data` resolves the module and registers any supported listener methods it exports. A listener can also refer to a particular exported class or object with a `#` suffix, such as `./listeners/OnUpdateProduct#OnUpdateProduct`.

## Write a before-save listener

A listener method receives two arguments: an event object and a callback. The event contains information about the operation, including the target object and the model. The callback tells the framework that the listener has finished:

```javascript
export function beforeSave(event, callback) {
  const order = event.target;

  if (!order.orderNumber) {
    order.orderNumber = `ORDER-${Date.now()}`;
  }

  return callback();
}
```

A `beforeSave` listener runs before the object is persisted. It can normalize values, calculate a field, or reject invalid state. To stop the operation, pass an error to the callback:

```javascript
export function beforeSave(event, callback) {
  if (event.target.total < 0) {
    return callback(new Error('Order total cannot be negative.'));
  }

  return callback();
}
```

The callback is important. If the listener does not call it, the save pipeline cannot continue or finish correctly.

## React after a save

An `afterSave` listener runs after an object has been created or updated. It is a good place for side effects such as sending a notification, writing an audit entry, or updating an external system:

```javascript
export function afterSave(event, callback) {
  if (event.state !== 1) {
    return callback();
  }

  console.log('A new order was created:', event.target.orderNumber);
  return callback();
}
```

The `state` value tells the listener what kind of save occurred. Check it before performing an action that should happen only for a new record. A notification that belongs only to creation should not be sent again every time the order is edited.

External work should be handled carefully. If a notification is essential to the business operation, decide whether an error should fail the save. If it is optional, log the failure and keep the persistence workflow reliable according to the application's requirements.

## Other lifecycle methods

A listener module can implement more than one lifecycle method:

```javascript
export function beforeRemove(event, callback) {
  if (event.target.isProtected) {
    return callback(new Error('This record cannot be removed.'));
  }

  return callback();
}

export function afterRemove(event, callback) {
  console.log('Removed:', event.target.id);
  return callback();
}
```

Common model events include:

- `beforeSave`: validate or prepare an object before insert or update.
- `afterSave`: react after insert or update completes.
- `beforeRemove`: prevent or prepare a delete.
- `afterRemove`: react after deletion completes.
- `beforeExecute`: inspect or change a query before execution.
- `afterExecute`: inspect the result after a query executes.
- `beforeUpgrade` and `afterUpgrade`: respond when a model is upgraded or migrated.

The framework only registers methods that the listener exports. A module can therefore focus on the events it actually needs.

## Understand the event object

The event argument is a `DataEventArgs` object. Its most useful properties are:

- `model`: the `DataModel` that raised the event.
- `target`: the data object being inserted, updated, or removed.
- `state`: the operation state, such as insert, update, or delete.
- `previous`: the previous version of the object when it is available.
- `emitter`: the query or event emitter involved in the operation.
- `query`: the underlying query expression when the event concerns execution.

For example, an update listener can compare the current and previous values:

```javascript
export function beforeSave(event, callback) {
  if (event.state === 2 && event.previous) {
    if (event.previous.status !== event.target.status) {
      console.log(`Status changed on ${event.model.name}`);
    }
  }

  return callback();
}
```

Use the event information instead of reading request-specific variables from inside the listener. That keeps the listener reusable wherever the model is used.

## Keep listeners focused

A listener should enforce one model rule or coordinate one small piece of lifecycle behavior. Good listeners are predictable, finish quickly, and always call their callback.

Avoid putting an entire application workflow inside a single listener. If several operations are involved, call a dedicated service from the listener and keep the model event method responsible for translating lifecycle events into that service call.

Also remember that listeners may run for every operation on the model. A slow network request in `beforeSave`, for example, can slow every save. Choose `before` or `after` based on whether the operation must be blocked by the listener's work.

## The listener lifecycle

The basic flow looks like this:

```text
application calls model.save(object)
        |
        v
beforeSave listeners run
        |
        v
object is persisted, or an error stops the operation
        |
        v
afterSave listeners run
```

This is the main idea behind model event listeners: the model owns the lifecycle, while each listener contributes one focused rule or reaction. Once the listener calls its callback, the framework can move to the next listener or finish the operation.

Start with a `beforeSave` validation rule, test the allowed and rejected cases, and then add an `afterSave` reaction when the persisted change needs to notify another part of the system.
