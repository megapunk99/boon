"""
Sāthī Network — Blockchain Verification Service.

A lightweight, cryptographic chain-of-custody system for biomedical waste.
Each handoff (generation → segregation → collection → treatment → disposal)
creates an immutable block linked via SHA-256 hashes.

This is NOT a full distributed ledger — it's a verifiable audit trail
designed for CPCB compliance and regulatory transparency.
"""

import hashlib
import json
import random
import string
from datetime import datetime, timedelta
from typing import Optional


# ── Block Structure ───────────────────────────────────────────────────────

class Block:
    """A single block in the waste tracking chain."""

    def __init__(
        self,
        index: int,
        timestamp: str,
        data: dict,
        previous_hash: str,
        nonce: int = 0,
    ):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.compute_hash()

    def compute_hash(self) -> str:
        """Compute SHA-256 hash of the block contents."""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
        }, sort_keys=True, default=str)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def to_dict(self) -> dict:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
            "nonce": self.nonce,
        }


# ── Blockchain ────────────────────────────────────────────────────────────

class WasteBlockchain:
    """
    Immutable chain of custody for biomedical waste.

    Each waste item gets its own blockchain instance upon generation.
    Every handoff, treatment, and disposal event adds a new block.
    """

    def __init__(self, barcode: str):
        self.barcode = barcode
        self.chain: list[Block] = []
        self._create_genesis_block()

    def _create_genesis_block(self):
        """Create the genesis block when waste is first generated."""
        genesis_data = {
            "event": "generation",
            "barcode": self.barcode,
            "status": "created",
            "actor": "system",
            "verification": self._generate_verification_code(),
        }
        genesis = Block(
            index=0,
            timestamp=datetime.now().isoformat(),
            data=genesis_data,
            previous_hash="0" * 64,
        )
        self.chain.append(genesis)

    def add_block(self, data: dict) -> Block:
        """Add a new block to the chain after validation."""
        previous_block = self.chain[-1]
        new_block = Block(
            index=len(self.chain),
            timestamp=datetime.now().isoformat(),
            data={**data, "verification": self._generate_verification_code()},
            previous_hash=previous_block.hash,
        )
        self.chain.append(new_block)
        return new_block

    def verify_chain(self) -> dict:
        """
        Verify the integrity of the entire chain.
        Returns a detailed verification report.
        """
        issues = []
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            # Check hash integrity
            if current.hash != current.compute_hash():
                issues.append({
                    "block": i,
                    "issue": "hash_mismatch",
                    "detail": "Block hash does not match computed hash",
                })

            # Check chain linkage
            if current.previous_hash != previous.hash:
                issues.append({
                    "block": i,
                    "issue": "chain_break",
                    "detail": "Previous hash does not match actual previous block hash",
                })

        return {
            "barcode": self.barcode,
            "chain_length": len(self.chain),
            "is_valid": len(issues) == 0,
            "issues": issues,
            "merkle_root": self._compute_merkle_root(),
            "verified_at": datetime.now().isoformat(),
        }

    def _compute_merkle_root(self) -> str:
        """Compute a simple Merkle root hash of all block hashes."""
        if not self.chain:
            return "0" * 64
        combined = "".join(block.hash for block in self.chain)
        return hashlib.sha256(combined.encode()).hexdigest()

    def _generate_verification_code(self) -> str:
        """Generate a short verification code for the block."""
        chars = string.ascii_uppercase + string.digits
        return "".join(random.choices(chars, k=8))

    def get_audit_trail(self) -> list[dict]:
        """Get the full audit trail as a list of dicts."""
        return [block.to_dict() for block in self.chain]

    def get_latest_block(self) -> Optional[Block]:
        """Get the most recent block in the chain."""
        return self.chain[-1] if self.chain else None


# ── Network Registry ──────────────────────────────────────────────────────

