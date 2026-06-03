import json
import os
import sys

SYLLABUS_FILE = "syllabus.json"
PROGRESS_FILE = "progress.json"

def load_json(filename):
    if not os.path.exists(filename):
        return None
    with open(filename, 'r') as f:
        return json.load(f)

def save_json(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)

def init_progress():
    if not os.path.exists(PROGRESS_FILE):
        save_json(PROGRESS_FILE, {"current_step": 1, "completed_steps": []})

def get_current_module():
    syllabus = load_json(SYLLABUS_FILE)
    progress = load_json(PROGRESS_FILE)
    current_step = progress.get("current_step", 1)

    for mod in syllabus["modules"]:
      if mod["step"] == current_step:
          return mod
    return syllabus["modules"][-1]

def print_dashboard(shift_type):
    mod = get_current_module()

    print("\n" + "="*60)
    print(f" SYSTEM CONTROLS: MODULE STEP {mod['step']} - {mod['title'].upper()}")
    print("="*60)

    if shift_type in ["morning", "evening"]:
        print(f"\n[+] SHIFT STATE DETECTION: Active {shift_type.capitalize()} Shift")
        print(f"    --> 🚗 COMMUTE TO WORK (23 Mins Target):")
        print(f"        Track:  {mod['to_work_audio']['title']}")
        print(f"        Link:   {mod['to_work_audio']['url']}")
        print(f"\n    --> 🚗 COMMUTE HOME FROM WORK (23 Mins Target):")
        print(f"        Track:  {mod['from_work_audio']['title']}")
        print(f"        Link:   {mod['from_work_audio']['url']}")
        print(f"\n    --> 🛋️ NIGHTLY WIND-DOWN CODE:")
        print(f"        Book:   {mod['nightly_reading']['book']}")
        print(f"        Read:   {mod['nightly_reading']['assignment']}")

    elif shift_type == "off":
        syllabus = load_json(SYLLABUS_FILE)
        exports = syllabus.get("meta", {}).get("daily_exports", [])
        print("\n[+] SHIFT STATE DETECTION: Scheduled Off-Day")
        print("    --> 🛋️ HIGH-EFFICIENCY DEEP READING BLOCK (30 Mins):")
        print(f"        Target Text: {mod['nightly_reading']['book']}")
        print(f"        Assignment:  {mod['nightly_reading']['assignment']}")
        print("\n    --> 🧪 DAILY BEHAVIORAL PROTOCOL (3 Exports):")
        for i, export in enumerate(exports, 1):
            print(f"        {i}. {export}")
        if not exports:
            print("        Execute the 3 'Daily Exports' from your Master Blueprint document.")

    print("\n" + "="*60)
    print(" Run 'python comm_engine.py complete' once this step is fully implemented.")
    print("="*60 + "\n")

def print_scripts():
    syllabus = load_json(SYLLABUS_FILE)
    scripts = syllabus.get("meta", {}).get("scripts", [])
    print("\n" + "="*60)
    print(" STRUCTURED SCRIPTS - DAILY STANDARD OPERATING PROCEDURES")
    print("="*60 + "\n")
    for i, script in enumerate(scripts, 1):
        print(f"    {i}. {script}\n")
    print("="*60 + "\n")

def complete_step():
    progress = load_json(PROGRESS_FILE)
    syllabus = load_json(SYLLABUS_FILE)
    current = progress["current_step"]

    if current < len(syllabus["modules"]):
        progress["completed_steps"].append(current)
        progress["current_step"] = current + 1
        save_json(PROGRESS_FILE, progress)
        print(f"\n[✔] Step {current} checked off. Moving to Step {current + 1}.\n")
    else:
        print("\n[★] Complete syllabus iteration achieved. Mastery sequence locked.\n")

if __name__ == "__main__":
    init_progress()
    if len(sys.argv) < 2:
        print("\nUsage Error: Specify shift condition or progression.")
        print("Commands: python comm_engine.py [morning | evening | off | scripts | complete]\n")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd in ["morning", "evening", "off"]:
        print_dashboard(cmd)
    elif cmd == "scripts":
        print_scripts()
    elif cmd == "complete":
        complete_step()
    else:
        print("Invalid operational command parameter.")
