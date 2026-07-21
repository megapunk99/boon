"""Boon — Analytics and insights service."""

from datetime import datetime, timedelta
import random
import math
from collections import Counter, defaultdict

from app.models.schemas import (
    WasteItem, WasteCategory, WasteStatus, WasteSeverity,
    DashboardStats, WasteGenerationSummary, ComplianceReport, PredictionResponse,
)
from data.sample_data import SAMPLE_WASTE_ITEMS, SAMPLE_ALERTS


class AnalyticsService:
    """Provides analytical insights, compliance reporting, and predictions."""

    @staticmethod
    def get_dashboard_stats() -> DashboardStats:
        """Compute real-time dashboard statistics from sample data."""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)

        items = SAMPLE_WASTE_ITEMS
        alerts = SAMPLE_ALERTS

        # Today's stats
        today_items = [i for i in items if i.generated_at >= today_start]
        today_kg = sum(i.weight_kg for i in today_items)

        # Weekly stats
        week_items = [i for i in items if i.generated_at >= week_start]
        week_kg = sum(i.weight_kg for i in week_items)

        # Monthly stats
        month_items = [i for i in items if i.generated_at >= month_start]
        month_kg = sum(i.weight_kg for i in month_items)

        # Category breakdown
        cat_breakdown = defaultdict(float)
        for i in items:
            cat_breakdown[i.category.value] += i.weight_kg

        # Department breakdown
        dept_breakdown = defaultdict(float)
        for i in items:
            dept_breakdown[i.department] += i.weight_kg

        # Severity breakdown
        sev_breakdown = Counter(i.severity.value for i in items)

        # Status breakdown
        status_breakdown = Counter(i.status.value for i in items)

        # Compliance score (simulated)
        treated = sum(1 for i in items if i.status in [WasteStatus.TREATED, WasteStatus.DISPOSED])
        compliance_score = round((treated / len(items)) * 100, 1) if items else 0

        # Segregation accuracy (simulated)
        segregation_accuracy = round(random.uniform(82, 96), 1)

        # Monthly trend (last 6 months)
        monthly_trend = []
        for i in range(5, -1, -1):
            m = now.month - i
            y = now.year
            if m <= 0:
                m += 12
                y -= 1
            monthly_trend.append({
                "month": f"{y}-{m:02d}",
                "generated": round(random.uniform(800, 1500), 1),
                "treated": round(random.uniform(700, 1300), 1),
            })

        # Category distribution
        cat_data = [
            {"name": c.replace("_", " ").title(), "value": round(v, 1), "color": "#FFD700" if "yellow" in c else "#FF4444" if "red" in c else "#FFFFFF" if "white" in c else "#4488FF"}
            for c, v in cat_breakdown.items()
        ]

        # Recent activity
        recent = sorted(items, key=lambda x: x.generated_at, reverse=True)[:10]
        recent_activity = [
            {
                "id": item.id,
                "source": item.source,
                "category": item.category.value,
                "waste_type": item.waste_type.replace("_", " ").title(),
                "weight_kg": item.weight_kg,
                "status": item.status.value,
                "time": item.generated_at.isoformat(),
            }
            for item in recent
        ]

        # Alerts for dashboard
        alert_data = [
            {
                "id": a.id,
                "type": a.type,
                "severity": a.severity.value,
                "title": a.title,
                "message": a.message,
                "facility": a.facility,
                "created_at": a.created_at.isoformat(),
                "resolved": a.resolved_at is not None,
            }
            for a in alerts
        ]

        active_routes = 2
        facilities_at_risk = sum(1 for a in alerts if a.severity in [WasteSeverity.HIGH, WasteSeverity.CRITICAL] and not a.resolved_at)

        return DashboardStats(
            total_facilities=8,
            active_alerts=len(alerts),
            total_tracked_items=len(items),
            waste_treated_today_kg=round(today_kg, 1),
            compliance_rate=compliance_score,
            segregation_accuracy=segregation_accuracy,
            active_routes=active_routes,
            facilities_at_risk=facilities_at_risk,
            monthly_trend=monthly_trend,
            category_distribution=cat_data,
            recent_activity=recent_activity,
            alerts=alert_data,
        )

    @staticmethod
    def get_facility_summary() -> list[dict]:
        """Get compliance and waste summary for all facilities."""
        from data.sample_data import FACILITIES

        summaries = []
        for fac in FACILITIES:
            fac_items = [i for i in SAMPLE_WASTE_ITEMS if i.source == fac.name]
            total_waste = sum(i.weight_kg for i in fac_items)
            treated = sum(1 for i in fac_items if i.status in [WasteStatus.TREATED, WasteStatus.DISPOSED])
            compliance = round((treated / len(fac_items)) * 100, 1) if fac_items else 100.0

            summaries.append({
                "id": fac.id,
                "name": fac.name,
                "type": fac.type,
                "city": fac.city,
                "state": fac.state,
                "capacity_kg": fac.capacity_kg_per_day,
                "current_load_kg": fac.current_load_kg,
                "load_percentage": round((fac.current_load_kg / fac.capacity_kg_per_day) * 100, 1),
                "waste_items_count": len(fac_items),
                "total_waste_kg": round(total_waste, 1),
                "compliance_rate": compliance,
                "compliance_status": fac.compliance_status,
                "last_audit": fac.last_audit.isoformat() if fac.last_audit else None,
                "gps_lat": fac.gps_lat,
                "gps_lng": fac.gps_lng,
            })
        return summaries

    @staticmethod
    def get_generation_summary() -> WasteGenerationSummary:
        """Get waste generation summary for analytics dashboard."""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)

        items = SAMPLE_WASTE_ITEMS

        today_items = [i for i in items if i.generated_at >= today_start]
        week_items = [i for i in items if i.generated_at >= week_start]
        month_items = [i for i in items if i.generated_at >= month_start]

        cat_bd = defaultdict(float)
        dept_bd = defaultdict(float)
        for i in month_items:
            cat_bd[i.category.value] += i.weight_kg
            dept_bd[i.department] += i.weight_kg

        sev_bd = Counter(i.severity.value for i in month_items)
        st_bd = Counter(i.status.value for i in month_items)

        treated = sum(1 for i in items if i.status in [WasteStatus.TREATED, WasteStatus.DISPOSED])
        compliance = round((treated / len(items)) * 100, 1) if items else 0

        active_alerts = sum(1 for a in SAMPLE_ALERTS if not a.resolved_at)

        return WasteGenerationSummary(
            today_total_kg=round(sum(i.weight_kg for i in today_items), 1),
            today_items=len(today_items),
            weekly_total_kg=round(sum(i.weight_kg for i in week_items), 1),
            monthly_total_kg=round(sum(i.weight_kg for i in month_items), 1),
            category_breakdown={k: round(v, 1) for k, v in cat_bd.items()},
            department_breakdown={k: round(v, 1) for k, v in dept_bd.items()},
            severity_breakdown=dict(sev_bd),
            status_breakdown=dict(st_bd),
            compliance_score=compliance,
            active_alerts=active_alerts,
        )

    @staticmethod
    def get_predictions(facility_id: str, days: int = 7) -> list[PredictionResponse]:
        """Simulate ML-based waste generation predictions."""
        from data.sample_data import FACILITIES

        fac = next((f for f in FACILITIES if f.id == facility_id), FACILITIES[0])
        now = datetime.now()
        predictions = []

        for d in range(days):
            date = now + timedelta(days=d)
            # Simulate daily variation with weekly seasonality
            base = fac.current_load_kg * 0.85
            day_of_week = date.weekday()
            weekday_factor = 1.0 + (0.15 if day_of_week < 5 else -0.1)  # More on weekdays
            seasonal = 1.0 + random.uniform(-0.08, 0.08)
            predicted = round(base * weekday_factor * seasonal, 1)

            predictions.append(PredictionResponse(
                facility_id=facility_id,
                date=date.strftime("%Y-%m-%d"),
                predicted_waste_kg=predicted,
                confidence_interval=(round(predicted * 0.88, 1), round(predicted * 1.12, 1)),
                peak_generation_hour=random.randint(9, 14),
                recommended_collection_time=f"{random.randint(7, 10):02d}:00",
                seasonal_factor=round(seasonal, 3),
            ))

        return predictions

    @staticmethod
    def generate_compliance_report(facility_name: str | None = None) -> ComplianceReport:
        """Generate a CPCB-compliant waste management report."""
        from data.sample_data import FACILITIES

        fac = next((f for f in FACILITIES if f.name == facility_name), FACILITIES[0])
        items = [i for i in SAMPLE_WASTE_ITEMS if i.source == fac.name]
        now = datetime.now()

        cat_kg = defaultdict(float)
        for i in items:
            cat_kg[i.category.value] += i.weight_kg

        total_kg = sum(i.weight_kg for i in items)
        treated_count = sum(1 for i in items if i.status in [WasteStatus.TREATED, WasteStatus.DISPOSED])
        treatment_eff = round((treated_count / len(items)) * 100, 1) if items else 0

        correct_seg = sum(1 for _ in items for _ in [1] if random.random() > 0.12)  # 88% seg accuracy
        seg_accuracy = round((correct_seg / len(items)) * 100, 1) if items else 0

        collected_items = sum(1 for i in items if i.status not in [WasteStatus.GENERATED, WasteStatus.SEGREGATED])
        collection_cov = round((collected_items / len(items)) * 100, 1) if items else 0

        incidents = sum(1 for a in SAMPLE_ALERTS if a.facility == fac.name and a.severity in [WasteSeverity.HIGH, WasteSeverity.CRITICAL])
        score = round((treatment_eff * 0.35 + seg_accuracy * 0.30 + collection_cov * 0.25 + max(0, 100 - incidents * 10) * 0.10), 1)
        status = "compliant" if score >= 85 else "needs_attention" if score >= 65 else "non_compliant"

        return ComplianceReport(
            report_id=f"CPCB-{now.strftime('%Y%m')}-{fac.id.split('-')[1]}",
            facility_name=fac.name,
            reporting_period=now.strftime("%B %Y"),
            generated_at=now,
            total_waste_generated_kg=round(total_kg, 1),
            waste_by_category={k: round(v, 1) for k, v in cat_kg.items()},
            treatment_efficiency=treatment_eff,
            segregation_accuracy=seg_accuracy,
            collection_coverage=collection_cov,
            incidents=incidents,
            compliance_score=score,
            recommendations=[
                "Implement real-time bin level monitoring to optimize collection schedules",
                "Conduct monthly segregation training for all healthcare staff",
                "Deploy IoT sensors for temperature monitoring in storage areas",
                "Establish QR-code based tracking for all waste categories",
                "Schedule weekly CPCB compliance audits",
            ],
            status=status,
            certifiable=score >= 90,
        )
