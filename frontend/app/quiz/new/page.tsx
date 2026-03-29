'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import Button from '@/components/Button';
import Alert from '@/components/Alert';

export default function CreateQuizPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    totalmarks: 100,
    passingMarks: 40,
    marksPerQuestion: 1,
    duration: 30,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    aiProvider: 'custom' as 'custom' | 'groq' | 'gemini' | 'ollama' | 'mixed',
    numberOfQuestions: 10,
  });
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: ['totalmarks', 'passingMarks', 'marksPerQuestion', 'duration', 'numberOfQuestions'].includes(name) 
        ? parseInt(value) 
        : value 
    }));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.txt') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    });

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Only PDF, TXT, DOC, and DOCX files are allowed.');
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create FormData for multipart file upload
      const formDataWithFiles = new FormData();
      formDataWithFiles.append('title', formData.title);
      formDataWithFiles.append('description', formData.description);
      formDataWithFiles.append('subject', formData.subject);
      formDataWithFiles.append('totalmarks', formData.totalmarks.toString());
      formDataWithFiles.append('passingMarks', formData.passingMarks.toString());
      formDataWithFiles.append('marksPerQuestion', formData.marksPerQuestion.toString());
      formDataWithFiles.append('duration', formData.duration.toString());
      formDataWithFiles.append('difficulty', formData.difficulty);
      formDataWithFiles.append('aiProvider', formData.aiProvider);
      formDataWithFiles.append('numberOfQuestions', formData.numberOfQuestions.toString());

      // Add files
      uploadedFiles.forEach((file) => {
        formDataWithFiles.append('sourceFiles', file);
      });

      // Use fetch for multipart data
      const token = localStorage.getItem('authToken');
      const apiUrl = await getApiBaseUrl();
      const response = await fetch(`${apiUrl}/quizzes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataWithFiles,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create quiz (${response.status})`);
      }

      const data = await response.json();
      router.push(`/quiz/${data.quiz._id}/edit`);
    } catch (err) {
      console.error('Quiz creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold mb-6">📝 Create New Quiz</h1>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quiz Title*</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Biology Fundamentals"
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of your quiz"
                className="input-field w-full"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject*</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Science, Math, History"
                className="input-field w-full"
                required
              />
            </div>

            {/* AI Generation Settings */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">🤖 AI Generation Settings</h3>
              <div className="grid grid-cols-1 gap-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">

                {/* AI Model Selector */}
                <div>
                  <label className="block text-sm font-medium mb-1">AI Model</label>
                  <select
                    name="aiProvider"
                    value={formData.aiProvider}
                    onChange={handleChange}
                    className="input-field w-full"
                  >
                    <option value="custom">🧠 Custom Quiz Model (In-house, Recommended)</option>
                    <option value="mixed">🔀 Mixed (Custom + All LLMs)</option>
                    <option value="groq">⚡ Groq LLM (Llama 3)</option>
                    <option value="gemini">✨ Google Gemini</option>
                    <option value="ollama">🦙 Ollama (Local)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.aiProvider === 'custom' && '✅ Standalone NLP + fine-tuned with LLMs when available. No API key required.'}
                    {formData.aiProvider === 'mixed' && '🔀 Blends questions from all available providers for maximum diversity.'}
                    {formData.aiProvider === 'groq' && '⚡ Uses Groq Cloud (requires GROQ_API_KEY). Fastest LLM.'}
                    {formData.aiProvider === 'gemini' && '✨ Uses Google Gemini (requires GEMINI_API_KEY and billing).'}
                    {formData.aiProvider === 'ollama' && '🦙 Uses local Ollama (requires Ollama running on your machine).'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Question Difficulty</label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                      className="input-field w-full"
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="block text-sm font-medium mb-1">No. of Questions</label>
                    <input
                      type="number"
                      name="numberOfQuestions"
                      value={formData.numberOfQuestions}
                      onChange={handleChange}
                      min={1}
                      max={20}
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Marks*</label>
                <input
                  type="number"
                  name="totalmarks"
                  value={formData.totalmarks}
                  onChange={handleChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Passing Marks*</label>
                <input
                  type="number"
                  name="passingMarks"
                  value={formData.passingMarks}
                  onChange={handleChange}
                  className="input-field w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marks Per Question*</label>
                <input
                  type="number"
                  name="marksPerQuestion"
                  value={formData.marksPerQuestion}
                  onChange={handleChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)*</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="input-field w-full"
                  required
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium mb-2">📎 Study Materials (Optional)</label>
              <p className="text-xs text-gray-600 mb-3">Upload PDF files, text documents, or study notes</p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="fileInput"
                />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-sm font-medium">Click to upload or drag files</p>
                  <p className="text-xs text-gray-500">PDF, TXT, DOC, DOCX (Max 50MB each)</p>
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg">
                            {file.type === 'application/pdf' ? '📄' : file.name.endsWith('.txt') ? '📝' : '📋'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Quiz'}
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
