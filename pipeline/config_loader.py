"""Load and validate pipeline configuration from config.yaml."""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml


CONFIG_PATH = Path(__file__).parent / "config.yaml"


def load_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    """Load config.yaml and return the parsed dict.

    Raises:
        FileNotFoundError: If config.yaml is missing.
        SystemExit: If any required parameter is TODO_UNSET.
    """
    if not path.exists():
        raise FileNotFoundError(f"Config not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    return cfg


def require(cfg: dict[str, Any], *keys: str) -> Any:
    """Navigate nested config keys. Fail loudly if TODO_UNSET.

    Usage: require(cfg, 'hydrology', 'accumulation_threshold')
    """
    val = cfg
    path_str = ""
    for k in keys:
        path_str += f".{k}"
        if not isinstance(val, dict) or k not in val:
            print(f"FATAL: config key {path_str.lstrip('.')} is missing", file=sys.stderr)
            sys.exit(1)
        val = val[k]
    if val == "TODO_UNSET":
        print(
            f"FATAL: config key {path_str.lstrip('.')} is TODO_UNSET. "
            f"Set it from validation results before running the pipeline.",
            file=sys.stderr,
        )
        sys.exit(1)
    return val