class SathiNetwork:
    """
    The Sāthī Network — a registry of all waste blockchains across India.

    Maintains a global view of all tracked waste items, facilities,
    and compliance metrics across the network.
    """

    def __init__(self):
        self._chains: dict[str, WasteBlockchain] = {}
        self._facilities: dict[str, dict] = {}
        self._cbwtf_market: list[dict] = []

    def register_waste_item(self, barcode: str) -> WasteBlockchain:
        """Register a new waste item and create its blockchain."""
        if barcode not in self._chains:
            self._chains[barcode] = WasteBlockchain(barcode)
        return self._chains[barcode]

    def record_handoff(
        self,
        barcode: str,
        event: str,
        actor: str,
        location: str,
        metadata: dict | None = None,
    ) -> dict:
        """Record a handoff event in the waste item's blockchain."""
        if barcode not in self._chains:
            self.register_waste_item(barcode)

        chain = self._chains[barcode]
        block_data = {
            "event": event,
            "barcode": barcode,
            "status": event,
            "actor": actor,
            "location": location,
            "timestamp_utc": datetime.now().isoformat(),
            **(metadata or {}),
        }
        block = chain.add_block(block_data)
        return block.to_dict()

    def verify_waste_item(self, barcode: str) -> dict:
        """Verify the blockchain integrity for a waste item."""
        if barcode not in self._chains:
            return {
                "barcode": barcode,
                "found": False,
                "message": "Waste item not found in Sāthī Network",
            }
        chain = self._chains[barcode]
        verification = chain.verify_chain()
        return {
            "barcode": barcode,
            "found": True,
            **verification,
            "latest_event": chain.get_latest_block().data.get("event") if chain.get_latest_block() else None,
        }

    def get_waste_history(self, barcode: str) -> list[dict]:
        """Get the full handoff history for a waste item."""
        if barcode not in self._chains:
            return []
        return self._chains[barcode].get_audit_trail()

    def register_facility(self, facility_data: dict):
        """Register a facility on the Sāthī Network."""
        self._facilities[facility_data["id"]] = {
            **facility_data,
            "registered_at": datetime.now().isoformat(),
            "total_blocks_verified": 0,
            "compliance_score": 100.0,
        }

    def update_compliance_score(self, facility_id: str, score: float):
        """Update a facility's compliance score."""
        if facility_id in self._facilities:
            self._facilities[facility_id]["compliance_score"] = round(score, 1)

    def get_network_stats(self) -> dict:
        """Get global network statistics."""
        total_items = len(self._chains)
        total_blocks = sum(len(c.chain) for c in self._chains.values())
        verified_items = sum(
            1 for c in self._chains.values() if c.verify_chain()["is_valid"]
        )

        return {
            "network_name": "Sāthī — India's Waste Intelligence Network",
            "total_waste_items_tracked": total_items,
            "total_blocks_mined": total_blocks,
            "verified_chains": verified_items,
            "integrity_rate": round((verified_items / total_items) * 100, 1) if total_items else 100.0,
            "registered_facilities": len(self._facilities),
            "average_chain_length": round(total_blocks / total_items, 1) if total_items else 0,
            "network_status": "operational",
            "last_block_mined": datetime.now().isoformat(),
            "total_compliance_reports": sum(
                1 for f in self._facilities.values()
                if f["compliance_score"] >= 85
            ),
        }

    def get_marketplace_listings(self) -> list[dict]:
        """Get CBWTF capacity marketplace listings."""
        return self._cbwtf_market

    def add_marketplace_listing(self, listing: dict):
        """Add a capacity listing to the marketplace."""
        self._cbwtf_market.append({
            **listing,
            "listed_at": datetime.now().isoformat(),
            "status": "available",
        })


# ── Global Network Singleton ──────────────────────────────────────────────

# The one true Sāthī Network instance
sathi_network = SathiNetwork()


# ── Utility: Seed initial data ────────────────────────────────────────────

def seed_sathi_network():
    """Seed the network with sample blockchain data for demo."""
    from data.sample_data import SAMPLE_WASTE_ITEMS, FACILITIES

    # Register facilities
    for fac in FACILITIES:
        sathi_network.register_facility({
            "id": fac.id,
            "name": fac.name,
            "type": fac.type,
            "city": fac.city,
            "state": fac.state,
            "registration": fac.registration_number,
            "capacity_kg": fac.capacity_kg_per_day,
        })

    # Create blockchains for sample waste items
    handoff_events = [
        "generation", "segregation", "collection",
        "treatment", "disposal",
    ]

    for item in SAMPLE_WASTE_ITEMS[:50]:  # First 50 items
        chain = sathi_network.register_waste_item(item.barcode)

        # Simulate the handoff chain
        events = handoff_events[:random.randint(2, 5)]
        for i, event in enumerate(events):
            actor = random.choice([
                "Waste Handler", "Nurse Station", "Collection Team",
                "CBWTF Operator", "Compliance Officer",
            ])
            location = random.choice([
                item.source, f"{item.source} - {item.department}",
                "Collection Vehicle", "CBWTF Facility", "TSDF Landfill",
            ])
            chain.add_block({
                "event": event,
                "barcode": item.barcode,
                "status": event,
                "actor": actor,
                "location": location,
                "timestamp_utc": (
                    datetime.now() - timedelta(hours=random.randint(1, 72))
                ).isoformat(),
                "weight_kg": item.weight_kg,
                "category": item.category.value,
                "waste_type": item.waste_type,
                "temperature": item.temperature_celsius,
            })

        # Update facility compliance scores
        for fac in FACILITIES:
            score = random.uniform(72, 99)
            sathi_network.update_compliance_score(fac.id, score)

    # Seed marketplace
    sathi_network.add_marketplace_listing({
        "id": "MKT-001",
        "facility": "GreenMed CBWTF",
        "location": "Bengaluru, Karnataka",
        "available_capacity_kg": 1200,
        "price_per_kg": 18.50,
        "services": ["incineration", "autoclaving", "chemical_treatment"],
        "certification": "CPCB-Approved",
    })
    sathi_network.add_marketplace_listing({
        "id": "MKT-002",
        "facility": "EcoWaste Solutions",
        "location": "Mumbai, Maharashtra",
        "available_capacity_kg": 850,
        "price_per_kg": 22.00,
        "services": ["autoclaving", "microwave_treatment", "sharps_destruction"],
        "certification": "CPCB-Approved",
    })
    sathi_network.add_marketplace_listing({
        "id": "MKT-003",
        "facility": "CleanHarbor BioMed Facility",
        "location": "New Delhi, Delhi",
        "available_capacity_kg": 2000,
        "price_per_kg": 15.75,
        "services": ["incineration", "plasma_pyrolysis", "chemical_disinfection"],
        "certification": "CPCB-Approved",
    })


# Seed on import if not already seeded
if not sathi_network._chains:
    seed_sathi_network()
