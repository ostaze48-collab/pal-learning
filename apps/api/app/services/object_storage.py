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

    is_r2 = backend == 'R2'
    bucket = os.getenv('R2_BUCKET') if is_r2 else os.getenv('S3_BUCKET')
    endpoint = os.getenv('R2_ENDPOINT_URL') if is_r2 else os.getenv('S3_ENDPOINT_URL')
    access_key = os.getenv('R2_ACCESS_KEY_ID') if is_r2 else os.getenv('S3_ACCESS_KEY_ID')
    secret_key = os.getenv('R2_SECRET_ACCESS_KEY') if is_r2 else os.getenv('S3_SECRET_ACCESS_KEY')
    public_base = os.getenv('R2_PUBLIC_BASE_URL') if is_r2 else os.getenv('S3_PUBLIC_BASE_URL')

    if is_r2:
        bucket = bucket or os.getenv('S3_BUCKET')
        endpoint = endpoint or os.getenv('S3_ENDPOINT_URL')
        access_key = access_key or os.getenv('S3_ACCESS_KEY_ID')
        secret_key = secret_key or os.getenv('S3_SECRET_ACCESS_KEY')
        public_base = public_base or os.getenv('S3_PUBLIC_BASE_URL')

    prefix = 'R2' if is_r2 else 'S3'
    missing = []
    if not bucket:
        missing.append(f'{prefix}_BUCKET')
    if not endpoint:
        missing.append(f'{prefix}_ENDPOINT_URL')
    if not access_key:
        missing.append(f'{prefix}_ACCESS_KEY_ID')
    if not secret_key:
        missing.append(f'{prefix}_SECRET_ACCESS_KEY')

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


def _credentials(config: StorageConfiguration) -> tuple[str | None, str | None]:
    if config.backend == 'R2':
        return (
            os.getenv('R2_ACCESS_KEY_ID') or os.getenv('S3_ACCESS_KEY_ID'),
            os.getenv('R2_SECRET_ACCESS_KEY') or os.getenv('S3_SECRET_ACCESS_KEY'),
        )
    return os.getenv('S3_ACCESS_KEY_ID'), os.getenv('S3_SECRET_ACCESS_KEY')


def _s3_client(config: StorageConfiguration):
    if not config.durable or not config.configured:
        raise RuntimeError(
            'Durable source storage is not configured: '
            + ','.join(config.missing or ('unsupported_backend',))
        )
    try:
        import boto3
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError('boto3 is required for S3-compatible storage') from exc
    access_key, secret_key = _credentials(config)
    return boto3.client(
        's3',
        endpoint_url=config.endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=os.getenv('S3_REGION', 'auto'),
    )


def _parse_s3_key(file_key: str) -> tuple[str, str]:
    if not file_key.startswith('s3://'):
        raise ValueError('Not an s3:// storage key')
    value = file_key[5:]
    bucket, sep, key = value.partition('/')
    if not sep or not bucket or not key:
        raise ValueError('Invalid s3:// storage key')
    return bucket, key


def read_storage_bytes(file_key: str) -> bytes:
    """Read an imported source from LOCAL or configured S3-compatible storage."""
    if not file_key:
        raise RuntimeError('Source file has no storage key')
    if not file_key.startswith('s3://'):
        return Path(file_key).read_bytes()

    config = storage_configuration()
    bucket, key = _parse_s3_key(file_key)
    body = _s3_client(config).get_object(Bucket=bucket, Key=key)['Body']
    return body.read()


def persist_source_bytes(
    *,
    data: bytes,
    filename: str,
    checksum: str,
    content_type: str | None,
    local_path: Path,
) -> str:
    """Persist an imported curriculum source and return the durable file key."""
    config = storage_configuration()
    if config.backend == 'LOCAL':
        return str(local_path)
    client = _s3_client(config)
    key = f"curriculum/{checksum[:2]}/{checksum}-{_safe_filename(filename)}"
    put_args = {'Bucket': config.bucket, 'Key': key, 'Body': data}
    if content_type:
        put_args['ContentType'] = content_type
    client.put_object(**put_args)
    return f"s3://{config.bucket}/{key}"


def persist_visual_asset_bytes(
    *,
    data: bytes,
    lesson_id: int,
    source_file_id: int,
    source_page: int,
    checksum: str,
    variant: str = 'main',
    extension: str = 'png',
    content_type: str = 'image/png',
    local_dir: str | Path = 'data/visual-assets',
) -> dict:
    """Persist a derived page visual without granting learner-facing rights.

    A public URL is returned only when storage has a configured public base URL.
    Rights clearance remains a separate database/admin decision.
    """
    config = storage_configuration()
    filename = f'l{lesson_id}-s{source_file_id}-p{source_page}-{variant}-{checksum[:16]}.{extension}'
    key = f'visual-assets/lessons/{lesson_id}/source-{source_file_id}/page-{source_page}/{filename}'

    if config.backend == 'LOCAL':
        root = Path(local_dir)
        target = root / str(lesson_id) / str(source_file_id) / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return {'storage_key': str(target), 'public_url': None, 'durable': False}

    client = _s3_client(config)
    client.put_object(Bucket=config.bucket, Key=key, Body=data, ContentType=content_type)
    base = (config.public_base_url or '').rstrip('/')
    return {
        'storage_key': f's3://{config.bucket}/{key}',
        'public_url': f'{base}/{key}' if base else None,
        'durable': True,
    }
