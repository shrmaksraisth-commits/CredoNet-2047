import { GmailMessage } from "../types";

export const MOCK_SANDBOX_EMAILS: GmailMessage[] = [
  {
    id: "msg-sandbox-1",
    threadId: "thread-sandbox-1",
    subject: "📢 Welcome to your CredoNet Digital Sandbox Inbox!",
    from: "CredoNet Workspace Services <support@credonet.gov.in>",
    to: "you@credonet.gov.in",
    date: "Tue, 07 Jul 2026 09:30:00 GMT",
    snippet: "Welcome! Since this application is in development/sandbox mode, we have enabled this interactive Sandbox Inbox to demonstrate how SIA can help you manage and summarize your emails.",
    body: `Namaste,

Welcome to your CredoNet Digital Sandbox Inbox!

Since external Google OAuth has restricted access in developer testing mode, this fully interactive Sandbox Inbox is active to let anyone experience the email management capabilities of SIA.

What you can do in this simulator:
1. Ask SIA on the AI Chat screen to read or summarize your latest emails.
2. Select any email in this inbox to generate a smart AI reply draft.
3. Automatically extract a Checklist or To-Do list from your emails using SIA's scanner.
4. Compose and "send" custom emails to see the pipeline in action.

Enjoy exploring CredoNet!

Warm regards,
CredoNet Workspace Team`,
    labels: ["INBOX", "UNREAD", "STARRED"]
  },
  {
    id: "msg-sandbox-2",
    threadId: "thread-sandbox-2",
    subject: "⚠️ Urgent: College Project Phase-2 Submission Deadline Extended",
    from: "Prof. Ramesh Sharma (CS Department) <ramesh.sharma@credonet-university.edu.in>",
    to: "you@credonet.gov.in",
    date: "Tue, 07 Jul 2026 08:15:00 GMT",
    snippet: "Dear Students, please note that the Phase-2 submission for your Smart India AI Hackathon project has been extended until next Monday. Make sure all files are compiled.",
    body: `Dear Students,

Please note that based on multiple requests from student coordinators, the submission deadline for your Smart India AI Hackathon project (Phase-2 Prototype & Report) has been extended.

New Deadline: Next Monday, July 13th, 2026, by 11:59 PM IST.

Please ensure the following are included in your submission package:
1. Complete source code repository link (GitHub/CredoNet Lab).
2. Phase-2 architectural design document.
3. A 2-minute video presentation showing the live features.

Ensure your code compiles successfully. No further extensions will be granted.

Best regards,
Prof. Ramesh Sharma
Department of Computer Science & Engineering
CredoNet University`,
    labels: ["INBOX", "UNREAD"]
  },
  {
    id: "msg-sandbox-3",
    threadId: "thread-sandbox-3",
    subject: "🚀 National Internship Portal: Application Status Update",
    from: "Digital India Internship Gateway <opportunities@internships.gov.in>",
    to: "you@credonet.gov.in",
    date: "Mon, 06 Jul 2026 14:20:00 GMT",
    snippet: "Congratulations! Your application for the Summer AI & Digital Governance Fellowship has been shortlisted for the final interview round.",
    body: `Dear Applicant,

We are pleased to inform you that your application for the "Summer AI & Digital Governance Fellowship" has been shortlisted for the final interview round.

Your profile stood out among over 10,000 applicants across the country!

Details of your upcoming technical evaluation:
Date: Thursday, July 9th, 2026
Time: 10:30 AM - 11:15 AM IST
Format: Online Technical Discussion (system architecture, React development, and AI design)

Please confirm your availability by replying to this email or selecting a slot on the Portal by tomorrow evening.

Congratulations and good luck!

Sincerely,
National Internship Cell
Ministry of Electronics & Information Technology`,
    labels: ["INBOX", "IMPORTANT"]
  },
  {
    id: "msg-sandbox-4",
    threadId: "thread-sandbox-4",
    subject: "🍕 Study Session & Pizza This Thursday!",
    from: "Arun Patel (Class Coordinator) <arun.patel@student-union.org.in>",
    to: "you@credonet.gov.in",
    date: "Sun, 05 Jul 2026 18:05:00 GMT",
    snippet: "Hey, we are planning a group study session this Thursday evening at the library workspace to wrap up the project report. There will be pizza!",
    body: `Hey buddy,

Hope you're doing great!

We are planning a group study session this Thursday evening at the Central Library Workspace (Room 204) from 5:00 PM onwards. The goal is to wrap up our Phase-2 report and test the UI layout.

We've ordered some pizzas to keep us fueled, so don't worry about dinner!

Please let me know if you can make it, and if you have any preference for the pizza toppings.

Cheers,
Arun`,
    labels: ["INBOX"]
  },
  {
    id: "msg-sandbox-5",
    threadId: "thread-sandbox-5",
    subject: "💳 Monthly Digital India Scholar Stipend Disbursed",
    from: "National Scholarship Portal <stipend-alerts@nsp.gov.in>",
    to: "you@credonet.gov.in",
    date: "Sat, 04 Jul 2026 11:10:00 GMT",
    snippet: "Your monthly scholar stipend of ₹12,000 has been successfully disbursed to your linked bank account.",
    body: `Dear Scholar,

This is to inform you that your monthly stipend of ₹12,000 under the Digital India Scholar Fellowship has been successfully disbursed to your linked bank account via Direct Benefit Transfer (DBT).

Transaction ID: NSP-DBT-2026-9871A
Disbursed Date: July 4th, 2026
Amount: ₹12,000.00

Please verify with your bank, and contact the scholarship office if you do not receive the credit within 3 business days.

Regards,
Scholarship Division
Ministry of Education`,
    labels: ["INBOX"]
  }
];
