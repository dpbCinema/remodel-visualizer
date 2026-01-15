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
