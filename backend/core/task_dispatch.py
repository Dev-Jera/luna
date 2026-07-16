import logging
import threading

from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger(__name__)


import sys

def dispatch(task, *args):
    """Queue with Celery in production; run off-request for the local no-Redis MVP."""
    if settings.USE_REDIS:
        return task.delay(*args)

    if 'test' in sys.argv:
        task.run(*args)
        return None

    def run():
        close_old_connections()
        try:
            task.run(*args)
        except Exception:
            logger.exception('Background task failed', extra={'task': task.name})
        finally:
            close_old_connections()

    threading.Thread(target=run, name=f'luna-{task.name}', daemon=True).start()
    return None
