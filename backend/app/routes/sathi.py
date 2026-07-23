"""
Sāthī Network — API Routes.

Endpoints for:
- Network dashboard and global statistics
- Blockchain explorer (verify waste chains)
- Compliance scoring and heatmap
- CBWTF capacity marketplace
- AI enforcement engine (simulated)
"""

import hashlib
import json
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.blockchain_service import sathi_network
from app.services import cpcb_service

router = APIRouter(prefix="/sathi", tags=["Sāthī Network"])


# ── Request Models ────────────────────────────────────────────────────────

class HandoffRecord(BaseModel):
    barcode: str
    event: str
    actor: str
    location: str
    weight_kg: float | None = None
    category: str | None = None
    waste_type: str | None = None
    temperature: float | None = None
    notes: str | None = None


class MarketplaceListing(BaseModel):
    facility: str
    location: str
    available_capacity_kg: float
    price_per_kg: float
    services: list[str]
    certification: str


# ── Network Dashboard ─────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_sathi_dashboard():
    """Get the Sāthī Network global dashboard with all key metrics."""
    stats = sathi_network.get_network_stats()

    # Collect facility compliance data
    facilities = []
    for fac_id, fac_data in sathi_network._facilities.items():
        facilities.append({
            "id": fac_id,
            "name": fac_data["name"],
            "type": fac_data["type"],
            "city": fac_data["city"],
            "state": fac_data["state"],
            "compliance_score": fac_data["compliance_score"],
            "items_tracked": fac_data.get("total_blocks_verified", 0),
        })

    # Sort by compliance
    facilities.sort(key=lambda f: f["compliance_score"], reverse=True)

    # Recent network activity (simulated)
    recent_activity = []
    events = ["block_mined", "chain_verified", "compliance_report", "handoff_recorded"]
    for i in range(10):
        recent_activity.append({
            "id": f"ACT-{i+1:04d}",
            "type": random.choice(events),
            "description": random.choice([
                "New waste item registered on network",
                "Blockchain chain verified — 5 blocks validated",
                "Compliance report generated for facility",
                "Handoff recorded — Collection → Treatment",
                "New facility joined Sāthī Network",
                "Marketplace listing created",
                "AI audit completed — no violations found",
                "CPCB report auto-submitted",
                "Segregation anomaly detected and resolved",
                "Network integrity check passed",
            ]),
            "timestamp": (datetime.now() - timedelta(minutes=random.randint(5, 480))).isoformat(),
            "status": random.choice(["completed", "verified", "pending"]),
        })

    recent_activity.sort(key=lambda a: a["timestamp"], reverse=True)

    # Monthly growth
    monthly_growth = []
    for i in range(6):
        m = (datetime.now().month - i) or 12
        y = datetime.now().year - (1 if datetime.now().month - i <= 0 else 0)
        monthly_growth.append({
            "month": f"{y}-{m:02d}",
            "items_tracked": random.randint(30, 80) + i * 15,
            "blocks_mined": random.randint(100, 300) + i * 40,
            "compliance_rate": round(70 + i * 4 + random.uniform(-2, 2), 1),
        })
    monthly_growth.reverse()

    return {
        **stats,
        "facilities": facilities,
        "recent_activity": recent_activity,
        "monthly_growth": monthly_growth,
        "network_coverage": {
            "states_covered": 8,
            "cities_covered": 14,
            "total_hospitals": len(facilities),
            "active_cbwtf": 3,
        },
    }


# ── Blockchain Explorer ───────────────────────────────────────────────────

@router.get("/explorer/stats")
async def get_blockchain_stats():
    """Get global blockchain statistics across the entire network."""
    chains = sathi_network._chains

    total_blocks = sum(len(c.chain) for c in chains.values())
    total_chains = len(chains)

    # Block generation rate (last 24h simulated)
    blocks_last_24h = random.randint(40, 120)

    # Average verification time
    avg_verification_ms = round(random.uniform(12, 45), 1)

    return {
        "total_chains": total_chains,
        "total_blocks": total_blocks,
        "blocks_last_24h": blocks_last_24h,
        "avg_block_time_seconds": round(86400 / max(blocks_last_24h, 1), 1),
        "avg_verification_ms": avg_verification_ms,
        "chain_integrity": round(
            sum(1 for c in chains.values() if c.verify_chain()["is_valid"]) / max(total_chains, 1) * 100,
            1,
        ),
        "genesis_blocks": total_chains,
        "algorithm": "SHA-256",
        "network_hash_rate": f"{random.randint(100, 500)} hashes/sec (simulated)",
    }


