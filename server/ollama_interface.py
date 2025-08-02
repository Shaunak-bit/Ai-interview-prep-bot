import subprocess

def ask_ollama(prompt: str) -> str:
    try:
        result = subprocess.run(
            ["ollama", "run", "gemma:2b"],
            input=prompt.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=60
        )
        output = result.stdout.decode("utf-8", errors="ignore")

        # Remove Ollama's preamble (e.g. prompt echo or other noise)
        clean_output = output.strip().split('\n', 1)[-1].strip()
        return clean_output

    except subprocess.TimeoutExpired:
        return "⚠️ Ollama timed out. Please try again."

    except Exception as e:
        return f"❌ Ollama error: {e}"
