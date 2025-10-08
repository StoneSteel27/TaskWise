This is a School Tasks and Announcements backend, written in python, FastAPI, Sqlite.

1. Login:
- Users enter their `roll_number` and `password` to login
- POST `/v1/api/login`
- **Request Body:**
    ```json
    {
        "username": "your_roll_number",
        "password": "your_password"
    }
    ```
- **Response:**
    ```json
    {
        "access_token": "your_access_token",
        "token_type": "bearer",
        "user": {
            "name": "User Name",
            "roll_number": "your_roll_number",
            "role": "TEACHER",
            "profile_picture_url": "url_to_profile_picture.jpg",
            "homeroom_class": "10-A"
        }
    }
    ```

1. Features common to all users:
- Viewing School-wide announcements
- School wide Announcement:
    - Allowed: All authenticated users
    -   **School-wide Announcements List:**
        -   GET `/v1/api/me/school-announcements`
        -   Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Response**
            -   **Json Response:**
                ```json
                {
                  "announcements": [
                    {
                      "announcement_id": "SCH-ANC-001",
                      "name": "Principal",
                      "time": "2025-08-01T12:52:41+05:30",
                      "title": "Independence Day Celebration",
                      "description": "All students are requested to assemble in the main ground tomorrow at 9:00 AM for the Independence Day flag hoisting ceremony.",
                      "attachements": ["event_schedule.pdf"]
                    }
                  ]
                }
                ```
        -   **View Single School-wide Announcement:**
            -   GET `/v1/api/school-announcements/{announcement_id}`
            -   This endpoint retrieves the details of a specific school-wide announcement.
            -   Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
            -   **Response**
                -   **Json Response (on success):**
                    ```json
                    {
                      "announcement_id": "SCH-ANC-001",
                      "name": "Principal",
                      "time": "2025-08-01T12:52:41+05:30",
                      "title": "Independence Day Celebration",
                      "description": "All students are requested to assemble in the main ground tomorrow at 9:00 AM for the Independence Day flag hoisting ceremony.",
                      "attachements": ["event_schedule.pdf"]
                    }
                    ```

3. Types of Users:
- Admin
- Principal
- Teachers
- Students
* The type of person logging in will be based on thier credentials.

4. Student flow:
- Students have courses based on thier class.
- eg: Take class 10-A-25, contains 40 Students.
    - they have 6 Subjects: Math, Science, Soc. Science, English, Language, CS
    - each language is taught by a teacher.
    - each teacher will Create Tasks and Announcements only for a particular subject.
    - The Attendance for The Class will be taken by a `homeroom_teacher` in the morning. Students can view thier attendance in our web app
    - Students need to attach a file to the task, to be marked from "PENDING" to "SUBMITTED". Once Approved by teacher, it will change to "APPROVED" status

