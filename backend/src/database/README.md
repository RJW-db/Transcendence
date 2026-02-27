# Database Class API Wrapper

## Overview

The `Database` class is both a modular wrapper and a custom API for Prisma and Fastify. It simplifies database access, error handling, and HTTP response management in your backend. It automatically handles try/catch logic for all database operations, sends appropriate HTTP responses for Prisma errors, and allows flexible customization of error messages and behavior. You interact with your database through a clean API of methods provided by the class.

## Features

- Singleton pattern: Only one instance per server.
- Automatic error handling: No need for manual try/catch.
- Customizable error messages per Prisma error code.
- Toggleable auto-reply: Let the class send HTTP responses, or handle errors yourself.
- Modular API: Add methods for any model/query.
- Clean shutdown: Ensures database connections are closed gracefully.

---

## Initialization

Initialize the singleton instance at server startup:

```typescript
import { initializeDatabase } from './utils/database';
import Fastify from 'fastify';

const fastify = Fastify();
initializeDatabase(fastify);
```

---

## Usage

Import and use the singleton instance anywhere in your app:

```typescript
import { db } from './utils/database';
```

### Example: Find user by ID (default error handling)

```typescript
const user = await db.findUserById(userId, reply);
if (!user) return; // Default error message sent to client
```

### Example: Custom error message for "not found"

```typescript
const user = await db.findUserById(userId, reply, {
  messages: { P2025: 'User not found' }
});
if (!user) return;
```

### Example: Create user with custom duplicate error

```typescript
const user = await db.createUser({
  Alias: alias,
  Email: email,
  Password: '',
  Secret2FA: secret,
  GuestLogin: true,
  CreationDate: new Date(),
}, reply, {
  messages: { P2002: 'Guest account already exists' }
});
if (!user) return;
```

### Example: Handle errors yourself (no auto reply)

```typescript
const user = await db.findUserById(userId, reply, { autoReply: false });
if (!user) {
  reply.status(404).send({ message: 'Custom not found message' });
  return;
}
```

### Example: Set global error messages

```typescript
db.setGlobalMessages({ P2025: 'User not found globally!' });
const user = await db.findUserById(userId, reply);
```

---

## Shutdown

Cleanly close the database connection on server shutdown:

```typescript
import { closeDatabase } from './utils/database';

await closeDatabase();
```

---

## Why Use This Class?

- **Automatic try/catch:** All database methods are wrapped, so you never need to manually catch errors.
- **Consistent error responses:** Prisma errors are mapped to HTTP status codes and messages, sent directly to the client.
- **Customizable:** Override error messages per call or globally, and control whether the class sends responses or not.
- **Modular API:** Add new methods for any model or query, keeping your code DRY and maintainable.
- **Safe shutdown:** Ensures all database connections are closed when your server stops.

---

## Adding New Methods

To add new database operations, simply add methods to the class using the same error handling pattern as `findUserById`. These methods form your custom database API.

---

This README should help you and your team understand, use, and extend the Database class API wrapper efficiently!
