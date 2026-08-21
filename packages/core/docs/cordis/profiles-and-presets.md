# Profiles, presets, and YAML composition

English | [中文](profiles-and-presets.zh.md)

Profiles are small, scenario-specific sets of built-in Pi-Cordis plugins. They change policy and the model-facing tool surface; they do not replace Pi's agent loop or TUI.

## Canonical profiles

| Profile | Composition |
| --- | --- |
| `default` | `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `btw`, `terminal-notifier` |
| `plan` | `plan-mode`, read-only `safety-gate`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question` |
| `ptc` | `code-mode`, `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question` |

`minimal` is an internal/testing escape hatch that mounts no capability plugins.

## Lookup order

Profile definitions are merged in this order, with later definitions replacing the same profile name:

1. built-in definitions;
2. `<cwd>/presets/` source-tree fallback;
3. `<agentDir>/presets/`;
4. `<cwd>/.picds/presets/`, or `<cwd>/.pi/presets/` only when `.picds/presets/` is absent.

Single-file `cordis.yml` lookup follows the same `.picds`-or-legacy-`.pi` rule.

## Directory format

```text
.picds/presets/review/
  preset.yml
  cordis.yml
```

```yaml
# preset.yml
name: review
description: Read-only review
```

```yaml
# cordis.yml
- name: '@pi-cordis/plugin-plan-mode'
- name: '@pi-cordis/plugin-safety-gate'
  config:
    readOnly: true
- name: '@pi-cordis/plugin-rules-injector'
```

Profile YAML currently composes built-in Pi-Cordis plugins only. Unknown names fail the switch before the active profile is disposed. Install ordinary Pi extensions through Pi's package manager.

## Switching and teardown

```bash
picds --profile plan
picds --profile ptc
```

Inside the TUI use `/profile default`, `/profile plan`, or `/profile ptc`. Each switch disposes the exact fibers mounted by the previous profile, mounts the new set, and calls `pi.setActiveTools()` through the bridge.

Development HMR watches preset YAML and optional plugin source. A YAML change triggers one serialized profile reload; watchers, debounce timers, and hot-loaded fibers are disposed with the Cordis context.