@router.get("/explorer/chain/{barcode}")
async def explore_chain(barcode: str):
    """Explore the full blockchain for a specific waste item."""
    history = sathi_network.get_waste_history(barcode)
    if not history:
        raise HTTPException(
            status_code=404,
            detail=f"Waste item {barcode} not found on Sāthī Network",
        )

    verification = sathi_network.verify_waste_item(barcode)

    return {
        "barcode": barcode,
        "chain": history,
        "chain_length": len(history),
        "verification": verification,
        "merkle_root": verification.get("merkle_root"),
    }


@router.get("/explorer/search")
async def search_chain(
    query: str = Query(..., description="Search barcode, facility, or actor"),
):
    """Search across all blockchains in the network."""
    results = []
    chains = sathi_network._chains
    q = query.lower()

    for barcode, chain in chains.items():
        if q in barcode.lower():
            results.append({
                "barcode": barcode,
                "block_count": len(chain.chain),
                "latest_event": chain.get_latest_block().data.get("event") if chain.get_latest_block() else None,
                "is_verified": chain.verify_chain()["is_valid"],
            })
            continue

        # Search block data
        for block in chain.chain:
            data_str = json.dumps(block.data).lower()
            if q in data_str:
                results.append({
                    "barcode": barcode,
                    "block_index": block.index,
                    "event": block.data.get("event"),
                    "actor": block.data.get("actor"),
                    "is_verified": chain.verify_chain()["is_valid"],
                })
                break

    return {
        "query": query,
        "results_count": len(results),
        "results": results[:20],  # Limit to 20 results
    }


# ── Handoff Recording ─────────────────────────────────────────────────────

