# GitHub Actions — Security Scanning

Static security analysis of GitHub Actions workflow definitions using zizmor, surfaced via SARIF without blocking CI.

## Requirements

- **Dedicated zizmor workflow file** _(must, functional)_ — The system SHALL add zizmor as a dedicated workflow file rather than as a job or step inside an existing CI workflow.
  - _Given_ the repository contains existing CI workflows _When_ zizmor is introduced _Then_ it is defined in its own workflow file under .github/workflows/
  - _Given_ the new workflow file exists _When_ a developer reviews the repository workflows _Then_ the zizmor workflow is clearly named and separate from build/test workflows
- **Non-blocking zizmor success** _(must, functional)_ — The system SHALL configure the zizmor workflow to always report success and never fail or block CI builds, regardless of any findings.
  - _Given_ zizmor detects security findings _When_ the workflow job completes _Then_ the job exits with a success/green status
  - _Given_ a pull request is open _When_ the zizmor workflow reports findings _Then_ the overall PR status remains green and the zizmor job does not block merging
  - _Given_ the scan step reports findings _When_ the workflow continues _Then_ the SARIF upload step still runs so findings are reported
- **Official zizmor GitHub Action** _(must, functional)_ — The system SHALL install and invoke zizmor using the official zizmor GitHub Action at the most recent release tag available at the time of implementation.
  - _Given_ the workflow runs _When_ zizmor is set up _Then_ it uses the official zizmor GitHub Action published by the zizmor maintainers at the most recent release tag available when the workflow is implemented
  - _Given_ the workflow definition _When_ reviewed _Then_ zizmor is not installed via pip, cargo, pre-commit, or any other non-official-action method
- **Scan all workflow files** _(must, functional)_ — The system SHALL scan all GitHub Actions workflow files in the repository.
  - _Given_ the repository contains workflow files under .github/workflows/ _When_ zizmor runs _Then_ every YAML workflow file in that directory tree is scanned
  - _Given_ the repository contains reusable workflows or composite action definitions _When_ zizmor runs _Then_ those files are also included in the scan scope
- **Generate and upload SARIF report** _(must, functional)_ — The system SHALL generate and upload zizmor findings as a SARIF report so findings are visible through GitHub's security alerting interface.
  - _Given_ zizmor produces findings _When_ the workflow completes _Then_ a SARIF file is generated and uploaded to GitHub
  - _Given_ the SARIF upload succeeds _When_ viewing the pull request checks or repository security tab _Then_ zizmor findings are surfaced as security alerts or annotations
- **Trigger on pull request events** _(must, functional)_ — The system SHALL trigger the zizmor workflow on pull request events.
  - _Given_ a pull request is opened, synchronized, or reopened _When_ the event occurs _Then_ the zizmor workflow runs automatically
  - _Given_ a direct push to the default branch or any other non-PR event _When_ no pull request is involved _Then_ the zizmor workflow does not run unless explicitly changed later
- **Standard recommended permissions** _(must, functional)_ — The system SHALL apply the standard recommended zizmor action permissions, including any permissions required for SARIF upload.
  - _Given_ the workflow job definition _When_ reviewed _Then_ its permissions block matches the official zizmor action's documented recommendations
  - _Given_ the workflow uploads SARIF _When_ it runs _Then_ the GitHub token has sufficient rights to write security events
- **Optional informational status check** _(must, functional)_ — The system SHALL treat the zizmor job as an optional, informational status check rather than a required check.
  - _Given_ branch protection rules are configured _When_ the zizmor job is evaluated _Then_ it is not listed as a required status check
  - _Given_ the zizmor job appears in the PR checks list _When_ a contributor views it _Then_ the job name or description clearly indicates it is informational and non-blocking
- **Suppress rules or establish a baseline** _(could, functional)_ — The system MAY suppress specific zizmor rules or establish a baseline for existing findings based on maintainer judgement.
  - _Given_ existing workflows contain zizmor findings _When_ the team decides to reduce noise _Then_ rules may be disabled or a baseline file may be created
  - _Given_ a suppression or baseline is added _When_ it is reviewed _Then_ it includes a brief documented rationale
- **Use most recent zizmor release tag** _(should, nonfunctional)_ — The system SHALL use the most recent release tag of the official zizmor GitHub Action available at the time of implementation rather than pinning to a specific SHA/digest.
  - _Given_ the workflow uses the official zizmor GitHub Action _When_ the action reference is reviewed _Then_ it points to the most recent release tag available at implementation time rather than a SHA/digest
- **Keep zizmor workflow simple** _(should, nonfunctional)_ — The system SHALL keep the zizmor workflow simple and avoid custom caching or dependency-pinning mechanisms.
  - _Given_ the zizmor workflow definition _When_ reviewed _Then_ zizmor is invoked through the official action directly on a standard runner without custom caching or dependency-pinning mechanisms
- **Discoverable findings via code-scanning interface** _(should, nonfunctional)_ — The system SHALL make zizmor findings discoverable through GitHub's native code-scanning interface via SARIF upload.
  - _Given_ zizmor findings exist _When_ the workflow uploads the SARIF report to GitHub _Then_ the findings are visible in GitHub's native code-scanning interface

## Domain rules

- **The zizmor workflow must never cause a CI build or pull request to fail, even when security findings are present.**
  - _Why:_ The requirement explicitly states that builds must not fail if zizmor is not passing.
- **The zizmor workflow must be implemented as a dedicated workflow file, not embedded in existing CI workflows.**
  - _Why:_ The product owner specified a dedicated file to keep the security scan isolated and independently maintainable.
- **The workflow must run only on pull request events unless changed by future work.**
  - _Why:_ The product owner scoped the trigger to pull requests.
- **The workflow must use the official zizmor GitHub Action and follow its recommended permissions.**
  - _Why:_ This ensures supported behavior and appropriate token scoping for SARIF uploads.
- **The repository is public, so workflows triggered by pull_request events from forks receive a read-only GITHUB_TOKEN.**
  - _Why:_ This is a GitHub platform behavior for public repositories and affects how the SARIF upload step must be designed.
