# Security Specification - Claude Creator Catalyst

## Data Invariants
1. A VideoIdea must have a valid `userId` matching the creator's UID.
2. A VideoIdea must have a `title` and `thumbnailConcept` of reasonable size.
3. Users can only read and write their own ideas and profiles.
4. `createdAt` must be a server timestamp.

## The Dirty Dozen Payloads (Targeting PERMISSION_DENIED)
1. **Identity Theft (Create)**: Creating an idea with `userId` of another user.
2. **Identity Theft (Read)**: Fetching ideas belonging to another user.
3. **Identity Theft (Update)**: Modifying the `userId` of an existing idea.
4. **Identity Theft (Delete)**: Deleting someone else's idea.
5. **Shadow Field Injection**: Adding `isAdmin: true` to a UserProfile.
6. **Resource Exhaustion**: Writing a 1MB string into the `title` field.
7. **Bypassing Verification**: Writing to Firestore without `email_verified == true`.
8. **Spoofing Timestamps**: Providing a manual `createdAt` string instead of server timestamp.
9. **Invalid ID**: Using a 2KB string as a document ID.
10. **State Corruption**: Updating the `audience` to a value not in the enum.
11. **PII Leakage**: Authenticated user trying to list the entire `users` collection.
12. **Orphaned Write**: Creating an idea without a corresponding user profile (Wait, profiles are simple, but we check UID).

## Test Runner logic (Conceptual for firestore.rules.test.ts)
- `assertFails(idea.create({ userId: 'other' }))`
- `assertFails(idea.list().where('userId', '==', 'other'))`
- `assertFails(user.update({ isAdmin: true }))`
- `assertFails(idea.create({ title: 'A'.repeat(100000) }))`
