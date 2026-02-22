import asyncio
import sys
import os

# Add parent directory to path to import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.ai_classifier import classify_grievance

async def test_classification(description: str):
    print(f"\n--- TESTING: {description[:50]}... ---")
    results = await classify_grievance(description)
    print(f"Primary Category:   {results['category']}")
    print(f"Primary Dept:       {results['department']}")
    print(f"Total Domains:      {len(results['domains'])}")
    print(f"All Departments:    {', '.join(results['all_departments'])}")
    print(f"Keywords Found:     {', '.join(results['keywords_found'])}")
    print(f"Explanation:        {results['explanation']}")

async def main():
    test_cases = [
        "road and the water connection function were not working",
        "water leak and the road is broken",
        "Garbage is piling up near the primary school",
        "Water pipe leakage and sewage block in the hospital area",
        "Unauthorized building construction is happening in the environment protected zone"
    ]
    
    for case in test_cases:
        await test_classification(case)

if __name__ == "__main__":
    asyncio.run(main())
