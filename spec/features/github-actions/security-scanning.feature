Feature: GitHub Actions — Security Scanning
  Static security analysis of GitHub Actions workflow definitions using zizmor, surfaced via SARIF without blocking CI.

  @must
  Scenario: Dedicated zizmor workflow file (#1)
    Given the repository contains existing CI workflows
    When zizmor is introduced
    Then it is defined in its own workflow file under .github/workflows/

  @must
  Scenario: Dedicated zizmor workflow file (#2)
    Given the new workflow file exists
    When a developer reviews the repository workflows
    Then the zizmor workflow is clearly named and separate from build/test workflows

  @must
  Scenario: Non-blocking zizmor success (#1)
    Given zizmor detects security findings
    When the workflow job completes
    Then the job exits with a success/green status

  @must
  Scenario: Non-blocking zizmor success (#2)
    Given a pull request is open
    When the zizmor workflow reports findings
    Then the overall PR status remains green and the zizmor job does not block merging

  @must
  Scenario: Non-blocking zizmor success (#3)
    Given the scan step reports findings
    When the workflow continues
    Then the SARIF upload step still runs so findings are reported

  @must
  Scenario: Official zizmor GitHub Action (#1)
    Given the workflow runs
    When zizmor is set up
    Then it uses the official zizmor GitHub Action published by the zizmor maintainers at the most recent release tag available when the workflow is implemented

  @must
  Scenario: Official zizmor GitHub Action (#2)
    Given the workflow definition
    When reviewed
    Then zizmor is not installed via pip, cargo, pre-commit, or any other non-official-action method

  @must
  Scenario: Scan all workflow files (#1)
    Given the repository contains workflow files under .github/workflows/
    When zizmor runs
    Then every YAML workflow file in that directory tree is scanned

  @must
  Scenario: Scan all workflow files (#2)
    Given the repository contains reusable workflows or composite action definitions
    When zizmor runs
    Then those files are also included in the scan scope

  @must
  Scenario: Generate and upload SARIF report (#1)
    Given zizmor produces findings
    When the workflow completes
    Then a SARIF file is generated and uploaded to GitHub

  @must
  Scenario: Generate and upload SARIF report (#2)
    Given the SARIF upload succeeds
    When viewing the pull request checks or repository security tab
    Then zizmor findings are surfaced as security alerts or annotations

  @must
  Scenario: Trigger on pull request events (#1)
    Given a pull request is opened, synchronized, or reopened
    When the event occurs
    Then the zizmor workflow runs automatically

  @must
  Scenario: Trigger on pull request events (#2)
    Given a direct push to the default branch or any other non-PR event
    When no pull request is involved
    Then the zizmor workflow does not run unless explicitly changed later

  @must
  Scenario: Standard recommended permissions (#1)
    Given the workflow job definition
    When reviewed
    Then its permissions block matches the official zizmor action's documented recommendations

  @must
  Scenario: Standard recommended permissions (#2)
    Given the workflow uploads SARIF
    When it runs
    Then the GitHub token has sufficient rights to write security events

  @must
  Scenario: Optional informational status check (#1)
    Given branch protection rules are configured
    When the zizmor job is evaluated
    Then it is not listed as a required status check

  @must
  Scenario: Optional informational status check (#2)
    Given the zizmor job appears in the PR checks list
    When a contributor views it
    Then the job name or description clearly indicates it is informational and non-blocking

  Scenario: Suppress rules or establish a baseline (#1)
    Given existing workflows contain zizmor findings
    When the team decides to reduce noise
    Then rules may be disabled or a baseline file may be created

  Scenario: Suppress rules or establish a baseline (#2)
    Given a suppression or baseline is added
    When it is reviewed
    Then it includes a brief documented rationale

  Scenario: Use most recent zizmor release tag
    Given the workflow uses the official zizmor GitHub Action
    When the action reference is reviewed
    Then it points to the most recent release tag available at implementation time rather than a SHA/digest

  Scenario: Keep zizmor workflow simple
    Given the zizmor workflow definition
    When reviewed
    Then zizmor is invoked through the official action directly on a standard runner without custom caching or dependency-pinning mechanisms

  Scenario: Discoverable findings via code-scanning interface
    Given zizmor findings exist
    When the workflow uploads the SARIF report to GitHub
    Then the findings are visible in GitHub's native code-scanning interface