@router.post("/handoff")
async def record_handoff(handoff: HandoffRecord):
    """Record a waste handoff event on the Sāthī Network blockchain."""
    metadata = {}
    if handoff.weight_kg is not None:
        metadata["weight_kg"] = handoff.weight_kg
    if handoff.category is not None:
        metadata["category"] = handoff.category
    if handoff.waste_type is not None:
        metadata["waste_type"] = handoff.waste_type
    if handoff.temperature is not None:
        metadata["temperature"] = handoff.temperature
    if handoff.notes is not None:
        metadata["notes"] = handoff.notes

    try:
        block = sathi_network.record_handoff(
            barcode=handoff.barcode,
            event=handoff.event,
            actor=handoff.actor,
            location=handoff.location,
            metadata=metadata,
        )
        return {
            "success": True,
            "message": f"Handoff '{handoff.event}' recorded for {handoff.barcode}",
            "block": block,
            "verification": sathi_network.verify_waste_item(handoff.barcode),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Compliance Engine ─────────────────────────────────────────────────────

@router.get("/compliance/overview")
async def get_compliance_overview():
    """Get a compliance overview across all facilities on the network."""
    facilities = []
    for fac_id, fac_data in sathi_network._facilities.items():
        score = fac_data["compliance_score"]
        facilities.append({
            "id": fac_id,
            "name": fac_data["name"],
            "city": fac_data["city"],
            "state": fac_data["state"],
            "compliance_score": score,
            "status": "compliant" if score >= 85 else "needs_attention" if score >= 70 else "non_compliant",
            "registration": fac_data["registration"],
            "last_audit": (datetime.now() - timedelta(days=random.randint(15, 90))).isoformat(),
        })

    # Calculate aggregate
    scores = [f["compliance_score"] for f in facilities]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    status_counts = {"compliant": 0, "needs_attention": 0, "non_compliant": 0}
    for f in facilities:
        status_counts[f["status"]] += 1

    return {
        "total_facilities": len(facilities),
        "average_compliance_score": avg_score,
        "status_breakdown": status_counts,
        "facilities": sorted(facilities, key=lambda f: f["compliance_score"]),
        "network_health": "strong" if avg_score >= 85 else "moderate" if avg_score >= 70 else "needs_improvement",
        "reporting_period": datetime.now().strftime("%B %Y"),
    }


@router.get("/compliance/facility/{facility_id}")
async def get_facility_compliance(facility_id: str):
    """Get detailed compliance data for a specific facility."""
    if facility_id not in sathi_network._facilities:
        raise HTTPException(status_code=404, detail=f"Facility {facility_id} not found")

    fac = sathi_network._facilities[facility_id]

    # Simulated compliance breakdown
    metrics = {
        "segregation_accuracy": round(random.uniform(78, 98), 1),
        "collection_timeliness": round(random.uniform(82, 99), 1),
        "storage_compliance": round(random.uniform(75, 97), 1),
        "treatment_efficiency": round(random.uniform(80, 100), 1),
        "documentation_quality": round(random.uniform(70, 95), 1),
        "staff_training": round(random.uniform(65, 92), 1),
    }

    # Recent violations
    violations = []
    if fac["compliance_score"] < 85:
        violation_types = [
            "Segregation protocol violation in General Ward",
            "Storage temperature exceeded threshold",
            "Collection delay > 2 hours",
            "Weight discrepancy in reported vs actual",
            "Missing documentation for cytotoxic waste",
        ]
        for i in range(random.randint(1, 3)):
            violations.append({
                "id": f"VIO-{facility_id}-{i+1}",
                "type": random.choice([
                    "segregation_error", "temp_violation",
                    "collection_delay", "documentation_gap",
                ]),
                "description": random.choice(violation_types),
                "detected_at": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                "resolved": random.choice([True, False]),
                "severity": random.choice(["low", "medium", "high"]),
            })

    return {
        "facility": fac,
        "compliance_score": fac["compliance_score"],
        "status": "compliant" if fac["compliance_score"] >= 85 else "needs_attention" if fac["compliance_score"] >= 70 else "non_compliant",
        "metrics": metrics,
        "overall_metric": round(sum(metrics.values()) / len(metrics), 1),
        "violations": violations,
        "violations_count": len(violations),
        "recommendations": [
            "Implement real-time bin monitoring system",
            "Conduct monthly segregation training",
            "Deploy IoT temperature sensors",
            "Upgrade to blockchain-verified tracking",
            "Schedule weekly internal audits",
        ][:random.randint(2, 4)],
    }


# ── AI Enforcement Engine ─────────────────────────────────────────────────

@router.post("/ai/enforce")
async def run_ai_enforcement(barcode: str):
    """
    Run AI-powered compliance enforcement on a waste item's chain.

    Simulates computer vision audit, segregation check, and anomaly detection.
    """
    if barcode not in sathi_network._chains:
        raise HTTPException(status_code=404, detail=f"Item {barcode} not found")

    chain = sathi_network._chains[barcode]
    blocks = chain.get_audit_trail()

    # Simulate AI analysis
    findings = []

    # 1. Chain completeness check
    required_events = {"generation", "segregation", "collection", "treatment", "disposal"}
    found_events = set()
    for block in blocks:
        event = block["data"].get("event")
        if event:
            found_events.add(event)

    missing = required_events - found_events
    if missing:
        findings.append({
            "type": "incomplete_chain",
            "severity": "high",
            "detail": f"Missing required handoffs: {', '.join(missing)}",
            "recommendation": "Ensure all lifecycle events are recorded",
        })

    # 2. Segregation audit (simulated)
    if random.random() > 0.7:
        findings.append({
            "type": "segregation_anomaly",
            "severity": "medium",
            "detail": "Potential cross-contamination detected in waste category assignment",
            "recommendation": "Verify waste type matches category per BMW Rules 2016",
        })

    # 3. Weight consistency check (simulated)
    weights = []
    for block in blocks:
        w = block["data"].get("weight_kg")
        if w:
            weights.append(w)
    if len(weights) >= 2 and max(weights) > min(weights) * 1.15:
        findings.append({
            "type": "weight_discrepancy",
            "severity": "low",
            "detail": f"Weight varies across handoffs ({min(weights)}-{max(weights)} kg)",
            "recommendation": "Verify weighing scale calibration",
        })

    # 4. Timing audit (simulated)
    timestamps = []
    for block in blocks:
        ts = block["data"].get("timestamp_utc")
        if ts:
            try:
                timestamps.append(datetime.fromisoformat(ts))
            except (ValueError, TypeError):
                pass

    if len(timestamps) >= 2:
        gaps = [(timestamps[i+1] - timestamps[i]).total_seconds() / 3600 for i in range(len(timestamps)-1)]
        if any(g > 48 for g in gaps):
            findings.append({
                "type": "storage_time_exceeded",
                "severity": "high",
                "detail": "Waste storage exceeded 48-hour limit between handoffs",
                "recommendation": "Immediate collection required per CPCB guidelines",
            })

    score = max(0, 100 - sum(
        {"low": 5, "medium": 15, "high": 30}.get(f["severity"], 10)
        for f in findings
    ))

    return {
        "barcode": barcode,
        "ai_audit_id": f"AUDIT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "executed_at": datetime.now().isoformat(),
        "compliance_score": score,
        "status": "passed" if score >= 80 else "needs_review" if score >= 60 else "failed",
        "findings": findings,
        "findings_count": len(findings),
        "blocks_audited": len(blocks),
        "chain_integrity": chain.verify_chain()["is_valid"],
        "ai_model": "SāthīNet-AI v1.0 (simulated)",
    }


# ── Marketplace ───────────────────────────────────────────────────────────

@router.get("/marketplace")
async def get_marketplace():
    """Get CBWTF capacity marketplace listings."""
    listings = sathi_network.get_marketplace_listings()

    # Add some dynamic simulated listings
    if len(listings) < 6:
        extra = [
            {
                "id": "MKT-004",
                "facility": "BioCycle Treatment Center",
                "location": "Hyderabad, Telangana",
                "available_capacity_kg": 600,
                "price_per_kg": 20.00,
                "services": ["chemical_treatment", "autoclaving", "recycling"],
                "certification": "CPCB-Approved",
                "listed_at": (datetime.now() - timedelta(days=2)).isoformat(),
                "status": "available",
            },
            {
                "id": "MKT-005",
                "facility": "GreenEarth Disposal Services",
                "location": "Chennai, Tamil Nadu",
                "available_capacity_kg": 1500,
                "price_per_kg": 16.25,
                "services": ["incineration", "secured_landfill", "sharps_destruction"],
                "certification": "CPCB-Approved",
                "listed_at": (datetime.now() - timedelta(days=5)).isoformat(),
                "status": "available",
            },
        ]
        listings.extend(extra)

    # Market stats
    total_capacity = sum(l["available_capacity_kg"] for l in listings)
    avg_price = round(
        sum(l["price_per_kg"] for l in listings) / len(listings), 2
    ) if listings else 0

    return {
        "listings": listings,
        "total_listings": len(listings),
        "total_available_capacity_kg": total_capacity,
        "average_price_per_kg": avg_price,
        "price_range": {
            "min": min(l["price_per_kg"] for l in listings) if listings else 0,
            "max": max(l["price_per_kg"] for l in listings) if listings else 0,
        },
        "market_health": "active",
    }


@router.post("/marketplace/list")
async def create_marketplace_listing(listing: MarketplaceListing):
    """Create a new CBWTF capacity marketplace listing."""
    listing_id = f"MKT-{random.randint(1000, 9999)}"
    entry = {
        "id": listing_id,
        **listing.model_dump(),
        "listed_at": datetime.now().isoformat(),
        "status": "available",
    }
    sathi_network.add_marketplace_listing(entry)
    return {
        "success": True,
        "message": "Listing created on Sāthī Marketplace",
        "listing": entry,
    }


# ── CPCB Auto-Reporting ──────────────────────────────────────────────────

@router.get("/reports/list")
async def list_cpcb_reports(
    facility_id: str | None = Query(None),
    limit: int = Query(20),
    offset: int = Query(0),
    session: AsyncSession = Depends(get_session),
):
    """List all CPCB compliance reports, optionally filtered by facility."""
    reports, total = await cpcb_service.list_reports(session, facility_id, limit, offset)
    return {
        "reports": reports,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/reports/{report_id}")
async def get_cpcb_report(
    report_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get a specific CPCB report by ID."""
    report = await cpcb_service.get_report(session, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/reports/{report_id}/download")
async def download_cpcb_report(
    report_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Download a CPCB compliance report as JSON data."""
    report = await cpcb_service.get_report(session, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.delete("/reports/{report_id}")
async def delete_cpcb_report(
    report_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete a CPCB compliance report."""
    deleted = await cpcb_service.delete_report(session, report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "message": f"Report {report_id} deleted"}


@router.get("/report/generate")
async def generate_cpcb_report(
    facility_id: str = Query("FAC-001"),
    month: str | None = Query(None, description="Month in YYYY-MM format"),
    session: AsyncSession = Depends(get_session),
):
    """Generate and persist a CPCB-compliant compliance report."""
    from data.sample_data import FACILITIES

    fac = next((f for f in FACILITIES if f.id == facility_id), None)
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")

    report = await cpcb_service.generate_report(
        session=session,
        facility_id=fac.id,
        facility_name=fac.name,
        month=month,
    )

    # Include full facility details
    report["facility"] = {
        "name": fac.name,
        "registration": fac.registration_number,
        "address": fac.address,
        "city": fac.city,
        "state": fac.state,
    }
    report["generated_by"] = "Sāthī Network — Auto-Compliance Engine"
    report["submission_status"] = "auto_submitted"
    report["certification"] = "CPCB BMW Rules 2016 Compliant"

    # Include the full report_data JSON blob for nested structure
    stored_report = await cpcb_service.get_report(session, report["report_id"])
    if stored_report and stored_report.get("report_data"):
        report["waste_data"] = stored_report["report_data"].get("waste_data", {})
        report["blockchain_verification"] = stored_report["report_data"].get("blockchain_verification", {})
        report["compliance_summary"] = stored_report["report_data"].get("compliance_summary", {})
    else:
        # Fallback: build from flat fields
        report["waste_data"] = {
            "total_generated_kg": report.get("total_generated_kg", 0),
            "items_tracked": report.get("items_tracked", 0),
            "blocks_verified": report.get("blocks_verified", 0),
            "chain_integrity": report.get("chain_integrity", 100.0),
        }
        report["blockchain_verification"] = {
            "method": "SHA-256 Merkle Tree",
            "chains_verified": report.get("items_tracked", 0),
            "all_chains_intact": report.get("all_chains_intact", True),
            "verification_timestamp": report.get("generated_at"),
        }

    return report
