from __future__ import annotations

import os
from dataclasses import dataclass

from ..importer.source_policy import allowed_source_types, source_allows
from .object_storage import storage_configuration
from .release_policy import (
    AUDITED_RELEASE_TRANSACTION_IMPLEMENTED,
    DIRECT_LEGACY_PUBLISH_ENABLED,
)


@dataclass(frozen=True)
class ProductionReadiness:
    ready: bool
    checks: dict[str, bool]
    blockers: list[str]
    details: dict


def _source_policy_is_fail_closed() -> bool:
    return (
        source_allows('UNKNOWN_FUTURE_TYPE', 'factual_grounding') is False
        and source_allows('SOLUTIONS', 'factual_grounding') is False
        and source_allows('CURRICULUM_PLAN', 'factual_grounding') is False
        and allowed_source_types('factual_grounding') == {'STUDENT_BOOK', 'OFFICIAL_PACKAGE'}
    )


def evaluate_production_readiness(
    *,
    database_backend: str,
    allowed_origins: list[str],
    migration_current: bool = False,
    migration_revision: str | None = None,
    migration_head: str | None = None,
) -> ProductionReadiness:
    provider = os.getenv('AI_PROVIDER', 'LOCAL_MOCK').upper()
    ai_key = bool(os.getenv('OPENAI_API_KEY')) if provider == 'OPENAI' else False
    ai_model = bool(os.getenv('OPENAI_MODEL') or os.getenv('OPENAI_MODEL_BALANCED')) if provider == 'OPENAI' else False
    jwt_secret = os.getenv('JWT_SECRET', '')
    bootstrap_password = os.getenv('BOOTSTRAP_ADMIN_PASSWORD', '')
    storage = storage_configuration()

    production_origins = [x for x in allowed_origins if x.startswith('https://')]
    wildcard_origin = '*' in allowed_origins

    checks = {
        'persistent_database': database_backend in {'postgresql', 'postgres'},
        'database_migration_current': migration_current,
        'durable_source_storage': storage.durable,
        'source_storage_configured': storage.durable and storage.configured,
        'jwt_secret_configured': len(jwt_secret) >= 32 and jwt_secret.lower() not in {'change-me', 'changeme'},
        'cors_has_production_origin': bool(production_origins),
        'cors_has_no_wildcard': not wildcard_origin,
        'admin_bootstrap_password_configured': len(bootstrap_password) >= 12,
        'ai_provider_is_real': provider != 'LOCAL_MOCK',
        'ai_provider_configured': provider == 'OPENAI' and ai_key and ai_model,
        'source_authority_policy_fail_closed': _source_policy_is_fail_closed(),
        'legacy_direct_publish_disabled': not DIRECT_LEGACY_PUBLISH_ENABLED,
        'audited_release_transaction_available': AUDITED_RELEASE_TRANSACTION_IMPLEMENTED,
    }
    ready = all(checks.values())
    blockers = [name for name, passed in checks.items() if not passed]
    return ProductionReadiness(
        ready=ready,
        checks=checks,
        blockers=blockers,
        details={
            'database_backend': database_backend,
            'migration_revision': migration_revision,
            'migration_head': migration_head,
            'storage_backend': storage.backend,
            'storage_durable': storage.durable,
            'storage_configured': storage.configured,
            'storage_bucket': storage.bucket,
            'storage_endpoint_configured': bool(storage.endpoint_url),
            'storage_missing': list(storage.missing),
            'ai_provider': provider,
            'production_origins': production_origins,
            'bootstrap_password_present': bool(bootstrap_password),
            'release_policy': {
                'direct_legacy_publish_enabled': DIRECT_LEGACY_PUBLISH_ENABLED,
                'audited_release_transaction_implemented': AUDITED_RELEASE_TRANSACTION_IMPLEMENTED,
            },
        },
    )
