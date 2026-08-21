# Profiles, presets, and YAML composition

English | [中文](profiles-and-presets.zh.md)

Profiles are small sets of built-in Pi-Cordis plugins that change capability presentation. They do not replace Pi's agent loop or TUI, and they do not represent temporary collaboration state.

## Canonical profiles

| Profile | Composition |
| --- | --- |
| `default` | `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question`, `btw`, `terminal-notifier` |
| `ptc` | `code-mode`, `safety-gate`, `git-guard`, `rules-injector`, `todo-tracker`, `output-truncator`, `ask-question` |

Core-only embeddings and tests can pass `createPiContext({ profile: false })`; this does not create a hidden user-facing Profile.

Plan is mounted once by `@pi-cordis/core` outside the Profile scope. `/plan` activates per-session planning policy, `/plan off` leaves it by user action, and `exit_plan_mode` performs interactive review. Plan activation does not mount or dispose Fibers and does not change the tool catalog.

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
- name: '@pi-cordis/plugin-safety-gate'
  config:
    readOnly: true
- name: '@pi-cordis/plugin-rules-injector'
```

Profile YAML currently composes built-in Pi-Cordis plugins only. Unknown names fail the switch before the active profile is disposed. Install ordinary Pi extensions through Pi's package manager.

## Switching and teardown

```bash
picds --profile ptc
picds --plan
```

Inside the TUI use `/profile default` or `/profile ptc`. Each switch disposes the exact Fibers mounted by the previous Profile, mounts the new set, and calls `pi.setActiveTools()` through the bridge. Use `/plan` independently; approving a plan leaves the selected Profile unchanged.

Development HMR watches preset YAML and optional plugin source. A YAML change triggers one serialized profile reload; watchers, debounce timers, and hot-loaded fibers are disposed with the Cordis context.
