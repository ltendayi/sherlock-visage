from celery import Celery
import os
import time

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("tasks", broker=redis_url, backend=redis_url)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task
def process_data(data_id: int):
    '''Example background task'''
    print(f"[Worker] Processing data {data_id}")
    time.sleep(2)
    return {
        "data_id": data_id, 
        "processed": True, 
        "timestamp": time.time(),
        "worker": os.getpid()
    }

@celery_app.task
def periodic_task():
    '''Example periodic task'''
    print(f"[Worker] Running periodic task at {time.time()}")
    return {"task": "periodic", "timestamp": time.time()}

@celery_app.task
def health_check():
    '''Health check task'''
    return {
        "status": "healthy",
        "worker_pid": os.getpid(),
        "timestamp": time.time()
    }
