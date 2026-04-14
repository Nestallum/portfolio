import sys
import re
from pathlib import Path
from playwright.sync_api import sync_playwright


def parse_viewport(html: str) -> tuple[int, int]:
    match = re.search(r'width=(\d+),\s*height=(\d+)', html)
    if match:
        return int(match.group(1)), int(match.group(2))
    return 1200, 630  # fallback


def screenshot(html_file: str) -> None:
    path = Path(html_file).resolve()
    output = Path(path.stem + ".png")

    width, height = parse_viewport(path.read_text(encoding="utf-8"))

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(path.as_uri())
        page.screenshot(path=str(output))
        browser.close()

    print(f"Screenshot saved to {output}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python screenshot.py <file.html>")
        sys.exit(1)
    screenshot(sys.argv[1])