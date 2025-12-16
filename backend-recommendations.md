# Recommended Backend Endpoint Additions

Add these endpoints and CRUD functions to your FastAPI backend to support the full portal functionality.

---

## Important: Manager Creation with Regions

The frontend now requires managers to be created with at least one region. Your existing `POST /managers/` endpoint should accept a `region_slugs` array in the payload and assign those regions to the manager upon creation.

**Expected ManagerPayload schema:**
```python
class ManagerPayload(BaseModel):
    name: str
    email: str
    region_slugs: list[str]  # Required, at least one region slug
```

**Update your create_manager endpoint to:**
1. Accept the `region_slugs` in the payload
2. Look up the Region objects by slug
3. Assign them to the manager's `regions` relationship before saving

Example CRUD function update:
```python
async def create_manager(db: AsyncSession, payload: ManagerPayload) -> Manager:
    manager = Manager(name=payload.name, email=payload.email)

    # Look up regions by slug and assign them
    for slug in payload.region_slugs:
        region = await get_region_by_slug(db, slug)
        if region:
            manager.regions.append(region)

    db.add(manager)
    await db.commit()
    await db.refresh(manager)
    return manager
```

---

## 1. New CRUD Functions (add to `app/crud/crud.py`)

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.portal import Region, Manager, Lifeguard, manager_region
from uuid import UUID


# ---------- Lifeguards ----------

async def list_lifeguards(db: AsyncSession) -> list[Lifeguard]:
    result = await db.execute(select(Lifeguard))
    return list(result.scalars().all())


async def get_lifeguard_by_pk(db: AsyncSession, pk: UUID) -> Lifeguard | None:
    return await db.get(Lifeguard, pk)


async def update_lifeguard(db: AsyncSession, lifeguard: Lifeguard, data: dict) -> Lifeguard:
    for key, value in data.items():
        if hasattr(lifeguard, key):
            setattr(lifeguard, key, value)
    await db.commit()
    await db.refresh(lifeguard)
    return lifeguard


async def delete_lifeguard(db: AsyncSession, lifeguard: Lifeguard) -> None:
    await db.delete(lifeguard)
    await db.commit()


# ---------- Regions ----------

async def update_region_full(db: AsyncSession, region: Region, data: dict) -> Region:
    """Update region fields including slug and locations."""
    for key, value in data.items():
        if hasattr(region, key) and key not in ('pk', 'id', 'created'):
            setattr(region, key, value)
    await db.commit()
    await db.refresh(region)
    return region


async def assign_manager_to_region(db: AsyncSession, region: Region, manager: Manager) -> Region:
    """Assign a manager to a region."""
    if manager not in region.managers:
        region.managers.append(manager)
        await db.commit()
        await db.refresh(region)
    return region


async def unassign_manager_from_region(db: AsyncSession, region: Region, manager: Manager) -> Region:
    """Remove a manager from a region."""
    if manager in region.managers:
        region.managers.remove(manager)
        await db.commit()
        await db.refresh(region)
    return region
```

---

## 2. Updated Regions Router (update `app/routers/regions.py`)

Add these new endpoints to your existing regions router:

```python
from app.schemas.portal_schemas import RegionUpdate  # You'll need to add this schema

# PUT /regions/{region_id} - Full region update
@router.put('/{region_id}', response_model=RegionRead)
async def update_region(
    region_id: UUID,
    payload: RegionUpdate,
    db: AsyncSession = Depends(get_db)
):
    region = await crud.get_region_by_pk(db, region_id)
    if not region:
        raise HTTPException(status_code=404, detail=f"Region {region_id} not found")

    # Check for slug uniqueness if slug is being changed
    if payload.slug and payload.slug != region.slug:
        existing = await crud.get_region_by_slug(db, payload.slug)
        if existing:
            raise HTTPException(status_code=400, detail=f"Region with slug '{payload.slug}' already exists")

    try:
        updated = await crud.update_region_full(db, region, payload.model_dump(exclude_unset=True))
        return updated
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Failed to update region")


