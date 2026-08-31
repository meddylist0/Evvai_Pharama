import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

def inspect_all_routes():
    inventory = []
    
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = sorted(list(route.methods - {'HEAD', 'OPTIONS'}))
            if not methods:
                continue
            path = route.path
            name = route.name
            
            # Skip swagger / openapi internal docs from business classification
            if path in ["/openapi.json", "/api/v1/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"]:
                continue
                
            dep_names = []
            if hasattr(route, 'dependant'):
                def collect_deps(dependant):
                    for d in getattr(dependant, 'dependencies', []):
                        if hasattr(d, 'call'):
                            call_name = getattr(d.call, '__name__', str(d.call))
                            dep_names.append(call_name)
                        collect_deps(d)
                try:
                    collect_deps(route.dependant)
                except Exception:
                    pass
            
            dep_names_set = set(dep_names)
            
            is_admin = (
                "require_admin" in dep_names_set or
                "admin" in path or
                any(p in path for p in ["/users", "/audit", "/reports", "/inventory", "/pricing", "/notifications", "/kyc/pending", "/review"]) or
                (path.startswith("/api/v1/products") and any(m in ["POST", "PUT", "DELETE"] for m in methods)) or
                (path.startswith("/api/v1/categories") and any(m in ["POST", "PUT", "DELETE"] for m in methods)) or
                "/adjust-stock" in path or
                "/status" in path or
                "/admin-refund" in path
            )
            is_dist = "require_distributor" in dep_names_set or "/kyc/submit" in path
            is_auth = (
                "get_current_user" in dep_names_set or
                "get_current_active_user" in dep_names_set or
                is_admin or
                is_dist or
                path in ["/api/v1/auth/me", "/api/v1/auth/profile", "/api/v1/auth/change-password", "/api/v1/orders", "/api/v1/orders/my-orders"] or
                "/cancel" in path or
                "/invoice" in path or
                "/return" in path or
                "/payments/create-razorpay-order" in path or
                "/payments/verify-and-order" in path
            )
            
            role = "ADMIN" if is_admin else ("DISTRIBUTOR" if is_dist else ("CUSTOMER" if is_auth else "PUBLIC"))
                
            inventory.append({
                "methods": methods,
                "path": path,
                "name": name,
                "auth_required": is_auth,
                "role": role,
                "dependencies": list(dep_names_set)
            })
            
    return inventory

if __name__ == "__main__":
    inv = inspect_all_routes()
    total = len(inv)
    public_count = sum(1 for i in inv if i["role"] == "PUBLIC")
    admin_count = sum(1 for i in inv if i["role"] == "ADMIN")
    auth_count = sum(1 for i in inv if i["role"] == "AUTHENTICATED")
    dist_count = sum(1 for i in inv if i["role"] == "DISTRIBUTOR")
    protected_count = total - public_count
    
    print(f"Total Application APIs Discovered: {total}")
    print(f"Public APIs                      : {public_count}")
    print(f"Protected APIs Total             : {protected_count}")
    print(f"  - Admin APIs                   : {admin_count}")
    print(f"  - Customer / Shared Auth APIs  : {auth_count}")
    print(f"  - Distributor APIs             : {dist_count}")
    print("=" * 80)
    for i in sorted(inv, key=lambda x: (x["role"], x["path"])):
        print(f"{','.join(i['methods']):<7} {i['path']:<45} [{i['role']:<13}] (auth={i['auth_required']})")
