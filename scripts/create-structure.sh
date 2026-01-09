#!/bin/bash

# Create Source Directory
mkdir -p src/{bot,commands,config,database,services,utils,templates,schedulers}
mkdir -p src/database/{migrations,seeds,repositories}

# Create Test Directory
mkdir -p tests/{unit,integration,e2e}

# Create Storage Directory
mkdir -p storage/{auth,images,reports,backups,logs}

# Create Docs and Scripts
mkdir -p docs scripts .github/workflows .github/ISSUE_TEMPLATE

# Create .gitkeep for empty dirs
find src -type d -empty -exec touch {}/.gitkeep \;
find storage -type d -empty -exec touch {}/.gitkeep \;
find tests -type d -empty -exec touch {}/.gitkeep \;

echo "✅ Project structure created!"
