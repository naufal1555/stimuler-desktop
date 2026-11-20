from fastapi import APIRouter, HTTPException
from api.container import container

router = APIRouter(prefix="/api", tags=["catalog"])

@router.get("/topics")
def get_topics():
    data = container.catalog_queries_uc.get_topics()
    if data is None:
        raise HTTPException(status_code=404, detail="Topics file not found")
    return data

@router.get("/courses")
def get_courses():
    data = container.catalog_queries_uc.get_courses()
    if data is None:
        raise HTTPException(status_code=404, detail="Courses file not found")
    return data

@router.get("/analysis/default")
def get_default_analysis():
    data = container.catalog_queries_uc.get_default_analysis()
    if data is None:
        raise HTTPException(status_code=404, detail="Analysis file not found")
    return data
