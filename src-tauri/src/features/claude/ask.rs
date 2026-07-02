use crate::error::AppError;
use crate::features::claude::model::ClaudeAnswer;
use serde_json::Value;
use std::path::Path;
use std::process::{Command, Stdio};

/// The model the Ask feature runs against. Haiku on purpose: this is cheap,
/// fast, one-shot Q&A — not an agentic session.
const MODEL: &str = "haiku";

/// Read-only tool allowlist (comma-delimited, as the CLI expects). The Ask
/// feature answers questions *about* a repo; it must never write, run, or edit.
/// In headless `-p` mode there is no TTY to approve a prompt, so any tool
/// outside this list is auto-denied — restricting it here keeps Claude from
/// reaching for Bash/Write and stalling the run.
const ALLOWED_TOOLS: &str = "Read,Grep,Glob";

/// Ask Claude Code a one-shot question about a repository. Spawns the `claude`
/// CLI in headless JSON mode with the repo as its working directory (so it
/// picks up that repo's `CLAUDE.md` and config), and returns the parsed answer.
pub fn ask(repo: &Path, question: &str) -> Result<ClaudeAnswer, AppError> {
    let question = question.trim();
    if question.is_empty() {
        return Err(AppError::new("Ask a question first."));
    }
    if !repo.is_dir() {
        return Err(AppError::new("This repository no longer exists on disk."));
    }

    let output = command(repo, question)?
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| AppError::new(format!("Couldn't start Claude Code: {e}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let detail = stderr.trim();
        let msg = if detail.is_empty() {
            "Claude Code exited without producing an answer.".to_string()
        } else {
            format!("Claude Code failed: {detail}")
        };
        return Err(AppError::new(msg));
    }

    parse_answer(&String::from_utf8_lossy(&output.stdout))
}

/// Build the headless `claude` invocation, resolving the binary on `PATH`.
/// On Windows the CLI is often a `claude.cmd`/`.bat` shim, which `CreateProcess`
/// can't launch directly — those are routed through `cmd /C`.
fn command(repo: &Path, question: &str) -> Result<Command, AppError> {
    let bin = resolve_binary()?;
    let args = [
        "-p",
        question,
        "--model",
        MODEL,
        "--output-format",
        "json",
        "--allowedTools",
        ALLOWED_TOOLS,
    ];

    let mut cmd = if cfg!(target_os = "windows")
        && (bin.to_ascii_lowercase().ends_with(".cmd")
            || bin.to_ascii_lowercase().ends_with(".bat"))
    {
        let mut c = Command::new("cmd");
        c.arg("/C").arg(&bin).args(args);
        c
    } else {
        let mut c = Command::new(&bin);
        c.args(args);
        c
    };
    cmd.current_dir(repo);
    Ok(cmd)
}

/// Locate the `claude` binary the same way `detect` does, returning its full
/// path so we can tell a `.cmd` shim apart from a native executable.
fn resolve_binary() -> Result<String, AppError> {
    let finder = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };
    let out = Command::new(finder)
        .arg("claude")
        .output()
        .map_err(|e| AppError::new(format!("Couldn't locate Claude Code: {e}")))?;
    let path = String::from_utf8_lossy(&out.stdout)
        .lines()
        .next()
        .unwrap_or("")
        .trim()
        .to_string();
    if !out.status.success() || path.is_empty() {
        return Err(AppError::new(
            "Claude Code isn't on your PATH. Install it to ask questions about this repo.",
        ));
    }
    Ok(path)
}

/// Parse the object emitted by `claude --output-format json`. Tolerant of
/// fields coming and going across CLI versions: only `result` is required on
/// success, and an `is_error` run surfaces whatever message the CLI gave.
fn parse_answer(stdout: &str) -> Result<ClaudeAnswer, AppError> {
    let stdout = stdout.trim();
    if stdout.is_empty() {
        return Err(AppError::new("Claude Code returned an empty response."));
    }
    let json: Value = serde_json::from_str(stdout)
        .map_err(|_| AppError::new("Couldn't read Claude Code's response."))?;

    let result = json.get("result").and_then(Value::as_str);

    if json.get("is_error").and_then(Value::as_bool) == Some(true) {
        let msg = result
            .filter(|s| !s.trim().is_empty())
            .or_else(|| json.get("subtype").and_then(Value::as_str))
            .unwrap_or("Claude Code couldn't answer that.");
        return Err(AppError::new(msg.to_string()));
    }

    let answer = result
        .filter(|s| !s.trim().is_empty())
        .ok_or_else(|| AppError::new("Claude Code didn't return an answer."))?
        .trim()
        .to_string();

    Ok(ClaudeAnswer {
        answer,
        model: json
            .get("model")
            .and_then(Value::as_str)
            .map(str::to_string),
        cost_usd: json.get("total_cost_usd").and_then(Value::as_f64),
        duration_ms: json.get("duration_ms").and_then(Value::as_u64),
        num_turns: json
            .get("num_turns")
            .and_then(Value::as_u64)
            .map(|n| n as u32),
        session_id: json
            .get("session_id")
            .and_then(Value::as_str)
            .map(str::to_string),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_a_successful_result() {
        let out = r#"{
            "type": "result",
            "subtype": "success",
            "is_error": false,
            "duration_ms": 8421,
            "num_turns": 4,
            "result": "  This repo is a Tauri app.  ",
            "session_id": "abc-123",
            "total_cost_usd": 0.0123,
            "model": "claude-haiku-4-5-20251001"
        }"#;
        let a = parse_answer(out).unwrap();
        assert_eq!(a.answer, "This repo is a Tauri app.");
        assert_eq!(a.session_id.as_deref(), Some("abc-123"));
        assert_eq!(a.num_turns, Some(4));
        assert_eq!(a.duration_ms, Some(8421));
        assert_eq!(a.cost_usd, Some(0.0123));
        assert_eq!(a.model.as_deref(), Some("claude-haiku-4-5-20251001"));
    }

    #[test]
    fn surfaces_the_message_on_an_error_result() {
        let out = r#"{"type":"result","is_error":true,"subtype":"error_max_turns","result":"Hit the turn limit."}"#;
        let err = parse_answer(out).unwrap_err();
        assert_eq!(err.message, "Hit the turn limit.");
    }

    #[test]
    fn falls_back_to_subtype_when_an_error_has_no_result() {
        let out = r#"{"is_error":true,"subtype":"error_during_execution"}"#;
        let err = parse_answer(out).unwrap_err();
        assert_eq!(err.message, "error_during_execution");
    }

    #[test]
    fn missing_result_is_an_error_even_without_is_error_flag() {
        let out = r#"{"type":"result","session_id":"x"}"#;
        assert!(parse_answer(out).is_err());
    }

    #[test]
    fn tolerates_a_result_with_only_the_answer() {
        let out = r#"{"result":"Just the answer."}"#;
        let a = parse_answer(out).unwrap();
        assert_eq!(a.answer, "Just the answer.");
        assert_eq!(a.cost_usd, None);
        assert_eq!(a.session_id, None);
    }

    #[test]
    fn rejects_non_json_output() {
        assert!(parse_answer("not json at all").is_err());
        assert!(parse_answer("   ").is_err());
    }
}
