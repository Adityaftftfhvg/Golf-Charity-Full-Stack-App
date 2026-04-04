🏌️ Golf Charity Full Stack App

A modern subscription-based golf platform that blends performance tracking, monthly rewards, and charitable giving into one seamless experience.

Built as part of a full-stack development challenge inspired by a real-world Product Requirements Document (PRD), this project demonstrates scalable architecture, clean UI/UX, and complete end-to-end functionality.

🚀 Live Demo

http://golf-charity-full-stack-app-two.vercel.app/

📌 Project Overview

This platform allows users to:

Subscribe to monthly/yearly plans
Enter and track their golf scores
Participate in monthly prize draws
Contribute to charities of their choice

The goal is to create an emotionally engaging experience, focusing more on impact and rewards rather than traditional golf aesthetics .

✨ Core Features
🔐 Authentication & User Roles
Secure login/signup system
Role-based access:
Public Users
Subscribers
Admin
💳 Subscription System
Monthly & yearly plans
Payment integration (Stripe or equivalent)
Subscription lifecycle handling:
Active / Expired / Renewal
⛳ Score Management
Users can enter their last 5 golf scores
Automatic replacement of oldest score
Scores displayed in reverse chronological order
🎯 Monthly Draw System
Prize categories:
5-match (Jackpot)
4-match
3-match
Draw types:
Random
Algorithm-based
Jackpot rollover supported
💰 Prize Pool Logic
Subscription revenue distributed:
40% → Jackpot
35% → 4-match winners
25% → 3-match winners
Equal distribution among winners
❤️ Charity Integration
Users select a charity during signup
Minimum 10% contribution
Option to increase donation %
Charity listing & profiles
🧾 Winner Verification System
Proof upload by winners
Admin approval/rejection
Payment tracking (Pending → Paid)
📊 User Dashboard
Subscription status
Score management
Charity contribution
Draw participation
Winnings overview
🛠️ Admin Dashboard
User & subscription management
Draw configuration & execution
Charity management
Winner verification
Analytics & reports
🧑‍💻 Tech Stack

Frontend

Next.js
React
Tailwind CSS

Backend

Node.js / API routes
Supabase / Firebase (DB & Auth)

Other Tools

Phonepe (Payments)
Vercel (Deployment)
🏗️ System Design Highlights
Scalable architecture for multi-country expansion
Modular codebase for future mobile app support
Secure authentication (JWT / session-based)
Optimized performance & responsive design
📱 UI/UX Philosophy
Clean, modern, and emotion-driven design
Avoids traditional golf visuals
Focus on:
Charity impact
Engagement
Simplicity
Smooth animations & micro-interactions
🧪 Testing Checklist
✅ User authentication
✅ Subscription flow
✅ Score logic (5-score rolling)
✅ Draw system
✅ Charity contribution
✅ Winner verification
✅ Dashboard functionality
⚙️ Setup Instructions
# Clone the repo
git clone https://github.com/your-username/Golf-Charity-Full-Stack-App.git

# Navigate to project
cd Golf-Charity-Full-Stack-App

# Install dependencies
npm install

# Run development server
npm run dev

📈 Future Enhancements
Mobile app version
AI-based draw optimization
Team / corporate subscriptions
Advanced analytics dashboard
Campaign & fundraising modules

🙌 Author
Aditya Pathak
