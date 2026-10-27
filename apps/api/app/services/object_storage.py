from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path


DURABLE_BACKENDS = {'S3', 'S3_COMPATIBLE', 'R2'}


@dataclass(frozen=True)
class StorageConfiguration:
    backend: str
    durable: bool
    configured: bool
    bucket: str | None
    endpoint_url: str | None
    public_base_url: str | None
    missing: tuple[str, ...]


def storage_configuration() -> StorageConfiguration:
    backend = os.getenv('STORAGE_BACKEND', 'LOCAL').strip().upper() or 'LOCAL'
    if backend == 'LOCAL':
        return StorageConfiguration(
            backend='LOCAL', durable=False, configured=True,
            bucket=None, endpoint_url=None, public_base_url=None, missing=(),
        )

    if backend not in DURABLE_BACKENDS:
        return StorageConfiguration(
            backend=backend, durable=False, configured=False,
            bucket=None, endpoint_url=None, public_base_url=None,
            missing=('SUPPORTED_STORAGE_BACKEND',),
        )

    bucket = os.getenv('S3_BUCKET') or os.getenv('R2_BUCKET')
    endpoint = os.getenv('S3_ENDPOINT_URL') or os.getenv('R2_ENDPOINT_URL')
    access_key = os.getenv('S3_ACCESS_KEY_ID') or os.getenv('R2_ACCESS_KEY_ID')
    secret_key = os.getenv('S3_SECRET_ACCESS_KEY') or os.getenv('R2_SECRET_ACCESS_KEY')
    public_base = os.getenv('S3_PUBLIC_BASE_URL') or os.getenv('R2_PUBLIC_BASE_URL')

    missing = []
    if not bucket:
        missing.append('S3_BUCKET')
    if not endpoint:
        missing.append('S3_ENDPOINT_URL')
    if not access_key:
        missing.append('S3_ACCESS_KEY_ID')
    if not secret_key:
        missing.append('S3_SECRET_ACCESS_KEY')

    return StorageConfiguration(
        backend=backend,
        durable=True,
        configured=not missing,
        bucket=bucket,
        endpoint_url=endpoint,
        public_base_url=public_base,
        missing=tuple(missing),
    )


def _safe_filename(filename: str) -> str:
    name = Path(filename or 'source.bin').name
    name = re.sub(r'[^A-Za-z0-9._-]+', '-', name).strip('-')
    return name[:120] or 'source.bin'


def persist_source_bytes(
    *,
    data: bytes,
    filename: str,
    checksum: str,
    content_type: str | None,
    local_path: Path,
) -> str:
    """Persist an imported curriculum source and return the durable file key.

    LOCAL intentionally returns the local path for development/demo. S3-compatible
    backends upload the original bytes and return an s3:// key. Extraction may
    still use the local working copy; factual provenance points at this returned key.
    """
    config = storage_configuration()
    if config.backend == 'LOCAL':
        return str(local_path)
    if not config.durable or not config.configured:
        raise RuntimeError(
            'Durable source storage is not configured: '
            + ','.join(config.missing or ('unsupported_backend',))
        )

    try:
        import boto3
    except ImportError as exc:  # pragma: no cover - dependency is present in production requirements
        raise RuntimeError('boto3 is required for S3-compatible source storage') from exc

    access_key = os.getenv('S3_ACCESS_KEY_ID') or os.getenv('R2_ACCESS_KEY_ID')
    secret_key = os.getenv('S3_SECRET_ACCESS_KEY') or os.getenv('R2_SECRET_ACCESS_KEY')
    region = os.getenv('S3_REGION', 'auto')
    key = f"curriculum/{checksum[:2]}/{checksum}-{_safe_filename(filename)}"

    client = boto3.client(
        's3',
        endpoint_url=config.endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )
    put_args = {
        'Bucket': config.bucket,
        'Key': key,
        'Body': data,
    }
    if content_type:
        put_args['ContentType'] = content_type
    client.put_object(**put_args)
    return f"s3://{config.bucket}/{key}"
