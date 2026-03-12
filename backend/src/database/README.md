# Website for error codes
https://www.prisma.io/docs/orm/reference/error-reference#prisma-client-query-engine

# Database Usage Examples


## 1. Basic usage with auto-reply enabled (default)

```typescript
import { db, initializeDatabase } from './new';
import { FastifyInstance } from 'fastify';

initializeDatabase(fastify); // fastify is your FastifyInstance

const user = await db.findByEmail('user@example.com');
// If not found or error, auto-reply sends response and user is null
```

## 2. Disabling auto-reply for manual error handling

```typescript
db.setAutoReply(false);

const user = await db.findByEmail('user@example.com');
if (!user) {
	// Handle error or not-found manually
	reply.status(404).send({ message: 'User not found' });
}
```

## 3. Customizing error messages for specific codes

```typescript
// Set custom messages for one or more codes
db.setMessage({
	P2002: 'Email already taken',
	P2025: 'User does not exist',
	P2004: 'Constraint failed',
	P2000: 'Value too long',
	P2001: 'Record not found',
	P2003: 'Related record missing',
	P2005: 'Invalid value',
	P2006: 'Invalid value',
	P2007: 'Validation error',
	P2011: 'Field cannot be null',
	P2014: 'Relation violation'
});
// These messages will be used in auto-reply or manual handling
```

## 4. Toggling auto-reply

```typescript
db.toggleAutoReply(); // Flips autoReply on/off
```

## 5. Using custom methods

```typescript
const exists = await db.exists('user@example.com');
if (exists) {
	// User exists, proceed
} else {
	// User does not exist, handle accordingly
}
```

## 6. Manual error handling with custom status code

```typescript
// Set custom status codes for one or more codes
db.setStatusCode({
  P2002: 409,
  P2004: 500,
  P2001: 404
});

db.setAutoReply(false);
const user = await db.create({ data: { email: 'user@example.com' } });
if (!user) {
  reply.status(409).send({ message: 'Email already taken' });
}
```

## 8. Setting multiple custom messages

```typescript
// Set a single custom message
db.setMessage('P2002', 'Email already taken');

// Set multiple custom messages at once
db.setMessage({
	P2002: 'Email already taken',
	P2025: 'User does not exist',
	P2004: 'Constraint failed'
});
```

## 7. Closing the database connection

```typescript
await closeDatabase();
```
