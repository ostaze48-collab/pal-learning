from __future__ import annotations

# Publication remains intentionally fail-closed. Staging, academic QA and the
# final release gate can assess readiness, but no code path is allowed to mutate
# live curriculum state until an audited, transactional release mechanism exists.
DIRECT_LEGACY_PUBLISH_ENABLED = False
AUDITED_RELEASE_TRANSACTION_IMPLEMENTED = False


def release_policy_status() -> dict:
    return {
        'direct_legacy_publish_enabled': DIRECT_LEGACY_PUBLISH_ENABLED,
        'direct_legacy_publish_disabled': not DIRECT_LEGACY_PUBLISH_ENABLED,
        'audited_release_transaction_implemented': AUDITED_RELEASE_TRANSACTION_IMPLEMENTED,
        'publication_authorized': AUDITED_RELEASE_TRANSACTION_IMPLEMENTED,
    }
