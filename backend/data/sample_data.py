"""Boon — Sample data for demo and development."""

from datetime import datetime, timedelta
import random

from app.models.schemas import (
    WasteItem, WasteCategory, WasteStatus, WasteSeverity,
    Facility, CollectionRoute, Alert,
)

# ── Healthcare Facilities ─────────────────────────────────────────────────
FACILITIES = [
    Facility(
        id="FAC-001", name="AIIMS Delhi", type="Hospital",
        address="Ansari Nagar, New Delhi", city="New Delhi", state="Delhi",
        registration_number="DL-BMW-001-2025", capacity_kg_per_day=450.0,
        current_load_kg=320.0, compliance_status="compliant",
        last_audit=datetime.now() - timedelta(days=45),
        gps_lat=28.5672, gps_lng=77.2100,
    ),
    Facility(
        id="FAC-002", name="Fortis Memorial Research Institute", type="Hospital",
        address="Sector 44, Gurugram", city="Gurugram", state="Haryana",
        registration_number="HR-BMW-042-2025", capacity_kg_per_day=280.0,
        current_load_kg=195.0, compliance_status="compliant",
        last_audit=datetime.now() - timedelta(days=30),
        gps_lat=28.4595, gps_lng=77.0266,
    ),
    Facility(
        id="FAC-003", name="Tata Memorial Hospital", type="Hospital",
        address="Dr E Borges Road, Parel, Mumbai", city="Mumbai", state="Maharashtra",
        registration_number="MH-BMW-189-2025", capacity_kg_per_day=350.0,
        current_load_kg=275.0, compliance_status="needs_attention",
        last_audit=datetime.now() - timedelta(days=90),
        gps_lat=19.0086, gps_lng=72.8410,
    ),
    Facility(
        id="FAC-004", name="Apollo Hospitals Chennai", type="Hospital",
        address="Greams Lane, Chennai", city="Chennai", state="Tamil Nadu",
        registration_number="TN-BMW-067-2025", capacity_kg_per_day=320.0,
        current_load_kg=210.0, compliance_status="compliant",
        last_audit=datetime.now() - timedelta(days=60),
        gps_lat=13.0668, gps_lng=80.2513,
    ),
    Facility(
        id="FAC-005", name="NIMHANS Bangalore", type="Hospital",
        address="Hosur Road, Bangalore", city="Bangalore", state="Karnataka",
        registration_number="KA-BMW-033-2025", capacity_kg_per_day=200.0,
        current_load_kg=165.0, compliance_status="non_compliant",
        last_audit=datetime.now() - timedelta(days=120),
        gps_lat=12.9432, gps_lng=77.5965,
    ),
    Facility(
        id="FAC-006", name="Kasturba Medical College", type="Hospital",
        address="Manipal, Udupi", city="Manipal", state="Karnataka",
        registration_number="KA-BMW-078-2025", capacity_kg_per_day=180.0,
        current_load_kg=142.0, compliance_status="compliant",
        last_audit=datetime.now() - timedelta(days=20),
        gps_lat=13.3520, gps_lng=74.7930,
    ),
    Facility(
        id="FAC-007", name="SMS Medical College Jaipur", type="Hospital",
        address="Jawahar Lal Nehru Marg, Jaipur", city="Jaipur", state="Rajasthan",
        registration_number="RJ-BMW-022-2025", capacity_kg_per_day=220.0,
        current_load_kg=188.0, compliance_status="needs_attention",
        last_audit=datetime.now() - timedelta(days=75),
        gps_lat=26.8938, gps_lng=75.8002,
    ),
    Facility(
        id="FAC-008", name="PGIMER Chandigarh", type="Hospital",
        address="Sector 12, Chandigarh", city="Chandigarh", state="Chandigarh",
        registration_number="CH-BMW-005-2025", capacity_kg_per_day=300.0,
        current_load_kg=248.0, compliance_status="compliant",
        last_audit=datetime.now() - timedelta(days=15),
        gps_lat=30.7651, gps_lng=76.7732,
    ),
]

