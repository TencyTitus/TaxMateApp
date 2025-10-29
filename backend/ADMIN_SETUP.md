# Admin Setup Instructions

## Setting Up Admin Account

To create an admin account for accessing the Admin Dashboard, follow these steps:

### Option 1: Using the Setup Script (Recommended)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the admin setup script:**
   ```bash
   node setupAdmin.js
   ```

3. **Default Admin Credentials:**
   - **Email:** `admin@taxmate.com`
   - **Password:** `Admin@123`

4. **Login:**
   - Go to the login page: `http://localhost:5173/login`
   - Enter the admin credentials
   - You will be automatically redirected to `/admin`

### Option 2: Manually Create Admin User

If you prefer to create an admin user manually:

1. **Register a regular user** through the registration page

2. **Update the user in MongoDB:**
   ```javascript
   // Using MongoDB shell or Compass
   db.users.updateOne(
     { email: "youremail@example.com" },
     { $set: { isAdmin: true, status: "active" } }
   )
   ```

3. **Login with that account** - You'll be redirected to the admin panel

### Accessing the Admin Dashboard

- **URL:** `http://localhost:5173/admin`
- Only users with `isAdmin: true` can access this page
- Non-admin users will be redirected to `/user`

### Features Available in Admin Dashboard

✅ View total users, revenue, and tax returns statistics (real-time data from database)
✅ Search and filter users
✅ View user details
✅ Update user status (Active, Inactive, Pending, Suspended)
✅ Delete users (except admin users)
✅ Export user data to CSV
✅ View recent system activity
✅ **Live data integration** - All user data fetched from MongoDB

### Admin Dashboard Data Sources

The admin dashboard now displays **real user data** from the database:

- **Users Table**: Fetched from MongoDB via `/users` endpoint
- **Statistics**: Calculated from actual user data
  - Total Users: Count of all registered users
  - Total Revenue: Sum of all user payments (to be implemented)
    - Tax Returns Filed: Count of completed tax submissions (to be implemented)
  - Growth Rate: Calculated from historical data

### API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Fetch all users (admin only) |
| DELETE | `/users/:userId` | Delete a specific user |
| PUT | `/users/:userId/status` | Update user status |

### Security Notes

⚠️ **Important:**
- Change the default admin password immediately after first login
- Keep admin credentials secure
- Only grant admin access to trusted users
- Admin users cannot be deleted through the admin panel
- Password fields are never returned in API responses

### Troubleshooting

**Problem:** Can't access admin dashboard
- **Solution:** Verify the user has `isAdmin: true` in the database

**Problem:** Setup script doesn't work
- **Solution:** Ensure MongoDB is running and the connection string is correct

**Problem:** Redirected to /user instead of /admin
- **Solution:** Check localStorage - the user object should have `isAdmin: true`

**Problem:** No users showing in admin dashboard
- **Solution:** 
  - Check if MongoDB is running
  - Verify backend server is running on port 5000
  - Check browser console for API errors
  - Register some test users first

**Problem:** "Failed to fetch users" error
- **Solution:**
  - Ensure backend server is running: `node server.js`
  - Check MongoDB connection status
  - Verify CORS is enabled in server.js

### Testing Admin Functionality

You can test with these steps:
1. **Start MongoDB** (if not already running)
2. **Start backend server**: `cd backend && node server.js`
3. **Start frontend**: `cd frontend && npm run dev`
4. **Create admin account** using the setup script
5. **Create test users** through the registration page
6. **Login with admin credentials**
7. **Verify you're redirected to `/admin`**
8. **Check that all registered users appear in the admin dashboard**
9. **Test user management features**:
   - Search for users
   - Filter by status
   - Update user status
   - Export data to CSV
10. **Login with a regular user account**
11. **Verify you're redirected to `/user`** (not `/admin`)
