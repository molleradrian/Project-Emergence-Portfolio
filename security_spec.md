# Security Specification & Attack Vectors

## 1. Data Invariants
1. **User Profile**: Only the owner of the user profile path `/users/{userId}` can view or edit their profile document. The document ID MUST match the authenticated user ID (`request.auth.uid`). No spoofed emails can be set.
2. **System State**: The `/system_state/live_matrix` document holds general system telemetry. Read access is public, but updates can only be written by authenticated user sessions.
3. **Chronicle Stream**: The `/chronicle_stream/{id}` collection stores professional chronicle accomplishments. Read access is public. Writes (creation, modification, and deletion) require authentication.

## 2. The Dirty Dozen Payloads (Targeting Exploitative Vulnerabilities)

1. **Self-Assigned Identity Block**: Trying to write a user document where ID does not match auth UID.
2. **Resource Poisoning (Over-sized payload)**: Inserting a 10MB string into an ID or state parameter.
3. **Ghost Fields Bypass**: Injecting arbitrary extra fields in user profile.
4. **Incorrect ID Formatting**: Writing an ID containing invalid characters or too long.
5. **Unauthorized Telemetry Pulse**: Guest modifying state without auth.
6. **Negative Signal Frequency**: Injecting negative parameters in numeric fields.
7. **Future Timestamps Poisioning**: Sending client-spoofed timestamps.
8. **Chronicle Spoofing**: Signed-in user writing a milestone targeting another user.
9. **Direct State Shortcutting**: Skipping status transitions without authorization controls.
10. **Null Payload Injection**: Sending blank raw payloads when schema expects maps.
11. **Malicious Administrative Escalate**: Setting admin status manually via user profile.
12. **PII Data Leakage**: Unauthenticated client harvesting full user document collections.
