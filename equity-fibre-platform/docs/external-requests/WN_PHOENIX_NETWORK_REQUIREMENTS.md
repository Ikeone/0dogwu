# WN / Phoenix network system requirements (BLOCKED_EXTERNAL: NET-001)

Send to: WN network/engineering owner. The network system of record is undetermined; provisioning "network" provider runs MANUAL in pilot.

| # | Exact question/artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| N1 | Is the platform Phoenix, Feenix, or an internal WN system? Correct name/spelling | Identify SoR | WN | doc | No | both | provisioning topology | Name confirmed |
| N2 | Which system is authoritative for customer/service status? | Avoid wrong "active" | WN | doc | No | activation logic | SoR documented |
| N3 | Interface type: REST/SOAP/MQ/DB/manual portal? Spec | Adapter | WN | spec | No | network provider | Adapter type chosen |
| N4 | Required identifiers: Chorus service ID, ONT ID, circuit ID, WAN MAC, serial, username, VLAN, plan ID | Provisioning fields | WN | list | No | order refs mapping | Provisioning accepts identifiers |
| N5 | Is RADIUS/AAA present? How are credentials generated/delivered? | Auth/CPE | WN | doc | partial | both | credential handling | Credentials issued safely |
| N6 | BNG, VLAN, CGNAT, IPv4/IPv6, DNS policy | Network config | WN | doc | No | provisioning | Config applied in test |
| N7 | Operations: activate/suspend/reconnect/cancel/move-address | Lifecycle | WN | doc | No | network provider | Each op verified in test |
| N8 | Which event confirms real internet access (not just Chorus completion)? | Correct activation | WN | doc | No | activation gate | Activation only on this event |
| N9 | Monitoring/fault/CPE-management system (TR-069/TR-369/USP/ACS)? | Assurance | WN | doc | No | device mgmt provider | ACS integration scoped |
| N10 | Existing billing/CRM/helpdesk that must remain SoR? | Avoid duplication | WN | doc | No | billing SoR | SoR boundary documented |

Default (pending): MANUAL network provisioning with dual-control activation/suspension; do NOT mark ACTIVE from a Chorus-only event. Status: NOT REQUESTED — 2026-09-03.
