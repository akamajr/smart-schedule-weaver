import docx
import uuid
import re

doc = docx.Document("timebable_example2.docx")

faculties = {}       # name -> id
departments = {}     # (fac_id, name) -> id
courses = {}         # (dept_id, code) -> id
halls = {}           # name -> id
exam_sessions = []   # list of dicts

current_faculty = "UNKNOWN_FACULTY"
current_department = "UNKNOWN_DEPARTMENT"

def get_uuid():
    return str(uuid.uuid4())

# Docx block iteration needs some care in python-docx
# We can iterate through body elements directly
from docx.document import Document # type: ignore
from docx.oxml.text.paragraph import CT_P # type: ignore
from docx.oxml.table import CT_Tbl # type: ignore
from docx.table import _Cell, Table # type: ignore
from docx.text.paragraph import Paragraph

def iter_block_items(parent):
    if isinstance(parent, Document):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise ValueError("something's not right")

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)

for block in iter_block_items(doc):
    if isinstance(block, Paragraph):
        text = block.text.strip()
        if text.upper().startswith("FACULTY/SCHOOL:"):
            current_faculty = text[15:].strip()
            if current_faculty not in faculties:
                faculties[current_faculty] = get_uuid()
        elif text.upper().startswith("DEPARTMENT:"):
            current_department = text[11:].strip()
            fac_id = faculties.get(current_faculty)
            if fac_id and (fac_id, current_department) not in departments:
                departments[(fac_id, current_department)] = get_uuid()
                
    elif isinstance(block, Table):
        fac_id = faculties.get(current_faculty)
        if not fac_id:
            faculties[current_faculty] = get_uuid()
            fac_id = faculties[current_faculty]
            
        dept_key = (fac_id, current_department)
        if dept_key not in departments:
            departments[dept_key] = get_uuid()
        dept_id = departments[dept_key]
        
        for i, row in enumerate(block.rows):
            # Skip header
            if i == 0:
                continue
            cells = [c.text.strip().replace("\n", " ") for c in row.cells]
            
            if len(cells) >= 3:
                date_time = cells[0]
                course_code = cells[1]
                hall_info = cells[2]
                comments = cells[3] if len(cells) > 3 else ""
                
                if "DATE & TIME" in date_time.upper() or course_code == "" or hall_info == "":
                    continue
                    
                course_key = (dept_id, course_code)
                if course_key not in courses:
                    courses[course_key] = get_uuid()
                course_id = courses[course_key]
                
                if hall_info not in halls:
                    halls[hall_info] = get_uuid()
                hall_id = halls[hall_info]
                
                match = re.search(r'(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})', date_time)
                date_val = '2026-01-01'
                start_val = '00:00:00'
                end_val = '00:00:00'
                
                if match:
                    d, m, y = match.group(1).split('/')
                    date_val = f"{y}-{m}-{d}"
                    start_val = match.group(2) + ":00"
                    end_val = match.group(3) + ":00"
                
                session_id = get_uuid()
                exam_sessions.append({
                    "id": session_id,
                    "course_id": course_id,
                    "exam_date": date_val,
                    "start_time": start_val,
                    "end_time": end_val,
                    "comments": comments.replace("'", "''"),
                    "hall_id": hall_id
                })

def escape_sql(val):
    return val.replace('"', '').replace("'", "''")

with open("supabase/data_entries_draft.sql", "w", encoding="utf-8") as f:
    f.write("-- FACULTIES\n")
    for name, uid in faculties.items():
        f.write(f"INSERT INTO faculties (id, name) VALUES ('{uid}', '{escape_sql(name)}');\n")
        
    f.write("\n-- DEPARTMENTS\n")
    for (fac_id, name), uid in departments.items():
        f.write(f"INSERT INTO departments (id, faculty_id, name) VALUES ('{uid}', '{fac_id}', '{escape_sql(name)}');\n")
        
    f.write("\n-- COURSES\n")
    for (dept_id, code), uid in courses.items():
        f.write(f"INSERT INTO courses (id, department_id, course_code) VALUES ('{uid}', '{dept_id}', '{escape_sql(code)}');\n")
        
    f.write("\n-- HALLS\n")
    for name, uid in halls.items():
        f.write(f"INSERT INTO halls (id, name) VALUES ('{uid}', '{escape_sql(name)}');\n")
        
    f.write("\n-- EXAM SESSIONS\n")
    for sess in exam_sessions:
        f.write(f"INSERT INTO exam_sessions (id, course_id, exam_date, start_time, end_time, comments) VALUES ('{sess['id']}', '{sess['course_id']}', '{sess['exam_date']}', '{sess['start_time']}', '{sess['end_time']}', '{sess['comments']}');\n")
        
    f.write("\n-- EXAM SESSION HALLS\n")
    for sess in exam_sessions:
        f.write(f"INSERT INTO exam_session_halls (exam_session_id, hall_id) VALUES ('{sess['id']}', '{sess['hall_id']}');\n")
        
print("Extracted SQL to supabase/data_entries_draft.sql")
