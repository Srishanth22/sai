import spacy
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize

# Download necessary NLTK datasets (will only download if missing)
try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
except Exception:
    pass

# Load a small SpaCy English model
# Run this in terminal first: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("SpaCy model 'en_core_web_sm' not found. Please install it using: python -m spacy download en_core_web_sm")
    nlp = None

def preprocess_text(text: str) -> str:
    """
    Cleans and preprocesses the text before generation using SpaCy.
    """
    if not nlp:
        return text.strip()
    
    # Process text
    doc = nlp(text)
    
    # Example: we could extract named entities or purely rely on basic cleaning
    # For now, just a simple clean up of extra spaces
    clean_text = " ".join([token.text for token in doc if not token.is_space])
    return clean_text

def analyze_generated_text(text: str):
    """
    Analyzes the output generated from the AI utilizing NLTK.
    """
    sentences = sent_tokenize(text)
    words = word_tokenize(text)
    return {
        "num_sentences": len(sentences),
        "num_words": len(words),
        "sentences": sentences
    }
