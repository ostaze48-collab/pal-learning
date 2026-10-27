# Official Source Workflow

Admin-only workflow for the current Grade 5 Science Semester 1 official source.

Sequence:
1. Sync the catalog entry into the package.
2. Fetch and extract the registered Ministry source.
3. Verify semester scope terms.
4. Promote to `OFFICIAL_PACKAGE` only on a scope PASS.

The UI intentionally surfaces durable-storage status so production generation can remain blocked until source bytes are persisted safely.
