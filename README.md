# Fleek Curated

Hackathon project for **[Fleek](https://joinfleek.com)** — AI-powered clothing upselling. Customers describe what they want (text or image), we classify and understand the request, then customise Fleek products to make them unique.

## Architecture

```
Customer prompt (text or image)
        │
        ▼
┌─────────────────────┐
│  Next.js site (web/) │  ← demo UI
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Part 1 — Classifier │  ← initialised here
│  • text vs image     │
│  • describe intent   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Part 2 — Customizer  │  ← your hackathon work
│  • AI edit clothing  │
│  • product lookup    │
└─────────────────────┘
```

## Part 1 — Classifier (ready)

Determines whether input is **text** or **image**, then returns a structured description:

| Field | Example |
|-------|---------|
| `clothing_item` | hoodie, jacket, t-shirt |
| `customization_intent` | "add neon logo", "make it vintage red" |
| `style_tags` | streetwear, y2k, minimal |
| `summary` | plain-language summary |

### Quick start

**Terminal 1 — Python API**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optional: add OPENAI_API_KEY for smarter descriptions
python main.py
```

API docs: http://localhost:8000/docs

**Terminal 2 — Next.js site**

```bash
cd web
cp .env.local.example .env.local
npm run dev
```

Site: http://localhost:3000

### Example — text prompt

```bash
curl -X POST http://localhost:8000/analyze \
  -F "text=Customise this black hoodie with a vintage wash and streetwear vibe"
```

### Example — image upload

```bash
curl -X POST http://localhost:8000/analyze \
  -F "image=@reference-outfit.jpg" \
  -F "text=Make something like this but in navy"
```

### Python usage

```python
from part1_classifier.pipeline import analyze

result = analyze(text="Turn this jacket Y2K pink")
print(result.classification.input_type)  # text
print(result.description.customization_intent)
```

## Part 2 — Customizer (stub wired)

Part 1 and Part 2 connect via `POST /curate`. Mock catalogue lives in `part1_classifier/data/mock_products.json`.

Your work — replace the mock in:

1. **`customizer.py`** — swap `status: "mock"` for real AI image generation
2. **`product_lookup.py`** — real catalogue search when available

### Integration endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /products` | Mock Fleek catalogue |
| `POST /analyze` | Part 1 only |
| `POST /curate` | Part 1 → Part 2 full pipeline |

## Tests

```bash
pytest
```

## Share on GitHub

```bash
git init
git add .
git commit -m "Initialise Fleek Curated hackathon project"
git branch -M main
git remote add origin https://github.com/YOUR_USER/fleekcurated.git
git push -u origin main
```

## Team split

| Part | Owner | Status |
|------|-------|--------|
| Next.js site | Shared / initialised | ✅ Ready |
| 1 — Classifier | Shared / initialised | ✅ Ready |
| 2 — AI customisation + product lookup | You | 🔨 In progress |
