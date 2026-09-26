<!-- generated-by: gsd-doc-writer -->
# LPG Traceability (CSPH GPL)

The regulated LPG distribution chain in Cameroon: bulk and bottled product moves from
filling centres and depots to commercial buyers, and every movement, declaration, and
verification is accountable to the regulator. This file fixes the vocabulary. It is a
glossary only — no implementation detail lives here.

## Language

### Organizations and actors

**CSPH**:
The national LPG regulator; the authority the whole system reports to.
_Avoid_: regulator platform, ministry

**Organisation type**:
The kind of legal body an organisation is — regulator, depot, marketeur, transporteur,
or client.
_Avoid_: company kind, account type

**Marketeur**:
The oil company that owns product, commissions pickups and tours, and submits monthly
volume declarations.
_Avoid_: client, buyer, customer

**Transporteur**:
The carrier that executes external tours under contract, supplying its own vehicles,
drivers, and livreurs.
_Avoid_: logistics provider, fleet partner

**Livreur**:
The delivery operator who executes a tour at checkpoints. The lowest-tier actor in the
hierarchy.
_Avoid_: driver, courier

**Site assignment**:
The link between an actor and the operational sites they are responsible for. It is what
an agent is accountable to, independent of the actor's role.
_Avoid_: ownership, subscription

**Scope**:
The set of locations and rows an actor may see or act on. Never derived from role alone.
_Avoid_: visibility, permission filter

### Locations

**Operational site**:
A filling centre, depot, or supply point from which product is dispatched.
_Avoid_: site (when the distinction matters), location

**Client site**:
A commercial buyer's premises, distinct from an operational site.
_Avoid_: customer site, point of sale

**Checkpoint**:
One stop on a tour; either an operational site or a client site.
_Avoid_: stop, waypoint, visit point

**Geo verification**:
Confidence-based confirmation that a location's coordinates are correct, promoted when
confidence and delivery history justify it.
_Avoid_: geocoding, map validation

### Product and quantity

**VRAC**:
Bulk LPG moved by tank truck. Always quantified in tonnes métriques.
_Avoid_: bulk (when the product is meant), liquid

**BOUTEILLES50KG**:
50 kg LPG cylinders, counted individually.
_Avoid_: bottles (when the pack size is meant), units

**TM**:
Tonne métrique. The unit of VRAC quantity.
_Avoid_: ton, tonne, kg, litre

**btl**:
The unit of count for BOUTEILLES50KG.
_Avoid_: bottle, cyl, unit

**Meter reading**:
The VRAC quantity recorded at a checkpoint from the tanker's gauge.
_Avoid_: scan (for VRAC), volume reading

**Scan event**:
A single evidentiary reading — an RFID bottle scan or a VRAC meter reading — at a
checkpoint.
_Avoid_: telemetry, event log

### Movement and operations

**Pickup request**:
A marketeur's request to move product from a source location to a destination.
_Avoid_: shipment, transfer order

**Tour**:
A delivery route with an ordered set of checkpoints and the crew that executes it.
_Avoid_: tournée (as an English label), round, itinerary

**Internal tour**:
A tour executed by the marketeur's own crew.
_Avoid_: direct tour, own fleet tour

**External tour**:
A tour a transporteur must acknowledge and staff with its own crew before it can start.
_Avoid_: outsourced tour, partner tour

**Transporter acknowledgement**:
The transporteur's acceptance of an external tour; without it the tour cannot advance.
_Avoid_: approval, confirmation

**Crew**:
The vehicle, driver, and livreur assigned to execute a tour.
_Avoid_: team, assignment

**Contract**:
A marketeur–transporteur agreement, evidenced by a proof document and bounded by start
and end dates, carrying an acceptance timestamp.
_Avoid_: agreement, deal

**Proof**:
The document that evidences an event or an object: a contract proof, a delivery proof, a
certificate.
_Avoid_: attachment, file

### Regulatory loop

**Declaration**:
A marketeur's monthly self-report of volume sold.
_Avoid_: report, statement

**Tracked volume**:
The volume derived from scan events and meter readings, as opposed to declared volume.
_Avoid_: real volume, actual volume

**Volume gap**:
The difference between declared and tracked volume, expressed in TM and as a percentage
of the declared figure.
_Avoid_: discrepancy, loss

**Tolerance**:
The permitted volume gap before it becomes a regulatory matter.
_Avoid_: allowance, slack

**Reconciliation**:
The act of comparing declared volume against tracked volume and resolving the difference.
_Avoid_: audit, check

**Verification**:
A regulator's confirmation of a reconciled declaration or a reconciled site.
_Avoid_: review, approval

**Redressement**:
The financial penalty issued when a reconciled gap exceeds tolerance.
_Avoid_: fine, penalty, sanction

**Anomaly**:
A rule-detected irregularity — an unacknowledged tour, an offline device, a depleted
battery — raised for investigation.
_Avoid_: alert, warning, issue

**Retention**:
The period an evidentiary record must remain available. Scan events and audit records
are retained for years, not days.
_Avoid_: expiry, TTL

### Settings and policy

**Setting**:
A named, tunable business rule that governs behaviour — a threshold, a timeout, an
enforced-role list, a retention period. Behaviour is never pinned to a literal.
_Avoid_: config, constant, parameter

**MFA enforcement**:
The rule naming the roles required to use multi-factor authentication. A role may be
required to complete setup before acting.
_Avoid_: 2FA requirement, login policy

**Effective permission**:
The union of the actor's system-role grants and custom-role grants, then constrained by
scope. A role by itself is never the whole answer.
_Avoid_: role permission, access right

**Custom role**:
An additional, named grant set layered on top of the system role.
_Avoid_: permission set, profile

**Soft delete**:
Marking a row as deleted so it disappears from normal reads while remaining recoverable
and auditable.
_Avoid_: archive, hide, disable
