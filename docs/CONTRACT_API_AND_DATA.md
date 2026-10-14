# Registry V2 contract API and data

## Configuration

`get_config()` returns protocol `revigate-registry-v1`, chain ID `61999`, contract version `2`, and custody `NONE`. The frontend rejects any other identity.

## Writes

- `register_program(repo, rulebook_path, manifest_path, branch, baseline_sha)` creates a proposed program for the caller.
- `verify_program(program_id)` authenticates the nominated, GitHub verified baseline and activates epoch 1.
- `expire_unverified_program(program_id)` expires an unverified proposal strictly after its deadline.
- `acknowledge_rules(program_id, epoch, sha, digest)` records an exact current version once; an exact repeat is idempotent.
- `reaffirm_rules(program_id, epoch, sha, digest)` appends another explicit acknowledgment.
- `request_revision(program_id, candidate_sha)` creates a bounded publisher review request without web or model work.
- `assess_revision(review_id)` authenticates both commits and returns MATERIAL, NONMATERIAL, or INCONCLUSIVE through GenLayer nondeterministic execution.
- `expire_revision_request(review_id)` expires a pending request strictly after its deadline.

All methods are nonpayable and the application sends value zero. This application rule does not claim that unsolicited native value is impossible at the network level. Revigate has no ledger or recovery mechanism for such value.

## Views

- `get_program`, `get_review`, and `get_acknowledgment` return one canonical record.
- `get_program_page` and `get_review_page` return newest first pages.
- `get_material_event_page` and `get_acknowledgment_page` return newest first history pages.
- Every page size is between 1 and 50 and uses an exclusive `before` cursor.

## Source model

A program binds publisher, repository, branch, fixed rulebook and manifest paths, baseline and active full commit SHAs, normalized document digest, epoch, status, pending review, verification time, and material history count. A review binds its base SHA and digest before semantic assessment. An acknowledgment binds wallet, epoch, SHA, digest, and time.

The canonical source is the latest publisher submitted commit that passed Registry authentication and assessment. Revigate does not monitor repository HEAD or discover unpublished changes.
