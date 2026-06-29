from conftest import CONTRACT, seed_show, seed_cue, seed_ack, mock_gate


def _setup(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_show(c, direct_vm, direct_alice)
    return c


# Scenario 1: a fully prepared backstage cue clears the gate as READY.
def test_ready_cue(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_ready",
             audience_visibility="backstage", risk_level="low")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=94)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_ready")
    cue = c.get_cue("cue_ready")
    assert cue["gate"] == "READY"
    assert cue["status"] == "ready"
    assert cue["proofHash"].startswith("0xCF")
    summary = {v["validator"]: v for v in cue["validatorSummary"]}
    assert summary["gate_consistency"]["passed"] is True


# Scenario 2: an audience-facing cue with no required acknowledgement is held.
def test_missing_acknowledgement_holds(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_face",
             responsible_role="talent",
             audience_visibility="audience_facing",
             segment="winner_reveal")
    # The model optimistically says READY; the backstop must hold it.
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=88)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_face")
    cue = c.get_cue("cue_face")
    assert cue["gate"] == "HOLD"
    assert cue["status"] == "holding"
    summary = {v["validator"]: v for v in cue["validatorSummary"]}
    assert summary["role_acknowledgement"]["passed"] is False
    assert "talent" in cue["roleIssues"]


# Scenario 3: an acknowledgement by the wrong role does not count toward readiness.
def test_wrong_role_acknowledgement(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_wrong",
             responsible_role="talent",
             audience_visibility="audience_facing",
             segment="winner_reveal")
    # Wrong role acknowledges; "catering" is not a required role for this show.
    seed_ack(c, direct_vm, direct_bob, "ack_bad", "cue_wrong", "catering", "I have it")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=80)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_wrong")
    cue = c.get_cue("cue_wrong")
    assert cue["gate"] == "HOLD"
    summary = {v["validator"]: v for v in cue["validatorSummary"]}
    assert summary["role_acknowledgement"]["passed"] is False
    assert "talent" in cue["roleIssues"]


# Scenario 4: a cue that violates a show ordering rule is blocked.
def test_contradictory_cue_blocked(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    # Later-segment cue this early cue should not depend on.
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_winner",
             segment="winner_reveal", title="Winner Reveal")
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_early",
             segment="cold_open", dependencies=["cue_winner"],
             title="Pre-reveal teaser")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=70)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_early")
    cue = c.get_cue("cue_early")
    assert cue["gate"] == "BLOCKED"
    assert cue["status"] == "blocked"
    summary = {v["validator"]: v for v in cue["validatorSummary"]}
    assert summary["show_rule"]["passed"] is False
    assert summary["show_rule"]["blocks"] is True


# Scenario 4b: a pyro cue requiring safety confirmation escalates.
def test_producer_confirmation_required(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_pyro",
             cue_type="pyro", segment="winner_reveal",
             responsible_role="stage_manager",
             audience_visibility="backstage",
             risk_level="high",
             fallback_instruction="Abort pyro and cut to wide shot.",
             confirmation_requirement="safety_officer")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=85)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_pyro")
    cue = c.get_cue("cue_pyro")
    assert cue["gate"] == "PRODUCER_CONFIRMATION_REQUIRED"
    summary = {v["validator"]: v for v in cue["validatorSummary"]}
    assert summary["producer_confirmation"]["passed"] is False
    assert "await_safety_officer" in cue["requiredActions"]


# Scenario 5: a high-risk cue with no fallback needs revision.
def test_missing_fallback_needs_revision(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_norisk",
             segment="category_block", risk_level="high",
             audience_visibility="backstage",
             fallback_instruction="")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=75)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_norisk")
    cue = c.get_cue("cue_norisk")
    assert cue["gate"] == "NEEDS_REVISION"
    assert cue["status"] == "revising"
    summary = {v["validator"]: v for v in cue["validatorSummary"]}
    assert summary["fallback_safety"]["passed"] is False
    assert "missing_fallback" in cue["requiredActions"]


# Scenario 6: a high-risk cue whose fallback resolves the risk settles READY_WITH_CAUTION.
def test_fallback_resolves_risk(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_caution",
             segment="category_block", risk_level="high",
             audience_visibility="backstage",
             fallback_instruction="Cut to standby slate if the feed drops.",
             confirmation_requirement="none")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=90)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_caution")
    cue = c.get_cue("cue_caution")
    assert cue["gate"] == "READY_WITH_CAUTION"
    assert cue["status"] == "ready"
    assert "fallback_armed" in cue["riskFlags"]


# Scenario 7: fabricated precondition evidence is dropped by the validator.
def test_fake_evidence_dropped(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_fake",
             audience_visibility="backstage", risk_level="low")
    # Index 99 does not exist among the three preconditions.
    mock_gate(direct_vm, "READY", matched=[99], dependency_issues=["ghost_cue"],
              role_issues=["ghost_role"], confidence=65)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_fake")
    cue = c.get_cue("cue_fake")
    summary = {v["validator"]: v for v in cue["validatorSummary"]}
    assert summary["evidence_consistency"]["passed"] is False
    assert cue["matchedPreconditions"] == []
    assert "ghost_cue" not in cue["dependencyIssues"]
    assert "ghost_role" not in cue["roleIssues"]


# Scenario 8: a ready cue can be sealed into a receipt.
def test_receipt_ready(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_seal",
             audience_visibility="backstage", risk_level="low")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=92)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_seal")
    c.record_cue_receipt("cue_seal")
    rc = c.get_receipt_for_cue("cue_seal")
    assert rc["cueId"] == "cue_seal"
    assert rc["gate"] == "READY"
    assert rc["proofHash"].startswith("0xCF")
    # the cue is marked complete once its receipt is sealed
    assert c.get_cue("cue_seal")["status"] == "complete"


# Dependency completeness: an incomplete prior cue holds the dependent cue.
def test_incomplete_dependency_holds(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_first",
             segment="cold_open", title="First")
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_second",
             segment="category_block", dependencies=["cue_first"], title="Second")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2], confidence=80)
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_second")
    cue = c.get_cue("cue_second")
    assert cue["gate"] == "HOLD"
    summary = {v["validator"]: v for v in cue["validatorSummary"]}
    assert summary["dependency_completeness"]["passed"] is False
    assert "cue_first" in cue["dependencyIssues"]


# Double evaluation is rejected.
def test_double_evaluation_rejected(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_dbl",
             audience_visibility="backstage", risk_level="low")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2])
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_dbl")
    with direct_vm.expect_revert("already evaluated"):
        c.evaluate_cue_gate("cue_dbl")


# Show receipt aggregates cue outcomes.
def test_show_receipt(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_ok",
             audience_visibility="backstage", risk_level="low")
    mock_gate(direct_vm, "READY", matched=[0, 1, 2])
    direct_vm.sender = direct_alice
    c.evaluate_cue_gate("cue_ok")
    c.record_show_receipt("show_finale")
    rc = c.get_receipt_for_show("show_finale")
    assert rc["showId"] == "show_finale"
    assert rc["cuesReady"] == 1
    assert rc["proofHash"].startswith("0xCS")
