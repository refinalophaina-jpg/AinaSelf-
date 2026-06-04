#!/usr/bin/env python3
"""
Download book EPUBs from Archive.org lending library.
Requires a free Archive.org account and active browser session cookies.
"""
import os
import sys
import json
import time

BOOKS = [
    {
        "id": "difficult_conversations",
        "archive_id": "difficultconvers00doug",
        "title": "Difficult Conversations",
        "filename": "difficult_conversations.epub"
    },
    {
        "id": "crucial_conversations",
        "archive_id": "crucialconversat00patt",
        "title": "Crucial Conversations",
        "filename": "crucial_conversations.epub"
    },
    {
        "id": "relationship_cure",
        "archive_id": "isbn_9780609608098",
        "title": "The Relationship Cure",
        "filename": "relationship_cure.epub"
    }
]

BOOKS_DIR = os.path.join(os.path.dirname(__file__), '..', 'books')
ARCHIVE_BASE = "https://archive.org"


def check_dependencies():
    try:
        import requests
    except ImportError:
        print("Install requests: pip install requests")
        sys.exit(1)


def fetch_book(book, session_cookies=None):
    import requests
    os.makedirs(BOOKS_DIR, exist_ok=True)
    out_path = os.path.join(BOOKS_DIR, book["filename"])

    if os.path.exists(out_path):
        size = os.path.getsize(out_path)
        print(f"  Already exists: {book['filename']} ({size // 1024}KB)")
        return True

    # Try direct download URL
    url = f"{ARCHIVE_BASE}/download/{book['archive_id']}/{book['archive_id']}.epub"
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        sess = requests.Session()
        if session_cookies:
            sess.cookies.update(session_cookies)

        print(f"  Fetching: {book['title']}")
        r = sess.get(url, headers=headers, timeout=30, stream=True)

        if r.status_code == 200 and 'epub' in r.headers.get('content-type', '').lower():
            with open(out_path, 'wb') as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            size = os.path.getsize(out_path)
            print(f"  Saved: {book['filename']} ({size // 1024}KB)")
            return True
        elif r.status_code == 403:
            print(f"  Access denied -- borrow the book first at:")
            print(f"    https://archive.org/details/{book['archive_id']}")
            print(f"    Then export your cookies and pass them via ARCHIVE_COOKIES env var")
            return False
        else:
            print(f"  HTTP {r.status_code} for {book['title']}")
            return False
    except Exception as e:
        print(f"  Error: {e}")
        return False


def main():
    check_dependencies()

    # Optional: load cookies from env or file
    cookies = {}
    cookie_env = os.environ.get('ARCHIVE_COOKIES', '')
    if cookie_env:
        try:
            cookies = json.loads(cookie_env)
        except Exception:
            pass

    print("\n+-- Archive.org Book Fetcher ----------------------------------------+")
    print("|  Saves EPUBs to books/ for in-browser reading                      |")
    print("+--------------------------------------------------------------------+\n")

    results = []
    for book in BOOKS:
        print(f"\n[{book['id']}]")
        ok = fetch_book(book, cookies)
        results.append((book['title'], ok))
        time.sleep(1)

    print("\n-- Results ---------------------------------------------------------")
    for title, ok in results:
        icon = "OK" if ok else "FAIL"
        print(f"  [{icon}]  {title}")

    not_found = [t for t, ok in results if not ok]
    if not_found:
        print("\n-- Manual Download Instructions ------------------------------------")
        print("  1. Create a free account at archive.org")
        print("  2. Search for and borrow each book (14-day loan)")
        print("  3. Download the EPUB format")
        print("  4. Place the file in the books/ directory")
        print("  5. Rename to match: difficult_conversations.epub, etc.\n")


if __name__ == "__main__":
    main()
