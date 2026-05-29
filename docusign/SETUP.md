# AgreementDesk — Setup Guide

Internal DocuSign-style document signing app for 3rd Power Outlet.

## Quick Start

### 1. Install dependencies
```bash
cd docusign
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your settings
```

Key settings in `.env`:
| Variable | Description |
|---|---|
| `BASE_URL` | Your server's public URL (e.g. `https://agreements.yoursite.com`) |
| `JWT_SECRET` | Random string for signing tokens — change this! |
| `ADMIN_EMAIL` | Your login email (default: `john@3rdpoweroutlet.com`) |
| `ADMIN_PASSWORD` | Your login password (change from default) |
| `ORG_NAME` | Your org name shown in emails and PDFs |
| `SMTP_HOST/USER/PASS` | SMTP email settings |

### 3. Email setup (Gmail)
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to App Passwords → create one for "Mail"
4. Set `SMTP_USER=your@gmail.com` and `SMTP_PASS=the-app-password`

### 4. Start the server
```bash
npm start
# or for development with auto-restart:
npm run dev
```

Open **http://localhost:3000** and log in.

---

## How It Works

### Workflow
```
You create template → Send to client → Client signs → You countersign → Both get PDF
```

1. **Create a template** — Write your agreement text, add custom fields (name, company, phone, etc.), use `{{field_name}}` placeholders in the text.
2. **Send to client** — Enter client name + email, optionally add a personal message. Client gets a signing email.
3. **Client signs** — Client opens the unique link, reads the agreement, fills in fields, draws/types their signature. No account needed.
4. **You countersign** — You get an email notification. Log in → Dashboard → Countersign → Done.
5. **PDF sent to both** — A legally binding PDF with both signatures, timestamps, IPs, and audit trail is emailed to both parties.

### Legal Validity
Each completed agreement includes:
- Unique document ID
- Both party signatures with timestamps
- IP addresses captured at signing
- Full audit trail (who did what, when)
- ESIGN/UETA compliance statement in the PDF

---

## Running in Production

For production, consider:
- Use a process manager: `pm2 start server.js --name agreements`
- Put behind nginx with HTTPS (required for legal signatures)
- Set `BASE_URL` to your HTTPS domain
- Use a strong `JWT_SECRET`
- Back up `docusign.db` and `pdfs/` regularly

### Nginx config example
```nginx
server {
    server_name agreements.yoursite.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
