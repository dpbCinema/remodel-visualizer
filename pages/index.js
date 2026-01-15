import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [step, setStep] = useState('welcome');
  const [currentRoomImage, setCurrentRoomImage] = useState(null);
  const [currentRoomData, setCurrentRoomData] = useState(null);
  const [inspirationImage, setInspirationImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('savedIdeas');
    if (saved) {
      try {
        setSavedIdeas(JSON.parse(saved));
      } catch (e) {
        console.log('Error loading saved ideas');
      }
    }
  }, []);

  const handleCurrentRoomUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.src = e.target.result;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxSize = 1024;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCurrentRoomImage(resizedDataUrl);
        setCurrentRoomData(resizedDataUrl.split(',')[1]);
      };
    };
    
    reader.readAsDataURL(file);
  };

  const handleInspirationUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setInspirationImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const generateVisualization = async () => {
    setIsGenerating(true);
    setError('');
    setStep('generating');

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRoom: currentRoomData,
          style: selectedStyle
        })
      });

      const data = await response.json();

      if (data.success && data.image) {
        setGeneratedImage(data.image);
        setStep('results');
      } else {
        throw new Error(data.error || 'Failed to generate');
      }
    } catch (err) {
      setError(err.message);
      setStep('style');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveIdea = () => {
    const idea = {
      id: Date.now(),
      currentRoom: currentRoomImage,
      inspiration: inspirationImage,
      result: generatedImage,
      style: selectedStyle,
      date: new Date().toISOString()
    };
    const updated = [...savedIdeas, idea];
    setSavedIdeas(updated);
    localStorage.setItem('savedIdeas', JSON.stringify(updated));
    alert('💾 Idea saved!');
  };

  const deleteSavedIdea = (id) => {
    const updated = savedIdeas.filter(idea => idea.id !== id);
    setSavedIdeas(updated);
    localStorage.setItem('savedIdeas', JSON.stringify(updated));
  };

  const startOver = () => {
    setCurrentRoomImage(null);
    setCurrentRoomData(null);
    setInspirationImage(null);
    setGeneratedImage(null);
    setSelectedStyle('');
    setError('');
    setStep('upload');
  };

  const tryDifferentStyle = () => {
    setGeneratedImage(null);
    setSelectedStyle('');
    setError('');
    setStep('style');
  };

  const styles = [
    { value: 'modern minimalist', label: 'Modern Minimalist', emoji: '⬜' },
    { value: 'traditional', label: 'Traditional', emoji: '🏛️' },
    { value: 'contemporary', label: 'Contemporary', emoji: '🎨' },
    { value: 'rustic farmhouse', label: 'Rustic Farmhouse', emoji: '🌾' },
    { value: 'industrial', label: 'Industrial', emoji: '🏭' },
    { value: 'scandinavian', label: 'Scandinavian', emoji: '❄️' },
    { value: 'mediterranean', label: 'Mediterranean', emoji: '🌊' },
    { value: 'luxury', label: 'Luxury', emoji: '💎' },
  ];

  return (
    <>
      <Head>
        <title>Remodel Vision Tool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {step === 'welcome' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
                  <div className="text-6xl mb-4">🏠✨</div>
                  <h1 className="text-4xl font-bold mb-3">Remodel Vision Tool</h1>
                  <p className="text-xl text-blue-100">See YOUR space transformed</p>
                </div>

                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">How It Works</h2>
                  
                  <div className="space-y-6 mb-8">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mr-4">📸</div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800 mb-1">Step 1: Upload Your Room</h3>
                        <p className="text-slate-600">Take a photo of your current space</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl mr-4">💡</div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800 mb-1">Step 2: Add Inspiration</h3>
                        <p className="text-slate-600">Upload a style you found online</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl mr-4">🎨</div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800 mb-1">Step 3: See the Magic</h3>
                        <p className="text-slate-600">AI shows what your space would look like</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('upload')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 px-6 rounded-xl text-xl shadow-lg transition-all"
                  >
                    🚀 Start Visualizing
                  </button>

                  {savedIdeas.length > 0 && (
                    <button
                      onClick={() => setStep('saved')}
                      className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-xl transition-all"
                    >
                      📂 View Saved Ideas ({savedIdeas.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Upload Photos</h1>
                <button onClick={() => setStep('welcome')} className="text-slate-600">← Back</button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">📸 Your Current Room</h2>
                <div
                  onClick={() => document.getElementById('currentRoomInput').click()}
                  className="border-3 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer bg-blue-50 hover:border-blue-500 transition-colors"
                >
                  <input
                    type="file"
                    id="currentRoomInput"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCurrentRoomUpload}
                  />
                  {!currentRoomImage ? (
                    <>
                      <div className="text-5xl mb-3">📷</div>
                      <p className="text-slate-700 font-medium">Tap to take or upload photo</p>
                    </>
                  ) : (
                    <>
                      <img src={currentRoomImage} alt="Current" className="max-h-64 mx-auto rounded-lg shadow-md mb-3" />
                      <p className="text-sm text-green-600 font-medium">✓ Photo uploaded!</p>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">💡 Your Inspiration</h2>
                <div
                  onClick={() => document.getElementById('inspirationInput').click()}
                  className="border-3 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer bg-purple-50 hover:border-purple-500 transition-colors"
                >
                  <input
                    type="file"
                    id="inspirationInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleInspirationUpload}
                  />
                  {!inspirationImage ? (
                    <>
                      <div className="text-5xl mb-3">✨</div>
                      <p className="text-slate-700 font-medium">Tap to upload inspiration</p>
                    </>
                  ) : (
                    <>
                      <img src={inspirationImage} alt="Inspiration" className="max-h-64 mx-auto rounded-lg shadow-md mb-3" />
                      <p className="text-sm text-green-600 font-medium">✓ Inspiration uploaded!</p>
                    </>
                  )}
                </div>
              </div>

              {currentRoomImage && inspirationImage && (
                <button
                  onClick={() => setStep('style')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 rounded-xl shadow-lg transition-all"
                >
                  Continue to Style Options →
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'style' && (
          <div className="p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Choose Style</h1>
                <button onClick={() => setStep('upload')} className="text-slate-600">← Back</button>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">🎨 Pick Your Style</h2>
                <div className="grid grid-cols-2 gap-3">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setSelectedStyle(style.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedStyle === style.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{style.emoji}</div>
                      <div className="font-semibold text-slate-800">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedStyle && (
                <button
                  onClick={generateVisualization}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 rounded-xl shadow-lg transition-all"
                >
                  ✨ Generate Visualization
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="p-4 flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Creating Your Vision...</h2>
              <p className="text-slate-600">This takes 30-60 seconds</p>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="p-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">🎉 Here's Your Vision!</h1>

              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 text-center">Current</h3>
                    <img src={currentRoomImage} alt="Current" className="w-full rounded-lg shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 text-center">Inspiration</h3>
                    <img src={inspirationImage} alt="Inspiration" className="w-full rounded-lg shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 text-center">Your Vision</h3>
                    <img src={generatedImage} alt="Generated" className="w-full rounded-lg shadow-md" />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button onClick={saveIdea} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-all">
                    💾 Save This Idea
                  </button>
                  <button onClick={tryDifferentStyle} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all">
                    🔄 Try Another Style
                  </button>
                  <button onClick={() => setStep('welcome')} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-4 rounded-xl transition-all">
                    🏠 Start New
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'saved' && (
          <div className="p-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-800">My Saved Ideas</h1>
                <button onClick={() => setStep('welcome')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all">← Back</button>
              </div>

              {savedIdeas.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <h2 className="text-2xl font-semibold text-slate-800 mb-3">No saved ideas yet</h2>
                  <button
                    onClick={() => setStep('upload')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg mt-4 transition-all"
                  >
                    Create Your First Idea
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedIdeas.map((idea) => (
                    <div key={idea.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="grid grid-cols-3 gap-2 p-3">
                        <img src={idea.currentRoom} alt="Current" className="w-full rounded" />
                        <img src={idea.inspiration} alt="Inspiration" className="w-full rounded" />
                        <img src={idea.result} alt="Result" className="w-full rounded" />
                      </div>
                      <div className="p-4 border-t">
                        <p className="text-sm text-slate-600 mb-3">{new Date(idea.date).toLocaleDateString()}</p>
                        <button
                          onClick={() => deleteSavedIdea(idea.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
