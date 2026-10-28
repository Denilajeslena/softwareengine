from flask import Blueprint, request, g
from app.utils.response import success_response, error_response
from app.utils.auth import roles_required
from app.services.inventory_service import (
    get_inventory_overview,
    get_all_stacks,
    create_or_update_stack,
    record_inventory_audit,
)
from app.services.audit_service import log_audit_event

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.route("/overview", methods=["GET"])
@roles_required("librarian", "admin")
def get_overview():
    """
    GET /api/inventory/overview
    Retrieves real-time physical stack capacity, total copies, and utilization rate.
    """
    overview = get_inventory_overview()
    return success_response(
        data=overview,
        message="Inventory stack overview retrieved successfully.",
        status_code=200,
    )


@inventory_bp.route("/stacks", methods=["GET"])
@roles_required("librarian", "admin")
def list_stacks():
    """
    GET /api/inventory/stacks
    Lists physical shelf stacks.
    """
    stacks = get_all_stacks()
    return success_response(
        data={"stacks": stacks},
        message=f"Retrieved {len(stacks)} physical inventory stacks.",
        status_code=200,
    )


@inventory_bp.route("/stacks", methods=["POST"])
@roles_required("librarian", "admin")
def save_stack():
    """
    POST /api/inventory/stacks
    Creates or updates a physical stack location.
    """
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()

    if not name or len(name) < 3:
        return error_response(
            message="Stack name must be at least 3 characters.",
            status_code=400,
            error_code="VALIDATION_STACK_NAME",
        )

    stack = create_or_update_stack(data)
    actor_email = g.current_user.get("email", "librarian@scholars.shelf")
    log_audit_event(
        actor=actor_email,
        role=g.current_user.get("role", "librarian"),
        action="STACK_MODIFY",
        resource_type="inventory",
        resource_id=stack["id"],
        details=f"Configured stack section '{stack['name']}' (Capacity: {stack['capacity']}).",
        level="INFO",
    )
    return success_response(
        data={"stack": stack},
        message=f"Stack section '{stack['name']}' saved successfully.",
        status_code=201,
    )


@inventory_bp.route("/audits", methods=["POST"])
@roles_required("librarian", "admin")
def perform_audit():
    """
    POST /api/inventory/audits
    Executes a manual or barcode-driven inventory reconciliation against physical shelf copies.
    """
    data = request.get_json(silent=True) or {}
    stack_id = data.get("stackId")
    scanned_barcodes = data.get("scannedBarcodes", [])
    notes = data.get("notes", "")

    if not stack_id:
        return error_response(
            message="Target stack section is required for inventory audit.",
            status_code=400,
            error_code="STACK_REQUIRED",
        )

    if not isinstance(scanned_barcodes, list):
        return error_response(
            message="scannedBarcodes must be an array of scanned barcode strings.",
            status_code=400,
            error_code="INVALID_BARCODES_FORMAT",
        )

    auditor_email = g.current_user.get("email", "librarian@scholars.shelf")

    try:
        report = record_inventory_audit(
            stack_id=stack_id,
            auditor_email=auditor_email,
            scanned_barcodes=scanned_barcodes,
            notes=notes,
        )

        log_audit_event(
            actor=auditor_email,
            role=g.current_user.get("role", "librarian"),
            action="INVENTORY_AUDIT",
            resource_type="inventory",
            resource_id=stack_id,
            details=(
                f"Physical stack audit for '{report['stackName']}': "
                f"{report['matchedCount']}/{report['totalExpected']} matched ({report['matchRate']}% match rate)."
            ),
            level="SUCCESS" if report["outcome"] == "Reconciled" else "WARNING",
        )

        return success_response(
            data={"auditReport": report},
            message=f"Audit completed: {report['outcome']} with {report['matchRate']}% match rate.",
            status_code=201,
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=400,
            error_code="AUDIT_FAILED",
        )
