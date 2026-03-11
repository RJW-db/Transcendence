
// // 1. Unique Constraint Violation (e.g., duplicate email)
// // Try to create a user with an email that already exists
// await db.user.create({
//   data: {
//     email: "existing@email.com", // Use an email that already exists in your DB
//     username: "testuser",
//     password: "irrelevant",
//   },
// }, { logMessage: "Testing unique constraint violation" });

// // 2. Invalid Field Name
// // Try to find a user with a non-existent field
// await db.user.findUnique({
//   where: { nonExistentField: "value" }, // This field does not exist
// }, { logMessage: "Testing invalid field" });


// // 3. Malformed Data
// // Pass a wrong data type
// await db.user.create({
//   data: {
//     email: 12345, // Should be a string, not a number
//     username: "testuser",
//     password: "irrelevant",
//   },
// }, { logMessage: "Testing malformed data" });

// // 4. Force a Prisma Error with a Bad Query
// // Directly call a method that doesn't exist
// await db.user.nonExistentMethod({}, { logMessage: "Testing non-existent method" });