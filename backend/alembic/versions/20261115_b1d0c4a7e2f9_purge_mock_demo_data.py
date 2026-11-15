"""purge mock demo data

The submission shows only curated data (NASA PSI and the cited NASA sources). This removes every
row the former seed/mock.py wrote (`mock-` ids, `MOCK-` accessions, routes `M01`.., passport
snapshots with `mock_demo`) and everything visitors derived from it (forks, shares, scenarios).
Curated rows are untouched. Data-only: downgrade is a no-op (the deploy takes a dump first).

Revision ID: b1d0c4a7e2f9
Revises: 8c16be262092
Create Date: 2026-11-15 18:30:00
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'b1d0c4a7e2f9'
down_revision: Union[str, Sequence[str], None] = '8c16be262092'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MOCK_ITEMS = "SELECT id FROM cargo_items WHERE slug LIKE 'mock-%'"
MOCK_ROUTES = "SELECT id FROM routes WHERE id ~ '^M[0-9]+$'"
MOCK_ENVS = "SELECT id FROM environments WHERE id LIKE 'mock-%'"

# Children first; cascades remove configs, components, conditions, links and assessments.
STATEMENTS = [
    "DELETE FROM passport_exports WHERE snapshot ? 'mock_demo'",
    # cargo items derived from mock data: forks of mock cargo, items behind mock share links, and
    # visitor items whose scenarios sit on a mock route or environment (they would be orphans)
    f"""DELETE FROM cargo_items WHERE forked_from_id IN ({MOCK_ITEMS})
        OR id IN (SELECT c.item_id FROM cargo_configs c JOIN shares s ON s.cargo_config_id = c.id
                  WHERE s.slug LIKE 'mock-%')
        OR (origin = 'user' AND id IN (SELECT c.item_id FROM cargo_configs c
                  JOIN scenarios sc ON sc.config_id = c.id
                  WHERE sc.route_id IN ({MOCK_ROUTES}) OR sc.environment_id IN ({MOCK_ENVS})))""",
    "DELETE FROM shares WHERE slug LIKE 'mock-%'",
    # scenarios (and the shares that point at them) on a mock route or environment
    f"""DELETE FROM shares WHERE scenario_id IN (SELECT id FROM scenarios
        WHERE route_id IN ({MOCK_ROUTES}) OR environment_id IN ({MOCK_ENVS}))""",
    f"DELETE FROM scenarios WHERE route_id IN ({MOCK_ROUTES}) OR environment_id IN ({MOCK_ENVS})",
    f"DELETE FROM cargo_items WHERE id IN ({MOCK_ITEMS})",
    "DELETE FROM findings WHERE id LIKE 'mock-%'",
    "DELETE FROM reference_passages WHERE id LIKE 'mock-%'",
    "DELETE FROM observations WHERE source_id LIKE 'mock-%' OR material_id LIKE 'mock-%'",
    "DELETE FROM investigations WHERE accession LIKE 'MOCK-%'",
    f"DELETE FROM routes WHERE id IN ({MOCK_ROUTES})",
    "DELETE FROM environments WHERE id LIKE 'mock-%'",
    "DELETE FROM materials WHERE id LIKE 'mock-%'",
    "DELETE FROM sources WHERE id LIKE 'mock-%'",
]


def upgrade() -> None:
    for sql in STATEMENTS:
        op.execute(sql)


def downgrade() -> None:
    pass
