#!/bin/bash
bash scripts/create-structure.sh
bash scripts/setup-foundation.sh
cp .env.example .env
echo "🎉 Complete setup finished!"
