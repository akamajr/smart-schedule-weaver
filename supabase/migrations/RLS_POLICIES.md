# RLS Policies & RBAC — Smart Schedule Weaver

## Role Definitions

| Role | Description |
|---|---|
| `admin` | Full access to all data and user management |
| `lecturer` | Read access to schedules, student lists; no write access |
| `student` | Read access to schedules; own profile only |

---

## Helper Functions (used inside policies)

```sql
-- Returns the current user's role from the profiles table
get_my_role() → user_role

-- Returns true if the current user is an admin
is_admin() → boolean
```

---

## Table: `profiles`
> All authenticated users have a profile. Linked 1:1 to `auth.users`.

| Policy | Operation | Who | Condition |
|---|---|---|---|
| `profiles: users can view own profile` | SELECT | Any authenticated | `auth.uid() = id` |
| `profiles: admins can view all` | SELECT | Admins only | `is_admin()` |
| `profiles: users can update own profile` | UPDATE | Any authenticated | Own row; cannot change their own `role` |
| `profiles: admins can manage all` | ALL | Admins only | `is_admin()` |

---

## Table: `admins`
> Extra details for admin users.

| Policy | Operation | Who | Condition |
|---|---|---|---|
| `admins: only admins can view` | SELECT | Admins only | `is_admin()` |
| `admins: only admins can manage` | ALL | Admins only | `is_admin()` |

---

## Table: `lecturers`
> Extra details for lecturer users.

| Policy | Operation | Who | Condition |
|---|---|---|---|
| `lecturers: all authenticated can view` | SELECT | All authenticated | `auth.role() = 'authenticated'` |
| `lecturers: can view own record` | SELECT | Lecturer themselves | `id = auth.uid()` |
| `lecturers: admins can manage` | ALL | Admins only | `is_admin()` |

---

## Table: `students`
> Extra details for student users.

| Policy | Operation | Who | Condition |
|---|---|---|---|
| `students: can view own record` | SELECT | Student themselves | `id = auth.uid()` |
| `students: admins can view all` | SELECT | Admins only | `is_admin()` |
| `students: lecturers can view all` | SELECT | Lecturers only | `get_my_role() = 'lecturer'` |
| `students: admins can manage` | ALL | Admins only | `is_admin()` |

---

## Table: `faculties`

| Policy | Operation | Who | Condition |
|---|---|---|---|
| `faculties: all authenticated can read` | SELECT | All authenticated | `auth.role() = 'authenticated'` |
| `faculties: admins can insert` | INSERT | Admins only | `is_admin()` |
| `faculties: admins can update` | UPDATE | Admins only | `is_admin()` |
| `faculties: admins can delete` | DELETE | Admins only | `is_admin()` |

---

## Table: `departments`

| Policy | Operation | Who | Condition |
|---|---|---|---|
| `departments: all authenticated can read` | SELECT | All authenticated | `auth.role() = 'authenticated'` |
| `departments: admins can insert` | INSERT | Admins only | `is_admin()` |
| `departments: admins can update` | UPDATE | Admins only | `is_admin()` |
| `departments: admins can delete` | DELETE | Admins only | `is_admin()` |

---

## Table: `courses`

| Policy | Operation | Who | Condition |
|---|---|---|---|
| `courses: all authenticated can read` | SELECT | All authenticated | `auth.role() = 'authenticated'` |
| `courses: admins can insert` | INSERT | Admins only | `is_admin()` |
| `courses: admins can update` | UPDATE | Admins only | `is_admin()` |
| `courses: admins can delete` | DELETE | Admins only | `is_admin()` |

---

## Table: `halls`
---------------------------------------------------------------------------------------------------------
|           Policy                    | Operation |       Who         |           Condition             |
|-------------------------------------|-----------|-------------------|---------------------------------|
| `halls: all authenticated can read` | SELECT    | All authenticated | `auth.role() = 'authenticated'` |
| `halls: admins can insert`          | INSERT    | Admins only       | `is_admin()`                    |
| `halls: admins can update`          | UPDATE    | Admins only       | `is_admin()`                    |
| `halls: admins can delete`          | DELETE    | Admins only       | `is_admin()`                    |
---------------------------------------------------------------------------------------------------------



## Table: `exam_sessions`

-------------------------------------------------------------------------------------------------------------------
| Policy                                      | Operation   |          Who      |           Condition             |
|---------------------------------------------|---------------------------------|---------------------------------|
| `exam_sessions: all authenticated can read` | SELECT      | All authenticated | `auth.role() = 'authenticated'` |
| `exam_sessions: admins can insert`          | INSERT      |     Admins only   |         `is_admin()`            |
| `exam_sessions: admins can update`          | UPDATE      |     Admins only   |         `is_admin()`            |
| `exam_sessions: admins can delete`          | DELETE      |     Admins only   |         `is_admin()`            |
-------------------------------------------------------------------------------------------------------------------
           


## Table: `exam_session_halls`
-----------------------------------------------------------------------------------------------------------------------
| Policy                                           | Operation  |        Who        |               Condition         |
|--------------------------------------------------|------------|-------------------|-------------------------------- |
| `exam_session_halls: all authenticated can read` | SELECT     | All authenticated | `auth.role() ='authenticated'`  |
| `exam_session_halls: admins can insert`          | INSERT     | Admins only       |          `is_admin()`           |
| `exam_session_halls: admins can update`          | UPDATE     | Admins only       |          `is_admin()`           |
| `exam_session_halls: admins can delete`          | DELETE     | Admins only       |          `is_admin()`           |
-----------------------------------------------------------------------------------------------------------------------

## Access Matrix Summary

|        Resource      |   Admin  |    Lecturer | Student |
|----------------------|------------------------|----------|---|
| `profiles`           | (own)    |   ✅ R/W    | ✅ R/W | ✅ R/W |
| `profiles`           |  (all)   |   ✅ R/W    | ❌ | ❌ |
| `admins`             | ✅ R/W  |   ❌         | ❌          |
| `lecturers`          | ✅ R/W  |   ✅ R (own)  | ✅ R (list) |
| `students`           | ✅ R/W  |   ✅ R (all)   |  ✅ R (own) |
| `faculties`          | ✅ R/W  |   ✅ R | ✅ R |
| `departments`        | ✅ R/W  |   ✅ R | ✅ R |
| `courses`            | ✅ R/W  |   ✅ R | ✅ R |
| `halls`              | ✅ R/W  |   ✅ R | ✅ R |
| `exam_sessions`      | ✅ R/W  |   ✅ R | ✅ R |
| `exam_session_halls` | ✅ R/W  |   ✅ R | ✅ R |

---

## Authentication Flow

1. User signs up via `supabase.auth.signUp({ email, password, options: { data: { full_name, role } } })`
2. The `on_auth_user_created` trigger auto-creates a `profiles` row with the role from `raw_user_meta_data`
3. On login, the client reads `profiles.role` to determine what UI/routes to display
4. All API calls are governed by the RLS policies above — no extra server-side enforcement needed

> [!IMPORTANT]
> The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. **Never expose it client-side.** Only use it in server-side code (e.g., Next.js API routes or Edge Functions).
