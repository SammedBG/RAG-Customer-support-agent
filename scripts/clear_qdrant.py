"""
One-time script to clear ALL old TechNova data from Qdrant Cloud.
Run this before deploying the new generic version.
"""
import sys
sys.path.insert(0, ".")

from qdrant_client import QdrantClient

# Qdrant Cloud credentials (from .env)
QDRANT_URL = "https://a996314f-c074-4a79-a2bc-046a7d2a1c2e.eu-central-1-0.aws.cloud.qdrant.io"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Mjg1OTVhMmUtYmNmZC00NTlmLThhYzItYzE4OGUwZDVkYWEzIn0.Oz2o2GRtnIUVJmXiT6GBgkQaNIo-6LhVZrB2NBw7RWA"
COLLECTION_NAME = "MyRAG"

print(f"Connecting to Qdrant Cloud...")
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)

# Check existing collections
collections = [c.name for c in client.get_collections().collections]
print(f"Existing collections: {collections}")

if COLLECTION_NAME in collections:
    info = client.get_collection(COLLECTION_NAME)
    print(f"Collection '{COLLECTION_NAME}' has {info.points_count} points")
    
    # Delete the entire collection
    client.delete_collection(COLLECTION_NAME)
    print(f"✅ Collection '{COLLECTION_NAME}' DELETED — old TechNova data is gone!")
else:
    print(f"Collection '{COLLECTION_NAME}' does not exist — already clean.")

print("\nDone! Deploy the new code and upload fresh documents.")
