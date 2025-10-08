from datetime import datetime, date, timedelta
import random
from src.database import SessionLocal
from src.auth.service import get_password_hash
from src.auth.models import User, UserRole
from src.courses.models import Course
from src.announcements.models import CourseAnnouncement, SchoolAnnouncement
from src.tasks.models import Task
from src.attendance.models import Attendance, AttendanceStatusEnum
from src.schedules.models import Schedule, DayOfWeek
from src.geofence.models import Geofence
import json

def seed_data():
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Database already seeded. Skipping.")
            return

        print("Database is empty. Seeding initial data...")

        # --- Configuration ---
        CLASSES = ["10-A", "10-B", "10-C"]
        SUBJECTS = {
            "Mathematics": {"color": "#FF5733", "image": "math.png"},
            "Science": {"color": "#27AE60", "image": "science.png"},
            "English": {"color": "#3498DB", "image": "english.png"},
            "History": {"color": "#F1C40F", "image": "history.png"},
            "Art": {"color": "#9B59B6", "image": "art.png"},
            "Physical Education": {"color": "#E74C3C", "image": "pe.png"}
        }
        TEACHERS = {
            "teacher1": {"name": "Mr. Anderson", "subject": "Mathematics"},
            "teacher2": {"name": "Ms. Brody", "subject": "Science"},
            "teacher3": {"name": "Mr. Carter", "subject": "English"},
            "teacher4": {"name": "Ms. Daniels", "subject": "History"},
            "teacher5": {"name": "Mr. Evans", "subject": "Art"},
            "teacher6": {"name": "Ms. Foster", "subject": "Physical Education"},
        }
        STUDENTS_PER_CLASS = 5
        
        # Create a reverse map for easy lookup
        SUBJECT_TEACHER_MAP = {info["subject"]: teacher_id for teacher_id, info in TEACHERS.items()}

        # --- User Creation ---
        user_objects = {}
        # Principal
        user_objects["principal"] = User(
            roll_number="principal",
            password=get_password_hash("password"),
            role=UserRole.PRINCIPAL,
            name="Mr. Smith"
        )
        # Teachers
        for teacher_id, info in TEACHERS.items():
            user_objects[teacher_id] = User(
                roll_number=teacher_id,
                password=get_password_hash("password"),
                role=UserRole.TEACHER,
                name=info["name"]
            )
        # Students
        student_map = {cls: [] for cls in CLASSES}
        for cls in CLASSES:
            for i in range(1, STUDENTS_PER_CLASS + 1):
                student_id = f"student_{cls.replace('-', '')}_{i}"
                student_map[cls].append(student_id)
                user_objects[student_id] = User(
                    roll_number=student_id,
                    password=get_password_hash("password"),
                    role=UserRole.STUDENT,
                    name=f"Student {cls}-{i}",
                    classroom=cls,
                    email=f"{student_id}@school.com",
                    phone_personal=f"123-456-789{i}",
                    phone_mother=f"123-456-789{i}",
                    phone_father=f"123-456-789{i}",
                    home_address=f"{i} Main St, Anytown, USA"
                )
        db.add_all(user_objects.values())

        # --- Course Creation ---
        course_objects = {}
        for cls in CLASSES:
            for subject, subject_info in SUBJECTS.items():
                course_id = f"{subject[:3].upper()}-{cls}"
                teacher_id = SUBJECT_TEACHER_MAP[subject]
                
                course = Course(
                    id=course_id,
                    name=subject,
                    class_name=cls,
                    accent_color=subject_info["color"],
                    accent_image=subject_info["image"],
                    homeroom_teacher=user_objects[teacher_id]
                )
                
                # Add students and the designated teacher to the course
                for student_id in student_map[cls]:
                    course.students.append(user_objects[student_id])
                course.teachers.append(user_objects[teacher_id])

                course_objects[course_id] = course
        db.add_all(course_objects.values())

        

        # --- Announcements and Tasks ---
        for course_id, course in course_objects.items():
            teacher = course.homeroom_teacher
            # Announcements
            for i in range(1, 4):
                announcement = CourseAnnouncement(
                    course=course,
                    author=teacher,
                    title=f"Announcement {i} for {course.name}",
                    description=f"This is the description for announcement {i} in {course.name}, {course.class_name}.",
                    created_at=datetime.now() - timedelta(days=i)
                )
                db.add(announcement)
            # Tasks
            for i in range(1, 4):
                task = Task(
                    course=course,
                    author=teacher,
                    title=f"Task {i} for {course.name}",
                    description=f"Complete this task for {course.name}, {course.class_name}.",
                    created_at=datetime.now() - timedelta(days=i),
                    deadline=datetime.now() + timedelta(days=7+i)
                )
                db.add(task)

        # --- School Announcements ---
        school_announcements = [
            {"title": "Welcome Back!", "description": "Welcome back to the new school year! We hope you had a great summer."},
            {"title": "School Play Auditions", "description": "Auditions for the annual school play, 'A Midsummer Night's Dream', will be held next week."},
            {"title": "Parent-Teacher Conferences", "description": "Parent-teacher conferences will be held on October 25th. Please sign up for a time slot."}
        ]
        for announcement_data in school_announcements:
            announcement = SchoolAnnouncement(
                title=announcement_data["title"],
                description=announcement_data["description"],
                author=user_objects["principal"],
                created_at=datetime.now()
            )
            db.add(announcement)

        # --- Attendance ---
        for cls, students in student_map.items():
            for student_id in students:
                for i in range(1, 6): # Attendance for the last 5 days
                    status = AttendanceStatusEnum.PRESENT if random.choice([True, False]) else AttendanceStatusEnum.ABSENT
                    attendance = Attendance(
                        student_roll_number=student_id,
                        date=date.today() - timedelta(days=i),
                        status=status,
                        class_code=cls
                    )
                    db.add(attendance)

        # --- Schedule (6 periods per day) ---
        days = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
        for cls in CLASSES:
            subjects_in_class = [c.id for c in course_objects.values() if c.class_name == cls]
            for day in days:
                random.shuffle(subjects_in_class) # Vary the schedule each day
                for period in range(1, 7): # 6 periods
                    schedule = Schedule(
                        class_id=cls,
                        day_of_week=day,
                        period=period,
                        course_id=subjects_in_class[period - 1]
                    )
                    db.add(schedule)

        # --- Geofence ---
        geofence_coordinates = [
            [
                [13.028739115673496, 80.01522632938645][::-1],
                [13.028668560312445, 80.01606586072745][::-1],
                [13.028595391768622, 80.01670959082917][::-1],
                [13.027576256229123, 80.016631806777][::-1],
                [13.02749002149124, 80.01578422880975][::-1],
                [13.027774857329424, 80.015108312202940][::-1]
            ]
        ]
        geofence = Geofence(
            name="SCAD Building",
            polygon=json.dumps(geofence_coordinates)
        )
        db.add(geofence)

        # --- Commit ---
        db.commit()
        print("Successfully seeded database with corrected logic.")

    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()
