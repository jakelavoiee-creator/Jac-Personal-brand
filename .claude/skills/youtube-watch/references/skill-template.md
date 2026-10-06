# Template for a skill learned from YouTube

Copy into `.claude/skills/<skill-name>/SKILL.md` and fill in every section. Keep steps concrete: exact commands, values, settings and thresholds, never "configure appropriately".

```markdown
---
name: <skill-name>
description: <What it does + when to use it. List the phrases a user would say that should trigger it.>
---

# <Skill Name>

<One paragraph: the outcome this skill produces and who it's for.>

## Prerequisites
- <tools, accounts, keys, files, with install commands>

## Method
1. <Step, with exact command/setting>. _Source: <video title> @ 3:42_
2. ...

## Quality bar
- <How to tell the result is right: checks, numbers, examples of good vs. off>

## Gotchas
- <Mistakes the videos warned about, edge cases>. _Source: ... @ mm:ss_

## Where sources disagreed
- <Point of disagreement → which approach this skill follows and why>

## Sources
- <Title> (<channel>), <URL>, watched <date>
```
