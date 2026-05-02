#!/bin/bash
# Auto-backup script for Mission Control critical files
# Run: chmod +x backup.sh && ./backup.sh

cd /root/.openclaw/workspace

# Files to always keep in sync
BACKUP_FILES="SYSTEM_ARCH.md SOUL.md USER.md AGENTS.md MEMORY.md"

git add $BACKUP_FILES
git commit -m "Auto-backup: $(date '+%Y-%m-%d %H:%M')" || echo "No changes to backup"
git push origin main

echo "Backup complete: $(date)"