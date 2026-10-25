# B71 R1 · ask21r — Pre-RO APPEND-ONLY evidence + Host kit RO (APPLICATION ONLY)

## Gate
ASK21R_PRERO_APPEND_ONLY_EVIDENCE_AND_HOST_KIT_RO_APPLICATION

## Upstream (ask21q GPT)
- A=`NO_CONDITIONAL`
- B=`NO_NEXT_GATE_REQUIRED` · P1=`ASK21Q_HISTORICAL_LOG_OVERWRITE`
- C=`YES_CONTINUE_BLOCK` (Recover)
- Next token: `ASK21R_PRERO_APPEND_ONLY_EVIDENCE_AND_HOST_KIT_RO_APPLICATION`

## Fix (box kit copy — ask21q/ask21k source NOT mutated)
Root cause: ask21q `ensure_out_safe` still unlinked/recreated fixed paths (`01-pre-ro.out` etc.) → historical evidence overwrite.

ask21r overlay:
- `create_unique_out`: each run creates NEW `$ROOT/out/<prefix>.<UTC>.<rand>.out` via exclusive create (bash noclobber)
- Never `: >` / truncate / unlink / mv-overwrite historical fixed logs
- PASS/FAIL grep uses echoed `OUT=` path; optional append-only `*.index`
- Keeps ask21q symlink/FIFO/parent-dir refuse guards
- Applied to all five \*-run pastes: 01-pre-ro, 03-receive, 04-verify, 05-atomic, 06-post-ro
- Negative/primary drills 9/9 PASS (hist `01-pre-ro.out` sha256+inode unchanged)

## Host kit RO materials
- Box-side expect pin table: `pins/HOST_KIT_RO_EXPECT.sha256`
- Future RO checklist: `evidence/HOST_KIT_RO_CHECKLIST.txt`
- `LIVE_KIT_READONLY_CHECK=NOT_VERIFIED` · no live host probe · no re-bootstrap
- `PRE_RO_RETRY=NOT_AUTHORIZED`

## Kit reuse readonly
- `REUSE_KIT=ask21r-append-only` · lineage `ask21q-fixed→ask21r`
- Bootstrap SHA unchanged `2db1e576…`
- Pin table: `pins/KIT_REUSE_READONLY.sha256`

## Authority (unchanged bans)
- `PRE_RO_RETRY=NOT_AUTHORIZED`
- `HOST_REPLACE_EXECUTE=NOT_AUTHORIZED`
- `LIVE_RECOVER=NOT_AUTHORIZED`
- `INSTALL_ONE=NOT_AUTHORIZED`
- `AUTO_EXECUTE=FORBIDDEN`
- chmod grant SPENT · `HOST_CHMOD_DONE=YES`
- Owner REPLACE oneshot clock-valid to `2026-10-26T09:50:00Z` ≠ execution authority
- **Do NOT seek bundled replace this round.** After accept: Pre-RO read-only retry ALONE.

## Seek (GPT)
- **A** = `accept_ask21r_append_only_scope`
- **B** = `YES_PRE_RO_READONLY_RETRY_ONLY_WITH_STRICT_GATES` (Pre-RO alone; ≠ Receive/Atomic; ≠ auto-exec)
- **C** = `block_Recover`

## Hashes
- INNER=`ac1e7643831ce125185c906fca9784bb922a2ce5db300c033aa3028d32807a04` (`ask21r-prero-append-only-host-kit-ro.tgz`)
- OUTER=`540ce0ff9cfd93b7fca75399bdc83871e87f9c5b2e7e61cdddf23b62bdd37964`
- ASK21Q_OUTER=`1660c4e38402aa23e63842fde33e91b235481535d37e3c96976d6d09b42af41a`
- ASK21P_OUTER=`8b1aec9ab1f7f20a9bfd65030cfe02cd78c9af86d0ecadc99585f85febe91b35`
- ASK21K_OUTER=`24dd00d9a7fc7c0e89e3fcc039590915842c411edbb9695f8cc7cdbed05aa54d`