# POST /regions/{region_id}/managers/{manager_id} - Assign manager to region
@router.post('/{region_id}/managers/{manager_id}', response_model=RegionRead)
async def assign_manager(
    region_id: UUID,
    manager_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    region = await crud.get_region_by_pk(db, region_id)
    if not region:
        raise HTTPException(status_code=404, detail=f"Region {region_id} not found")

    manager = await crud.get_manager_by_pk(db, manager_id)
    if not manager:
        raise HTTPException(status_code=404, detail=f"Manager {manager_id} not found")

    try:
        updated = await crud.assign_manager_to_region(db, region, manager)
        return updated
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Failed to assign manager to region")


# DELETE /regions/{region_id}/managers/{manager_id} - Unassign manager from region
@router.delete('/{region_id}/managers/{manager_id}', response_model=RegionRead)
async def unassign_manager(
    region_id: UUID,
    manager_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    region = await crud.get_region_by_pk(db, region_id)
    if not region:
        raise HTTPException(status_code=404, detail=f"Region {region_id} not found")

    manager = await crud.get_manager_by_pk(db, manager_id)
    if not manager:
        raise HTTPException(status_code=404, detail=f"Manager {manager_id} not found")

    try:
        updated = await crud.unassign_manager_from_region(db, region, manager)
        return updated
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Failed to unassign manager from region")
```

---

## 3. Lifeguards Router (add new file `app/routers/lifeguards.py` or extend managers.py)

Create a dedicated lifeguards router or add to existing file:

```python
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select
from app.db import get_db
from app.models.portal import Lifeguard
from app.schemas import portal_schemas
from app.crud import crud
from uuid import UUID

router = APIRouter(prefix="/lifeguards", tags=['Lifeguards'])


@router.get('/', response_model=List[portal_schemas.Lifeguard])
async def list_lifeguards(db: AsyncSession = Depends(get_db)):
    """List all lifeguards."""
    result = await db.execute(select(Lifeguard))
    return result.scalars().all()


@router.get('/{lifeguard_id}', response_model=portal_schemas.Lifeguard)
async def get_lifeguard(lifeguard_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a lifeguard by ID."""
    lifeguard = await crud.get_lifeguard_by_pk(db, lifeguard_id)
    if not lifeguard:
        raise HTTPException(status_code=404, detail=f"Lifeguard {lifeguard_id} not found")
    return lifeguard


@router.put('/{lifeguard_id}', response_model=portal_schemas.Lifeguard)
async def update_lifeguard(
    lifeguard_id: UUID,
    payload: portal_schemas.LifeguardUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a lifeguard."""
    lifeguard = await crud.get_lifeguard_by_pk(db, lifeguard_id)
    if not lifeguard:
        raise HTTPException(status_code=404, detail=f"Lifeguard {lifeguard_id} not found")

    # Check phone uniqueness if being changed
    if payload.phone and payload.phone != lifeguard.phone:
        existing = await crud.get_lifeguard_by_phone(db, payload.phone)
        if existing:
            raise HTTPException(status_code=400, detail=f"Phone number already in use")

    try:
        updated = await crud.update_lifeguard(db, lifeguard, payload.model_dump(exclude_unset=True))
        return updated
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Failed to update lifeguard")


@router.delete('/{lifeguard_id}')
async def delete_lifeguard(lifeguard_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a lifeguard."""
    lifeguard = await crud.get_lifeguard_by_pk(db, lifeguard_id)
    if not lifeguard:
        raise HTTPException(status_code=404, detail=f"Lifeguard {lifeguard_id} not found")

    try:
        await crud.delete_lifeguard(db, lifeguard)
        return {"detail": "Lifeguard deleted"}
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Failed to delete lifeguard")
```

---

## 4. New Pydantic Schemas (add to `app/schemas/portal_schemas.py`)

```python
from typing import Optional

# Region update schema (for PUT endpoint)
class RegionUpdate(BaseModel):
    slug: Optional[str] = None
    locations: Optional[dict[str, str]] = None


# Lifeguard update schema (for PUT endpoint)
class LifeguardUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    region_id: Optional[str] = None  # UUID as string
```

---

## 5. Register the Lifeguards Router (in your main app file)

```python
from app.routers import lifeguards

app.include_router(lifeguards.router)
```

---

## Summary of New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/regions/{id}` | Full region update (slug + locations) |
| POST | `/regions/{id}/managers/{manager_id}` | Assign manager to region |
| DELETE | `/regions/{id}/managers/{manager_id}` | Unassign manager from region |
| GET | `/lifeguards/` | List all lifeguards |
| GET | `/lifeguards/{id}` | Get lifeguard by ID |
| PUT | `/lifeguards/{id}` | Update lifeguard |
| DELETE | `/lifeguards/{id}` | Delete lifeguard |
