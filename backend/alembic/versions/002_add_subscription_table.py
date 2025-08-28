"""Add subscription table

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create subscriptions table
    op.create_table('subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plan_type', sa.Enum('FREE', 'BASIC', 'PRO', 'ENTERPRISE', name='plantype'), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING', name='subscriptionstatus'), nullable=False),
        sa.Column('razorpay_subscription_id', sa.String(), nullable=True),
        sa.Column('razorpay_customer_id', sa.String(), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscriptions_id'), 'subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_subscriptions_razorpay_subscription_id'), 'subscriptions', ['razorpay_subscription_id'], unique=True)


def downgrade() -> None:
    # Drop subscriptions table
    op.drop_index(op.f('ix_subscriptions_razorpay_subscription_id'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_id'), table_name='subscriptions')
    op.drop_table('subscriptions')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS subscriptionstatus')
    op.execute('DROP TYPE IF EXISTS plantype')