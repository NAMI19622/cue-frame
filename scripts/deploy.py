"""Deploy CueFrame to Bradbury testnet and seed the demo show.

Reads the deployer private key from the workspace .env (GENLAYER_PRIVATE_KEY).
Usage:
    python scripts/deploy.py            # deploy + seed
    python scripts/deploy.py --no-seed  # deploy only
"""
import os
import sys
import json
import re

from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE = os.path.dirname(ROOT)
CONTRACT_PATH = os.path.join(ROOT, "contracts", "contract.py")


def load_key() -> str:
    # Prefer environment, then workspace .env, then project .env.
    key = os.environ.get("GENLAYER_PRIVATE_KEY")
    if key:
        return key.strip().strip('"')
    for env_path in (os.path.join(WORKSPACE, ".env"), os.path.join(ROOT, ".env")):
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as fh:
                for line in fh:
                    m = re.match(r'\s*GENLAYER_PRIVATE_KEY\s*=\s*"?([^"\r\n]+)"?', line)
                    if m:
                        return m.group(1).strip()
    raise SystemExit("GENLAYER_PRIVATE_KEY not found in env or .env")


def main():
    seed = "--no-seed" not in sys.argv
    key = load_key()
    account = create_account(account_private_key=key)
    client = create_client(chain=testnet_bradbury, account=account)
    print("Deployer:", account.address)

    with open(CONTRACT_PATH, "r", encoding="utf-8") as fh:
        code = fh.read()

    print("Deploying CueFrame ...")
    tx_hash = client.deploy_contract(code=code, args=[])
    print("Deploy tx:", tx_hash)
    receipt = client.wait_for_transaction_receipt(
        transaction_hash=tx_hash, status="ACCEPTED", retries=80, interval=5000
    )
    address = receipt.get("data", {}).get("contract_address") or receipt.get("contract_address")
    if not address:
        address = _find_address(receipt)
    print("Contract address:", address)

    out = {"contract": address, "deployTx": tx_hash, "network": "testnet-bradbury"}
    with open(os.path.join(ROOT, "deployment.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print("Wrote deployment.json")

    if seed and address:
        seed_demo(client, address)


def _find_address(receipt):
    # Walk nested dict for a contract_address key.
    stack = [receipt]
    while stack:
        cur = stack.pop()
        if isinstance(cur, dict):
            for k, v in cur.items():
                if k in ("contract_address", "contractAddress") and isinstance(v, str):
                    return v
                stack.append(v)
        elif isinstance(cur, list):
            stack.extend(cur)
    return None


def _write(client, address, method, args):
    print("  write:", method)
    tx = client.write_contract(address=address, function_name=method, args=args)
    client.wait_for_transaction_receipt(
        transaction_hash=tx, status="ACCEPTED", retries=80, interval=5000
    )
    return tx


def seed_demo(client, address):
    print("Seeding demo show 'Indie Builder Launch Night' ...")
    _write(client, address, "create_show_spine", [
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

    # Cue 1: backstage opening roll, fully prepared.
    _write(client, address, "create_cue_card", [
        "cue_opening_roll", "show_launch_night",
        "Opening Title Roll",
        "vtr", "opening", "T-00:20 to T+00:00", "video",
        "Roll the opening title package and bring the music bed up under the host intro.",
        ["title package loaded on server", "music bed cued", "host mic open"],
        [], "backstage",
        "Hold on the standby slate and take the host on camera 1.",
        "low", "none",
    ])

    # Cue 2: audience-facing Open Q&A that needs the guest present and acknowledged.
    _write(client, address, "create_cue_card", [
        "cue_open_qa", "show_launch_night",
        "Open Q&A",
        "talent", "open_q_and_a", "T+32:00 to T+44:00", "host",
        "Bring the guest to the couch and open audience questions live on camera.",
        ["guest present on set", "audience mics live", "lower-third graphic ready"],
        ["cue_opening_roll"], "audience_facing",
        "If the guest is not ready, hold on a host monologue and take a sponsor bumper.",
        "medium", "stage_manager",
    ])

    # Cue 3: the early winner announcement, an ordering violation that must block.
    _write(client, address, "create_cue_card", [
        "cue_early_winner", "show_launch_night",
        "Early Winner Announcement",
        "announcement", "demo_block", "T+12:00 to T+12:30", "host",
        "Announce the launch night winner during the demo block to build excitement.",
        ["winner name confirmed by judges"],
        ["cue_open_qa"], "audience_facing",
        "",
        "high", "producer",
    ])

    print("Seed complete. Demo show 'show_launch_night' with three cues is ready to evaluate from the UI.")


if __name__ == "__main__":
    main()
