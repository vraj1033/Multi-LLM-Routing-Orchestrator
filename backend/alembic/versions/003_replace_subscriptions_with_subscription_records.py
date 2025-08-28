"""Replace subscriptions with subscription_records

Revision ID: 003
Revises: 002
Create Date: 2025-08-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old subscriptions table if exists
    try:
        op.drop_index(op.f('ix_subscriptions_razorpay_subscription_id'), table_name='subscriptions')
    except Exception:
        pass
    try:
        op.drop_index(op.f('ix_subscriptions_id'), table_name='subscriptions')
    except Exception:
        pass
    try:
        op.drop_table('subscriptions')
    except Exception:
        pass
    try:
        op.execute('DROP TYPE IF EXISTS subscriptionstatus')
        op.execute('DROP TYPE IF EXISTS plantype')
    except Exception:
        pass

    # Create subscription_records table
    op.create_table(
        'subscription_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plan_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('razorpay_order_id', sa.String(), nullable=True),
        sa.Column('razorpay_payment_id', sa.String(), nullable=True),
        sa.Column('razorpay_signature', sa.String(), nullable=True),
        sa.Column('razorpay_customer_id', sa.String(), nullable=True),
        sa.Column('amount', sa.Integer(), nullable=True),
        sa.Column('currency', sa.String(), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscription_records_id'), 'subscription_records', ['id'], unique=False)
    op.create_index(op.f('ix_subscription_records_user_id'), 'subscription_records', ['user_id'], unique=False)
    op.create_index(op.f('ix_subscription_records_razorpay_payment_id'), 'subscription_records', ['razorpay_payment_id'], unique=False)
    op.create_index(op.f('ix_subscription_records_razorpay_order_id'), 'subscription_records', ['razorpay_order_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_subscription_records_razorpay_order_id'), table_name='subscription_records')
    op.drop_index(op.f('ix_subscription_records_razorpay_payment_id'), table_name='subscription_records')
    op.drop_index(op.f('ix_subscription_records_user_id'), table_name='subscription_records')
    op.drop_index(op.f('ix_subscription_records_id'), table_name='subscription_records')
    op.drop_table('subscription_records')


