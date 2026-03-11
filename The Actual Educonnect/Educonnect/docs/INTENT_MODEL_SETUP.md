# Using the Colab-Trained Intent Model in EduConnect

The intent model you train in **NLP_TRAINED_MODEL_FOR_STUDY_GROUPS.ipynb** (Google Colab) can be used by the Python backend so that **EduBot/AtlasBot** uses the trained classifier instead of (or before) the built-in embedding similarity.

---

## 1. Train the model in Colab

1. Open the notebook in [Google Colab](https://colab.research.google.com).
2. Upload your intent CSV to Drive (e.g. `My Drive/intents_for_colab.csv`) or use the path set in the notebook.
3. Run all cells. At the end, the model is saved to:
   - **`/content/drive/MyDrive/Peertopeer/models/intent`**  
   (or whatever `OUTPUT_DIR` is in the notebook.)

---

## 2. Download the model into your project

After training in Colab, copy the **entire** `intent` folder from Google Drive to your machine.

**From Google Drive (browser):**

1. Go to [drive.google.com](https://drive.google.com) → **My Drive** → **Peertopeer** → **models** → **intent**.
2. Select the **intent** folder (or all files inside it).
3. Right‑click → **Download** (or **Download as .zip** then unzip).

**You should have a folder containing at least:**

- `config.json`
- `pytorch_model.bin` or `model.safetensors`
- `tokenizer_config.json`
- `vocab.txt` (and possibly other tokenizer files)

---

## 3. Place the model in the backend

Put that folder inside your EduConnect project so the Python backend can load it:

**Path:**

```
Educonnect/
  backend/
    models/
      intent/          <-- put the downloaded folder here
        config.json
        pytorch_model.bin   (or model.safetensors)
        tokenizer_config.json
        vocab.txt
        ...
```

So: **`The Actual Educonnect\Educonnect\backend\models\intent\`** with all the saved files inside.

**Optional:** To use a different path, set the environment variable before starting the backend:

- Windows: `set TRAINED_INTENT_MODEL_DIR=C:\path\to\intent`
- Linux/Mac: `export TRAINED_INTENT_MODEL_DIR=/path/to/intent`

---

## 4. Install backend dependencies

The backend needs `transformers` and `torch` to load the trained model:

```bash
cd "The Actual Educonnect\Educonnect\backend"
pip install -r requirements.txt
```

---

## 5. Run the Python backend

The Node server (chat route) calls the NLP backend at **http://localhost:5001** by default. The Python backend is set to run on port **5001** so they match.

```bash
cd "The Actual Educonnect\Educonnect\backend"
python app.py
```

The app will listen on **http://localhost:5001**. To use another port: `set PORT=5002` (Windows) or `export PORT=5002` (Mac/Linux), then run `python app.py`.

---

## 6. Run the rest of the app

1. **Node server** (EduConnect API + chat route that calls the Python backend):

   ```bash
   cd "The Actual Educonnect\Educonnect\server"
   npm start
   ```

2. **Frontend:**

   ```bash
   cd "The Actual Educonnect\Educonnect"
   npm run dev
   ```

3. Open the app, open **EduBot**, and send a message. The Node server will call the Python backend’s `/api/nlp/atlas-intent`; if the trained model is in `backend/models/intent`, the backend will use it and return intent + confidence so the bot responds using your Colab-trained model.

---

## 7. Behaviour summary

| Situation | What happens |
|-----------|----------------|
| **Model in `backend/models/intent`** and loads successfully | AtlasBot intent uses the **Colab-trained classifier** (intent + confidence). |
| **No model folder or load fails** | Backend falls back to **embedding similarity** (same as before). |

No frontend or Node changes are required; only the Python backend needs the model files and the updated code (already in `app.py`).
