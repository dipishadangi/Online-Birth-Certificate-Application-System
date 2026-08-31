"""add file_data columns to documents

Revision ID: 0001_add_file_data
Revises: 
Create Date: 2026-08-31 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_add_file_data'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path VARCHAR")
        op.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_content_type VARCHAR")
        op.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER")
        op.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_data BYTEA")
    else:
        inspector = sa.inspect(bind)
        cols = [c['name'] for c in inspector.get_columns('documents')]
        if 'file_path' not in cols:
            op.add_column('documents', sa.Column('file_path', sa.String(), nullable=True))
        if 'file_content_type' not in cols:
            op.add_column('documents', sa.Column('file_content_type', sa.String(), nullable=True))
        if 'file_size' not in cols:
            op.add_column('documents', sa.Column('file_size', sa.Integer(), nullable=True))
        if 'file_data' not in cols:
            op.add_column('documents', sa.Column('file_data', sa.LargeBinary(), nullable=True))



def downgrade():
    op.drop_column('documents', 'file_data')
    op.drop_column('documents', 'file_size')
    op.drop_column('documents', 'file_content_type')
    op.drop_column('documents', 'file_path')
