import google.generativeai as genai
import os

# Replace 'YOUR_API_KEY' with your actual key
genai.configure(api_key="AIzaSyD7yL1G7wNmqsaJFx3CHbicLRRz1d_PZNM")

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello")
    print("API Key is working!")
    print(response.text)
except Exception as e:
    print(f"API Key failed: {e}")
