#!/usr/bin/env python3

from __future__ import annotations

import json
import math
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "presets" / "manifest.json"
GRAMMAR_FIXTURES_PATH = ROOT / "fixtures" / "grammar" / "examples.json"

MODE_VARIABLES = {
    "2d": {"x"},
    "3d": {"x", "y"},
}

FUNCTIONS = {
    "abs",
    "acos",
    "asin",
    "atan",
    "atan2",
    "ceil",
    "cos",
    "cosh",
    "exp",
    "floor",
    "ln",
    "log10",
    "max",
    "min",
    "round",
    "sign",
    "sin",
    "sinh",
    "sqrt",
    "tan",
    "tanh",
}

RESERVED_IDENTIFIERS = FUNCTIONS | {"x", "y", "z", "pi", "e"}
PARAMETER_ID_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")


def load_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def require_number(value: object, field_name: str) -> None:
    require(
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value),
        f"{field_name} must be a finite number",
    )


def validate_axis(axis: dict[str, object], field_name: str) -> None:
    require(set(axis.keys()) == {"min", "max"}, f"{field_name} must contain only min/max")
    require_number(axis["min"], f"{field_name}.min")
    require_number(axis["max"], f"{field_name}.max")
    require(axis["min"] < axis["max"], f"{field_name}.min must be less than max")


def validate_parameters(parameters: object, preset_id: str) -> None:
    require(isinstance(parameters, list), f"{preset_id}: parameters must be an array")
    seen: set[str] = set()
    for index, parameter in enumerate(parameters):
        require(isinstance(parameter, dict), f"{preset_id}: parameters[{index}] must be an object")
        require("id" in parameter and "default" in parameter, f"{preset_id}: parameters[{index}] must include id/default")
        parameter_id = parameter["id"]
        require(isinstance(parameter_id, str), f"{preset_id}: parameters[{index}].id must be a string")
        require(PARAMETER_ID_PATTERN.match(parameter_id) is not None, f"{preset_id}: invalid parameter id {parameter_id!r}")
        require(parameter_id not in RESERVED_IDENTIFIERS, f"{preset_id}: reserved parameter id {parameter_id!r}")
        require(parameter_id not in seen, f"{preset_id}: duplicate parameter id {parameter_id!r}")
        seen.add(parameter_id)
        require_number(parameter["default"], f"{preset_id}: parameters[{index}].default")
        for optional in ("min", "max", "step"):
            if optional in parameter:
                require_number(parameter[optional], f"{preset_id}: parameters[{index}].{optional}")
        if "label" in parameter:
            require(isinstance(parameter["label"], str) and parameter["label"], f"{preset_id}: parameters[{index}].label must be a non-empty string")


def validate_preset_file(path: Path, manifest_entry: dict[str, object]) -> None:
    data = load_json(path)
    require(isinstance(data, dict), f"{path}: preset must be a JSON object")
    preset_id = manifest_entry["id"]
    require(data.get("version") == 1, f"{path}: version must equal 1")
    require(data.get("id") == preset_id, f"{path}: id must match manifest")
    require(path.stem == preset_id, f"{path}: filename must equal preset id")
    mode = data.get("mode")
    require(mode in MODE_VARIABLES, f"{path}: mode must be 2d or 3d")
    require(isinstance(data.get("title"), str) and data["title"], f"{path}: title must be a non-empty string")
    require(isinstance(data.get("expression"), str) and data["expression"], f"{path}: expression must be a non-empty string")
    validate_parameters(data.get("parameters"), preset_id)
    viewport = data.get("viewport")
    require(isinstance(viewport, dict), f"{path}: viewport must be an object")
    required_axes = {"x", "y"} if mode == "2d" else {"x", "y", "z"}
    require(set(viewport.keys()) == required_axes, f"{path}: viewport axes must match mode")
    for axis_name, axis in viewport.items():
        require(isinstance(axis, dict), f"{path}: viewport.{axis_name} must be an object")
        validate_axis(axis, f"{path}: viewport.{axis_name}")
    sampling = data.get("sampling")
    require(isinstance(sampling, dict), f"{path}: sampling must be an object")
    if mode == "2d":
        require(set(sampling.keys()) == {"samples"}, f"{path}: 2d sampling must contain only samples")
        require(isinstance(sampling["samples"], int) and sampling["samples"] > 0, f"{path}: sampling.samples must be a positive integer")
    else:
        require(set(sampling.keys()) == {"xSamples", "ySamples"}, f"{path}: 3d sampling must contain xSamples/ySamples")
        for axis_name in ("xSamples", "ySamples"):
            require(isinstance(sampling[axis_name], int) and sampling[axis_name] > 0, f"{path}: sampling.{axis_name} must be a positive integer")
    if "description" in data:
        require(isinstance(data["description"], str) and data["description"], f"{path}: description must be a non-empty string")
    if "tags" in data:
        require(isinstance(data["tags"], list) and data["tags"], f"{path}: tags must be a non-empty array when present")
        for tag in data["tags"]:
            require(isinstance(tag, str) and tag, f"{path}: tags entries must be non-empty strings")