5. Student Flow's API Components and data structures
    - **Today Schedule Section:**
        - Allowed: Student
        - GET `/v1/api/me/schedule`
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - Response
            - Json Response:
                ```json
                {"morning_subs":["MATH-10A","SCI-10A","SOC-10A"],
                "aftnoon_subs":["CS-10A","ENG-10A","LANG-10A"]}
                ```
    - **Courses:**
        - GET `/v1/api/me/courses`
        - Allowed: Student
        - This endpoint retrieves the list of subjects a student is enrolled in.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response**
            - **Json Response:**
                ```json
                {
                  "courses": [
                    {
                      "name": "Mathematics",
                      "course_id": "MATH-01",
                      "teacher_name": "Mr. John Doe",
                      "accent_color": "#FF5733",
                      "accent_image": "math_icon.png"
                    }
                  ]
                }
                ```
    - **Attendance Records:**
        - GET `/v1/api/me/attendance-records`
        - Allowed: Student, Teacher (teacher's attendance also need to be implemented)
        - This endpoint retrieves the attendance records for the logged-in student.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response**
            - **Json Response:**
                ```json
                {
                  "total_days": 120,
                  "days_attended": 110,
                  "attendance_percentage": 91.6,
                  "leave_days": [
                    "2025-07-25"
                  ]
                }
                ```

    - **View Past Attendance (for Students):**
        - GET `/v1/api/me/attendance-history`
        - This endpoint retrieves the full attendance history for the logged-in student.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response**
            - **Json Response (on success):**
                ```json
                {
                  "history": [
                    {
                      "date": "2025-08-01",
                      "status": "PRESENT"
                    },
                    {
                      "date": "2025-07-31",
                      "status": "PRESENT"
                    },
                    {
                      "date": "2025-07-25",
                      "status": "LEAVE"
                    }
                  ]
                }
                ```
    - **Course Dashboard:**
        - Allowed: Student, Teacher( teacher should be also able to access the dashboard)
        - GET `/v1/api/me/{course_id}/dashboard`
        - This endpoint retrieves all the announcements and tasks for a specific course.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response**
            - **Json Response:**
                ```json
                {
                  "announcements": [
                    {
                      "announcement_id":"ANC-01",
                      "name": "Mr. John Doe",
                      "time": "2025-08-05T10:00:00+05:30",
                      "title": "Reminder: Upcoming Unit Test",
                      "description": "Just a reminder that our unit test on Algebra will be held next Monday. The syllabus includes chapters 2 and 3.",
                      "attachements": ["syllabus_update.pdf"]
                    }
                  ],
                  "tasks": [
                    {
                      "task_id":"TSK-01",
                      "name": "Mr. John Doe",
                      "time": "2025-08-04T14:30:00+05:30",
                      "title": "Homework: Chapter 2 Exercise",
                      "description": "Please complete all the questions in Exercise 2.4 and submit your solutions before the deadline.",
                      "attachements": ["Exercise_2.4.pdf"],
                      "deadline": "2025-08-11T23:59:59+05:30",
                      "status": "PENDING"
                    }
                  ]
                }
                ```
    - **Submit Task:**
        - Allowed: Student
        - POST `/v1/api/{course_id}/tasks/{task_id}/upload`
        - This endpoint allows a student to upload submission files for a specific task. Upon successful upload, the task's status will automatically change from "PENDING" to "SUBMITTED" or "DELAYED" if the deadline has passed. If a submission already exists, it will be overwritten.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - The request must be a `multipart/form-data` request containing the files.
        - **File Field** `files`: (File) The actual file(s) to be uploaded. This field can be included multiple times for multiple files.
        - **Response**
            - **Json Response (on success):**
                ```json
                {
                  "message": "Files uploaded successfully.",
                  "task_id": "TSK-01",
                  "new_status": "SUBMITTED" # or "DELAYED"
                }
                ```

    - **Edit Task Submission:**
        - Allowed: Student (only their own submission)
        - PUT `/v1/api/{course_id}/tasks/{task_id}/submission/edit`
        - This endpoint allows a student to edit their submission by adding or removing files.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Request Body (`multipart/form-data`):**
            -   **Form Field** `attachments_to_keep`: (JSON String Array) A JSON string of filenames that should remain attached. e.g., `["diagram.pdf"]`
            -   **File Field** `files`: (File) Any *new* files to be added.
        - **Response (on success):**
            ```json
            {
              "message": "Submission updated successfully.",
              "submission_id": 1,
              "current_attachments": ["diagram.pdf", "new_notes.docx"]
            }
            ```

    - **Unsubmit Task (Delete Entire Submission):**
        - Allowed: Student (only their own submission)
        - DELETE `/v1/api/{course_id}/tasks/{task_id}/submission/delete`
        - This endpoint allows a student to delete their submission entirely, reverting the task status to PENDING.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (on success):**
            ```json
            {
              "message": "Submission deleted successfully."
            }
            ```

    - **Delete Single Submission File:**
        - Allowed: Student (only their own submission)
        - DELETE `/v1/api/{course_id}/tasks/{task_id}/submission/attachments/{file_name}`
        - This endpoint allows a student to delete a single file from their submission. If the last file is deleted, the entire submission is removed.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (on success):**
            ```json
            {
              "message": "File 'your_file.pdf' has been deleted from the submission."
            }
            ```

    - **Task View:**
        - GET `/v1/api/{course_id}/tasks/{task_id}`
        -  Allowed: Student, Teacher
        - View the task's details. The response will differ based on the user type.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (for Students)**
            - **Json Response (on success):**
                ```json
                {
                  "task_id":"TSK-01",
                  "name": "Mr. John Doe",
                  "time": "2025-08-04T14:30:00+05:30",
                  "title": "Homework: Chapter 2 Exercise",
                  "description": "Please complete all the questions in Exercise 2.4 and submit your solutions before the deadline.",
                  "attachements": ["Exercise_2.4.pdf"],
                  "deadline": "2025-08-11T23:59:59+05:30",
                  "status": "SUBMITTED", # Can be PENDING, SUBMITTED, APPROVED, DELAYED
                  "submission_attachments": ["solution_part1.pdf", "solution_part2.pdf"],
                  "grade": "A",
                  "remarks": "Good work!",
                  "rejection_reason": null
                }
                ```
        - **Response (for Teachers)**
            - The response for teachers includes the base task details plus a `submissions` array containing the status for every student in the course.
            - **Json Response (on success):**
                ```json
                {
                  "task_id":"TSK-01",
                  "name": "Mr. John Doe",
                  "time": "2025-08-04T14:30:00+05:30",
                  "title": "Homework: Chapter 2 Exercise",
                  "description": "Please complete all the questions in Exercise 2.4 and submit your solutions before the deadline.",
                  "attachements": ["Exercise_2.4.pdf"],
                  "deadline": "2025-08-11T23:59:59+05:30",
                  "submissions": [
                    {
                      "student_name": "Kanishq V",
                      "student_roll_number": "192224227",
                      "profile_picture_url": "192224227.png",
                      "status": "SUBMITTED", # Can be PENDING, SUBMITTED, APPROVED, DELAYED
                      "submitted_at": "2025-08-10T18:00:00+05:30",
                      "grade": null,
                      "remarks": null
                    },
                    {
                      "student_name": "Another Student",
                      "student_roll_number": "192224228",
                      "profile_picture_url": "192224228.png",
                      "status": "APPROVED",
                      "submitted_at": "2025-08-09T12:00:00+05:30"
                    },
                    {
                      "student_name": "Third Student",
                      "student_roll_number": "192224229",
                      "profile_picture_url": "192224229.png",
                      "status": "PENDING",
                      "submitted_at": null
                    }
                  ]
                }
                ```

    - **Approve Task Submission:**
        -   PUT `/v1/api/courses/{course_id}/tasks/{task_id}/submissions/{student_roll_number}/approve`
        -   This endpoint allows a teacher to approve a student's submitted work.
        -   **Allowed:** Teacher
        -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Request Body (`multipart/form-data`):**
            -   **Form Field** `grade`: (String) The grade for the submission. Available options: "S", "A", "B", "C", "D".
            -   **Form Field** `remarks`: (String, Optional) Any remarks or feedback for the student.
        -   **Response (on success):**
            ```json
            {
              "message": "Submission approved successfully.",
              "student_roll_number": "192224227",
              "new_status": "APPROVED"
            }
            ```
    - **Task View:**
        - GET `/v1/api/{course_id}/tasks/{task_id}`
        -  Allowed: Student, Teacher
        - View the task's details. The response will differ based on the user type.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (for Students)**
            - **Json Response (on success):**
                ```json
                {
                  "task_id":"TSK-01",
                  "name": "Mr. John Doe",
                  "time": "2025-08-04T14:30:00+05:30",
                  "title": "Homework: Chapter 2 Exercise",
                  "description": "Please complete all the questions in Exercise 2.4 and submit your solutions before the deadline.",
                  "attachements": ["Exercise_2.4.pdf"],
                  "deadline": "2025-08-11T23:59:59+05:30",
                  "status": "PENDING",
                  "rejection_reason": "You forgot to attach the last page of the exercise. Please resubmit."
                }
                ```
    - **Reject Task Submission:**
        -   PUT `/v1/api/{course_id}/tasks/{task_id}/submissions/{student_roll_number}/reject`
        -   This endpoint allows a teacher to reject a student's submitted work, changing the status back to "PENDING".
        -   **Allowed:** Teacher
        -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Request Body (`multipart/form-data`):**
            -   **Form Field** `reason`: (String) "You forgot to attach the last page of the exercise. Please resubmit."
        -   **Response (on success):**
            ```json
            {
              "message": "Submission rejected successfully.",
              "student_roll_number": "192224227",
              "new_status": "PENDING"
            }
            ```

    - **Announcement View:**
        - GET `/v1/api/{course_id}/annoucements/{announcement_id}`
        - View the announcement's details
        -  Allowed: Student, Teacher( teacher should be also able to access the annoucement)
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response**
            - **Json Response (on success):**
                ```json
                {
                      "announcement_id":"ANC-01",
                      "name": "Mr. John Doe",
                      "time": "2025-08-05T10:00:00+05:30",
                      "title": "Reminder: Upcoming Unit Test",
                      "description": "Just a reminder that our unit test on Algebra will be held next Monday. The syllabus includes chapters 2 and 3.",
                      "attachements": ["syllabus_update.pdf"]
                    }
                ```
    - **Course Search:**
        - GET `/v1/api/me/{course_id}/search`
        - Allowed: Student, Teacher( teacher should be also able to access the search)
        - This endpoint searches for announcements and tasks within a specific course based on a query string. The search should scan titles and descriptions.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Query Parameter:**
            - `q`: The string to search for. Example: `?q=test`
        - **Response**
            - **Json Response:**
                ```json
                {
                  "announcements": [
                    {
                      "announce_id": "ANC-01",
                      "name": "Mr. John Doe",
                      "time": "2025-08-05T10:00:00+05:30",
                      "title": "Reminder: Upcoming Unit Test",
                      "description": "Just a reminder that our unit test on Algebra will be held next Monday. The syllabus includes chapters 2 and 3.",
                      "attachements": ["syllabus_update.pdf"]
                    }
                  ],
                  "tasks": [
                    {
                      "task_id":"TSK-05",
                      "name": "Mr. John Doe",
                      "time": "2025-08-06T11:00:00+05:30",
                      "title": "Practice Test for Algebra",
                      "description": "Please complete the attached practice test to prepare for the upcoming unit test.",
                      "attachements": ["Practice_Test_Algebra.pdf"],
                      "deadline": "2025-08-10T23:59:59+05:30",
                      "status": "PENDING"
                    }
                  ]
                }
                ```

6. Teachers Flow and API 
    - **Today's Schedule Section:**
        - GET `/v1/api/me/schedule`
        - Retrieves the daily schedule for the logged-in teacher, including classes and breaks.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response**
            - **Json Response:**
                ```json
                {
                  "morning_subs": [
                    "SCI-10A",
                    "BREAK",
                    "ENG-09B"
                  ],
                  "aftnoon_subs": [
                    "SCI-10B",
                    "BREAK",
                    "ENG-09A"
                  ]
                }
                ```
    - **Classes List:**
        - GET `/v1/api/me/classes`
        - This endpoint retrieves the list of classes and subjects the logged-in teacher is assigned to teach.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response**
            - **Json Response:**
                ```json
                {
                  "classes": [
                    {
                      "class_name": "Class 10-A",
                      "course_name": "Science",
                      "course_id": "SCI-10A",
                      "student_count": 40,
                      "accent_color": "#27AE60",
                      "accent_image": "science_banner.png"
                    }
                  ]
                }
                ```
    - **Update Course Accent Image:**
        - PUT `/v1/api/courses/me/{course_id}/accent_image`
        - This endpoint allows a teacher to update the accent image for a specific course.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - The request must be a `multipart/form-data` request containing the image file.
        - **File Field** `accent_image`: (File) The image file to be uploaded.
        - **Response**
            - **Json Response (on success):**
                ```json
                {
                  "message": "Course accent_image updated successfully"
                }
                ```

    -   **Create Task:**
        -   POST `/v1/api/{course_id}/tasks/create`
        -   This endpoint creates a new task and uploads its attachments in a single call.
        -   Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Request Body (`multipart/form-data`):**
            -   **Form Field** `title`: (String) "Photosynthesis Diagram"
            -   **Form Field** `description`: (String) "Draw and label a detailed diagram..."
            -   **Form Field** `deadline`: (String) "2025-08-20T23:59:59+05:30"
            -   **File Field** `files`: (File) The actual file(s) to be uploaded. This field can be included multiple times for multiple files.
        -   **Response (on success):**
            ```json
            {
              "message": "Task created successfully.",
              "task_id": "TSK-02",
              "uploaded_files": ["diagram_guidelines.pdf", "example_1.jpg"]
            }
            ```

    -   **Update Task Details & Manage Attachments:**
        -   PUT `/v1/api/{course_id}/tasks/{task_id}/update`
        -   This endpoint updates the text fields of a task. To manage attachments, you provide arrays of filenames to keep or new files to upload.
        -   Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Request Body (`multipart/form-data`):**
            -   **Form Field** `title`: (String) "Updated Task Title"
            -   **Form Field** `description`: (String) "Updated description..."
            -   **Form Field** `deadline`: (String) "2025-08-22T23:59:59+05:30"
            -   **Form Field** `attachments_to_keep`: (JSON String Array) A JSON string of filenames that should remain attached. e.g., `["diagram_guidelines.pdf"]`
            -   **File Field** `files`: (File) Any *new* files to be added.
        -   **Explanation:** On the backend, the server will compare the `attachments_to_keep` list with the currently stored files. Any stored file *not* in this list will be deleted. Any new files uploaded in the `files` field will be added. This avoids forcing the user to re-upload files they want to keep.
        -   **Response (on success):**
            ```json
            {
              "message": "Task updated successfully.",
              "task_id": "TSK-02",
              "current_attachments": ["diagram_guidelines.pdf", "newly_added_file.docx"]
            }
            ```

    - **Delete Task:**
        -   DELETE `/v1/api/{course_id}/tasks/{task_id}/delete`
        -   This endpoint allows a teacher to delete a task.
        -   Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Response**
            -   **Json Response (on success):**
                ```json
                {
                  "message": "Task deleted successfully.",
                  "task_id": "TSK-02"
                }
                ```
    -   **Create Course Announcement**
        -   `POST /v1/api/{course_id}/announcements/create`
        -   This endpoint creates a new announcement with its attachments for a specific course.
        -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Request Body (`multipart/form-data`):**
            -   **Form Field** `title`: (String) "Field Trip Permission Slip"
            -   **Form Field** `description`: (String) "Please find the attached permission slip for our upcoming field trip to the science museum. It must be signed and returned by this Friday."
            -   **File Field** `files`: (File) The actual file(s) to be uploaded (e.g., `permission_slip.pdf`). This field can be sent multiple times for multiple attachments.
        -   **Response (on success):**
            ```json
            {
              "message": "Announcement created successfully.",
              "announcement_id": "ANC-03",
              "uploaded_files": ["permission_slip.pdf"]
            }
            ```

    -   **Update Course Announcement**
        -   `PUT /v1/api/{course_id}/announcements/{announcement_id}/update`
        -   Updates an announcement's text details and allows for managing its attachments.
        -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Request Body (`multipart/form-data`):**
            -   **Form Field** `title`: (String) "Field Trip Permission Slip & Itinerary"
            -   **Form Field** `description`: (String) "UPDATED: Please find the permission slip and the full day's itinerary attached. Slips are due this Friday."
            -   **Form Field** `attachments_to_keep`: (JSON String Array) A JSON string of filenames that should remain attached. Example: `["permission_slip.pdf"]`. Any existing attachment not in this list will be deleted.
            -   **File Field** `files`: (File) Any *new* files to be added (e.g., `trip_itinerary.docx`).
        -   **Response (on success):**
            ```json
            {
              "message": "Announcement updated successfully.",
              "announcement_id": "ANC-03",
              "current_attachments": ["permission_slip.pdf", "trip_itinerary.docx"]
            }
            ```

    -   **Delete Course Announcement**
        -   `DELETE /v1/api/{course_id}/announcements/{announcement_id}/delete`
        -   Deletes an entire announcement, including all of its attachments.
        -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Response (on success):**
            ```json
            {
              "message": "Announcement deleted successfully.",
              "announcement_id": "ANC-03"
            }
            ```
    -   **List Students in a Class:**
        -   GET `/v1/api/{class_id}/students`
        -   This endpoint retrieves a list of all students enrolled in a specific class.
        -   **Allowed:** Homeroom Teacher of that class
        -   Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Response**
            -   **Json Response (on success):**
                ```json
                {
                  "students": [
                    {
                      "name": "Kanishq V",
                      "roll_number": "192224227",
                      "profile_picture_url": "192224227.png"
                    },
                    {
                      "name": "Another Student",
                      "roll_number": "192224228",
                      "profile_picture_url": "192224228.png"
                    }
                  ]
                }
                ```

    -   **View Student Profile:**
        -   GET `/v1/api/students/{student_roll_number}`
        -   **Allowed:** Homeroom Teacher or the student themselves
        -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Response**
            -   **Json Response (on success):**
                ```json
                {
                  "profile_picture_url": "192224227.png",
                  "name": "Kanishq V",
                  "roll_number": "192224227",
                  "classroom": "10-A",
                  "progress": {
                    "attendance_percentage": 89,
                    "tasks_completed": 19,
                    "tasks_total": 20
                  },
                  "grades": {
                    "s": 5,
                    "a": 8,
                    "b": 4,
                    "c": 1,
                    "d": 0,
                    "overall": "A"
                   },
                  "contact_info": {
                    "email": "kanishqv4227.sse@saveetha.com",
                    "phone_personal": "+919940256702",
                    "phone_mother": "+917740256702",
                    "phone_father": "+917740256702"
                  },
                  "home_address": "489, New MGR Nagar, Anaicut Road, Walajapet, Ranipet District - 632513, Tamil Nadu"
                  }
                }
                ```
    -   **Mark Class Attendance:**
        -   POST `/v1/api/{class_code}/attendance`
        -   This endpoint allows a homeroom teacher to submit the attendance for their assigned class for the current day.
        -   Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Path Parameter:**
            -   `class_code`: The unique identifier for the class, e.g., "10-A".
        -   **Request Body**
            -   The body should contain a list of students and their attendance status for the day.
            -   **Json Body:**
                ```json
                {
                  "attendance_data": [
                    {
                      "student_roll_number": "192224227",
                      "status": "PRESENT"
                    },
                    {
                      "student_roll_number": "192224228",
                      "status": "ABSENT"
                    },
                    {
                      "student_roll_number": "192224229",
                      "status": "LEAVE"
                    }
                  ]
                }
                ```
        -   **Response**
            -   **Json Response (on success):**
                ```json
                {
                  "message": "Attendance for class 10-A on 2025-08-01 has been successfully recorded."
                }
                ```

    -   **View Past Class Attendance (for Teachers):**
        -   GET `/v1/api/{class_code}/attendance-history?attendance_date=YYYY-MM-DD`
        -   This endpoint allows a homeroom teacher to view the attendance for their class on a specific past date.
        -   Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        -   **Query Parameter:**
            -   `attendance_date`: The date to retrieve records for, in `YYYY-MM-DD` format.
        -   **Response**
            -   **Json Response (on success):**
                ```json
                {
                  "records": [
                    {
                      "student_roll_number": "192224227",
                      "status": "PRESENT"
                    },
                    {
                      "student_roll_number": "192224228",
                      "status": "ABSENT"
                    }
                  ]
                }
                ```
    - **View Past Attendance (for Students):**
        - GET `/v1/api/me/attendance-history`
        - This endpoint retrieves the full attendance history for the logged-in student.
        - Requires: `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response**
            - **Json Response (on success):**
                ```json
                {
                  "history": [
                    {
                      "date": "2025-08-01",
                      "status": "PRESENT"
                    },
                    {
                      "date": "2025-07-31",
                      "status": "PRESENT"
                    },
                    {
                      "date": "2025-07-25",
                      "status": "LEAVE"
                    }
                  ]
                }
                ```
7. Teacher's Flow and API
-   **Create School-wide Announcement**
    -   `POST /v1/api/school-announcements/create`
    -   This endpoint creates a new school-wide announcement and uploads any associated files.
    -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>` (with Principal privileges)
    -   **Request Body (`multipart/form-data`):**
        -   **Form Field** `title`: (String) "Parent-Teacher Meeting Schedule"
        -   **Form Field** `description`: (String) "The upcoming Parent-Teacher meetings are scheduled for next month. Please see the attached document for the full schedule and booking information."
        -   **File Field** `files`: (File) The actual file(s) to be uploaded (e.g., `ptm_schedule_fall_2025.pdf`).
    -   **Response (on success):**
        ```json
        {
          "message": "School-wide announcement created successfully.",
          "announcement_id": "SCH-ANC-003",
          "uploaded_files": ["ptm_schedule_fall_2025.pdf"]
        }
        ```

-   **Update School-wide Announcement**
    -   `PUT /v1/api/school-announcements/{announcement_id}/update`
    -   Updates an existing school-wide announcement and its attachments.
    -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>` (with Principal privileges)
    -   **Request Body (`multipart/form-data`):**
        -   **Form Field** `title`: (String) "CORRECTION: Parent-Teacher Meeting Schedule"
        -   **Form Field** `description`: (String) "Please disregard the previous schedule. An updated version is attached with revised timings for Grade 10."
        -   **Form Field** `attachments_to_keep`: (JSON String Array) Example: `[]` (if you want to replace all old files).
        -   **File Field** `files`: (File) The new, corrected file (e.g., `ptm_schedule_fall_2025_revised.pdf`).
    -   **Response (on success):**
        ```json
        {
          "message": "School-wide announcement updated successfully.",
          "announcement_id": "SCH-ANC-003",
          "current_attachments": ["ptm_schedule_fall_2025_revised.pdf"]
        }
        ```

-   **Delete School-wide Announcement**
    -   `DELETE /v1/api/school-announcements/{announcement_id}/delete`
    -   Deletes a school-wide announcement permanently.
    -   **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>` (with Principal privileges)
    -   **Response (on success):**
        ```json
        {
          "message": "School-wide announcement deleted successfully.",
          "announcement_id": "SCH-ANC-003"
        }
        ```

8. Attachment Download Endpoints
    - **Download School-wide Announcement Attachment:**
        - GET `/v1/api/school-announcements/{announcement_id}/attachments/{file_name}`
        - This endpoint downloads a specific attachment from a school-wide announcement.
        - **Allowed:** All authenticated users
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response:** The requested file.

    - **Download Course Announcement Attachment:**
        - GET `/v1/api/courses/{course_id}/announcements/{announcement_id}/attachments/{file_name}`
        - This endpoint downloads an attachment from a course-specific announcement.
        - **Allowed:** Student, Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response:** The requested file.

    - **Download Task Attachment:**
        - GET `/v1/api/courses/{course_id}/tasks/{task_id}/attachments/{file_name}`
        - This endpoint downloads an attachment for a specific task.
        - **Allowed:** Student, Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response:** The requested file.

    - **Download Student's Own Task Submission:**
        - GET `/v1/api/courses/{course_id}/tasks/{task_id}/submission/download`
        - This endpoint allows a student to download their own submitted file(s) for a task. If multiple files were submitted, they will be downloaded as a single zip archive.
        - **Allowed:** Student (who submitted the task)
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response:** The submitted file(s).

    - **Download a Student's Task Submission (for Teachers):**
        - GET `/v1/api/courses/{course_id}/tasks/{task_id}/submissions/{student_roll_number}/download`
        - This endpoint allows a teacher to download a specific student's submission for a task. If the submission contains multiple files, they will be downloaded as a single zip archive.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response:** The student's submitted file(s), either directly or as a zip archive.
9. Asset Endpoints
    - **Course Icon:**
        - GET `/{course_id}/icon.png`
        - This endpoint retrieves the course's icon image. This is a public endpoint and does not require authentication.
        - **Response:** The requested image file.


10. Teacher Attendance (WebAuthn & Geofencing)
    - This feature allows teachers to check-in and check-out using their device's built-in biometrics (like Face ID or fingerprint) for enhanced security, combined with geofencing to ensure they are on school premises.
    - **Note for Frontend Developers:** The WebAuthn API uses base64url encoding for binary data in JSON. You will need to convert some fields from and to ArrayBuffer. Here are example helper functions in JavaScript:
        ```javascript
        // Decodes a base64url string to an ArrayBuffer.
        const bufferDecode = (value) => {
          const s = value.replace(/_/g, '/').replace(/-/g, '+');
          const decoded = atob(s);
          const buffer = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) {
            buffer[i] = decoded.charCodeAt(i);
          }
          return buffer.buffer;
        };

        // Encodes an ArrayBuffer to a base64url string.
        const bufferEncode = (value) => {
          const bytes = new Uint8Array(value);
          let s = '';
          for (let i = 0; i < bytes.length; i++) {
            s += String.fromCharCode(bytes[i]);
          }
          return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        };
        ```

    - **Get WebAuthn Registration Options:**
        - GET `/v1/api/attendance/teacher/webauthn/register-options`
        - This endpoint provides the necessary data to the client to start the WebAuthn registration ceremony. It should only be called if the teacher has not yet registered a device.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (on success):**
            ```json
            {
              "challenge": "...",
              "rp": {"id": "localhost", "name": "TaskWise"},
              "user": {"id": "...", "name": "Teacher Name", "displayName": "Teacher Name"},
              "pubKeyCredParams": [...],
              "authenticatorSelection": {
                "authenticatorAttachment": "platform",
                "userVerification": "required"
              },
              "timeout": 60000,
              "attestation": "direct"
            }
            ```
        - **Error Response (409 Conflict):**
            - If the user has already registered the maximum number of devices (2).

    - **Verify WebAuthn Registration:**
        - POST `/v1/api/attendance/teacher/webauthn/register-verify`
        - This endpoint receives the signed credential from the client to complete the registration process.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Request Body:**
            ```json
            {
              "id": "...",
              "rawId": "...",
              "response": {
                "clientDataJSON": "...",
                "attestationObject": "..."
              },
              "type": "public-key",
              "device_name": "My Phone",
              "recovery_code": "my-secret-code"
            }
            ```
        - **Response (on success):**
            ```json
            {
              "message": "Device registered successfully."
            }
            ```

    - **Get WebAuthn Authentication Options:**
        - GET `/v1/api/attendance/teacher/webauthn/auth-options`
        - This endpoint provides the challenge needed to initiate a sign-in (check-in/check-out) ceremony.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (on success):**
            ```json
            {
              "challenge": "...",
              "allowCredentials": [{"type": "public-key", "id": "..."}],
              "userVerification": "required",
              "rpId": "localhost",
              "timeout": 60000
            }
            ```

    - **Verify Check-In:**
        - POST `/v1/api/attendance/teacher/check-in`
        - Verifies the WebAuthn authentication response and records the teacher's check-in time if they are within the school's geofence.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Request Body:**
            ```json
            {
              "credential": {
                "id": "...",
                "rawId": "...",
                "response": {
                  "clientDataJSON": "...",
                  "authenticatorData": "...",
                  "signature": "...",
                  "userHandle": "..."
                },
                "type": "public-key"
              },
              "location": {
                "latitude": 12.9716,
                "longitude": 77.5946
              }
            }
            ```
        - **Response (on success):**
            ```json
            {
              "message": "Check-in successful.",
              "check_in_time": "2025-09-14T10:00:00Z"
            }
            ```

    - **Verify Check-Out:**
        - POST `/v1/api/attendance/teacher/check-out`
        - Verifies the WebAuthn authentication response and records the teacher's check-out time if they are within the school's geofence.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Request Body:** (Same as check-in)
        - **Response (on success):**
            ```json
            {
              "message": "Check-out successful.",
              "check_out_time": "2025-09-14T17:00:00Z"
            }
            ```

    - **Recovery Code Check-In:**
        - POST `/v1/api/attendance/teacher/recovery-check-in`
        - Allows a teacher to check-in using a one-time recovery code if their device is unavailable. An admin is notified upon use. This endpoint also enforces geofencing.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Request Body:**
            ```json
            {
              "code": "one-time-recovery-code",
              "location": {
                "latitude": 12.9716,
                "longitude": 77.5946
              },
              "reason": "I forgot my phone at home."
            }
            ```
        - **Response (on success):**
            ```json
            {
              "message": "Check-in successful using recovery code.",
              "check_in_time": "2025-09-14T10:05:00Z"
            }
            ```

    - **Recovery Code Check-Out:**
        - POST `/v1/api/attendance/teacher/recovery-check-out`
        - Allows a teacher to check-out using a one-time recovery code if their device is unavailable. An admin is notified upon use. This endpoint also enforces geofencing.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Request Body:**
            ```json
            {
              "code": "one-time-recovery-code",
              "location": {
                "latitude": 12.9716,
                "longitude": 77.5946
              },
              "reason": "My phone battery died."
            }
            ```
        - **Response (on success):**
            ```json
            {
              "message": "Check-out successful using recovery code.",
              "check_out_time": "2025-09-14T17:05:00Z"
            }
            ```

    - **Get Teacher Attendance Status:**
        - GET `/v1/api/attendance/teacher/status`
        - Retrieves the teacher's attendance status for the current day, including whether a device is registered.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (on success):**
            ```json
            {
                "status": "Checked In",
                "check_in_time": "2025-09-14T10:00:00Z",
                "check_out_time": null,
                "is_device_registered": true
            }
            ```

    - **Final Frontend Notes:**
        - **Production Configuration:** Remember that for WebAuthn to work in a production environment, the `RP_ID` and `ORIGIN` variables on the backend *must* be updated to match the production domain (e.g., `RP_ID` = "your-school.com", `ORIGIN` = "https://your-school.com"). WebAuthn is rightly strict about this to prevent phishing attacks.
        - **Challenge Session:** The temporary `challenge` value required for registration and authentication is handled automatically by the backend using a secure, server-side session cookie. No manual storage (e.g., in `localStorage`) is needed on the client-side.

    - **View Past Attendance (for Teachers):**
        - GET `/v1/api/attendance/teacher/me/attendance-history?year=YYYY&month=MM`
        - This endpoint retrieves the full attendance history for the logged-in teacher for a specific month.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Query Parameters:**
            - `year`: The year to retrieve records for (e.g., 2025).
            - `month`: The month to retrieve records for (1-12).
        - **Response (on success):**
            ```json
            {
              "history": [
                {
                  "date": "2025-09-14",
                  "check_in_time": "2025-09-14T10:00:00Z",
                  "check_out_time": "2025-09-14T17:00:00Z"
                },
                {
                  "date": "2025-09-13",
                  "check_in_time": "2025-09-13T09:55:00Z",
                  "check_out_time": "2025-09-13T16:50:00Z"
                }
              ]
            }
            ```

11. Geofencing Management
    - This feature allows the principal to define a polygon geofence for the school premises.

    - **Create Geofence:**
        - POST `/v1/api/geofence/`
        - This endpoint creates a new geofence. If a geofence already exists, it should be updated.
        - **Allowed:** Principal
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Request Body:**
            ```json
            {
              "name": "Main Campus",
              "coordinates": [
                [
                  [77.5946, 12.9716],
                  [77.5956, 12.9716],
                  [77.5956, 12.9726],
                  [77.5946, 12.9726],
                  [77.5946, 12.9716]
                ]
              ]
            }
            ```
        - **Response (on success):**
            ```json
            {
              "id": 1,
              "name": "Main Campus",
              "coordinates": [
                [
                  [77.5946, 12.9716],
                  [77.5956, 12.9716],
                  [77.5956, 12.9726],
                  [77.5946, 12.9726],
                  [77.5946, 12.9716]
                ]
              ]
            }
            ```

    - **Edit Geofence:**
        - PUT `/v1/api/geofence/{geofence_id}`
        - This endpoint updates an existing geofence.
        - **Allowed:** Principal
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Request Body:**
            ```json
            {
              "name": "Main Campus",
              "coordinates": [
                [
                  [77.5946, 12.9716],
                  [77.5956, 12.9716],
                  [77.5956, 12.9726],
                  [77.5946, 12.9726],
                  [77.5946, 12.9716]
                ]
              ]
            }
            ```
        - **Response (on success):**
            ```json
            {
              "id": 1,
              "name": "Main Campus",
              "coordinates": [
                [
                  [77.5946, 12.9716],
                  [77.5956, 12.9716],
                  [77.5956, 12.9726],
                  [77.5946, 12.9726],
                  [77.5946, 12.9716]
                ]
              ]
            }
            ```

    - **Get Geofence by ID:**
        - GET `/v1/api/geofence/{geofence_id}`
        - This endpoint retrieves a geofence by its ID.
        - **Allowed:** Principal
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (on success):**
            ```json
            {
              "id": 1,
              "name": "Main Campus",
              "coordinates": [
                [
                  [77.5946, 12.9716],
                  [77.5956, 12.9716],
                  [77.5956, 12.9726],
                  [77.5946, 12.9726],
                  [77.5946, 12.9716]
                ]
              ]
            }
            ```

    - **Get All Geofences:**
        - GET `/v1/api/geofence/coordinates/`
        - This endpoint retrieves all geofences.
        - **Allowed:** Teacher
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (on success):**
            ```json
            [
              {
                "id": 1,
                "name": "Main Campus",
                "coordinates": [
                  [
                    [77.5946, 12.9716],
                    [77.5956, 12.9716],
                    [77.5956, 12.9726],
                    [77.5946, 12.9726],
                    [77.5946, 12.9716]
                  ]
                ]
              }
            ]
            ```

    - **Delete Geofence:**
        - DELETE `/v1/api/geofence/{geofence_id}`
        - This endpoint deletes a geofence by its ID.
        - **Allowed:** Principal
        - **Requires:** `Authorization: Bearer <JWT-LOGIN_TOKEN>`
        - **Response (on success):**
            ```json
            {
              "id": 1,
              "name": "Main Campus",
              "coordinates": [
                [
                  [77.5946, 12.9716],
                  [77.5956, 12.9716],
                  [77.5956, 12.9726],
                  [77.5946, 12.9726],
                  [77.5946, 12.9716]
                ]
              ]
            }
            ```
