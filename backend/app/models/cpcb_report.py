"""CPCB Compliance Report — Database Model.

Stores generated CPCB compliance reports for historical reference
and download. Each report is linked to a facility and reporting period.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON

from app.database import Base


class CPCBReport(Base):
    """A generated CPCB compliance report stored in the database."""

    __tablename__ = "cpcb_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(String(64), unique=True, nullable=False, index=True)
    facility_id = Column(String(64), nullable=False, index=True)
    facility_name = Column(String(255), nullable=False)
    reporting_period = Column(String(7), nullable=False)  # YYYY-MM format
    generated_at = Column(DateTime, default=datetime.now, nullable=False)

    # Compliance data
    compliance_score = Column(Float, nullable=False)
    segregation_score = Column(Float, nullable=False)
    treatment_score = Column(Float, nullable=False)
    disposal_score = Column(Float, nullable=False)

    # Waste summary
    total_generated_kg = Column(Float, default=0.0)
    items_tracked = Column(Integer, default=0)
    blocks_verified = Column(Integer, default=0)
    chain_integrity = Column(Float, default=100.0)

    # Verification
    digital_signature = Column(String(64), nullable=False)
    blockchain_verified = Column(Integer, default=1)  # boolean
    all_chains_intact = Column(Integer, default=1)    # boolean

    # Full report data (JSON blob for flexible storage)
    report_data = Column(JSON, nullable=True)

    # Status
    status = Column(String(32), default="auto_submitted")  # auto_submitted, draft, pending

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "report_id": self.report_id,
            "facility_id": self.facility_id,
            "facility_name": self.facility_name,
            "reporting_period": self.reporting_period,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "compliance_score": self.compliance_score,
            "segregation_score": self.segregation_score,
            "treatment_score": self.treatment_score,
            "disposal_score": self.disposal_score,
            "total_generated_kg": self.total_generated_kg,
            "items_tracked": self.items_tracked,
            "blocks_verified": self.blocks_verified,
            "chain_integrity": self.chain_integrity,
            "digital_signature": self.digital_signature,
            "blockchain_verified": bool(self.blockchain_verified),
            "all_chains_intact": bool(self.all_chains_intact),
            "status": self.status,
        }
