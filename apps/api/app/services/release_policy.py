from __future__ import annotations

# Direct/legacy publication remains disabled. Publication is only possible through
# the audited release transaction, which re-runs the final gate, validates live
# provenance, requires PostgreSQL, and commits the new live version atomically.
DIRECT_LEGACY_PUBLISH_ENABLED = False
AUDITED_RELEASE_TRANSACTION_IMPLEMENTED = True


def release_policy_status() -> dict:
    return {
        'direct_legacy_publish_enabled': DIRECT_LEGACY_PUBLISH_ENABLED,
        'direct_legacy_publish_disabled': not DIRECT_LEGACY_PUBLISH_ENABLED,
        'audited_release_transaction_implemented': AUDITED_RELEASE_TRANSACTION_IMPLEMENTED,
        # Availability of the mechanism is not blanket authorization. Each release
        # must independently pass its transaction-time final gate.
        'publication_authorized': False,
        'publication_path': 'AUDITED_RELEASE_TRANSACTION_ONLY',
    }
