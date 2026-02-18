from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List
from email_service import send_email
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from fastapi import UploadFile, File, Form
import pandas as pd
import uuid

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Scheduler ----------------
scheduler = BackgroundScheduler()
scheduler.start()

# ---------------- In-memory store ----------------
email_store = {}

# ===================== MODELS =====================

class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str


class BulkEmailRequest(BaseModel):
    emails: List[str]
    subject: str
    body: str


class ScheduleEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    schedule_time: str


class ScheduleBulkRequest(BaseModel):
    emails: List[str]
    subject: str
    body: str
    schedule_time: str


# ===================== HELPERS =====================

def send_and_store(email_id, to, subject, body):
    send_email(to, subject, body)

    email_store[email_id] = {
        "to": to,
        "subject": subject,
        "status": "Sent",
        "sent_at": str(datetime.now())
    }


# ===================== ROUTES =====================

# ---------- SINGLE SEND ----------
@app.post("/send")
def send_single_email(request: EmailRequest):
    email_id = str(uuid.uuid4())

    send_and_store(email_id, request.to, request.subject, request.body)

    return {
        "email_id": email_id,
        "message": "Email sent successfully"
    }


# ---------- BULK SEND ----------
''''@app.post("/send-bulk")
def send_bulk_email(request: BulkEmailRequest):
    results = []

    for email in request.emails:
        email_id = str(uuid.uuid4())
        send_and_store(email_id, email, request.subject, request.body)

        results.append({
            "email_id": email_id,
            "to": email
        })

    return {
        "message": "Bulk emails sent",
        "results": results
    }

'''
# ---------- SINGLE SCHEDULE ----------
@app.post("/schedule")
def schedule_email(request: ScheduleEmailRequest):

    email_id = str(uuid.uuid4())
    run_time = datetime.fromisoformat(request.schedule_time)

    email_store[email_id] = {
        "to": request.to,
        "subject": request.subject,
        "status": "Scheduled",
        "sent_at": None
    }

    scheduler.add_job(
        send_and_store,
        'date',
        run_date=run_time,
        args=[email_id, request.to, request.subject, request.body]
    )

    return {
        "email_id": email_id,
        "message": "Email scheduled",
        "scheduled_for": run_time
    }


# ---------- BULK SCHEDULE ----------
''''@app.post("/schedule-bulk")
def schedule_bulk(request: ScheduleBulkRequest):

    run_time = datetime.fromisoformat(request.schedule_time)
    results = []

    for email in request.emails:
        email_id = str(uuid.uuid4())

        email_store[email_id] = {
            "to": email,
            "subject": request.subject,
            "status": "Scheduled",
            "sent_at": None
        }

        scheduler.add_job(
            send_and_store,
            'date',
            run_date=run_time,
            args=[email_id, email, request.subject, request.body]
        )

        results.append({
            "email_id": email_id,
            "to": email
        })

    return {
        "message": "Bulk emails scheduled",
        "scheduled_for": run_time,
        "results": results
    }
'''
# ---------- upload_bulk_files ----------
@app.post("/upload-and-send")
async def upload_and_send(
    file: UploadFile = File(...),
    subject: str = Form(...),
    body: str = Form(...)
):
    try:
        df = pd.read_excel(file.file)

        required_columns = ["firstname", "lastname", "email", "phone", "company"]

        for col in required_columns:
            if col not in df.columns:
                return {"error": f"Missing required column: {col}"}

        results = []

        for _, row in df.iterrows():
            email = row["email"]

            if pd.isna(email):
                continue

            result = send_email(email, subject, body)
            results.append(result)

        return {
            "message": "Emails sent successfully",
            "total_sent": len(results)
        }

    except Exception as e:
        return {"error": str(e)}

# ---------- Schedule_bulk_files ----------
@app.post("/upload-and-schedule")
async def upload_and_schedule(
    file: UploadFile = File(...),
    subject: str = Form(...),
    body: str = Form(...),
    schedule_time: str = Form(...)
):
    try:
        df = pd.read_excel(file.file)

        required_columns = ["firstname", "lastname", "email", "phone", "company"]

        for col in required_columns:
            if col not in df.columns:
                return {"error": f"Missing required column: {col}"}

        run_time = datetime.fromisoformat(schedule_time)

        total = 0

        for _, row in df.iterrows():
            email = row["email"]

            if pd.isna(email):
                continue

            scheduler.add_job(
                send_email,
                'date',
                run_date=run_time,
                args=[email, subject, body]
            )

            total += 1

        return {
            "message": "Emails scheduled successfully",
            "total_scheduled": total,
            "scheduled_for": run_time
        }

    except Exception as e:
        return {"error": str(e)}

# ---------- TRACK ----------
@app.get("/track/{email_id}")
def track_email(email_id: str):

    if email_id in email_store:
        email_store[email_id]["status"] = "Opened"

    return Response(
        content=b"",
        media_type="image/png"
    )


# ---------- STATUS ----------
@app.get("/status/{email_id}")
def check_status(email_id: str):

    if email_id in email_store:
        return email_store[email_id]

    return {"error": "Email not found"}