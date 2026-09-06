#!/bin/bash
# Why: remove the PATH symlink that after-install.sh created, but only if it
# still points into a h0x-ADE install dir — never delete an unrelated
# /usr/bin/h0x a user or other package may own.
set -e

# RPM passes an instance count; dpkg passes the package lifecycle action.
case "${1-}" in
  0 | remove | purge) ;;
  *) exit 0 ;;
esac

link="/usr/bin/h0x"

if [ -L "$link" ]; then
  target="$(readlink "$link" || true)"
  case "$target" in
    /opt/h0x-ADE/*|/opt/h0x/*|/opt/Orca/*)
      rm -f "$link"
      ;;
  esac
fi

exit 0
