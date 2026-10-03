"""Real integration test against the dedicated demo project; never logs credentials."""
import json, time, urllib.request, urllib.error
from pathlib import Path
config = json.loads(Path(__file__).with_name("dispatch-test-accounts.local").read_text())
base = config["gateway"]
results = []
def request(path, token=None, body=None, expected=200):
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            status, data = response.status, json.load(response)
    except urllib.error.HTTPError as error:
        status, data = error.code, json.load(error)
    assert status == expected, (path, status, data.get("message"))
    return data.get("data")
def login(account_id):
    account = next(a for a in config["accounts"] if a["details"]["id"] == account_id)
    return request("/auth/login", body={"username": account["details"]["email"], "password": account["password"]})["access_token"]
def check(label, condition):
    assert condition, label
    results.append(label)
    print("PASS", label, flush=True)
m = login("user-0007-sctm-marketeur")
l1 = login("user-0010-sctm-livreur1")
l2 = login("user-0011-sctm-livreur2")
foreign = login("user-0017-total-livreur1")
regulator = login("user-0001-csph-super")
org = "org-0002-sctm-0000-000000000001"
check("Crew restricted to SCTM", all(x["org_id"] == org for x in request("/drivers", m)))
draft = {"tour_code": "TEST-DISPATCH-"+str(int(time.time())), "marketeur_org_id": org, "execution_mode": "INTERNAL", "type": "VRAC", "requested_quantity": 20, "vehicle_id": "veh-0001-lt1123ub", "driver_id": "driver-0003-youssouf-hamadou", "livreur_user_id": "user-0010-sctm-livreur1", "checkpoints": [{"site_id": "site-0001-sctm-bonaberi", "sequence": 1, "expected_quantity": 0}, {"site_id": "site-0002-sctm-yaounde", "sequence": 2, "expected_quantity": 20}]}
tour = request("/tours", m, draft, 201)
id = tour["id"]
check("Created PLANNED tour with two persisted checkpoints", tour["status"] == "PLANNED" and len(tour["checkpoints"]) == 2)
check("Assigned driver receives tour", any(t["id"] == id for t in request("/tours", l1)))
check("Other driver cannot see tour", all(t["id"] != id for t in request("/tours", l2)))
request("/tours/"+id, foreign, expected=404)
check("Foreign organization cannot open tour by ID", True)
request("/tours/"+id+"/assign-driver?driverPersonId=user-0017-total-livreur1", m, {}, 403)
check("Foreign assignment rejected", True)
request("/tours/"+id+"/assign-driver?driverPersonId=user-0011-sctm-livreur2", m, {})
check("New assignee receives reassigned tour", any(t["id"] == id for t in request("/tours", l2)))
check("Previous assignee loses access", all(t["id"] != id for t in request("/tours", l1)))
check("Regulator can see tour", any(t["id"] == id for t in request("/tours", regulator)))
request("/tours", expected=401)
check("Anonymous access denied", True)
request("/tours", l2, draft, 403)
check("Driver cannot create tours", True)
Path(__file__).with_name("test-results.json").write_text(json.dumps({"tour_id":id,"tour_code":tour["tour_code"],"passed":results},indent=2))
