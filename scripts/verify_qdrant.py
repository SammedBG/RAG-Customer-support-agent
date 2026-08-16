"""Verify Qdrant Cloud is clean."""
import sys
sys.path.insert(0, ".")
from qdrant_client import QdrantClient

QDRANT_URL = "https://a996314f-c074-4a79-a2bc-046a7d2a1c2e.eu-central-1-0.aws.cloud.qdrant.io"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Mjg1OTVhMmUtYmNmZC00NTlmLThhYzItYzE4OGUwZDVkYWEzIn0.Oz2o2GRtnIUVJmXiT6GBgkQaNIo-6LhVZrB2NBw7RWA"

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
collections = [c.name for c in client.get_collections().collections]
print(f"Collections after cleanup: {collections}")
if not collections:
    print("SUCCESS - Qdrant is clean!")
else:
    for name in collections:
        info = client.get_collection(name)
        print(f"  {name}: {info.points_count} points")
