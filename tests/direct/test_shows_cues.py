from conftest import CONTRACT, seed_show, seed_cue, seed_ack


def test_create_show_and_read_back(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_show(c, direct_vm, direct_alice)
    s = c.get_show("show_finale")
    assert s["title"] == "Aurora Awards Live Finale"
    assert s["eventType"] == "awards_show"
    assert s["showMode"] == "live"
    assert "winner_reveal" in s["segments"]
    assert "stage_manager" in s["requiredRoles"]


def test_duplicate_show_rejected(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_show(c, direct_vm, direct_alice)
    with direct_vm.expect_revert("already exists"):
        seed_show(c, direct_vm, direct_alice)


def test_cue_requires_show(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("show not found"):
        seed_cue(c, direct_vm, direct_alice)


def test_create_cue_and_counts(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_show(c, direct_vm, direct_alice)
    seed_cue(c, direct_vm, direct_alice)
    cue = c.get_cue("cue_open")
    assert cue["cueType"] == "vtr"
    assert cue["segment"] == "cold_open"
    assert len(cue["preconditions"]) == 3
    assert cue["status"] == "drafted"
    assert c.get_show("show_finale")["cueCount"] == 1
    summary = c.get_summary()
    assert summary["shows"] == 1
    assert summary["cues"] == 1
    assert summary["gateValues"][0] == "READY"


def test_submit_acknowledgement_counts(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = direct_deploy(CONTRACT)
    seed_show(c, direct_vm, direct_alice)
    seed_cue(c, direct_vm, direct_alice)
    seed_ack(c, direct_vm, direct_bob, "ack_1", "cue_open", "audio")
    cue = c.get_cue("cue_open")
    assert cue["ackCount"] == 1
    acks = c.get_acks_for_cue("cue_open", 0, 20)
    assert acks["total"] == 1
    assert acks["items"][0]["role"] == "audio"


def test_pagination_shows_and_cues(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_show(c, direct_vm, direct_alice)
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_a")
    seed_cue(c, direct_vm, direct_alice, cue_id="cue_b", segment="credits")
    page = c.get_shows_page(0, 20)
    assert page["total"] == 1
    assert page["items"][0]["id"] == "show_finale"
    cues = c.get_cues_for_show("show_finale", 0, 1)
    assert cues["total"] == 2
    assert cues["limit"] == 1
    assert len(cues["items"]) == 1


def test_pagination_limit_capped(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_show(c, direct_vm, direct_alice)
    page = c.get_shows_page(0, 500)
    assert page["limit"] == 20