def validate_manifest() -> None:
    manifest = load_json(MANIFEST_PATH)
    require(isinstance(manifest, dict), "presets/manifest.json must be a JSON object")
    require(manifest.get("version") == 1, "presets/manifest.json version must equal 1")
    presets = manifest.get("presets")
    require(isinstance(presets, list) and presets, "presets/manifest.json must include a non-empty presets array")
    seen_ids: set[str] = set()
    for entry in presets:
        require(isinstance(entry, dict), "manifest preset entries must be objects")
        preset_id = entry.get("id")
        require(isinstance(preset_id, str) and preset_id, "manifest preset id must be a non-empty string")
        require(preset_id not in seen_ids, f"duplicate manifest preset id {preset_id!r}")
        seen_ids.add(preset_id)
        mode = entry.get("mode")
        require(mode in MODE_VARIABLES, f"manifest preset {preset_id!r} has invalid mode")
        path_value = entry.get("path")
        require(isinstance(path_value, str) and path_value, f"manifest preset {preset_id!r} must include a path")
        preset_path = ROOT / path_value
        require(preset_path.is_file(), f"manifest preset {preset_id!r} path does not exist: {path_value}")
        if "canonical" in entry:
            require(isinstance(entry["canonical"], bool), f"manifest preset {preset_id!r} canonical must be boolean")
        validate_preset_file(preset_path, entry)


def validate_grammar_examples() -> None:
    fixtures = load_json(GRAMMAR_FIXTURES_PATH)
    require(isinstance(fixtures, dict), "fixtures/grammar/examples.json must be a JSON object")
    require(fixtures.get("version") == 1, "fixtures/grammar/examples.json version must equal 1")
    cases = fixtures.get("cases")
    require(isinstance(cases, list) and cases, "fixtures/grammar/examples.json must include a non-empty cases array")
    seen_ids: set[str] = set()
    for case in cases:
        require(isinstance(case, dict), "grammar case entries must be objects")
        case_id = case.get("id")
        require(isinstance(case_id, str) and case_id, "grammar case id must be a non-empty string")
        require(case_id not in seen_ids, f"duplicate grammar case id {case_id!r}")
        seen_ids.add(case_id)
        kind = case.get("kind")
        require(kind in {"valid", "invalid"}, f"{case_id}: kind must be valid or invalid")
        mode = case.get("mode")
        require(mode in MODE_VARIABLES, f"{case_id}: mode must be 2d or 3d")
        require(isinstance(case.get("rawInput"), str) and case["rawInput"], f"{case_id}: rawInput must be a non-empty string")
        if kind == "valid":
            require(isinstance(case.get("normalizedExpression"), str) and case["normalizedExpression"], f"{case_id}: normalizedExpression must be present for valid cases")
            parameter_values = case.get("parameterValues")
            require(isinstance(parameter_values, dict), f"{case_id}: parameterValues must be an object for valid cases")
            for parameter_id, value in parameter_values.items():
                require(isinstance(parameter_id, str) and parameter_id, f"{case_id}: parameter value keys must be strings")
                require(PARAMETER_ID_PATTERN.match(parameter_id) is not None, f"{case_id}: invalid parameter value key {parameter_id!r}")
                require(parameter_id not in RESERVED_IDENTIFIERS, f"{case_id}: reserved parameter value key {parameter_id!r}")
                require_number(value, f"{case_id}: parameterValues.{parameter_id}")
        else:
            require(isinstance(case.get("expectedError"), str) and case["expectedError"], f"{case_id}: expectedError must be present for invalid cases")


def main() -> None:
    validate_manifest()
    validate_grammar_examples()
    print("inputs contract OK")


if __name__ == "__main__":
    main()
