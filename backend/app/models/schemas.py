"""Boon — Pydantic schemas for biomedical waste management."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class WasteCategory(str, Enum):
    YELLOW = "yellow"       # Infectious, anatomical, cytotoxic
    RED = "red"             # Recyclable contaminated waste
    WHITE = "white"         # Sharps
    BLUE = "blue"           # Glassware, metallic implants


class WasteStatus(str, Enum):
    GENERATED = "generated"
    SEGREGATED = "segregated"
    COLLECTED = "collected"
    STORED = "stored"
    TRANSIT = "transit"
    TREATED = "treated"
    DISPOSED = "disposed"


class WasteSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class WasteItem(BaseModel):
    id: str
    barcode: str
    category: WasteCategory
    waste_type: str
    source: str                          # Hospital / Clinic / Lab name
    source_type: str                     # ward, operation theater, lab, etc.
    department: str
    weight_kg: float
    container_type: str
    severity: WasteSeverity
    status: WasteStatus
    generated_at: datetime
    collected_at: datetime | None = None
    treated_at: datetime | None = None
    disposed_at: datetime | None = None
    collected_by: str | None = None
    facility: str | None = None
    treatment_method: str | None = None
    disposal_method: str | None = None
    temperature_celsius: float | None = None
    gps_lat: float | None = None
    gps_lng: float | None = None
    notes: str | None = None


class WasteGenerationSummary(BaseModel):
    today_total_kg: float
    today_items: int
    weekly_total_kg: float
    monthly_total_kg: float
    category_breakdown: dict[str, float]
    department_breakdown: dict[str, float]
    severity_breakdown: dict[str, int]
    status_breakdown: dict[str, int]
    compliance_score: float
    active_alerts: int


class Facility(BaseModel):
    id: str
    name: str
    type: str                            # Hospital, Clinic, Lab, CBWTF
    address: str
    city: str
    state: str
    registration_number: str
    capacity_kg_per_day: float
    current_load_kg: float
    compliance_status: str
    last_audit: datetime | None = None
    gps_lat: float
    gps_lng: float


class CollectionRoute(BaseModel):
    id: str
    vehicle_id: str
    driver_name: str
    driver_phone: str
    facilities: list[str]
    scheduled_time: datetime
    estimated_completion: datetime
    status: str
    total_waste_kg: float
    gps_trace: list[dict] = []


class Alert(BaseModel):
    id: str
    type: str                             # overflow, segregation_error, temp_violation, delay
    severity: WasteSeverity
    title: str
    message: str
    facility: str | None = None
    waste_item_id: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None
    resolved_by: str | None = None


class ClassificationResult(BaseModel):
    predicted_category: WasteCategory
    confidence: float
    waste_type: str
    treatment_recommendation: str
    disposal_guidelines: list[str]
    processing_time_ms: float


class ComplianceReport(BaseModel):
    report_id: str
    facility_name: str
    reporting_period: str
    generated_at: datetime
    total_waste_generated_kg: float
    waste_by_category: dict[str, float]
    treatment_efficiency: float
    segregation_accuracy: float
    collection_coverage: float
    incidents: int
    compliance_score: float
    recommendations: list[str]
    status: str                             # compliant, non_compliant, needs_attention
    certifiable: bool


class PredictionResponse(BaseModel):
    facility_id: str
    date: str
    predicted_waste_kg: float
    confidence_interval: tuple[float, float]
    peak_generation_hour: int
    recommended_collection_time: str
    seasonal_factor: float


class DashboardStats(BaseModel):
    total_facilities: int = 0
    active_alerts: int = 0
    total_tracked_items: int = 0
    waste_treated_today_kg: float = 0
    compliance_rate: float = 0
    segregation_accuracy: float = 0
    active_routes: int = 0
    facilities_at_risk: int = 0
    monthly_trend: list[dict] = []
    category_distribution: list[dict] = []
    recent_activity: list[dict] = []
    alerts: list[dict] = []
