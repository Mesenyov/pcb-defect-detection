import os
import glob
import cv2
import time
import asyncio
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi.concurrency import run_in_threadpool

from app.config import TEMPLATES_DIR, EXAMPLES_DIR, BASE_DIR, RESULTS_DIR
from app.inspector import PCBInspector
from app.utils import image_to_base64, read_imagefile

async def cleanup_results_task():
    while True:
        try:
            now = time.time()
            for filename in os.listdir(RESULTS_DIR):
                file_path = os.path.join(RESULTS_DIR, filename)
                if os.path.isfile(file_path):
                    if os.stat(file_path).st_mtime < now - 1800:
                        os.remove(file_path)
        except Exception as e:
            print(f"Cleanup error: {e}")
        await asyncio.sleep(600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_results_task())
    yield
    task.cancel()

app = FastAPI(title="PCB Defect Detective", lifespan=lifespan)
inspector = PCBInspector()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
async def read_root():
    with open(os.path.join(BASE_DIR, "templates", "index.html"), "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/api/templates")
async def get_templates():
    if not os.path.exists(TEMPLATES_DIR): return []
    extensions =["*.jpg", "*.JPG", "*.jpeg", "*.png", "*.PNG"]
    all_files =[]
    for ext in extensions: all_files.extend(glob.glob(os.path.join(TEMPLATES_DIR, ext)))
    unique_files = list({os.path.abspath(f).lower(): f for f in all_files}.values())
    results = []
    for f in sorted(unique_files)[:20]:
        try:
            img = cv2.imread(f)
            if img is None: continue
            img_small = cv2.resize(img, (200, 150))
            results.append({"name": os.path.basename(f), "src": f"data:image/jpeg;base64,{image_to_base64(img_small)}"})
        except: continue
    return results

@app.get("/api/examples")
async def get_examples():
    if not os.path.exists(EXAMPLES_DIR): return []
    extensions =["*.jpg", "*.JPG", "*.jpeg", "*.png", "*.PNG"]
    all_files =[]
    for ext in extensions: all_files.extend(glob.glob(os.path.join(EXAMPLES_DIR, ext)))
    unique_files = list({os.path.abspath(f).lower(): f for f in all_files}.values())
    results =[]
    for f in sorted(unique_files):
        try:
            img = cv2.imread(f)
            if img is None: continue
            img_small = cv2.resize(img, (150, 150))
            results.append({"name": os.path.basename(f), "src": f"data:image/jpeg;base64,{image_to_base64(img_small)}"})
        except: continue
    return results

@app.post("/api/analyze")
async def analyze_pcb(
    test_image: Optional[UploadFile] = File(None),
    template_image: Optional[UploadFile] = File(None),
    test_filename: Optional[str] = Form(None),
    template_filename: Optional[str] = Form(None),
    lang: str = Form("en")
):
    img_test = None
    if test_image: img_test = read_imagefile(await test_image.read())
    elif test_filename:
        path = os.path.join(EXAMPLES_DIR, test_filename)
        if os.path.exists(path): img_test = cv2.imread(path)
    if img_test is None: raise HTTPException(status_code=400, detail="Test image not found")

    img_gold = None
    if template_image: img_gold = read_imagefile(await template_image.read())
    elif template_filename:
        path = os.path.join(TEMPLATES_DIR, template_filename)
        if not os.path.exists(path) and test_filename:
            group_id = test_filename.split('_')[0]
            for ext in ['.JPG', '.jpg']:
                try_path = os.path.join(TEMPLATES_DIR, f"{group_id}{ext}")
                if os.path.exists(try_path):
                    path = try_path
                    break
        if os.path.exists(path): img_gold = cv2.imread(path)

    if img_gold is None: raise HTTPException(status_code=400, detail="Template image not found")

    if img_test.shape[:2] != img_gold.shape[:2]:
        img_gold = cv2.resize(img_gold, (img_test.shape[1], img_test.shape[0]))

    try:
        result = await run_in_threadpool(inspector.predict_and_visualize, img_test, img_gold, lang)
        return JSONResponse(content=result)
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)