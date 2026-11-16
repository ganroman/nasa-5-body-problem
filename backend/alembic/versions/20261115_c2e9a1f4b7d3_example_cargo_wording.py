"""example cargo wording

The seed files now say "example cargo" instead of "mock cargo", but the deploy runs migrations and
does not re-ingest the seed, so rows already in the database keep the old text. Idempotent updates.

Revision ID: c2e9a1f4b7d3
Revises: b1d0c4a7e2f9
Create Date: 2026-11-15 19:10:00
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'c2e9a1f4b7d3'
down_revision: Union[str, Sequence[str], None] = 'b1d0c4a7e2f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""UPDATE materials SET notes = replace(notes, 'instrument mock cargo.', 'instrument example cargo.')
                  WHERE notes LIKE '%instrument mock cargo.%'""")
    op.execute("""UPDATE sources SET title = 'Example cargo and material flammability evidence'
                  WHERE id = 'doc-env-material-flammability' AND title LIKE 'Mock cargo%'""")


def downgrade() -> None:
    pass
