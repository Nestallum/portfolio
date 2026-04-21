import sys
from pathlib import Path
from playwright.sync_api import sync_playwright


def screenshot(html_file: str, width: int, height: int, output: str):
    path = Path(html_file).resolve()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": width, "height": height},
            device_scale_factor=2
        )

        page.goto(path.as_uri())
        page.wait_for_load_state("networkidle")

        page.screenshot(
            path=output,
            clip={"x": 0, "y": 0, "width": width, "height": height}
        )

        browser.close()

    print(f"Saved: {output}")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python screenshot.py <file.html> <width> <height> <output.png>")
        sys.exit(1)

    html_file = sys.argv[1]
    width = int(sys.argv[2])
    height = int(sys.argv[3])
    output = sys.argv[4]

    screenshot(html_file, width, height, output)