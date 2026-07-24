---
title: Cloud VMS Product Notes
---

# Cloud VMS Product Notes

## Current Frigate data model

Frigate produces three related but distinct categories of data:

1. **Events** represent individual tracked objects or external detections. An
   event includes its camera, label, timestamps, score, zones, bounding box,
   thumbnail, media availability, and additional classification metadata.
2. **Review segments** group related activity from one camera into an operator
   review item. A segment references one or more event IDs and is classified as
   either `alert` or `detection`.
3. **Recording activity** stores recording segments and their motion, object,
   audio, and motion-heatmap metadata. Motion review is derived from this data,
   not from event or review-segment severity.

The resulting relationship is:

```text
tracked object, audio, LPR, or external API detection
  -> Event
  -> ReviewSegment (alert or detection)

recording segment
  -> motion metric and motion heatmap
  -> motion review timeline
```

## Review severity

`alert` and `detection` are review-segment severities. They are determined from
the camera review configuration, active object labels, required zones, and
whether the object is a valid moving detection. An active alert upgrades a
matching detection segment to `alert`.

The Motion view is separate. It displays normalized `Recordings.motion` values
over time and is represented in the UI as significant motion, rather than a
persisted `ReviewSegment` severity.

The default cutoff is 40 seconds for alerts and 30 seconds for detections. A
review segment stays open while qualifying activity continues. This makes the
segment resilient to short tracking losses that would otherwise create multiple
object events for the same real-world activity.

## Source of truth for a cloud VMS

Do not treat one table as the source of truth for every use case. Frigate has
two useful truth layers:

| Cloud concern | Source of truth | Why |
| --- | --- | --- |
| Detection evidence, model analysis, and tracker diagnostics | `Event` | It is the closest record of each tracked object or external detection. |
| Operator inbox, notification, acknowledgement, case management, and retention policy | `ReviewSegment` | It deduplicates related activity into one camera incident and applies the configured severity rules. |

For the cloud product, make an alert or detection `ReviewSegment` the canonical
**incident**. It should be the entity that receives an owner, status, note,
notification history, escalation, retention policy, and case link. Keep its
referenced events as immutable evidence records below the incident.

This distinction is important when tracking is lost. One person may produce two
or more `Event` records when the tracker assigns a new object ID. If the gap is
shorter than the configured cutoff, Frigate groups those events into one
`ReviewSegment`, avoiding duplicate operator alerts. If the gap exceeds the
cutoff, a new segment is created because it is operationally a new incident.

## What an alert review already provides

An alert review is more useful than a raw event as the cloud-facing incident
because Frigate has already assembled and classified the following data:

| Review data | Source or transformation | Cloud use |
| --- | --- | --- |
| `id`, camera, start time, end time | Review segment lifecycle | Incident identity and timeline |
| `severity` | Alert/detection labels, required zones, and review policy | Routing, notification, and priority rules |
| `data.detections` | IDs of contributing events | Evidence relationship and drill-down |
| `data.objects`, `verified_objects`, `sub_labels` | Aggregated tracked-object labels and classifications | Search, reporting, and operator context |
| `data.zones` | All active zones observed in the segment | Policy enforcement and location context |
| `data.audio` | Audio detection labels observed during the segment | Incident enrichment |
| `thumb_path` and `data.thumb_time` | Representative review thumbnail | Low-bandwidth incident preview |
| `data.metadata` | Optional GenAI review metadata | Title, description, and risk workflow |

The review maintainer also upgrades a detection segment to `alert` when alert
activity occurs during the same segment. This gives cloud workflows a stable,
policy-aware severity instead of requiring every cloud consumer to reimplement
Frigate's label, zone, object-state, and cutoff logic.

### Recommended synchronization contract

```text
ReviewSegment upsert
  -> cloud incident upsert
  -> notification and operator workflow

Event upserts referenced by ReviewSegment.data.detections
  -> cloud incident evidence upsert
  -> search, analytics, forensic detail, and model-quality analysis
```

The gateway should send review-segment updates until an end time is assigned.
It should then send a final incident upsert with media references and all known
event evidence. Both calls must be idempotent, keyed by the edge-generated
review-segment ID and event ID.

### Implementation evidence in Frigate

- `frigate/models.py` defines `Event`, `ReviewSegment`, and `Recordings` as
  separate persistence models.
- `frigate/events/maintainer.py` writes individual object and external
  detections to `Event`.
- `frigate/review/maintainer.py` selects alert and detection activity, groups
  it by camera and cutoff time, stores contributing event IDs in
  `ReviewSegment.data.detections`, and upgrades matching detection segments to
  alerts.
- `frigate/api/review.py` powers the operator review API from
  `ReviewSegment`, while its motion activity API reads `Recordings.motion`.

## Cloud VMS architecture

Use an edge-first design:

```text
Camera -> Frigate Edge -> local inference and local recording
                         -> durable sync queue
                         -> cloud ingestion API
                         -> metadata database, search index, and object storage
```

The edge remains responsible for low-latency detection and local recording.
Cloud services provide cross-site visibility, retention policies, operator
workflow, search, analytics, and integrations.

## Cloud data to collect

### Control-plane data

- Tenant, site, device, and camera inventory
- Configuration versions and deployment status
- Device heartbeat, software version, CPU, GPU, memory, disk, stream, and
  detector health
- User, role, audit, access, and retention-policy data

### Data-plane metadata

- Event lifecycle updates, including timestamps, object labels, confidence,
  zones, bounding boxes, classifications, and media references
- Review segments, severity, review state, assignments, notes, and escalation
- Recording catalog entries, duration, motion, object, audio, and heatmap
  summaries
- Thumbnails, low-resolution previews, snapshots, and selectively uploaded
  clips
- Aggregated motion buckets for timeline and operational analytics

## Recommended cloud entities

Keep ingestion and operator workflow separate:

```text
event_updates       immutable event lifecycle messages from edge
review_incidents    operator-facing aggregates and workflow state
recording_catalog   recording metadata and object-storage references
motion_buckets      aggregated motion measurements by camera and time window
device_heartbeats   operational health telemetry
audit_log           user and system actions
```

Use stable edge-generated IDs and idempotent upserts so a disconnected gateway
can safely retry synchronization.

## Media and privacy strategy

Do not upload continuous high-resolution video by default. Keep recordings at
the edge and sync metadata, thumbnails, and previews first. Upload full clips
for alerts, operator requests, legal holds, or an explicit retention policy.

Each gateway should maintain a local durable spool with backoff and retry. The
cloud should acknowledge persisted records before the gateway discards queued
metadata or media.
