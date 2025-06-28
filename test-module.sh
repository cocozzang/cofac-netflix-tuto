#!/bin/bash
MODULE=$1
if [ -z "$MODULE" ]; then
  echo "usage : pnpm test:module <module-name>"
  exit 1
fi

jest --testPathPattern=src/$MODULE --coverage --collectCoverageFrom=src/$MODULE/**
