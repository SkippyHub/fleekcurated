"""Run the Part 1 classifier API."""

import uvicorn

if __name__ == "__main__":
    uvicorn.run("part1_classifier.api:app", host="0.0.0.0", port=8000, reload=True)
