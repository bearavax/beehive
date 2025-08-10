"use client";

import React, { useState } from 'react';

// Custom icon components
const Hexagon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
  </svg>
);

const Upload = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const Wallet = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
  </svg>
);

const X = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Menu = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="12" x2="20" y2="12"></line>
    <line x1="4" y1="6" x2="20" y2="6"></line>
    <line x1="4" y1="18" x2="20" y2="18"></line>
  </svg>
);

export default function Home() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Mock data for artwork grid
  const artworks = [
    {
      id: 1,
      title: "Wellington Harbor Sunset",
      artist: "CreativeKiwi",
      timeAgo: "2 hours ago",
      imageUrl: "/api/placeholder/400/300",
      artistAvatar: "/api/placeholder/40/40"
    },
    {
      id: 2,
      title: "Mt. Victoria Lookout",
      artist: "WellyArtist",
      timeAgo: "5 hours ago",
      imageUrl: "/api/placeholder/400/300",
      artistAvatar: "/api/placeholder/40/40"
    },
    {
      id: 3,
      title: "Cuba Street Dreams",
      artist: "UrbanSketcher",
      timeAgo: "1 day ago",
      imageUrl: "/api/placeholder/400/300",
      artistAvatar: "/api/placeholder/40/40"
    },
    {
      id: 4,
      title: "Beehive Parliament",
      artist: "PoliticalArt",
      timeAgo: "2 days ago",
      imageUrl: "/api/placeholder/400/300",
      artistAvatar: "/api/placeholder/40/40"
    },
    {
      id: 5,
      title: "Botanical Gardens",
      artist: "NatureLover",
      timeAgo: "3 days ago",
      imageUrl: "/api/placeholder/400/300",
      artistAvatar: "/api/placeholder/40/40"
    },
    {
      id: 6,
      title: "Te Papa Reflection",
      artist: "MuseumFan",
      timeAgo: "4 days ago",
      imageUrl: "/api/placeholder/400/300",
      artistAvatar: "/api/placeholder/40/40"
    },
    {
      id: 7,
      title: "Oriental Bay",
      artist: "BeachComber",
      timeAgo: "5 days ago",
      imageUrl: "/api/placeholder/400/300",
      artistAvatar: "/api/placeholder/40/40"
    },
    {
      id: 8,
      title: "Cable Car Journey",
      artist: "HistoryBuff",
      timeAgo: "1 week ago",
      imageUrl: "/api/placeholder/400/300",
      artistAvatar: "/api/placeholder/40/40"
    }
  ];

  const connectWallet = () => {
    // Mock wallet connection
    setIsConnected(true);
    setIsWalletModalOpen(false);
  };

  const submitArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    setIsSubmitModalOpen(false);
    alert("Artwork submitted successfully! It will appear after moderation.");
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-500 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Hexagon className="text-black" size={32} />
              <h1 className="text-2xl font-bold text-black">Beehive</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => setIsSubmitModalOpen(true)}
                className="bg-black text-amber-500 px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center"
              >
                <Upload size={18} className="mr-2" />
                Submit Art
              </button>
              
              {isConnected ? (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-300">
                  Wallet Connected
                </div>
              ) : (
                <button 
                  onClick={() => setIsWalletModalOpen(true)}
                  className="border-2 border-black text-black px-4 py-2 rounded-lg hover:bg-amber-400 flex items-center"
                >
                  <Wallet size={18} className="mr-2" />
                  Connect Wallet
                </button>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
          
          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <div className="mt-4 pb-4 md:hidden">
              <button 
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full bg-black text-amber-500 px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center justify-center mb-2"
              >
                <Upload size={18} className="mr-2" />
                Submit Art
              </button>
              
              {isConnected ? (
                <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-300 text-center">
                  Wallet Connected
                </div>
              ) : (
                <button 
                  onClick={() => setIsWalletModalOpen(true)}
                  className="w-full border-2 border-black text-black px-4 py-2 rounded-lg hover:bg-amber-400 flex items-center justify-center"
                >
                  <Wallet size={18} className="mr-2" />
                  Connect Wallet
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Wellington Community Art</h2>
          <p className="text-gray-600">Discover and support local Wellington artists through the Beehive platform</p>
        </div>
        
        {/* Artwork Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <img 
                src={artwork.imageUrl} 
                alt={artwork.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900">{artwork.title}</h3>
                <div className="flex items-center mt-2">
                  <img 
                    src={artwork.artistAvatar} 
                    alt={artwork.artist} 
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-gray-700">@{artwork.artist}</span>
                </div>
                <div className="text-gray-500 text-sm mt-2">{artwork.timeAgo}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Hexagon className="text-amber-500 mr-2" size={24} />
              <span className="text-gray-700">Beehive DAO | Wellington</span>
            </div>
            <div className="text-gray-500 text-sm">
              &copy; 2025 Beehive. Built on Avalanche.
            </div>
          </div>
        </div>
      </footer>

      {/* Connect Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Connect Your Wallet</h3>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>
            
            <p className="mb-6 text-gray-600">Choose a wallet to connect to Beehive:</p>
            
            <div className="space-y-3">
              <button 
                onClick={connectWallet}
                className="w-full border border-gray-300 p-3 rounded-lg hover:bg-gray-100 flex items-center"
              >
                <img src="/api/placeholder/24/24" alt="MetaMask" className="mr-3" />
                MetaMask
              </button>
              <button 
                onClick={connectWallet}
                className="w-full border border-gray-300 p-3 rounded-lg hover:bg-gray-100 flex items-center"
              >
                <img src="/api/placeholder/24/24" alt="WalletConnect" className="mr-3" />
                WalletConnect
              </button>
              <button 
                onClick={connectWallet}
                className="w-full border border-gray-300 p-3 rounded-lg hover:bg-gray-100 flex items-center"
              >
                <img src="/api/placeholder/24/24" alt="Coinbase Wallet" className="mr-3" />
                Coinbase Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Artwork Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Submit Your Artwork</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submitArtwork}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="title">
                  Artwork Title
                </label>
                <input 
                  type="text"
                  id="title"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your artwork title"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Tell us about your artwork"
                  required
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Upload Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">PNG, JPG or GIF (max. 5MB)</p>
                  <button type="button" className="text-amber-600 hover:text-amber-500 text-sm font-medium">
                    Select from your computer
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="text-gray-500 mr-4 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 text-black px-4 py-2 rounded-lg hover:bg-amber-400"
                >
                  Submit Artwork
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}