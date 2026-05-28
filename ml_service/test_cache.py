import sys, io, time, os
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, '.')
from pipeline.graph import run_pipeline
from data.mongo_loader import load_students, get_db
import hashlib
from datetime import datetime, timezone

df  = load_students()
sid = df.iloc[0]['_id']

# Clear cache for a clean test
today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
key   = hashlib.sha256(f'{sid}:{today}'.encode()).hexdigest()
get_db().pipeline_cache.delete_one({'_id': key})
print('Cache cleared for clean test')

# Run 1 — full pipeline
t0 = time.time()
run_pipeline(sid)
t1 = time.time()
first_ms = round((t1-t0)*1000)

# Run 2 — should be cache HIT
t2 = time.time()
r  = run_pipeline(sid)
t3 = time.time()
second_ms = round((t3-t2)*1000)

print(f'Run 1 (full pipeline): {first_ms}ms')
print(f'Run 2 (cache hit):     {second_ms}ms')
print(f'Cache HIT:  {r.get("cache_hit", False)}')
print(f'Speedup:    {round(first_ms/max(second_ms,1))}x faster' if second_ms < first_ms else f'Hmm: {second_ms}ms vs {first_ms}ms')
