import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [step, setStep] = useState('welcome');
  const [currentRoomImage, setCurrentRoomImage] = useState(null);
  const [currentRoomData, setCurrentRoomData] = useState(null);
  const [mode, setMode] = useState('remodel');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [intensity, setIntensity] = useState(0.7);
  const [selectedChanges, setSelectedChanges] = useState([]);
  const [cabinetColor, setCabinetColor] = useState('');
  const [countertopMaterial, setCountertopMaterial] = useState('');
  const [wallColor, setWallColor] = useState('');
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
        const allowedDimensions = [
          [1024, 1024], [1152, 896], [1216, 832], [1344, 768],
          [1536, 640], [640, 1536], [768, 1344], [832, 1216], [896, 1152]
        ];
        
        const aspectRatio = img.width / img.height;
        let bestMatch = allowedDimensions[0];
        let bestDiff = Math.abs((allowedDimensions[0][0] / allowedDimensions[0][1]) - aspectRatio);
        
        for (const dim of allowedDimensions) {
          const dimRatio = dim[0] / dim[1];
          const diff = Math.abs(dimRatio - aspectRatio);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestMatch = dim;
          }
        }
        
        const [width, height] = bestMatch;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const scale = Math.max(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCurrentRoomImage(resizedDataUrl);
        setCurrentRoomData(resizedDataUrl.split(',')[1]);
      };
    };
    
    reader.readAsDataURL(file);
  };

  const toggleChange = (change) => {
    setSelectedChanges(prev => 
      prev.includes(change) 
        ? prev.filter(c => c !== change)
        : [...prev, change]
    );
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
          style: selectedStyle,
          mode: mode,
          intensity: intensity,
          changes: selectedChanges,
          cabinetColor: cabinetColor,
          countertopMaterial: countertopMaterial,
          wallColor: wallColor
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
      setStep('options');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveIdea = () => {
    const idea = {
      id: Date.now(),
      currentRoom: currentRoomImage,
      result: generatedImage,
      style: selectedStyle,
      mode: mode,
      intensity: intensity,
      changes: selectedChanges,
      date: new Date().toISOString()
    };
    const updated = [...savedIdeas, idea];
    setSavedIdeas(updated);
    localStorage.setItem('savedIdeas', JSON.stringify(updated));
    alert('💾 Idea saved successfully!');
  };

  const deleteSavedIdea = (id) => {
    const updated = savedIdeas.filter(idea => idea.id !== id);
    setSavedIdeas(updated);
    localStorage.setItem('savedIdeas', JSON.stringify(updated));
  };

  const startOver = () => {
    setCurrentRoomImage(null);
    setCurrentRoomData(null);
    setGeneratedImage(null);
    setSelectedStyle('');
    setSelectedChanges([]);
    setError('');
    setStep('upload');
  };

  const tryDifferentOptions = () => {
    setGeneratedImage(null);
    setError('');
    setStep('options');
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

  const changeOptions = [
    { value: 'island', label: 'Add/Change Island', emoji: '🏝️' },
    { value: 'cabinets', label: 'New Cabinets', emoji: '🗄️' },
    { value: 'walls', label: 'Remove/Move Walls', emoji: '🧱' },
    { value: 'flooring', label: 'New Flooring', emoji: '⬛' },
    { value: 'lighting', label: 'New Lighting', emoji: '💡' },
    { value: 'backsplash', label: 'New Backsplash', emoji: '🎨' },
    { value: 'countertops', label: 'New Countertops', emoji: '🪨' },
    { value: 'appliances', label: 'New Appliances', emoji: '🔌' },
  ];

  return (
    <>
      <Head>
        <title>Professional Remodel Visualizer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {step === 'welcome' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
                  <div className="text-6xl mb-4">🏠✨</div>
                  <h1 className="text-4xl font-bold mb-3">Professional Remodel Visualizer</h1>
                  <p className="text-xl text-blue-100">Transform ANY space with AI</p>
                </div>

                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Choose Your Mode</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="border-2 border-blue-500 bg-blue-50 rounded-xl p-6">
                      <div className="text-4xl mb-3">🔨</div>
                      <h3 className="font-bold text-lg text-slate-800 mb-2">Remodeling Mode</h3>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Complete kitchen renovations</li>
                        <li>• Add islands, change cabinets</li>
                        <li>• Remove walls, open floor plans</li>
                        <li>• New counters, flooring, lighting</li>
                      </ul>
                    </div>

                    <div className="border-2 border-purple-500 bg-purple-50 rounded-xl p-6">
                      <div className="text-4xl mb-3">🛋️</div>
                      <h3 className="font-bold text-lg text-slate-800 mb-2">Staging Mode</h3>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Add furniture & decor</li>
                        <li>• Professional staging</li>
                        <li>• Real estate ready</li>
                        <li>• Multiple design styles</li>
                      </ul>
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
                <h1 className="text-2xl font-bold text-slate-800">Upload Photo</h1>
                <button onClick={() => setStep('welcome')} className="text-slate-600 hover:text-slate-800">← Back</button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">📸 Your Current Space</h2>
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
                      <p className="text-slate-700 font-medium mb-2">Tap to take or upload photo</p>
                      <p className="text-sm text-slate-500">Kitchen, bedroom, living room, any space!</p>
                    </>
                  ) : (
                    <>
                      <img src={currentRoomImage} alt="Current" className="max-h-64 mx-auto rounded-lg shadow-md mb-3" />
                      <p className="text-sm text-green-600 font-medium">✓ Photo uploaded! Looks great!</p>
                    </>
                  )}
                </div>
              </div>

              {currentRoomImage && (
                <button
                  onClick={() => setStep('options')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 rounded-xl shadow-lg transition-all"
                >
                  Continue to Options →
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'options' && (
          <div className="p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Transformation Options</h1>
                <button onClick={() => setStep('upload')} className="text-slate-600 hover:text-slate-800">← Back</button>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Mode</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('remodel')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      mode === 'remodel'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🔨</div>
                    <div className="font-semibold text-slate-800">Remodel</div>
                    <div className="text-xs text-slate-600">Transform the space</div>
                  </button>
                  <button
                    onClick={() => setMode('staging')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      mode === 'staging'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">🛋️</div>
                    <div className="font-semibold text-slate-800">Staging</div>
                    <div className="text-xs text-slate-600">Add furniture & decor</div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">🎨 Design Style</h2>
                <div className="grid grid-cols-2 gap-3">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setSelectedStyle(style.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedStyle === style.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{style.emoji}</div>
                      <div className="font-semibold text-sm text-slate-800">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">⚡ Transformation Intensity</h2>
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={intensity}
                    onChange={(e) => setIntensity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg cursor-pointer"
                    style={{WebkitAppearance: 'none', appearance: 'none'}}
                  />
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtle</span>
                    <span className="font-semibold text-blue-600">
                      {intensity < 0.4 ? 'Subtle' : intensity < 0.7 ? 'Moderate' : 'Dramatic'}
                    </span>
                    <span>Dramatic</span>
                  </div>
                </div>
              </div>

              {mode === 'remodel' && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">🔧 Specific Changes (Optional)</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {changeOptions.map((change) => (
                      <button
                        key={change.value}
                        onClick={() => toggleChange(change.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedChanges.includes(change.value)
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xl mb-1">{change.emoji}</div>
                            <div className="font-semibold text-xs text-slate-800">{change.label}</div>
                          </div>
                          {selectedChanges.includes(change.value) && (
                            <div className="text-green-600 text-xl">✓</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'remodel' && (
                <>
                  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">🎨 Cabinet Color</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'white', label: 'White', color: '#FFFFFF' },
                        { value: 'navy', label: 'Navy Blue', color: '#1E3A8A' },
                        { value: 'gray', label: 'Gray', color: '#6B7280' },
                        { value: 'light-wood', label: 'Light Wood', color: '#D4A574' },
                        { value: 'dark-wood', label: 'Dark Wood', color: '#3E2723' }
                      ].map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setCabinetColor(color.value)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            cabinetColor === color.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200'
                          }`}
                        >
                          <div 
                            className="w-full h-8 rounded mb-2 border" 
                            style={{backgroundColor: color.color}}
                          />
                          <div className="font-semibold text-xs text-slate-800">{color.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">🪨 Countertop Material</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'quartz', label: 'Quartz', emoji: '⬜' },
                        { value: 'granite', label: 'Granite', emoji: '🪨' },
                        { value: 'marble', label: 'Marble', emoji: '🤍' },
                        { value: 'butcher-block', label: 'Butcher Block', emoji: '🟫' },
                        { value: 'concrete', label: 'Concrete', emoji: '⬛' }
                      ].map((material) => (
                        <button
                          key={material.value}
                          onClick={() => setCountertopMaterial(material.value)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            countertopMaterial === material.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="text-2xl mb-1">{material.emoji}</div>
                          <div className="font-semibold text-xs text-slate-800">{material.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">🖌️ Wall Color</h2>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { value: 'white', label: 'White', color: '#FFFFFF' },
                        { value: 'gray', label: 'Gray', color: '#9CA3AF' },
                        { value: 'beige', label: 'Beige', color: '#D4C4B0' },
                        { value: 'blue', label: 'Blue-Gray', color: '#94A3B8' }
                      ].map((wall) => (
                        <button
                          key={wall.value}
                          onClick={() => setWallColor(wall.value)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            wallColor === wall.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200'
                          }`}
                        >
                          <div 
                            className="w-full h-8 rounded mb-2 border" 
                            style={{backgroundColor: wall.color}}
                          />
                          <div className="font-semibold text-xs text-slate-800">{wall.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedStyle && (
                <button
                  onClick={generateVisualization}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 rounded-xl shadow-lg transition-all text-lg"
                >
                  ✨ Generate Transformation
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
              <p className="text-slate-600 mb-2">This takes 30-60 seconds</p>
              <p className="text-sm text-slate-500">
                {mode === 'staging' ? 'Adding furniture and decor...' : 'Transforming your space...'}
              </p>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="p-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">🎉 Here's Your {mode === 'staging' ? 'Staged' : 'Remodeled'} Space!</h1>

              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 text-center">Before</h3>
                    <img src={currentRoomImage} alt="Before" className="w-full rounded-lg shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 text-center">After</h3>
                    <img src={generatedImage} alt="After" className="w-full rounded-lg shadow-md" />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t">
                  <div className="text-sm text-slate-600">
                    <strong>Style:</strong> {selectedStyle} | <strong>Mode:</strong> {mode} | <strong>Intensity:</strong> {intensity < 0.4 ? 'Subtle' : intensity < 0.7 ? 'Moderate' : 'Dramatic'}
                    {selectedChanges.length > 0 && (
                      <span> | <strong>Changes:</strong> {selectedChanges.join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button onClick={saveIdea} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-all">
                    💾 Save This Idea
                  </button>
                  <button onClick={tryDifferentOptions} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all">
                    🔄 Try Different Options
                  </button>
                  <button onClick={startOver} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-4 rounded-xl transition-all">
                    🏠 New Photo
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
                      <div className="grid grid-cols-2 gap-2 p-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Before</p>
                          <img src={idea.currentRoom} alt="Before" className="w-full rounded" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">After</p>
                          <img src={idea.result} alt="After" className="w-full rounded" />
                        </div>
                      </div>
                      <div className="p-4 border-t">
                        <div className="text-xs text-slate-600 mb-2">
                          <strong>{idea.style}</strong> • {idea.mode}
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{new Date(idea.date).toLocaleDateString()}</p>
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
