#!/usr/bin/env python3
import argparse
import time
import psutil
import logging
import datetime

logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def monitor_system(interval=60):
    '''Monitor system resources'''
    logger.info(f"Starting system monitor (interval: {interval}s)")
    
    while True:
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Get process count
            process_count = len(list(psutil.process_iter()))
            
            # Log metrics
            logger.info(
                f"CPU: {cpu_percent:.1f}% | "
                f"Memory: {memory.percent:.1f}% ({memory.used/1024/1024/1024:.1f}GB/{memory.total/1024/1024/1024:.1f}GB) | "
                f"Disk: {disk.percent:.1f}% | "
                f"Processes: {process_count}"
            )
            
            # Check thresholds
            if cpu_percent > 80:
                logger.warning(f"High CPU usage: {cpu_percent:.1f}%")
            if memory.percent > 80:
                logger.warning(f"High memory usage: {memory.percent:.1f}%")
            if disk.percent > 80:
                logger.warning(f"High disk usage: {disk.percent:.1f}%")
            
            time.sleep(interval)
            
        except KeyboardInterrupt:
            logger.info("Monitor stopped by user")
            break
        except Exception as e:
            logger.error(f"Monitor error: {e}")
            time.sleep(interval)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="System monitor")
    parser.add_argument("--interval", type=int, default=60, help="Monitoring interval in seconds")
    args = parser.parse_args()
    
    monitor_system(args.interval)
