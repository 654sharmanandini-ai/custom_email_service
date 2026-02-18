import requests
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("PLUNK_API_KEY")
PLUNK_URL = "https://api.useplunk.com/v1/send"


BASE_TRACK_URL = "https://pockily-operculate-rose.ngrok-free.dev"

def send_email(to, subject, body):
    email_id = str(uuid.uuid4())

    tracking_pixel = f'<img src="https://pockily-operculate-rose.ngrok-free.dev/track/{email_id}" width="1" height="1" />'

    html_body = f"""
    <html>
        <body>
            <p>{body}</p>
            {tracking_pixel}
        </body>
    </html>
    """

    response = requests.post(
        PLUNK_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        json={
            "to": to,
            "subject": subject,
            "body": html_body,
            "type": "html"
        },
    )

    try:
        plunk_response = response.json()
    except:
        plunk_response = {"error": response.text}

    return {
        "email_id": email_id,
        "plunk_response": plunk_response
    }