# ── Waste Categories & Types ──────────────────────────────────────────────
WASTE_TYPES_BY_CATEGORY = {
    WasteCategory.YELLOW: [
        "human_anatomical_waste", "animal_waste", "microbiology_waste",
        "cytotoxic_drugs", "soiled_dressing", "blood_bags",
        "discarded_medicines", "incineration_ash",
    ],
    WasteCategory.RED: [
        "iv_tubing", "catheters", "urine_bags", "syringes_without_needle",
        "gloves", "masks", "dressing_materials", "bottles",
    ],
    WasteCategory.WHITE: [
        "hypodermic_needles", "scalpels", "blades", "surgical_knives",
        "broken_glass_ampoules", "injection_needles", "suture_needles",
    ],
    WasteCategory.BLUE: [
        "glass_vials", "glass_bottles", "metallic_implants",
        "broken_glassware", "ampoules",
    ],
}

DEPARTMENTS = [
    "Emergency", "ICU", "Operation Theater", "General Ward",
    "Maternity", "Pediatrics", "Pathology Lab", "Radiology",
    "Dental", "Pharmacy", "Administration", "Outpatient",
]

TREATMENT_METHODS = {
    WasteCategory.YELLOW: ["incineration", "plasma_pyrolysis", "chemical_treatment"],
    WasteCategory.RED: ["autoclaving", "microwave_treatment", "chemical_disinfection"],
    WasteCategory.WHITE: ["autoclaving", "sharps_destruction", "encapsulation"],
    WasteCategory.BLUE: ["autoclaving", "chemical_cleaning", "recycling"],
}

DISPOSAL_METHODS = {
    WasteCategory.YELLOW: ["secured_landfill", "energy_recovery"],
    WasteCategory.RED: ["recycling", "secured_landfill"],
    WasteCategory.WHITE: ["secured_landfill", "encapsulation_landfill"],
    WasteCategory.BLUE: ["recycling", "reuse", "secured_landfill"],
}

# ── Alert templates ───────────────────────────────────────────────────────
ALERT_TEMPLATES = [
    {"type": "overflow", "title": "Bin Overflow Warning", "message": "Waste bin in {department} has exceeded 90% capacity at {facility}", "severity": WasteSeverity.HIGH},
    {"type": "segregation_error", "title": "Segregation Protocol Violation", "message": "Improper waste segregation detected in {department} at {facility}", "severity": WasteSeverity.MEDIUM},
    {"type": "temp_violation", "title": "Storage Temperature Alert", "message": "Waste storage temperature exceeded safe threshold at {facility}", "severity": WasteSeverity.HIGH},
    {"type": "delay", "title": "Collection Delay Alert", "message": "Scheduled waste collection delayed by over 2 hours at {facility}", "severity": WasteSeverity.MEDIUM},
    {"type": "weight_discrepancy", "title": "Weight Mismatch Detected", "message": "Reported vs actual waste weight discrepancy of >15% at {facility}", "severity": WasteSeverity.CRITICAL},
    {"type": "expired_storage", "title": "Storage Time Exceeded", "message": "Biomedical waste stored for over 48 hours at {facility} {department}", "severity": WasteSeverity.HIGH},
]


def generate_barcode(facility_id: str, category: WasteCategory, index: int) -> str:
    """Generate a traceable barcode: BOON-{FAC}-{CAT}-{DATE}-{SEQ}"""
    date_str = datetime.now().strftime("%y%m%d")
    return f"BOON-{facility_id.split('-')[1]}-{category.value[:2].upper()}-{date_str}-{index:04d}"


