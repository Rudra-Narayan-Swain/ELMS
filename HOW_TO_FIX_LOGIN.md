# ========================================
# STEP-BY-STEP LOGIN FIX GUIDE
# ========================================

## STEP 1: CHECK XAMPP
✓ Open XAMPP Control Panel
✓ Start Apache
✓ Start MySQL
✓ Make sure both are GREEN/Running

## STEP 2: FIX DATABASE
1. Open browser: http://localhost/phpmyadmin
2. Click "SQL" tab at top
3. Copy ALL content from: d:\TEST-PROJECT\Elms\Elms\database\FIX_LOGIN.sql
4. Paste in SQL box
5. Click "Go" button
6. Should see "Success"

## STEP 3: START BACKEND
1. Open PowerShell/CMD
2. Run these commands:
   ```
   cd d:\TEST-PROJECT\Elms\Elms\backend
   node server.js
   ```
3. Should see message: "Server running on: http://localhost:3000"
4. Leave this window OPEN (don't close it!)

## STEP 4: OPEN FRONTEND
1. Open browser
2. Navigate to: d:\TEST-PROJECT\Elms\Elms\frontend\index.html
3. Or just double-click index.html

## STEP 5: LOGIN
Email: admin@company.com
Password: password

(NOTE: Password is "password" NOT "password123")

## TROUBLESHOOTING:

❌ If backend won't start:
   - Check if port 3000 is already in use
   - Check XAMPP MySQL is running
   - Update DB_PASSWORD in backend\.env if you have MySQL password

❌ If login still fails:
   - Open browser console (F12)
   - Check for errors
   - Verify backend is running (should see message in terminal)
   - Refresh the page

❌ "Cannot connect" error:
   - Make sure backend server is running
   - Check if http://localhost:3000/api/health works

## QUICK CHECK:
Backend running? YES/NO
XAMPP MySQL green? YES/NO
Database elms_db exists? YES/NO
FIX_LOGIN.sql executed? YES/NO

If all YES, then login should work!
