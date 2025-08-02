from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import spacy
import nltk
from nltk.corpus import wordnet
import re
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-pro")

# Download WordNet (only needed once)
nltk.download('wordnet')

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.get_database("ai_interview")
progress_collection = db.get_collection("progress")
asked_collection = db.get_collection("asked_questions")

# Validate user input
def is_valid_input(text):
    return len(text.strip()) >= 4 and re.search(r"[a-zA-Z]{3,}", text)

@app.route("/")
def home():
    return "Gemini Interview Bot Backend Running!"

@app.route("/questions/<domain>/<level>", methods=["GET"])
def get_questions(domain, level):
    try:
        file_path = f"questions/{domain.lower()}_{level.lower()}.json"
        with open(file_path, "r") as f:
            questions = json.load(f)
        return jsonify({"questions": questions})
    except FileNotFoundError:
        return jsonify({"error": "Questions not found"}), 404

# ✅ UPDATED DYNAMIC QUESTION GENERATOR
@app.route("/ask_dynamic", methods=["POST"])
def ask_dynamic():
    try:
        data = request.json
        domain = data.get("domain", "general")
        level = data.get("level", "easy")
        email = data.get("email")

        previous_docs = asked_collection.find(
            {"email": email, "domain": domain}
        ).sort("timestamp", -1).limit(50)

        previously_asked = [doc["question"] for doc in previous_docs]
        avoid_list = "\n".join(f"- {q}" for q in previously_asked)

        prompt = f"""
You are an experienced technical interviewer.

Generate 15 **new and unique** {level}-level interview questions in the domain: {domain}.
Do **NOT** repeat any of these previously asked questions:
{avoid_list}

🎯 Only output a clean numbered list of questions.
"""

        prompt += f"\n\nRandomSeed: {datetime.utcnow().timestamp()}"

        response = gemini_model.generate_content(prompt)
        lines = response.text.split("\n")
        questions = [line.strip() for line in lines if line.strip() and re.match(r"^\d+[\).\s]", line)]
        cleaned_questions = [re.sub(r"^\d+[\).\s]+", "", q) for q in questions]
        filtered_questions = [q for q in cleaned_questions if q not in previously_asked]

        return jsonify({"questions": filtered_questions[:10]})

    except Exception as e:
        print("🔥 Error in /ask_dynamic:", str(e))
        return jsonify({"error": "Failed to fetch questions"}), 500

@app.route("/evaluate_dynamic", methods=["POST"])
def evaluate_dynamic_answer():
    data = request.json
    question = data.get("question", "")
    answer = data.get("answer", "")
    domain = data.get("domain", "")
    email = data.get("email", "")

    if not is_valid_input(answer):
        return jsonify({
            "feedback": "Please provide a more meaningful and complete answer before evaluation.",
            "score": 1,
            "correct": False
        })

    prompt = f"""
You are a senior technical interviewer.
Evaluate the following answer to the question and provide feedback in 3 sections:
1. Clarity
2. Correctness
3. Completeness
End with: "Score: X/10"

Question: {question}
Answer: {answer}
"""

    try:
        response = gemini_model.generate_content(prompt)
        feedback = response.text.strip()
        score_match = re.search(r"Score\s*:\s*(\d+)", feedback)
        score = int(score_match.group(1)) if score_match else 5
        correct = score >= 7

        asked_collection.insert_one({
            "email": email,
            "domain": domain,
            "question": question,
            "timestamp": datetime.utcnow()
        })

        return jsonify({
            "score": score,
            "correct": correct,
            "feedback": feedback
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/evaluate", methods=["POST"])
def evaluate():
    data = request.json
    question = data.get("question", "")
    answer = data.get("answer", "")

    if not is_valid_input(answer):
        return jsonify({
            "feedback": "Please provide a more meaningful answer.",
            "score": 2,
            "correct": False
        })

    question_doc = nlp(question.lower())
    answer_lower = answer.lower()
    keywords = [token.lemma_ for token in question_doc if token.pos_ in ("NOUN", "VERB", "ADJ")]

    expanded_keywords = set(keywords)
    for kw in keywords:
        for syn in wordnet.synsets(kw):
            for lemma in syn.lemmas():
                expanded_keywords.add(lemma.name().replace("_", " ").lower())

    matched = sum(1 for kw in expanded_keywords if kw in answer_lower)

    clarity = "Good"
    correctness = "Partially correct"
    completeness = "Average"
    score = 5

    if matched > len(expanded_keywords) * 0.6:
        correctness = "Mostly correct"
        completeness = "Detailed"
        score = 7
    if matched == len(expanded_keywords):
        clarity = "Very clear"
        correctness = "Excellent"
        completeness = "Complete"
        score = 9

    feedback = f"""
✅ Clarity: {clarity}
✅ Correctness: {correctness}
✅ Completeness: {completeness}
🔢 Score: {score}/10
"""
    correct = score >= 7

    return jsonify({
        "feedback": feedback.strip(),
        "score": score,
        "correct": correct
    })

@app.route("/summary_feedback", methods=["POST"])
def summary_feedback():
    print("✅ /summary_feedback endpoint hit")
    try:
        data = request.json
        session = data.get("session", [])
        domain = data.get("domain", "general")
        user_email = data.get("userEmail")

        formatted_pairs = ""
        for idx, item in enumerate(session):
            formatted_pairs += f"Q{idx+1}: {item['question']}\nA: {item['answer']}\nScore: {item.get('score', '-')}\n\n"

        prompt = f"""
You're an expert interview coach. A candidate just completed a technical interview in the domain: {domain}.
Below are their responses to the questions:

{formatted_pairs}

Write a 3–4 sentence feedback summary highlighting strengths, weaknesses, and improvement areas.
❗ Do not begin with phrases like "Of course" or "Here is a summary". Start directly with the feedback.
Be constructive and end with a motivational note.
"""

        response = gemini_model.generate_content(prompt)
        final_feedback = response.text.strip()

        latest_session = progress_collection.find_one(
            {"userEmail": user_email, "domain": domain},
            sort=[("timestamp", -1)]
        )

        if latest_session:
            progress_collection.update_one(
                {"_id": latest_session["_id"]},
                {"$set": {"summaryFeedback": final_feedback}}
            )
            print("✅ Summary feedback saved in session:", latest_session["_id"])
        else:
            print("⚠️ No matching session found for saving feedback.")

        return jsonify({"summaryFeedback": final_feedback})

    except Exception as e:
        print("🔥 Error generating summary feedback:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
