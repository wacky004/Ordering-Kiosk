#!/usr/bin/env python3
"""
Starts the kiosk website without any batch/PowerShell quirks.

Run:  python start-website.py

It finds Node, installs dependencies if needed, then starts the server.
The server opens your browser automatically.
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

print()
print("  McDonald's Kiosk - starting the website")
print("  =======================================")
print(f"  Folder: {ROOT}")
print()

node = shutil.which("node")
if not node:
    print("  ERROR: Node.js was not found. Install the LTS version from https://nodejs.org")
    input("  Press Enter to close...")
    sys.exit(1)

print(f"  Node.js: {node}")

if not os.path.isdir(os.path.join(ROOT, "node_modules", "express")):
    print("  First run detected - installing dependencies...")
    npm = shutil.which("npm") or "npm"
    code = subprocess.call([npm, "install"], shell=(os.name == "nt"))
    if code != 0:
        print("  ERROR: npm install failed.")
        input("  Press Enter to close...")
        sys.exit(1)

print()
print("  Starting the server. Your browser will open automatically.")
print("  Keep this window open. Press Ctrl+C to stop.")
print()

try:
    subprocess.call([node, "server.js"])
except KeyboardInterrupt:
    pass

print()
print("  The server has stopped.")
input("  Press Enter to close...")
