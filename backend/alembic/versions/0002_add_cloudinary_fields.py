"""add cloudinary fields to documents and migrate existing file_data

Revision ID: 0002_add_cloudinary_fields
Revises: 0001_add_file_data
Create Date: 2026-08-31 01:30:00.000000
"""
import io
from alembic import op
import sqlalchemy as sa
import cloudinary
import cloudinary.uploader

from app.core.config import settings

# revision identifiers, used by Alembic.
revision = '0002_add_cloudinary_fields'
down_revision = '0001_add_file_data'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    # 1. Add cloudinary columns if they do not exist
    if dialect_name == "postgresql":
        op.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR")
        op.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS cloudinary_url VARCHAR")
    else:
        # SQLite / other fallback using Alembic batch operation or raw column check
        inspector = sa.inspect(bind)
        columns = [c['name'] for c in inspector.get_columns('documents')]
        if 'cloudinary_public_id' not in columns:
            op.add_column('documents', sa.Column('cloudinary_public_id', sa.String(), nullable=True))
        if 'cloudinary_url' not in columns:
            op.add_column('documents', sa.Column('cloudinary_url', sa.String(), nullable=True))

    # 2. Check if legacy file_data column exists and migrate any existing binary data to Cloudinary
    inspector = sa.inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('documents')]
    if 'file_data' in columns:
        # Configure Cloudinary for data migration if credentials are present
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )

        # Select documents with existing file_data
        result = bind.execute(sa.text("SELECT id, file_name, file_data FROM documents WHERE file_data IS NOT NULL"))
        rows = result.fetchall()

        for row in rows:
            doc_id, file_name, file_data = row[0], row[1], row[2]
            if file_data and len(file_data) > 0:
                try:
                    # Stream binary bytes to Cloudinary
                    file_obj = io.BytesIO(file_data)
                    file_obj.name = file_name or "migrated_document"
                    upload_res = cloudinary.uploader.upload(
                        file_obj,
                        folder="birth_certificates",
                        resource_type="auto",
                        type="private",
                    )
                    pub_id = upload_res.get("public_id")
                    sec_url = upload_res.get("secure_url")

                    bind.execute(
                        sa.text(
                            "UPDATE documents SET cloudinary_public_id = :pub_id, cloudinary_url = :sec_url WHERE id = :doc_id"
                        ),
                        {"pub_id": pub_id, "sec_url": sec_url, "doc_id": doc_id},
                    )
                except Exception as e:
                    print(f"Warning: Failed to migrate document ID {doc_id} to Cloudinary: {e}")

    # 3. Drop legacy columns
    if 'file_data' in columns:
        if dialect_name == "sqlite":
            with op.batch_alter_table('documents') as batch_op:
                batch_op.drop_column('file_data')
        else:
            op.execute("ALTER TABLE documents DROP COLUMN IF EXISTS file_data")

    if 'file_path' in columns:
        if dialect_name == "sqlite":
            with op.batch_alter_table('documents') as batch_op:
                batch_op.drop_column('file_path')
        else:
            op.execute("ALTER TABLE documents DROP COLUMN IF EXISTS file_path")


def downgrade():
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "postgresql":
        op.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path VARCHAR")
        op.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_data BYTEA")
        op.execute("ALTER TABLE documents DROP COLUMN IF EXISTS cloudinary_public_id")
        op.execute("ALTER TABLE documents DROP COLUMN IF EXISTS cloudinary_url")
    else:
        with op.batch_alter_table('documents') as batch_op:
            batch_op.add_column(sa.Column('file_path', sa.String(), nullable=True))
            batch_op.add_column(sa.Column('file_data', sa.LargeBinary(), nullable=True))
            batch_op.drop_column('cloudinary_public_id')
            batch_op.drop_column('cloudinary_url')
