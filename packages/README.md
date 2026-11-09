# Shared packages

Add a package when two consumers need the same stable contract or implementation. Declare it in each consumer's dependencies; avoid imports into another application's internals. Each package needs a unique name and its own checks. The helper protocol currently remains exported by `@hexforge/windows-helper/contracts`.
