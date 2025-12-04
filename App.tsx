import React, { useState, useEffect, useCallback } from 'react';
import { Radio, Mic, Map as MapIcon, ShieldAlert, Send, Activity, Navigation, Search } from 'lucide-react';
import { ResourcePoint, ResourceType, ResourceStatus, ChatMessage } from './types';
import MapView from './components/MapView';
import { parseIncidentReport, searchGlobalMap } from './services/geminiService';

// Mock Data
const INITIAL_RESOURCES: ResourcePoint[] = [
  { id: '1', name: 'Central Station Shelter', type: ResourceType.SHELTER, status: ResourceStatus.OPERATIONAL, location: { x: 50, y: 50 }, lastUpdated: '10m ago', notes: 'Capacity at 40%' },
  { id: '2', name: 'North River Pump', type: ResourceType.WATER, status: ResourceStatus.CRITICAL, location: { x: 75, y: 25 }, lastUpdated: '1h ago', notes: 'Filter broken, do not drink' },
  { id: '3', name: 'Field Hospital Alpha', type: ResourceType.MEDICAL, status: ResourceStatus.CROWDED, location: { x: 30, y: 70 }, lastUpdated: '5m ago', notes: 'High volume of patients' },
  { id: '4', name: 'Sector 9 Checkpoint', type: ResourceType.DANGER, status: ResourceStatus.CRITICAL, location: { x: 20, y: 20 }, lastUpdated: '2m ago', notes: 'Road blocked' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'report' | 'intel'>('map');
  const [resources, setResources] = useState<ResourcePoint[]>(INITIAL_RESOURCES);
  const [selectedResource, setSelectedResource] = useState<ResourcePoint | null>(null);
  
  // Reporting State
  const [reportInput, setReportInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Search/Intel State
  const [searchQuery, setSearchQuery] = useState('');
  const [intelMessages, setIntelMessages] = useState<ChatMessage[]>([]);

  // Handle new resource report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportInput.trim()) return;

    setIsProcessing(true);
    try {
      const parsed = await parseIncidentReport(reportInput);
      
      const newResource: ResourcePoint = {
        id: Date.now().toString(),
        name: parsed.name,
        type: parsed.type,
        status: parsed.status,
        location: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }, // Random location for demo
        lastUpdated: 'Just now',
        notes: parsed.notes
      };

      setResources(prev => [...prev, newResource]);
      setReportInput('');
      setActiveTab('map');
      setSelectedResource(newResource);
    } catch (err) {
      alert("Failed to parse report. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Intel Search
  const handleIntelSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: searchQuery };
    setIntelMessages(prev => [...prev, userMsg]);
    setSearchQuery('');
    setIsProcessing(true);

    try {
      const result = await searchGlobalMap(userMsg.text);
      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: result.text,
        links: result.links
      };
      setIntelMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setIntelMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Connection failed.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-slate-200 font-sans max-w-md mx-auto relative overflow-hidden shadow-2xl">
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-tactical-900 border-b border-tactical-800 z-10">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-500 animate-pulse" size={24} />
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100">CIVIL SAVE</h1>
            <div className="text-[10px] text-green-500 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
              NETWORK ONLINE
            </div>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-500 border border-slate-700 px-2 py-1 rounded">
          v2.4.0
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        
        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="p-4 space-y-4 pb-24">
            <div className="flex justify-between items-center text-sm text-slate-400">
              <span className="font-mono">SECTOR VIEW // LIVE</span>
              <div className="flex gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Safe</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span>Crit</span>
              </div>
            </div>

            <MapView resources={resources} onSelect={setSelectedResource} />

            {/* List View of Resources */}
            <div className="mt-4 space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Nearby Resources</h2>
              {resources.map(res => (
                <div 
                  key={res.id}
                  onClick={() => setSelectedResource(res)}
                  className={`p-3 bg-tactical-800 rounded-lg border-l-4 cursor-pointer hover:bg-slate-800 transition-colors ${
                    res.status === ResourceStatus.OPERATIONAL ? 'border-green-500' :
                    res.status === ResourceStatus.CRITICAL ? 'border-red-500' :
                    res.status === ResourceStatus.CROWDED ? 'border-amber-500' : 'border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-200">{res.name}</h3>
                    <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-slate-400">{res.type}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{res.notes}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-slate-500 font-mono">
                    <span>{res.lastUpdated}</span>
                    <span className="uppercase">{res.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="p-4 flex flex-col h-full pb-20">
            <h2 className="text-xl font-bold mb-4 text-slate-100">Broadcast Update</h2>
            <div className="flex-1 flex flex-col justify-center items-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-tactical-800 border-2 border-slate-700 flex items-center justify-center relative group cursor-pointer hover:border-red-500 transition-colors">
                <Mic size={40} className="text-slate-500 group-hover:text-red-500 transition-colors" />
                {isProcessing && <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>}
              </div>
              <p className="text-center text-slate-500 text-sm max-w-xs">
                Tap to record or type below. State location, resource type, and situation clearly.
              </p>
            </div>

            <form onSubmit={handleReportSubmit} className="mt-auto space-y-4">
              <div className="relative">
                <textarea
                  value={reportInput}
                  onChange={(e) => setReportInput(e.target.value)}
                  placeholder="e.g., 'The water tank at Sector 4 is contaminated.'"
                  className="w-full h-32 bg-tactical-800 text-slate-100 p-4 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <button 
                type="submit"
                disabled={isProcessing || !reportInput}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? 'ENCRYPTING & SENDING...' : <><Send size={18} /> BROADCAST REPORT</>}
              </button>
            </form>
          </div>
        )}

        {/* INTEL TAB */}
        {activeTab === 'intel' && (
          <div className="flex flex-col h-full pb-20">
             <div className="p-4 border-b border-tactical-800 bg-tactical-900 sticky top-0 z-10">
               <h2 className="font-bold text-amber-500 flex items-center gap-2">
                 <Search size={18} />
                 GLOBAL INTEL
               </h2>
             </div>
             
             <div className="flex-1 p-4 space-y-4 overflow-y-auto">
               {intelMessages.length === 0 && (
                 <div className="text-center text-slate-600 mt-20">
                   <Activity size={48} className="mx-auto mb-4 opacity-50" />
                   <p>Connect to Global Command.</p>
                   <p className="text-sm">Ask for shelter locations, news, or map data.</p>
                 </div>
               )}
               
               {intelMessages.map((msg) => (
                 <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                     msg.role === 'user' 
                       ? 'bg-blue-900/50 text-blue-100 rounded-tr-none' 
                       : 'bg-tactical-800 text-slate-300 rounded-tl-none border border-slate-700'
                   }`}>
                     {msg.text}
                   </div>
                   {/* Render Google Maps Grounding Links */}
                   {msg.links && msg.links.length > 0 && (
                     <div className="mt-2 space-y-1 w-full max-w-[85%]">
                       {msg.links.map((link, idx) => (
                         <a 
                           key={idx} 
                           href={link.uri} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center gap-2 text-xs bg-slate-900/50 p-2 rounded hover:bg-slate-800 text-blue-400 truncate"
                         >
                           <Navigation size={12} />
                           <span className="truncate">{link.title}</span>
                         </a>
                       ))}
                     </div>
                   )}
                 </div>
               ))}
               {isProcessing && <div className="text-xs text-amber-500 animate-pulse ml-2">Receiving transmission...</div>}
             </div>

             <form onSubmit={handleIntelSearch} className="p-4 bg-black border-t border-tactical-800">
               <div className="flex gap-2">
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Query global database..."
                   className="flex-1 bg-tactical-800 text-slate-200 px-4 py-3 rounded-lg border border-slate-700 focus:border-amber-500 focus:outline-none text-sm"
                 />
                 <button type="submit" disabled={isProcessing} className="bg-amber-600 p-3 rounded-lg text-black hover:bg-amber-500 transition-colors">
                   <Search size={20} />
                 </button>
               </div>
             </form>
          </div>
        )}

      </main>

      {/* Detail Modal / Slide-up */}
      {selectedResource && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-tactical-900 w-full rounded-t-2xl p-6 border-t border-slate-700 animate-[slideUp_0.3s_ease-out]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedResource.name}</h2>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-black ${
                    selectedResource.status === ResourceStatus.OPERATIONAL ? 'bg-green-500' :
                    selectedResource.status === ResourceStatus.CRITICAL ? 'bg-red-500' : 'bg-amber-500'
                  }`}>
                    {selectedResource.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
                    {selectedResource.type}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedResource(null)}
                className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-black/40 p-3 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-300">{selectedResource.notes}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                  <Navigation size={16} /> NAVIGATE
                </button>
                <button className="bg-tactical-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg text-sm font-bold border border-slate-700">
                  UPDATE STATUS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-tactical-900/95 backdrop-blur border-t border-slate-800 flex justify-around p-4 pb-6 z-40">
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-blue-500' : 'text-slate-600'}`}
        >
          <MapIcon size={24} />
          <span className="text-[10px] font-bold tracking-wider">GRID</span>
        </button>
        <button 
          onClick={() => setActiveTab('report')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'report' ? 'text-red-500' : 'text-slate-600'}`}
        >
          <Radio size={24} />
          <span className="text-[10px] font-bold tracking-wider">REPORT</span>
        </button>
        <button 
          onClick={() => setActiveTab('intel')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'intel' ? 'text-amber-500' : 'text-slate-600'}`}
        >
          <Activity size={24} />
          <span className="text-[10px] font-bold tracking-wider">INTEL</span>
        </button>
      </nav>

    </div>
  );
};

export default App;
