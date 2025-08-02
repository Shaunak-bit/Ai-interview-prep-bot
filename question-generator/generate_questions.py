import os
import json

# Fallback static question sets
STATIC_QUESTIONS = {
    "react": {
        "beginner": [
            "What is JSX in React?",
            "How does the virtual DOM work in React?",
            "What is the difference between props and state?",
            "What are React hooks?",
            "What is useEffect used for?",
            "What is the purpose of useState in React?",
            "How do you handle events in React?",
            "What are controlled components?",
            "How does React handle forms?",
            "What are keys in React and why are they important?"
        ],
        "intermediate": [
            "Explain the context API in React.",
            "What are custom hooks and how are they used?",
            "How does React handle reconciliation?",
            "What is prop drilling and how can it be avoided?",
            "What is memoization in React?",
            "What is the useCallback hook?",
            "Explain lazy loading in React.",
            "How can performance be optimized in React apps?",
            "What is the difference between useEffect and useLayoutEffect?",
            "What are React portals?"
        ],
        "advanced": [
            "How does React Fiber architecture improve performance?",
            "Explain Concurrent Mode in React.",
            "What are render props?",
            "How does Server-Side Rendering (SSR) work with React?",
            "What are higher-order components (HOCs)?",
            "How does code-splitting work in React?",
            "What are some anti-patterns in React?",
            "Explain the Suspense component in React.",
            "How do you build a custom state management solution in React?",
            "What’s new in React 18?"
        ]
    }
}

# Function to generate questions from static data
def generate_questions(domain="react", level="beginner", count=10):
    domain = domain.lower()
    level = level.lower()

    if domain not in STATIC_QUESTIONS or level not in STATIC_QUESTIONS[domain]:
        print("⚠️  No static questions available for this domain/level.")
        return []

    questions = STATIC_QUESTIONS[domain][level]
    return questions[:count]

# Save to JSON
def save_to_json(domain, questions):
    os.makedirs("questions", exist_ok=True)
    filename = f"questions/{domain.lower().replace(' ', '_')}.json"
    with open(filename, "w") as f:
        json.dump(questions, f, indent=2)
    print(f"\n✅ Saved {len(questions)} questions to {filename}\n")

# CLI input and run
if __name__ == "__main__":
    domain = input("Enter domain (e.g. React): ")
    level = input("Enter level (beginner, intermediate, advanced): ")
    count = int(input("How many questions? "))

    questions = generate_questions(domain=domain, level=level, count=count)
    if questions:
        save_to_json(domain, questions)