def _generate_waste_items(count: int = 100) -> list[WasteItem]:
    """Generate realistic sample waste items for demo."""
    items = []
    now = datetime.now()
    categories = list(WasteCategory)

    for i in range(count):
        cat = random.choice(categories)
        facility = random.choice(FACILITIES)
        dept = random.choice(DEPARTMENTS)
        waste_type = random.choice(WASTE_TYPES_BY_CATEGORY[cat])
        statuses = list(WasteStatus)
        # Weighted status distribution — more items are in early stages
        weights = [0.30, 0.20, 0.15, 0.10, 0.10, 0.10, 0.05]
        status = random.choices(statuses, weights=weights, k=1)[0]

        gen_time = now - timedelta(
            hours=random.randint(1, 72),
            minutes=random.randint(0, 59),
        )
        weight = round(random.uniform(0.5, 15.0), 2)
        severity = random.choices(
            list(WasteSeverity),
            weights=[0.4, 0.3, 0.2, 0.1],
            k=1,
        )[0]

        treatment_method = random.choice(TREATMENT_METHODS[cat]) if status in [WasteStatus.TREATED, WasteStatus.DISPOSED] else None
        disposal_method = random.choice(DISPOSAL_METHODS[cat]) if status == WasteStatus.DISPOSED else None

        item = WasteItem(
            id=f"WST-{i+1:04d}",
            barcode=generate_barcode(facility.id, cat, i + 1),
            category=cat,
            waste_type=waste_type,
            source=facility.name,
            source_type=facility.type,
            department=dept,
            weight_kg=weight,
            container_type=random.choice(["bin", "bag", "container", "box"]),
            severity=severity,
            status=status,
            generated_at=gen_time,
            collected_at=gen_time + timedelta(hours=random.randint(1, 6)) if status in [WasteStatus.COLLECTED, WasteStatus.STORED, WasteStatus.TRANSIT, WasteStatus.TREATED, WasteStatus.DISPOSED] else None,
            treated_at=gen_time + timedelta(hours=random.randint(6, 24)) if status in [WasteStatus.TREATED, WasteStatus.DISPOSED] else None,
            disposed_at=gen_time + timedelta(hours=random.randint(24, 72)) if status == WasteStatus.DISPOSED else None,
            collected_by=random.choice(["Ramesh S.", "Priya K.", "Anil M.", "Sunita R.", "Vijay P."]),
            facility=random.choice(["GreenMed CBWTF", "EcoWaste Solutions", "CleanHarbor Facility", "BioCycle Center"]),
            treatment_method=treatment_method,
            disposal_method=disposal_method,
            temperature_celsius=random.uniform(4, 30) if cat != WasteCategory.YELLOW else random.uniform(600, 900),
            gps_lat=facility.gps_lat + random.uniform(-0.01, 0.01),
            gps_lng=facility.gps_lng + random.uniform(-0.01, 0.01),
            notes=random.choice([None, "Routine collection", "Priority pickup", "Awareness training completed", "New batch of cytotoxic waste"]),
        )
        items.append(item)

    return items


def _generate_alerts() -> list[Alert]:
    """Generate recent alerts for the dashboard."""
    alerts = []
    now = datetime.now()
    for i in range(8):
        template = random.choice(ALERT_TEMPLATES)
        facility = random.choice(FACILITIES)
        dept = random.choice(DEPARTMENTS)
        is_resolved = i < 3
        alerts.append(Alert(
            id=f"ALR-{i+1:04d}",
            type=template["type"],
            severity=template["severity"],
            title=template["title"],
            message=template["message"].format(department=dept, facility=facility.name),
            facility=facility.name,
            created_at=now - timedelta(hours=random.randint(1, 48)),
            resolved_at=now - timedelta(hours=random.randint(0, 24)) if is_resolved else None,
            resolved_by=random.choice(["Dr. Sharma", "Admin Staff", "Compliance Officer"]) if is_resolved else None,
        ))
    return alerts


def _generate_collection_routes() -> list[CollectionRoute]:
    """Generate active collection routes."""
    now = datetime.now()
    return [
        CollectionRoute(
            id="RT-001", vehicle_id="KA-01-BMW-001",
            driver_name="Suresh Kumar", driver_phone="+91-9876543210",
            facilities=[FACILITIES[0].name, FACILITIES[1].name, FACILITIES[4].name],
            scheduled_time=now, estimated_completion=now + timedelta(hours=4),
            status="in_progress", total_waste_kg=156.0,
        ),
        CollectionRoute(
            id="RT-002", vehicle_id="KA-01-BMW-002",
            driver_name="Mohan Reddy", driver_phone="+91-9876543211",
            facilities=[FACILITIES[2].name, FACILITIES[3].name],
            scheduled_time=now + timedelta(hours=2),
            estimated_completion=now + timedelta(hours=6),
            status="scheduled", total_waste_kg=98.0,
        ),
        CollectionRoute(
            id="RT-003", vehicle_id="KA-01-BMW-003",
            driver_name="Lakshmi Devi", driver_phone="+91-9876543212",
            facilities=[FACILITIES[5].name, FACILITIES[6].name, FACILITIES[7].name],
            scheduled_time=now - timedelta(hours=1),
            estimated_completion=now + timedelta(hours=3),
            status="in_progress", total_waste_kg=134.0,
        ),
    ]


# ── Instantiate datasets ──────────────────────────────────────────────────
SAMPLE_WASTE_ITEMS = _generate_waste_items(120)
SAMPLE_ALERTS = _generate_alerts()
SAMPLE_ROUTES = _generate_collection_routes()
