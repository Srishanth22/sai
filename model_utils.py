from transformers import pipeline, TextIteratorStreamer
from threading import Thread

class TextGenerator:
    def __init__(self, model_name="gpt2"):
        # Initialize the pipeline for text generation using Hugging Face
        # We start with 'gpt2' as a lightweight placeholder for a pre-trained GPT model
        self.generator = pipeline("text-generation", model=model_name)

    def generate(self, prompt: str, max_length: int = 100, temperature: float = 0.7):
        """
        Generate text based on a user prompt synchronously.
        """
        result = self.generator(
            prompt,
            max_new_tokens=max_length,
            num_return_sequences=1,
            temperature=temperature,
            pad_token_id=50256,
            do_sample=True if temperature > 0 else False,
            repetition_penalty=1.2,
            top_k=50,
            top_p=0.92,
            no_repeat_ngram_size=3
        )
        return result[0]['generated_text']

    def generate_stream(self, prompt: str, max_length: int = 100, temperature: float = 0.7):
        """
        Generate text based on a user prompt via a generator/stream.
        """
        tokenizer = self.generator.tokenizer
        model = self.generator.model

        inputs = tokenizer([prompt], return_tensors="pt")
        streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)

        generation_kwargs = dict(
            **inputs,
            streamer=streamer,
            max_new_tokens=max_length,
            temperature=temperature,
            do_sample=True if temperature > 0 else False,
            pad_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.2,
            top_k=50,
            top_p=0.92,
            no_repeat_ngram_size=3
        )

        thread = Thread(target=model.generate, kwargs=generation_kwargs)
        thread.start()

        # Yield each generated token block
        for new_text in streamer:
            yield new_text

# Instantiate the generator
text_gen_model = TextGenerator()
