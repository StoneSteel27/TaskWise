from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

@router.get("/{course_id}/icon.png")
async def get_course_icon(course_id: str, t:int =0):
    
    sanitized_id = "".join(c for c in course_id if c.isalnum() or c in ('-', '_'))
    
    file_path = Path(f"uploads/courses/{sanitized_id}/icon.png")
    
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Icon not found")
        
    return FileResponse(file_path)
