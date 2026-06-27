#!/usr/bin/env python3
import argparse
import json
import re
import subprocess


def sh(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Rename legacy openreach S3 objects from old format (street_pc1_pc2.ext) "
            "to new format (pc1_pc2_<lastmodified>.ext). Renames are implemented as "
            "copy-object + delete-object."
        )
    )
    parser.add_argument(
        "--bucket",
        default="openreach-scrapper",
        help="S3 bucket name (default: openreach-scrapper)",
    )
    parser.add_argument(
        "--prefix",
        default="openreach/",
        help="S3 prefix to scan (default: openreach/)",
    )
    parser.add_argument(
        "--profile",
        default="512752756525_AdministratorAccess",
        help="AWS shared credentials profile to use",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually perform renames (copy+delete). Without this, only prints DRYRUN.",
    )
    args = parser.parse_args()

    # old format: openreach/<street>_<pc1>_<pc2>.html|png
    # (street part can include many underscores; pc1/pc2 are the last two underscore-delimited tokens)
    old_re = re.compile(
        r"^openreach/(?P<street>.+)_(?P<pc1>[^/._]+)_(?P<pc2>[^/._]+)\.(?P<ext>html|png)$"
    )
    # already-new format: openreach/<pc1>_<pc2>_<ts>(?:_invalid)?.html|png
    # Be strict so we don't classify legacy address keys as already-new.
    # Timestamp should look like ISO-ish and contain a 'T' (e.g. 2026-06-19T11-36-19-123Z or 2026-06-19T11-36-19+00-00)
    new_re = re.compile(
        r"^openreach/(?P<pc1>[A-Z]{1,2}[0-9][A-Z0-9]?)_(?P<pc2>[0-9][A-Z]{2})_(?P<ts>[^/.]*T[^/.]*)(?:_invalid)?\.(?P<ext>html|png)$",
        re.IGNORECASE,
    )

    cmd = [
        "aws",
        "s3api",
        "list-objects-v2",
        "--bucket",
        args.bucket,
        "--prefix",
        args.prefix,
        "--profile",
        args.profile,
    ]

    data = json.loads(sh(cmd))
    objs = data.get("Contents") or []

    existing = {o["Key"] for o in objs}

    planned: list[tuple[str, str]] = []
    skipped_new = 0
    skipped_other = 0

    for o in objs:
        key = o["Key"]
        last_modified = o["LastModified"]  # e.g. 2026-06-19T11:36:19.123Z

        # ignore odd placeholder keys like openreach/.html that can exist from previous bugs
        if key in {"openreach/.html", "openreach/.png"}:
            skipped_other += 1
            continue

        if new_re.match(key):
            skipped_new += 1
            continue

        m = old_re.match(key)
        if not m:
            skipped_other += 1
            continue

        pc1, pc2, ext = m.group("pc1"), m.group("pc2"), m.group("ext")

        # match scraper timestamp formatting: replace ':' and '.' with '-'
        ts = last_modified.replace(":", "-").replace(".", "-")
        new_key = f"openreach/{pc1}_{pc2}_{ts}.{ext}"

        planned.append((key, new_key))

    print(f"Found {len(objs)} objects under s3://{args.bucket}/{args.prefix}")
    print(f"- already in new format: {skipped_new}")
    print(f"- not matching known old/new patterns: {skipped_other}")
    print(f"- planned renames: {len(planned)}")
    print("")

    collisions = [(old, new) for (old, new) in planned if new in existing]
    if collisions:
        print("WARNING: destination key already exists for:")
        for old, new in collisions:
            print(f"- {old} -> {new}")
        print("Refusing to continue until collisions are resolved.")
        return 2

    if not args.apply:
        for old, new in planned:
            print(f"DRYRUN: {old} -> {new}")
        return 0

    print(f"Applying {len(planned)} renames...")
    for old_key, new_key in planned:
        print(f"COPY {old_key} -> {new_key}")
        subprocess.check_call(
            [
                "aws",
                "s3api",
                "copy-object",
                "--bucket",
                args.bucket,
                "--copy-source",
                f"{args.bucket}/{old_key}",
                "--key",
                new_key,
                "--profile",
                args.profile,
            ]
        )

        print(f"DELETE {old_key}")
        subprocess.check_call(
            [
                "aws",
                "s3api",
                "delete-object",
                "--bucket",
                args.bucket,
                "--key",
                old_key,
                "--profile",
                args.profile,
            ]
        )

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
