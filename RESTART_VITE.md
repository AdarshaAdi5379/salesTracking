# How to Fix the Proxy Issue

## The Problem
- Frontend makes requests to `http://localhost:3000/api/auth`
- Vite proxy should forward these to `http://localhost/api/auth`
- But the proxy isn't working because Vite dev server needs to be restarted

## Solution

### Step 1: Stop the Current Vite Server
In the terminal where Vite is running, press `Ctrl+C` to stop it.

### Step 2: Restart Vite Dev Server
```bash
cd /var/www/html/salestracking/admin
npm run dev
```

### Step 3: Check the Proxy Logs
When you make a request, you should see in the Vite terminal:
```
➡️  Proxying: POST /api/auth → /api/auth
⬅️  Response: 200 for /api/auth
```

### Step 4: Test in Browser
1. Open `http://localhost:3000/login`
2. Try to login
3. Check the Vite terminal for proxy logs
4. Check browser Network tab - the request should succeed

## Verification

The API backend is working correctly:
```bash
curl -X POST http://localhost/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"admin@example.com","password":"admin123"}'
```

This returns a successful response, so once Vite proxy is restarted, everything should work.

