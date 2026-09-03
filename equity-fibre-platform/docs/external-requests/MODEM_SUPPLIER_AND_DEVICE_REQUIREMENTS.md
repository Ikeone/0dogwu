# Modem supplier & device requirements (BLOCKED_EXTERNAL: MODEM-001)

Send to: WN procurement / modem supplier. Exact device is unknown; knowledge base uses generic, clearly-labelled guidance.

| # | Exact artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| D1 | Manufacturer/model/hardware revision | Support + provisioning | supplier/WN | value | No | ModemModel `confirmed` | Model set to confirmed |
| D2 | Landed cost | Unit economics | WN | value | No | pricing config | Cost reflected in metrics |
| D3 | Firmware/version policy | Support | supplier | doc | No | knowledge base | Policy documented |
| D4 | Official setup guide + port/light meanings | Accurate support | supplier | PDF | No | model-specific KB | KB replaces generic guide |
| D5 | Serial number format; WAN/LAN/Wi-Fi MAC fields | Inventory validation | supplier | spec | No | MAC/serial validation | Manifest imports cleanly |
| D6 | Which identifier WN/Phoenix requires (see NET-001 N4) | Provisioning | WN | value | No | provisioning refs | Correct identifier sent |
| D7 | Supplier manifest format (CSV/EDI) | Goods receipt | supplier | schema | No | manifest import | Dry-run import parses |
| D8 | Default credential handling | Security | supplier | doc | partial | device credential store | Credentials not stored unless required |
| D9 | Warranty/RMA process | Ops | supplier | doc | No | RMA flow | RMA lifecycle tested |
| D10 | Remote-management capability (TR-069/TR-369/USP/ACS) | Assurance | supplier | doc | No | DeviceManagementProvider | ACS scoped/disabled decision |

Status: NOT REQUESTED — 2026-09-03.
