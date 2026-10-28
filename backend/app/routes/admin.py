import csv
import io
from flask import Blueprint, request, g, Response
from app.utils.response import success_response, error_response
from app.utils.auth import roles_required
from app.services.policy_service import get_circulation_policy, update_circulation_policy
from app.services.audit_service import get_audit_logs, log_audit_event
from app.services.role_service import get_all_roles_with_permissions, update_role_permissions, ALL_PERMISSIONS

admin_bp = Blueprint("admin", __name__)


# -------------------------------------------------------------------
# CIRCULATION POLICY CONFIGURATION
# -------------------------------------------------------------------

@admin_bp.route("/policy", methods=["GET"])
@roles_required("admin", "librarian")
def get_policy():
    """
    GET /api/admin/policy
    Retrieves current active circulation policy.
    """
    policy = get_circulation_policy()
    return success_response(
        data={"policy": policy},
        message="Circulation policy retrieved successfully.",
        status_code=200,
    )


@admin_bp.route("/policy", methods=["PUT"])
@roles_required("admin")
def update_policy():
    """
    PUT /api/admin/policy
    Updates circulation policy and fine rates with validation.
    Immediately applies to all subsequent loan, fine, and renewal operations.
    """
    data = request.get_json(silent=True) or {}
    actor_email = g.current_user.get("email", "admin@scholars.shelf")

    try:
        new_policy = update_circulation_policy(data, actor_email=actor_email)
        log_audit_event(
            actor=actor_email,
            role="admin",
            action="POLICY_UPDATE",
            resource_type="policy",
            resource_id="active_policy",
            details=(
                f"Updated circulation rules: Loan term={new_policy['loan_duration_days']}d, "
                f"Max loans={new_policy['max_active_loans']}, Daily fine=${new_policy['overdue_fine_per_day']:.2f}, "
                f"Renewals cap={new_policy['renewal_limit']}."
            ),
            level="SUCCESS",
        )
        return success_response(
            data={"policy": new_policy},
            message="Circulation rules and policies saved to active operational configuration.",
            status_code=200,
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=400,
            error_code="INVALID_POLICY_CONFIGURATION",
        )


# -------------------------------------------------------------------
# AUDIT LOGS LEDGER & CSV EXPORT
# -------------------------------------------------------------------

@admin_bp.route("/audit-logs", methods=["GET"])
@roles_required("admin")
def get_audit_trail():
    """
    GET /api/admin/audit-logs
    Retrieves real paginated audit logs with search, action, level, and date filters.
    Pass ?format=csv to export matching records directly as CSV.
    """
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))
    action = request.args.get("action")
    level = request.args.get("level")
    search = request.args.get("search")
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")
    export_format = request.args.get("format", "").lower()

    if export_format == "csv":
        # Export all matching entries up to 1000
        logs_data = get_audit_logs(
            page=1,
            limit=1000,
            action=action,
            level=level,
            search=search,
            start_date=start_date,
            end_date=end_date,
        )
        records = logs_data.get("logs", [])

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Event ID", "Timestamp", "Actor", "Role", "Action", "Resource Type", "Resource ID", "Details", "Level"])
        for r in records:
            writer.writerow([
                r.get("id"),
                r.get("timestamp"),
                r.get("actor"),
                r.get("role"),
                r.get("action"),
                r.get("resource_type"),
                r.get("resource_id"),
                r.get("details"),
                r.get("level"),
            ])

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=scholars_shelf_audit_logs.csv"},
        )

    logs_data = get_audit_logs(
        page=page,
        limit=limit,
        action=action,
        level=level,
        search=search,
        start_date=start_date,
        end_date=end_date,
    )

    return success_response(
        data=logs_data,
        message=f"Retrieved {len(logs_data.get('logs', []))} audit events.",
        status_code=200,
    )


# -------------------------------------------------------------------
# ROLE & PERMISSION MANAGEMENT
# -------------------------------------------------------------------

@admin_bp.route("/roles", methods=["GET"])
@roles_required("admin")
def get_roles():
    """
    GET /api/admin/roles
    Retrieves complete permission matrix and role definitions.
    """
    roles = get_all_roles_with_permissions()
    return success_response(
        data={
            "roles": roles,
            "allPermissions": ALL_PERMISSIONS,
        },
        message="Role permissions matrix retrieved successfully.",
        status_code=200,
    )


@admin_bp.route("/roles/<role_name>", methods=["PUT"])
@roles_required("admin")
def update_role(role_name: str):
    """
    PUT /api/admin/roles/<role_name>
    Updates permission assignments for a specified role.
    """
    data = request.get_json(silent=True) or {}
    permissions = data.get("permissions", [])

    if not isinstance(permissions, list):
        return error_response(
            message="Permissions must be provided as a list of permission keys.",
            status_code=400,
            error_code="INVALID_PERMISSIONS_FORMAT",
        )

    try:
        updated = update_role_permissions(role_name, permissions)
        actor_email = g.current_user.get("email", "admin@scholars.shelf")
        log_audit_event(
            actor=actor_email,
            role="admin",
            action="ROLE_PERMISSIONS_UPDATE",
            resource_type="role",
            resource_id=role_name,
            details=f"Updated permissions for role '{role_name}' ({len(updated['permissions'])} permissions active).",
            level="WARNING",
        )
        return success_response(
            data={"role": updated},
            message=f"Permissions for role '{role_name}' updated successfully.",
            status_code=200,
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=400,
            error_code="ROLE_UPDATE_FAILED",
        )
