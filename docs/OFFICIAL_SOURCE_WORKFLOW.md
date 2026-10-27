# Official Source Workflow Gate

The current Grade 5 Science Semester 1 Ministry package is cataloged as `PS.G05.SCI.GAZA.CURRENT.S1` and remains a `CATALOG_CANDIDATE` until the fetched document proves the required semester scope.

Admin workflow:
- `POST /importer/catalog/source-packages/1/sync`
- `POST /importer/source-files/{id}/fetch-registered`
- `POST /importer/catalog/source-files/{id}/verify-scope`

Only a successful scope verification promotes the row to `OFFICIAL_PACKAGE`. The Admin UI also reports whether the source bytes were persisted to durable storage.
