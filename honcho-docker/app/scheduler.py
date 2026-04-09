import schedule
import time
from tasks import periodic_task, health_check
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_scheduler():
    '''Run scheduled tasks'''
    logger.info("Starting scheduler...")
    
    # Schedule tasks
    schedule.every(5).minutes.do(lambda: periodic_task.delay())
    schedule.every(10).minutes.do(lambda: health_check.delay())
    schedule.every().hour.do(lambda: logger.info("Hourly task scheduled"))
    schedule.every().day.at("09:00").do(lambda: logger.info("Daily 9 AM task"))
    
    logger.info(f"Scheduled tasks: {len(schedule.jobs)}")
    
    # Run forever
    while True:
        try:
            schedule.run_pending()
            time.sleep(60)
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            break
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    run_scheduler()
