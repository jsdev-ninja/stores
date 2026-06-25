---
sidebar_position: 1
title: Code Write Guide
---

# Code Write Guide

Rules to follow when writing code in this project. These are also enforced as a Cursor rule (`.cursor/rules/code-write-guide.mdc`).

## File size

- A file should be **150 lines maximum**.
- If a file grows past that, **split it into smaller files**.

## General

- Write **clean code**.
- Use **design patterns** to solve problems.

## React

- **Never** reference `appApi.*` inside a React dependency array (e.g. a `useEffect` dependency list).
  - For example, do **not** depend on `appApi.admin`.
