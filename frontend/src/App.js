import { useState, useEffect } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [activeTab, setActiveTab] = useState("single");

  const [to, setTo] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [file, setFile] = useState(null);

  const [emailId, setEmailId] = useState(null);
  const [status, setStatus] = useState("");
  const [sentAt, setSentAt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- VALIDATION ----------------

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateFutureDate = (date) => {
    return new Date(date) > new Date();
  };

  const resetFields = () => {
    setTo("");
    setBulkEmails("");
    setSubject("");
    setBody("");
    setScheduleTime("");
  };

  // ---------------- SINGLE SEND ----------------

  const sendSingle = async () => {
    if (!isValidEmail(to))
      return setMessage("Enter a valid email address");

    if (!subject || !body)
      return setMessage("Subject and message are required");

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body })
      });

      const data = await res.json();

      if (!res.ok) throw new Error();

      setEmailId(data.email_id);
      setStatus("Sent");
      setMessage("Email sent successfully!");
      resetFields();
    } catch {
      setMessage("Error sending email");
    }

    setLoading(false);
  };

  // ---------------- BULK SEND ----------------

  const sendBulk = async () => {
    const emails = bulkEmails.split(",").map(e => e.trim());

    if (emails.length === 0)
      return setMessage("Enter at least one email");

    for (let email of emails) {
      if (!isValidEmail(email))
        return setMessage(`Invalid email: ${email}`);
    }

    if (!subject || !body)
      return setMessage("Subject and message required");

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API}/send-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails,
          subject,
          body
        })
      });

      if (!res.ok) throw new Error();

      setMessage("Bulk emails sent successfully!");
      resetFields();
    } catch {
      setMessage("Bulk send failed");
    }

    setLoading(false);
  };

  // ---------------- SCHEDULE SINGLE ----------------

  const scheduleSingle = async () => {
    if (!isValidEmail(to))
      return setMessage("Invalid email address");

    if (!scheduleTime)
      return setMessage("Select schedule time");

    if (!validateFutureDate(scheduleTime))
      return setMessage("Schedule time must be in the future");

    if (!subject || !body)
      return setMessage("Subject and message required");

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          body,
          schedule_time: new Date(scheduleTime).toISOString()
        })
      });

      if (!res.ok) throw new Error();

      setMessage("Single email scheduled successfully!");
      resetFields();
    } catch {
      setMessage("Scheduling failed");
    }

    setLoading(false);
  };

  // ---------------- SCHEDULE BULK ----------------

  const scheduleBulk = async () => {
    const emails = bulkEmails.split(",").map(e => e.trim());

    if (emails.length === 0)
      return setMessage("Enter at least one email");

    for (let email of emails) {
      if (!isValidEmail(email))
        return setMessage(`Invalid email: ${email}`);
    }

    if (!scheduleTime)
      return setMessage("Select schedule time");

    if (!validateFutureDate(scheduleTime))
      return setMessage("Schedule time must be in the future");

    if (!subject || !body)
      return setMessage("Subject and message required");

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API}/schedule-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails,
          subject,
          body,
          schedule_time: new Date(scheduleTime).toISOString()
        })
      });

      if (!res.ok) throw new Error();

      setMessage("Bulk emails scheduled successfully!");
      resetFields();
    } catch {
      setMessage("Bulk scheduling failed");
    }

    setLoading(false);
  };
  const handleUpload = async () => {
  if (!file) return setMessage("Please upload an Excel file");
  if (!subject || !body) return setMessage("Subject and body required");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject);
  formData.append("body", body);

  setLoading(true);
  setMessage("");

  try {
    const res = await fetch(`${API}/upload-and-send`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) throw new Error();

    setMessage(`Sent to ${data.total_sent} users successfully`);
  } catch {
    setMessage("Upload failed");
  }

  setLoading(false);
};
  const uploadAndSend = async () => {
  if (!file) {
    setMessage("Please select a file");
    return;
  }

  if (!subject.trim() || !body.trim()) {
    setMessage("Subject and Body are required");
    return;
  }

  setLoading(true);
  setMessage("");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject);
  formData.append("body", body);

  try {
    const res = await fetch(`${API}/upload-and-send`, {
      method: "POST",
      body: formData,   // 🚨 NO headers here
    });

    const data = await res.json();
    setMessage(`Sent to ${data.count} users successfully`);
  } catch (error) {
    setMessage("Upload failed");
  }

  setLoading(false);
};
  const handleUploadSchedule = async () => {
  if (!file) return setMessage("Please upload Excel file");
  if (!subject || !body) return setMessage("Subject & body required");
  if (!scheduleTime) return setMessage("Select schedule time");

  if (new Date(scheduleTime) <= new Date())
    return setMessage("Schedule time must be future");

  setLoading(true);
  setMessage("");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject);
  formData.append("body", body);
  formData.append("schedule_time", new Date(scheduleTime).toISOString());

  try {
    const res = await fetch(`${API}/upload-and-schedule`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) throw new Error();

    setMessage(
      `Scheduled ${data.total_scheduled} emails successfully`
    );
  } catch {
    setMessage("Scheduling failed");
  }

  setLoading(false);
};

  // ---------------- TRACKING ----------------

  const checkStatus = async () => {
    if (!emailId) return;

    const res = await fetch(`${API}/status/${emailId}`);
    const data = await res.json();

    setStatus(data.status);
    setSentAt(data.sent_at);
  };

  useEffect(() => {
    if (!emailId) return;
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [emailId]);

  const badgeClass = () => {
    if (status === "Opened") return "badge opened";
    if (status === "Sent") return "badge sent";
    if (status === "Scheduled") return "badge scheduled";
    return "badge";
  };

  // ---------------- UI ----------------

  return (
    <div className="container">
      <h1>Email Automation Dashboard</h1>

      <div className="tabs">
        <button onClick={() => setActiveTab("single")}>Single</button>

        <button onClick={() => setActiveTab("scheduleSingle")}>Schedule Single</button>

        <button onClick={() => setActiveTab("upload")}>Upload</button>
        <button onClick={() => setActiveTab("uploadSchedule")}>
          Upload Schedule
        </button>

      </div>

      <div className="card">

        {activeTab === "single" && (
          <>
            <h2>Send Single Email</h2>
            <input placeholder="Recipient Email" value={to} onChange={e => setTo(e.target.value)} />
            <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
            <textarea placeholder="Message" value={body} onChange={e => setBody(e.target.value)} />
            <button onClick={sendSingle} disabled={loading}>
              {loading ? "Sending..." : "Send"}
            </button>
          </>
        )}

        {activeTab === "bulk" && (
          <>
            <h2>Send Bulk Email</h2>
            <textarea placeholder="Emails separated by comma"
              value={bulkEmails}
              onChange={e => setBulkEmails(e.target.value)} />
            <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
            <textarea placeholder="Message" value={body} onChange={e => setBody(e.target.value)} />
            <button onClick={sendBulk} disabled={loading}>
              {loading ? "Sending..." : "Send Bulk"}
            </button>
          </>
        )}

        {activeTab === "scheduleSingle" && (
          <>
            <h2>Schedule Single Email</h2>
            <input placeholder="Recipient Email" value={to} onChange={e => setTo(e.target.value)} />
            <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
            <textarea placeholder="Message" value={body} onChange={e => setBody(e.target.value)} />
            <button onClick={scheduleSingle} disabled={loading}>
              {loading ? "Scheduling..." : "Schedule"}
            </button>
          </>
        )}

        {activeTab === "scheduleBulk" && (
          <>
            <h2>Schedule Bulk Email</h2>
            <textarea placeholder="Emails separated by comma"
              value={bulkEmails}
              onChange={e => setBulkEmails(e.target.value)} />
            <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
            <textarea placeholder="Message" value={body} onChange={e => setBody(e.target.value)} />
            <button onClick={scheduleBulk} disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Bulk"}
            </button>
          </>
        )}

        {message && <p className="info">{message}</p>}
      </div>
       {activeTab === "upload" && (
  <>
    <h2>Upload Excel & Send</h2>

    <input
      type="file"
      accept=".xlsx"
      onChange={(e) => setFile(e.target.files[0])}
    />

    <input
      placeholder="Subject"
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
    />

    <textarea
      placeholder="Message"
      value={body}
      onChange={(e) => setBody(e.target.value)}
    />

    <button onClick={handleUpload} disabled={loading}>
      {loading ? "Uploading..." : "Upload & Send"}
    </button>
  </>
)}
       {activeTab === "uploadSchedule" && (
  <>
    <h2>Upload Excel & Schedule</h2>

    <input
      type="file"
      accept=".xlsx"
      onChange={(e) => setFile(e.target.files[0])}
    />

    <input
      type="datetime-local"
      value={scheduleTime}
      onChange={(e) => setScheduleTime(e.target.value)}
    />

    <input
      placeholder="Subject"
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
    />

    <textarea
      placeholder="Message"
      value={body}
      onChange={(e) => setBody(e.target.value)}
    />

    <button onClick={handleUploadSchedule} disabled={loading}>
      {loading ? "Scheduling..." : "Upload & Schedule"}
    </button>
  </>
)}

      {emailId && (
        <div className="card">
          <h2>Tracking Status</h2>
          <div className={badgeClass()}>{status || "Checking..."}</div>
          {sentAt && <p>Sent At: {new Date(sentAt).toLocaleString()}</p>}
          <button onClick={checkStatus}>Refresh</button>
        </div>
      )}
    </div>
  );
}

export default App;
