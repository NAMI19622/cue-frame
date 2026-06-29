import json
import os

# Windows workaround: the gltest direct loader maps a temp file onto stdin (fd 0)
# and then tries to unlink it while it is still open, which Windows forbids
# (WinError 32). Swallow that specific error so the in-memory test VM can run.
# This does not affect contract behavior; it only tolerates a leftover temp file.
_orig_unlink = os.unlink


def _safe_unlink(path, *args, **kwargs):
    try:
        return _orig_unlink(path, *args, **kwargs)
    except PermissionError:
        return None


os.unlink = _safe_unlink

CONTRACT = os.path.join("contracts", "contract.py")


def seed_show(contract, vm, owner, show_id="show_finale"):
    vm.sender = owner
    contract.create_show_spine(
        show_id,
        "Aurora Awards Live Finale",
        "awards_show",
        "live",
        ["cold_open", "category_block", "q_and_a", "winner_reveal", "credits"],
        [
            "do not announce the winner before the q_and_a segment ends",
            "no pyro cue may fire without safety officer confirmation",
            "audience-facing cues require the responsible role to acknowledge",
        ],
        ["stage_manager", "audio", "lighting", "talent"],
    )
    return show_id


def seed_cue(contract, vm, owner, cue_id="cue_open", show_id="show_finale", **kw):
    vm.sender = owner
    defaults = dict(
        title="Cold Open Roll",
        cue_type="vtr",
        segment="cold_open",
        timing_window="T-00:30 to T+00:00",
        responsible_role="audio",
        instruction="Roll the cold open package and bring up the bed.",
        preconditions=["package loaded on server", "audio bed cued", "lighting in preset 1"],
        dependencies=[],
        audience_visibility="backstage",
        fallback_instruction="Hold on slate and go to host on camera 2.",
        risk_level="low",
        confirmation_requirement="none",
    )
    defaults.update(kw)
    contract.create_cue_card(
        cue_id,
        show_id,
        defaults["title"],
        defaults["cue_type"],
        defaults["segment"],
        defaults["timing_window"],
        defaults["responsible_role"],
        defaults["instruction"],
        defaults["preconditions"],
        defaults["dependencies"],
        defaults["audience_visibility"],
        defaults["fallback_instruction"],
        defaults["risk_level"],
        defaults["confirmation_requirement"],
    )
    return cue_id


def seed_ack(contract, vm, sender, ack_id, cue_id, role, ack_text="standing by"):
    vm.sender = sender
    contract.submit_role_acknowledgement(ack_id, cue_id, role, ack_text)
    return ack_id


def mock_gate(vm, gate, matched=None, unresolved=None, dependency_issues=None,
              role_issues=None, risk=None, actions=None, confidence=90, reason="test"):
    payload = {
        "gate": gate,
        "matched_preconditions": matched or [],
        "unresolved_preconditions": unresolved or [],
        "dependency_issues": dependency_issues or [],
        "role_issues": role_issues or [],
        "risk_flags": risk or [],
        "required_actions": actions or [],
        "confidence": confidence,
        "reason": reason,
    }
    vm.mock_llm(r".*CueFrame.*", json.dumps(payload))
