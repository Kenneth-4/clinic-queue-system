# Admin Setup Guide

## Database Setup

1. **Create the required tables** by running the SQL commands in `database-schema.sql` in your Supabase SQL Editor.

2. **Create an admin account**:
   - Go to your Supabase Auth settings
   - Create a new user with email: `admin@clinic.com`
   - Set a secure password
   - Or sign up normally through the app with this email

## Admin Features

The admin dashboard (`/admin`) provides:

### Doctor Management
- **Add Doctor**: Create new doctors with name and specialization
- **Edit Doctor**: Modify existing doctor information
- **Delete Doctor**: Remove doctors from the system
- **Active Doctor Display**: The most recently created active doctor appears on the main page

### Queue Management
- **View All Patients**: See all patients in the queue (not just ongoing)
- **Skip Patient**: Mark a patient as "skipped" (removes from ongoing queue)
- **Proceed Patient**: Mark a patient as "completed" (removes from ongoing queue)
- **Mark as Ongoing**: Change patient status back to "ongoing"
- **Delete Patient**: Remove patient from queue entirely

## Admin Access

- Only users with email `admin@clinic.com` can access the admin dashboard
- Admin users see an "Admin" button in the navigation bar
- Non-admin users are redirected to the main page if they try to access `/admin`

## Queue Statuses

- **ongoing**: Patient is waiting in the queue (displayed on main page)
- **skipped**: Patient was skipped by admin
- **completed**: Patient consultation is finished

## Database Schema

### Doctors Table
- `id`: UUID primary key
- `name`: Doctor's full name
- `specialization`: Medical specialization (optional)
- `is_active`: Whether doctor is currently active
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### Queue Table
- `id`: Serial primary key
- `ticket_number`: Patient's ticket number
- `patient_name`: Patient's name
- `position`: Position in queue
- `status`: Current status (ongoing/skipped/completed)
- `created_at`: Timestamp of creation

## Security Notes

- Row Level Security (RLS) is enabled on both tables
- All authenticated users can perform operations (adjust policies as needed)
- Admin access is currently email-based (consider implementing proper role-based access for production)
