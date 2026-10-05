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

# Pickup planning uses the same authenticated execution channel as tours.
from datetime import datetime, timezone, timedelta
import base64, struct, zlib
options = request('/pickup-options', m)
check('SNH and SCDP supply sites available', any('snh' in x['name'].lower() for x in options['sources']) and any('scdp' in x['name'].lower() for x in options['sources']))
check('Pickup crew restricted to SCTM', all(x['org_id'] == org for key in ['vehicles','drivers','users'] for x in options[key]))
plan = dict(draft, tour_code='TEST-ENL-'+str(int(time.time())), source_site_id=options['sources'][0]['id'], destination_site_id='site-0001-sctm-bonaberi', scheduled_at=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat())
pickup = request('/pickups', m, plan, 201)
pid = pickup['id']
check('Pickup planned with crew, schedule and two stops', pickup['mission_kind']=='PICKUP' and pickup['pickup_status']=='VALIDATED' and len(pickup['checkpoints'])==2 and pickup['scheduled_at'])
check('SCTM driver receives pickup', any(x['id']==pid for x in request('/tours', l1)))
request('/tours/'+pid, l2, expected=404)
request('/tours/'+pid+'/documents', foreign, expected=404)
request('/pickups', m, dict(plan, destination_site_id='site-0009-total-bonaberi'), 403)
request('/pickups', m, dict(plan, source_site_id='site-0001-sctm-bonaberi'), 400)
request('/pickups', l1, plan, 403)
check('Pickup authorization and supplier validation enforced', True)
request('/tours/'+pid+'/loading', l1, {'tags':[]}, 409)
request('/tours/'+pid+'/loading', l2, {'tags':[]}, 404)
check('Receipt mandatory and assigned driver only', True)
# Small valid PNG fixture, explicitly marked as test evidence in PNG metadata.
def chunk(kind, data):
    return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',16,16,8,2,0,0,0))+chunk(b'tEXt',b'Description\x00TEST POC - not a real pickup receipt')+chunk(b'IDAT',zlib.compress(b''.join(b'\x00'+bytes([x*16,y*16,120])*16 for x,y in zip(range(16),range(16)))))+chunk(b'IEND',b'')
proof=base64.b64encode(png).decode()
loaded=request('/tours/'+pid+'/loading',l1,{'tags':[],'order_image_base64':proof})
check('Photo persisted and pickup started', loaded['pickup_status']=='INPROGRESS' and loaded['loading']['order_image_path'])
docs=request('/tours/'+pid+'/documents',m)
check('Marketer can view signed private receipt', len(docs)==1 and '/object/sign/dispatch-proofs/' in docs[0]['url'])
with urllib.request.urlopen(docs[0]['url'],timeout=15) as response:
    check('Signed receipt downloads the original PNG', response.read()==png)
stop=loaded['checkpoints'][1]['id']
received=request('/tours/'+pid+'/deliveries',l1,{'checkpoint_id':stop,'tags':[],'quantity':20,'proof_image_base64':proof})
check('Destination receipt and quantity stored', received['delivered_quantity']==20 and received['checkpoints'][1]['proof_image_path'])
check('Both scanned documents visible on web API',len(request('/tours/'+pid+'/documents',m))==2)
closed=request('/tours/'+pid+'/close',l1,{})
check('Pickup completes after destination receipt',closed['status']=='CLOSED' and closed['pickup_status']=='COMPLETED')
# Keep one clearly labelled planned pickup for hands-on PDA verification.
pending=request('/pickups',m,dict(plan,tour_code='TEST-PDA-ENL-'+str(int(time.time()))),201)
Path(__file__).with_name('test-results.json').write_text(json.dumps({'tour_id':id,'completed_pickup_id':pid,'planned_pickup_id':pending['id'],'planned_pickup_code':pending['tour_code'],'passed':results},indent=2))
