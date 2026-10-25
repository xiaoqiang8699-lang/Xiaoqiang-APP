# ask21r out_safe.inc.sh — APPEND-ONLY unique evidence logs (closes ASK21Q_HISTORICAL_LOG_OVERWRITE)
# Provides:
#   ensure_out_parent_safe <parent_dir>
#   create_unique_out <prefix>   → sets OUT to new exclusively-created path under $ROOT/out
# Never deletes, truncates, or rename-overwrites historical fixed names (e.g. 01-pre-ro.out).
# Keeps ask21q symlink/FIFO/parent-dir refuse guards.

ensure_out_parent_safe() {
  local parent="$1"
  if [[ -L "$parent" ]]; then
    echo "OUT_PARENT_SYMLINK path=$parent" >&2
    return 1
  fi
  if [[ -e "$parent" ]]; then
    if [[ ! -d "$parent" ]]; then
      if [[ -p "$parent" ]]; then
        echo "OUT_PARENT_FIFO path=$parent" >&2
      else
        echo "OUT_PARENT_NOT_DIR path=$parent" >&2
      fi
      return 1
    fi
  else
    mkdir -p -m 0700 "$parent" || { echo "OUT_PARENT_MKDIR_FAIL path=$parent" >&2; return 1; }
  fi
  if [[ -L "$parent" ]] || [[ ! -d "$parent" ]]; then
    echo "OUT_PARENT_NOT_REAL_DIR path=$parent" >&2
    return 1
  fi
  return 0
}

# Optional: append-only index (never truncate). Refuse if index is symlink/FIFO.
_append_out_index() {
  local index="$1" entry="$2"
  if [[ -L "$index" ]]; then
    echo "OUT_INDEX_SYMLINK path=$index" >&2
    return 1
  fi
  if [[ -e "$index" ]]; then
    if [[ -p "$index" ]]; then
      echo "OUT_INDEX_FIFO path=$index" >&2
      return 1
    fi
    if [[ ! -f "$index" ]]; then
      echo "OUT_INDEX_NOT_REGULAR path=$index" >&2
      return 1
    fi
  fi
  # append only — never : > or truncate
  printf '%s\n' "$entry" >> "$index" || { echo "OUT_INDEX_APPEND_FAIL path=$index" >&2; return 1; }
  return 0
}

# create_unique_out <prefix>
# Requires ROOT set. Sets global OUT to new unique exclusive path.
# Prefix examples: 01-pre-ro  03-receive  04-verify  05-atomic  06-post-ro
create_unique_out() {
  local prefix="$1"
  local parent candidate ts rand i
  if [[ -z "${ROOT:-}" ]]; then
    echo "OUT_ROOT_UNSET" >&2
    return 1
  fi
  if [[ -z "$prefix" || "$prefix" == */* || "$prefix" == .* ]]; then
    echo "OUT_BAD_PREFIX prefix=$prefix" >&2
    return 1
  fi
  parent="$ROOT/out"
  ensure_out_parent_safe "$parent" || return 1

  ts=$(date -u +%Y%m%dT%H%M%SZ) || { echo "OUT_TS_FAIL" >&2; return 1; }
  for i in 1 2 3 4 5 6 7 8; do
    if command -v openssl >/dev/null 2>&1; then
      rand=$(openssl rand -hex 4) || rand=""
    else
      rand=$(head -c 4 /dev/urandom 2>/dev/null | od -An -tx1 | tr -d ' \n')
    fi
    [[ -n "$rand" ]] || rand="${RANDOM}${i}"
    candidate="$parent/${prefix}.${ts}.${rand}.out"
    # Exclusive create: noclobber — fail if path already exists
    if (
      set -C
      : > "$candidate"
    ) 2>/dev/null; then
      # Final identity checks
      if [[ -L "$candidate" ]]; then
        echo "OUT_EXCL_SYMLINK path=$candidate" >&2
        return 1
      fi
      if [[ ! -f "$candidate" ]]; then
        echo "OUT_EXCL_NOT_REGULAR path=$candidate" >&2
        return 1
      fi
      OUT="$candidate"
      # Best-effort append-only index (non-fatal if skipped by caller env)
      if [[ "${OUT_INDEX_SKIP:-}" != "1" ]]; then
        _append_out_index "$parent/${prefix}.index" "$OUT" || true
      fi
      echo "OUT_SAFE=ask21r_append_only_exclusive"
      echo "OUT=$OUT"
      return 0
    fi
  done
  echo "OUT_EXCL_CREATE_FAIL prefix=$prefix parent=$parent" >&2
  return 1
}

# Compatibility wrapper name used by drills for parent/special-file rejects.
# When given a full path that already exists as symlink/FIFO → refuse (never overwrite).
# When given a full path under a bad parent → refuse.
# Does NOT truncate or recreate a fixed historical path.
ensure_out_safe_refuse_special() {
  local out="$1"
  local parent
  parent=$(dirname -- "$out")
  ensure_out_parent_safe "$parent" || return 1
  if [[ -L "$out" ]]; then
    echo "OUT_SYMLINK path=$out" >&2
    return 1
  fi
  if [[ -p "$out" ]]; then
    echo "OUT_FIFO path=$out" >&2
    return 1
  fi
  if [[ -e "$out" ]] && [[ ! -f "$out" ]]; then
    echo "OUT_NOT_REGULAR path=$out" >&2
    return 1
  fi
  # Historical regular file present → must NOT unlink/truncate; caller must use create_unique_out
  if [[ -e "$out" ]]; then
    echo "OUT_HISTORICAL_PRESERVE path=$out (use create_unique_out)" >&2
    return 1
  fi
  # Absent fixed path: still do NOT create fixed name; force unique API
  echo "OUT_FIXED_PATH_FORBIDDEN path=$out (use create_unique_out)" >&2
  return 1
}
