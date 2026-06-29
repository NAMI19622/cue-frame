"""Seed the demo show, cues, and an acknowledgement onto the deployed contract."""
import os, re, json
from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE = os.path.dirname(ROOT)


def load_key():
    key = os.environ.get("GENLAYER_PRIVATE_KEY")
    if key:
        return key.strip().strip('"')
    with open(os.path.join(WORKSPACE, ".env"), "r", encoding="utf-8") as fh:
        for line in fh:
            m = re.match(r'\s*GENLAYER_PRIVATE_KEY\s*=\s*"?([^"\r\n]+)"?', line)
            if m:
                return m.group(1).strip()


with open(os.path.join(ROOT, "deployment.json")) as fh:
    ADDRESS = json.load(fh)["contract"]

acct = create_account(account_private_key=load_key())
client = create_client(chain=testnet_bradbury, account=acct)


def w(method, args):
    print("write:", method)
    tx = client.write_contract(address=ADDRESS, function_name=method, args=args)
    client.wait_for_transaction_receipt(
        transaction_hash=tx, status="ACCEPTED", retries=90, interval=5000
    )
    print("  accepted:", tx)


def has(view, arg):
    try:
        client.read_contract(address=ADDRESS, function_name=view, args=[arg])
        return True
    except Exception:
        return False


if not has("get_show", "show_launch_night"):
    w("create_show_spine", [
        "show_launch_night",
        "Indie Builder Launch Night",
        "livestream",
        "live",
        ["pre_show", "opening", "demo_block", "guest_interview", "open_q_and_a", "winner_announcement", "wrap"],
        [
            "do not announce the winner before the open_q_and_a segment ends",
            "audience-facing cues require the responsible role to acknowledge",
            "no high-risk cue may fire without a fallback on record",
        ],
        ["host", "stage_manager", "audio", "video", "guest_wrangler"],
    ])

if not has("get_cue", "cue_opening_roll"):
    w("create_cue_card", [
        "cue_opening_roll", "show_launch_night",
        "Opening Title Roll",
        "vtr", "opening", "T-00:20 to T+00:00", "video",
        "Roll the opening title package and bring the music bed up under the host intro.",
        ["title package loaded on server", "music bed cued", "host mic open"],
        [], "backstage",
        "Hold on the standby slate and take the host on camera 1.",
        "low", "none",
    ])

if not has("get_cue", "cue_open_qa"):
    w("create_cue_card", [
        "cue_open_qa", "show_launch_night",
        "Open Q&A",
        "talent", "open_q_and_a", "T+32:00 to T+44:00", "host",
        "Bring the guest to the couch and open audience questions live on camera.",
        ["guest present on set", "audience mics live", "lower-third graphic ready"],
        ["cue_opening_roll"], "audience_facing",
        "If the guest is not ready, hold on a host monologue and take a sponsor bumper.",
        "medium", "stage_manager",
    ])

if not has("get_cue", "cue_early_winner"):
    w("create_cue_card", [
        "cue_early_winner", "show_launch_night",
        "Early Winner Announcement",
        "announcement", "demo_block", "T+12:00 to T+12:30", "host",
        "Announce the launch night winner during the demo block to build excitement.",
        ["winner name confirmed by judges"],
        ["cue_open_qa"], "audience_facing",
        "",
        "high", "producer",
    ])

# A single acknowledgement on the opening roll from its responsible role.
w("submit_role_acknowledgement", [
    "ack_opening_video", "cue_opening_roll", "video", "Title package loaded and bed cued, standing by.",
])

print("Seed complete.")
print(json.dumps(client.read_contract(address=ADDRESS, function_name="get_summary", args=[]), default=str))
