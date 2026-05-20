import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Sparkles, Trash2, Mail, Lock } from 'lucide-react';
import axios from 'axios';
import './App.css';

// ==========================================
// 🔐 1. AUTHENTICATION (STANDALONE URBAN ENTRANCE)
// ==========================================
const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const response = await axios.post(`http://localhost:5000${endpoint}`, { email, password });
      localStorage.setItem('aura_token', response.data.token);
      onAuthSuccess(response.data.userId, response.data.measurements, response.data.frontImage);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundImage: 'url("/login-bg.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      
      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
        
        <h1 style={{ textAlign: 'center', color: '#fbbf24', marginBottom: '10px', letterSpacing: '3px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>AURA STYLIST</h1>
        <p style={{ textAlign: 'center', color: '#e2e8f0', marginBottom: '30px' }}>{isLogin ? 'Welcome back.' : 'Create an account.'}</p>
        
        {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #ef4444' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={20} color="#fbbf24" style={{ position: 'absolute', top: '12px', left: '12px' }} />
            <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.3)', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '1rem' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={20} color="#fbbf24" style={{ position: 'absolute', top: '12px', left: '12px' }} />
            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.3)', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: '1rem' }} />
          </div>
          <button type="submit" disabled={loading} style={{ backgroundColor: '#fbbf24', color: '#0f172a', padding: '15px', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: '0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
            {loading ? 'Processing...' : (isLogin ? 'Enter Wardrobe' : 'Sign Up')}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '25px', color: '#cbd5e1', fontSize: '1.05rem' }}>
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#fbbf24', cursor: 'pointer', fontWeight: 'bold', padding: '10px' }}>{isLogin ? 'Create Account' : 'Log In Instead'}</span>
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 👕 2. WARDROBE COMPONENT
// ==========================================
const Wardrobe = ({ clothes, setClothes }) => {
  const handleDelete = async (itemId) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/wardrobe/${itemId}`);
      setClothes(clothes.filter((item) => item._id !== itemId));
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>👕 My Digital Closet</h1>
      
      {clothes.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '10vh', backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: '0.3s' }}>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Your closet is looking a little bare!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Click "Add Clothes" on the left to start building your digital wardrobe.</p>
        </div>
      ) : (
        <div className="closet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {clothes.map((item) => (
            <div key={item._id} style={{ backgroundColor: 'var(--bg-card)', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', transition: '0.3s' }}>
              <button onClick={() => handleDelete(item._id)} style={{ position: 'absolute', top: '25px', right: '25px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                <Trash2 size={18} />
              </button>
              <img src={item.imageUrl} alt={item.subCategory} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} />
              <h3 style={{ marginTop: '12px', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {item.color} {item.pattern && item.pattern !== 'Solid' ? item.pattern + ' ' : ''}{item.subCategory}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'capitalize' }}>{item.category} • {item.occasion[0]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 📸 3. UPLOAD COMPONENT
// ==========================================
const Upload = ({ userId, refreshCloset, uploadData, setUploadData }) => {
  const { files, previews, loading, progress: uploadProgress } = uploadData;

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 60) return alert("Maximum 60 images at a time!");
    setUploadData(prev => ({ ...prev, files: selectedFiles, previews: selectedFiles.map(file => URL.createObjectURL(file)) }));
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return alert("Please select images first!");
    setUploadData(prev => ({ ...prev, loading: true }));
    let totalSaved = 0; let totalSkipped = 0;

    for (let i = 0; i < files.length; i++) {
      setUploadData(prev => ({ ...prev, progress: { current: i + 1, total: files.length } }));
      const formData = new FormData();
      formData.append('image', files[i]);
      formData.append('userId', userId);
      try {
        const response = await axios.post('http://localhost:5000/api/upload-clothing', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        totalSaved += response.data.savedCount; totalSkipped += response.data.skippedCount;
        if (i < files.length - 1) await sleep(4000); 
      } catch (error) { 
        if (error.response?.status === 429) await sleep(15000); 
      }
    }
    alert(`✅ Analysis Complete!\nAdded: ${totalSaved}\nSkipped: ${totalSkipped} duplicates.`);
    setUploadData({ files: [], previews: [], loading: false, progress: { current: 0, total: 0 } });
    refreshCloset();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>📸 Add to Wardrobe</h1>
      <form onSubmit={handleBulkUpload} style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', transition: '0.3s' }}>
        <div style={{ border: '2px dashed var(--border-color)', padding: '40px 20px', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer', position: 'relative', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} disabled={loading} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: loading ? 'not-allowed' : 'pointer', zIndex: 10 }} />
          {previews.length > 0 ? (
            <div>
              <p style={{ fontWeight: 'bold', color: '#10b981', marginBottom: '15px' }}>{previews.length} Photos Selected</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxHeight: '300px', overflowY: 'auto' }}>
                {previews.map((src, idx) => <img key={idx} src={src} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} alt="preview" />)}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '10px' }}>Click or drag up to 60 photos here</p>
              <span style={{ backgroundColor: 'var(--bg-main)', padding: '8px 16px', borderRadius: '20px', color: 'var(--text-main)', fontWeight: 'bold', transition: '0.3s' }}>Select Images</span>
            </div>
          )}
        </div>
        
        {loading && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '5px' }}>Analyzing photo {uploadProgress.current} of {uploadProgress.total}...</p>
            <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '10px', height: '8px' }}>
              <div style={{ width: `${(uploadProgress.current/uploadProgress.total)*100}%`, backgroundColor: '#3b82f6', height: '100%', transition: 'width 0.3s' }}></div>
            </div>
          </div>
        )}
        <button type="submit" disabled={loading || !files.length} style={{ backgroundColor: (!files.length || loading) ? 'var(--border-color)' : '#3b82f6', color: 'white', padding: '15px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%', fontSize: '1.1rem', fontWeight: 'bold' }}>
          {loading ? 'Processing AI Data...' : `Upload ${files.length > 0 ? files.length : ''} Photos`}
        </button>
      </form>
    </div>
  );
};

// ==========================================
// ✨ 4. STYLIST COMPONENT
// ==========================================
const Stylist = ({ userId, clothes, userProfile, stylistData, setStylistData }) => {
  const { occasion, location, loading, outfits } = stylistData;

  const generateOutfit = async (e) => {
    e.preventDefault();
    setStylistData(prev => ({ ...prev, loading: true, outfits: [] }));
    try {
      const response = await axios.post('http://localhost:5000/api/generate-outfit', { userId, occasion, location });
      setStylistData(prev => ({ ...prev, loading: false, outfits: response.data.suggestions }));
    } catch (error) {
      alert("Failed to consult AI. Make sure you have enough clothes!");
      setStylistData(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sparkles color="#fbbf24" size={36} /> AI Stylist
      </h1>
      
      <form onSubmit={generateOutfit} style={{ backgroundColor: 'var(--bg-card)', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '2.5rem', transition: '0.3s' }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>What's the occasion?</label>
            <input type="text" value={occasion} onChange={(e) => setStylistData(p => ({...p, occasion: e.target.value}))} placeholder="e.g., Dinner Date" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--border-color)', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Where are you going?</label>
            <input type="text" value={location} onChange={(e) => setStylistData(p => ({...p, location: e.target.value}))} placeholder="e.g., Delhi" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--border-color)', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%', fontSize: '1.1rem', fontWeight: 'bold', transition: '0.2s' }}>
          {loading ? 'Consulting Elite Fashion AI...' : 'Generate My Lookbook'}
        </button>
      </form>
      
      {outfits.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0 }}>Your AI Lookbook:</h2>
          </div>
          
          {outfits.filter(o => clothes.some(c => c._id === o.topId) && clothes.some(c => c._id === o.bottomId)).map((outfit, index) => {
            const top = clothes.find(c => c._id === outfit.topId);
            const bottom = clothes.find(c => c._id === outfit.bottomId);

            return (
              <div key={index} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', transition: '0.3s' }}>
                <div style={{ backgroundColor: 'var(--nav-bg)', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--nav-text)', margin: 0 }}>Option {index + 1}</h3>
                  <div style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem' }}>Rating: {outfit.aiRating} / 10</div>
                </div>

                <div style={{ padding: '25px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '30px', lineHeight: '1.6' }}>"{outfit.explanation}"</p>
                  
                  <div className="stylist-outfit-container" style={{ display: 'flex', gap: '40px', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '12px', transition: '0.3s' }}>
                    {userProfile?.frontImage && (
                      <div style={{ textAlign: 'center', position: 'relative' }}>
                        <img src={userProfile.frontImage} alt="You" style={{ width: '180px', height: '360px', objectFit: 'cover', borderRadius: '12px', border: '4px solid var(--nav-bg)', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                        <span style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--nav-bg)', color: 'var(--nav-text)', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>YOUR BODY</span>
                      </div>
                    )}
                    <div className="stylist-plus-icon" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}>➕</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={top.imageUrl} style={{ width: '170px', height: '170px', objectFit: 'cover', borderRadius: '12px', border: '2px dashed var(--border-color)', backgroundColor: 'transparent' }} alt="Top" />
                        <span style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#3b82f6', color: 'white', fontSize: '0.8rem', padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold' }}>TOP</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <img src={bottom.imageUrl} style={{ width: '170px', height: '170px', objectFit: 'cover', borderRadius: '12px', border: '2px dashed var(--border-color)', backgroundColor: 'transparent' }} alt="Bottom" />
                        <span style={{ position: 'absolute', bottom: '-10px', right: '-10px', backgroundColor: '#f59e0b', color: 'white', fontSize: '0.8rem', padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold' }}>BOTTOM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 📐 5. SETUP COMPONENT (RESTORED!)
// ==========================================
const Setup = ({ userId, onComplete }) => {
  const [files, setFiles] = useState({ front: null, back: null, left: null, right: null });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [measurements, setMeasurements] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null); 
  const [activeField, setActiveField] = useState(null);

  const handleFileChange = (angle, e) => {
    const file = e.target.files[0];
    setFiles({ ...files, [angle]: file });
    if (angle === 'front' && file) setFrontPreview(URL.createObjectURL(file));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!files.front) return alert("Front image is required!");
    setLoading(true);
    const formData = new FormData();
    if (files.front) formData.append('front', files.front);
    if (files.back) formData.append('back', files.back);
    if (files.left) formData.append('left', files.left);
    if (files.right) formData.append('right', files.right);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze-body', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMeasurements(response.data.measurements);
      setStep(2); 
    } catch (error) { console.error("Analysis error:", error); alert("Failed to analyze body."); }
    setLoading(false);
  };

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/user/${userId}/measurements`, { measurements });

      const formData = new FormData();
      formData.append('image', files.front);
      const avatarRes = await axios.post(`http://localhost:5000/api/user/${userId}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});

      onComplete(measurements, avatarRes.data.frontImage); 
    } catch (error) { console.error("Error saving:", error); alert("Failed to save profile."); }
    setLoading(false);
  };

  if (step === 2 && measurements) {
    return (
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '10px' }}>Interactive AI Review 📐</h2>
        
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '30px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 1, position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'center' }}>
            {frontPreview && <img src={frontPreview} style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }} alt="Preview" />}
            {['shoulders', 'chest', 'waist', 'hips'].map((part, i) => (
              <div key={part} style={{ position: 'absolute', top: `${22 + (i*12)}%`, width: '100%', textAlign: 'center', opacity: activeField === part ? 1 : 0, transition: '0.3s' }}>
                <span style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'capitalize' }}>{part} ➔</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Predicted Body Type</label>
              <input type="text" value={measurements.bodyType} onChange={e => setMeasurements({...measurements, bodyType: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {['chest', 'waist', 'hips', 'shoulderWidth'].map((key) => (
                <div key={key}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'capitalize' }}>{key.replace('Width', '')} (in)</label>
                  <input type="number" value={measurements[key]} onFocus={() => setActiveField(key === 'shoulderWidth' ? 'shoulders' : key)} onBlur={() => setActiveField(null)} onChange={e => setMeasurements({...measurements, [key]: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: activeField === key ? '2px solid #10b981' : '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleFinalSave} disabled={loading} style={{ backgroundColor: '#10b981', color: 'white', padding: '15px 30px', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%', fontSize: '1.1rem', fontWeight: 'bold' }}>
          {loading ? 'Saving Updates...' : 'Looks Good! Save & Enter Closet ➔'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-main)' }}>Setup My Profile 👤</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Upload your photos so our AI can measure your 3D proportions.</p>
      <form onSubmit={handleAnalyze} style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          {['front', 'back', 'left', 'right'].map((angle) => (
            <div key={angle} style={{ border: '2px dashed var(--border-color)', padding: '20px', borderRadius: '8px', cursor: 'pointer', position: 'relative', textAlign: 'center' }}>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(angle, e)} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              <p style={{ fontWeight: 'bold', color: files[angle] ? '#10b981' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                {files[angle] ? `✅ ${angle} Selected` : `📸 ${angle} ${angle === 'front' ? '(Required)' : ''}`}
              </p>
            </div>
          ))}
        </div>
        <button type="submit" disabled={loading || !files.front} style={{ backgroundColor: (!files.front || loading) ? 'var(--border-color)' : '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: 'bold' }}>
          {loading ? 'Analyzing...' : 'Generate AI Profile'}
        </button>
      </form>
    </div>
  );
};

// ==========================================
// 🚀 6. MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('aura_token'));
  const [userId, setUserId] = useState(() => localStorage.getItem('aura_userId'));
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('aura_profile');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [needsSetup, setNeedsSetup] = useState(() => {
    const saved = localStorage.getItem('aura_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return !(parsed.measurements && parsed.measurements.bodyType);
    }
    return false;
  });

  const [clothes, setClothes] = useState([]);
  const [uploadData, setUploadData] = useState({ files: [], previews: [], loading: false, progress: { current: 0, total: 0 } });
  const [stylistData, setStylistData] = useState({ occasion: '', location: '', loading: false, outfits: [] });

  const handleAuthSuccess = (id, measurements, permanentImage) => {
    setUserId(id);
    setToken(localStorage.getItem('aura_token'));
    localStorage.setItem('aura_userId', id);
    
    if (measurements?.bodyType) { 
      const profileData = { measurements, frontImage: permanentImage };
      setUserProfile(profileData); 
      localStorage.setItem('aura_profile', JSON.stringify(profileData)); 
      setNeedsSetup(false); 
    } else { 
      setNeedsSetup(true); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_userId');
    localStorage.removeItem('aura_profile');
    
    setToken(null); setUserId(null); setUserProfile(null); setClothes([]);
    setUploadData({ files: [], previews: [], loading: false, progress: { current: 0, total: 0 } });
    setStylistData({ occasion: '', location: '', loading: false, outfits: [] });
  };

  const fetchCloset = () => {
    if (userId) axios.get(`http://localhost:5000/api/wardrobe/${userId}`).then(res => setClothes(res.data)).catch(err => console.error(err));
  };

  useEffect(() => { fetchCloset(); }, [userId]);

  if (!token) return <Auth onAuthSuccess={handleAuthSuccess} />;

  // 🌟 NEW: This perfectly routes the user to the Setup screen if their profile is missing!
  if (needsSetup) {
    return (
      <div className="app-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Setup 
          userId={userId} 
          onComplete={(meas, img) => { 
            const profileData = { measurements: meas, frontImage: img };
            setUserProfile(profileData); 
            localStorage.setItem('aura_profile', JSON.stringify(profileData));
            setNeedsSetup(false); 
          }} 
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="app-layout">
        
        {/* SIDEBAR NAVIGATION */}
        <nav className="app-sidebar">
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', margin: '0 0 1rem 0', color: 'var(--nav-text)' }}>AURA STYLIST</h2>
          
          <div className="nav-links-container">
            <Link to="/" style={{ color: 'var(--nav-text)', textDecoration: 'none', padding: '10px', backgroundColor: 'var(--nav-item)', borderRadius: '8px' }}>My Closet</Link>
            <Link to="/upload" style={{ color: 'var(--nav-text)', textDecoration: 'none', padding: '10px', backgroundColor: 'var(--nav-item)', borderRadius: '8px' }}>Add Clothes</Link>
            <Link to="/stylist" style={{ color: '#fbbf24', textDecoration: 'none', padding: '10px', backgroundColor: 'var(--nav-item)', borderRadius: '8px', fontWeight: 'bold' }}>AI Stylist</Link>
          </div>

          <div className="mobile-hide-profile" style={{ flex: 1, marginTop: '1.5rem', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }}>
            {userProfile && userProfile.frontImage && (
              <img src={userProfile.frontImage} alt="My Body" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'cover', objectPosition: 'top' }} />
            )}
            {userProfile && (
              <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1, padding: '30px 10px 15px', background: 'linear-gradient(to top, rgba(15,23,42,1) 15%, rgba(15,23,42,0.8) 60%, rgba(15,23,42,0) 100%)', textAlign: 'center' }}>
                <p style={{ color: '#fbbf24', fontWeight: 'bold', margin: 0 }}>{userProfile.measurements.bodyType}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '0.80rem', color: '#cbd5e1', marginTop: '5px' }}>
                  <span>Chest: {userProfile.measurements.chest}"</span>
                  <span>Waist: {userProfile.measurements.waist}"</span>
                </div>
              </div>
            )}
          </div>

          <button className="mobile-hide-profile" onClick={handleLogout} style={{ marginTop: '1rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
            Logout
          </button>
        </nav>
        
        {/* MAIN CONTENT */}
        <main style={{ flex: 1, paddingBottom: '2rem' }}>
          <Routes>
            <Route path="/" element={<Wardrobe clothes={clothes} setClothes={setClothes} />} />
            <Route path="/upload" element={<Upload userId={userId} refreshCloset={fetchCloset} uploadData={uploadData} setUploadData={setUploadData} />} />
            <Route path="/stylist" element={<Stylist userId={userId} clothes={clothes} userProfile={userProfile} stylistData={stylistData} setStylistData={setStylistData} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}