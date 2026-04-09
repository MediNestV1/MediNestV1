# 🚀 Contributor Onboarding: Sending your first PR

Hey team! To get your code into the **MediNest** main repository, please follow this exact Git sequence. This ensures that a Pull Request is generated correctly and shows up on my dashboard for approval.

### 🩺 Step 1: Create your "Feature Branch"
Never work directly on `main`. Create a new branch for your task:
```bash
git checkout -b feature/your-name-task
```

### 🩺 Step 2: Push your Changes
Once you've finished your code and committed it locally:
```bash
git add .
git commit -m "feat: added [describe your change]"
git push origin feature/your-name-task
```

### 🩺 Step 3: Open the Pull Request (PR)
1. Go to our repository on GitHub: [Your Repo URL Here]
2. You will see a yellow bar at the top that says: **"Compare & pull request"**. Click it!
3. Add a short summary of what you did.
4. Click **"Create pull request"**.

### 🏁 Step 4: Verification
Once you see your PR on the list, Vercel will automatically start a **Preview Build**. Check the comments in your PR to see your site live before we merge!

---
*Let's build the future of clinic management! 🏥🚀*
