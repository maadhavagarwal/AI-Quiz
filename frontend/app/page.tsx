'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-black/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🎯 AI MCQ Maker</h1>
          <div className="space-x-4">
            <Link href="/auth" className="text-white hover:text-blue-200 transition">
              Teacher Login
            </Link>
            <Link href="/auth" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">
              Take Test
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Intelligent Quiz Generation Platform
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Use AI to create high-quality multiple-choice questions from your study materials. 
            Perfect for teachers, coaching institutes, and EdTech platforms.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary bg-white text-blue-600 hover:bg-blue-50">
              Get Started
            </Link>
            <a href="#features" className="btn-secondary border-2 border-white text-white hover:bg-white/10">
              Learn More
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div id="features" className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="card bg-white/95">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-bold mb-2">AI-Powered Generation</h3>
            <p className="text-gray-600">
              Automatically generate MCQs from PDFs, text, or study notes using Gemini AI
            </p>
          </div>

          <div className="card bg-white/95">
            <div className="text-3xl mb-3">✏️</div>
            <h3 className="text-lg font-bold mb-2">Teacher Control</h3>
            <p className="text-gray-600">
              Review, edit, and finalize questions before sharing with students
            </p>
          </div>

          <div className="card bg-white/95">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-bold mb-2">Secure Testing</h3>
            <p className="text-gray-600">
              Tab-switch detection, anti-cheating features, and unique question sequences
            </p>
          </div>

          <div className="card bg-white/95">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-bold mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">
              Track student performance, view insights, and export results
            </p>
          </div>

          <div className="card bg-white/95">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-lg font-bold mb-2">AI Explanations</h3>
            <p className="text-gray-600">
              Students get instant AI-generated explanations for each answer
            </p>
          </div>

          <div className="card bg-white/95">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-bold mb-2">Low Bandwidth Mode</h3>
            <p className="text-gray-600">
              Optimized for slow internet connections with lazy loading
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Teaching?</h2>
          <Link href="/dashboard" className="btn-primary bg-white text-blue-600 hover:bg-blue-50 inline-block">
            Start Creating Quizzes Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 mt-20 py-8 text-center text-blue-100">
        <p>&copy; 2024 AI MCQ Maker. All rights reserved.</p>
      </footer>
    </div>
  );
}
