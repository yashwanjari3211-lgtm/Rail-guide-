import React, { useState, useEffect, useRef } from 'react';
import { 
  Train as TrainIcon, 
  Search, 
  MapPin, 
  MessageSquare, 
  Ticket, 
  Navigation, 
  Clock, 
  ChevronRight,
  Send,
  Loader2,
  Map as MapIcon,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType, Message, Train, LiveStatus, SeatAvailability } from './types';
import { getGeneralResponse, getJourneyPlan } from './services/gemini';
import { cn } from './utils';

const MOCK_TRAINS: Train[] = [
  { number: '12290', name: 'Nagpur Duronto Express', from: 'NGP', to: 'CSMT', departureTime: '20:40', arrivalTime: '08:05', runningDays: ['Daily'] },
  { number: '12106', name: 'Vidarbha Express', from: 'G', to: 'CSMT', departureTime: '14:55', arrivalTime: '07:00', runningDays: ['Daily'] },
  { number: '12136', name: 'Nagpur Pune SF Express', from: 'NGP', to: 'PUNE', departureTime: '18:00', arrivalTime: '09:05', runningDays: ['Mon', 'Wed', 'Sat'] },
];

const MOCK_STATUS: Record<string, LiveStatus> = {
  '12290': { trainNumber: '12290', currentStation: 'Igatpuri', status: 'On Time', delay: '0 min', lastUpdated: '2 mins ago', nextStation: 'Kalyan' },
  '12136': { trainNumber: '12136', currentStation: 'Ahmednagar', status: 'Late', delay: '15 mins', lastUpdated: '5 mins ago', nextStation: 'Daund' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('spot');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your RailGuide AI assistant. How can I help you today? You can ask me about train status, seat availability, or plan a journey!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [seatResults, setSeatResults] = useState<SeatAvailability[]>([]);
  const [isSearchingSeats, setIsSearchingSeats] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation error:", err)
      );
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFindSeats = () => {
    if (!fromStation || !toStation) return;
    setIsSearchingSeats(true);
    // Mock API call
    setTimeout(() => {
      setSeatResults([
        { trainNumber: '12290', class: '3A', availability: 'AVAILABLE-0042', fare: 1250 },
        { trainNumber: '12290', class: '2A', availability: 'AVAILABLE-0012', fare: 1840 },
        { trainNumber: '12136', class: 'SL', availability: 'WL 12/WL 8', fare: 450 },
        { trainNumber: '12136', class: '3A', availability: 'AVAILABLE-0005', fare: 1180 },
      ]);
      setIsSearchingSeats(false);
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Determine if it's a planning query
      const isPlanning = userMsg.toLowerCase().includes('go to') || 
                        userMsg.toLowerCase().includes('reach') || 
                        userMsg.toLowerCase().includes('from') ||
                        userMsg.toLowerCase().includes('plan');

      if (isPlanning) {
        const result = await getJourneyPlan(userMsg, location);
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: result.text || "I couldn't find a specific plan, but I can help with general train info.",
          type: 'planning',
          groundingChunks: result.groundingChunks
        }]);
      } else {
        const text = await getGeneralResponse(userMsg);
        setMessages(prev => [...prev, { role: 'model', text: text || "I'm sorry, I couldn't process that." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <TrainIcon className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">RailGuide AI</h1>
          </div>
          <div className="text-xs opacity-80 font-mono">LIVE</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto p-4 space-y-4">
          
          {activeTab === 'spot' && (
            <div className="space-y-4">
              {!selectedTrain ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Enter Train Name or Number"
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Searches</h2>
                    {MOCK_TRAINS.filter(t => t.number.includes(searchQuery) || t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(train => (
                      <motion.div 
                        key={train.number}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedTrain(train)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600">{train.number}</span>
                            <h3 className="font-medium">{train.name}</h3>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {train.from}
                            </div>
                            <ChevronRight className="w-3 h-3" />
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {train.to}
                            </div>
                          </div>
                        </div>
                        {MOCK_STATUS[train.number] && (
                          <div className="text-right">
                            <div className={cn(
                              "text-xs font-bold px-2 py-1 rounded-full",
                              MOCK_STATUS[train.number].status === 'On Time' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {MOCK_STATUS[train.number].status}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">{MOCK_STATUS[train.number].lastUpdated}</div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <button 
                    onClick={() => setSelectedTrain(null)}
                    className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Search
                  </button>

                  <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedTrain.name}</h2>
                        <p className="text-indigo-600 font-mono font-bold">{selectedTrain.number}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold",
                        MOCK_STATUS[selectedTrain.number]?.status === 'On Time' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {MOCK_STATUS[selectedTrain.number]?.status || 'Status Unknown'}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4 items-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedTrain.departureTime}</div>
                        <div className="text-xs text-slate-500">{selectedTrain.from}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-full h-[2px] bg-slate-200 relative">
                          <TrainIcon className="w-4 h-4 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white" />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2">12h 25m</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedTrain.arrivalTime}</div>
                        <div className="text-xs text-slate-500">{selectedTrain.to}</div>
                      </div>
                    </div>
                  </div>

                  {/* Live Map View */}
                  <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold">Live Train Location</h3>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Updated {MOCK_STATUS[selectedTrain.number]?.lastUpdated || 'just now'}
                      </div>
                    </div>
                    <div className="h-64 bg-slate-100 relative">
                      {/* Using an iframe for a real map view */}
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(MOCK_STATUS[selectedTrain.number]?.currentStation || selectedTrain.from)}+Railway+Station&zoom=12`}
                        allowFullScreen
                      ></iframe>
                      
                      {/* Fallback overlay if API key is missing or for visual flair */}
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/20 to-transparent" />
                      
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0">
                          <Navigation className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase">Current Location</div>
                          <div className="font-bold text-indigo-600">{MOCK_STATUS[selectedTrain.number]?.currentStation || 'Departing soon'}</div>
                          <div className="text-[10px] text-slate-400">Next: {MOCK_STATUS[selectedTrain.number]?.nextStation || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-indigo-900 text-sm">Status Update</h4>
                        <p className="text-indigo-700 text-xs mt-1">
                          Train is currently at {MOCK_STATUS[selectedTrain.number]?.currentStation} and is running {MOCK_STATUS[selectedTrain.number]?.delay === '0 min' ? 'on time' : MOCK_STATUS[selectedTrain.number]?.delay + ' late'}.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'pnr' && (
            <div className="space-y-6 py-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                <Ticket className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Check PNR Status</h2>
                <p className="text-slate-500 mt-1">Enter your 10-digit PNR number below</p>
              </div>
              <div className="w-full space-y-3">
                <input 
                  type="text" 
                  placeholder="PNR Number"
                  className="w-full bg-white border border-slate-200 rounded-xl py-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  maxLength={10}
                />
                <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  Check Status
                </button>
              </div>
            </div>
          )}

          {activeTab === 'seats' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  <input 
                    type="text" 
                    placeholder="From Station" 
                    className="bg-transparent w-full focus:outline-none"
                    value={fromStation}
                    onChange={(e) => setFromStation(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <input 
                    type="text" 
                    placeholder="To Station" 
                    className="bg-transparent w-full focus:outline-none"
                    value={toStation}
                    onChange={(e) => setToStation(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <input 
                    type="date" 
                    className="bg-transparent w-full focus:outline-none" 
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleFindSeats}
                  disabled={isSearchingSeats}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isSearchingSeats ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find Seat Availability'}
                </button>
              </div>

              <AnimatePresence>
                {seatResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <h3 className="text-sm font-bold text-slate-500 uppercase px-2">Availability Results</h3>
                    {seatResults.map((res, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600">{res.trainNumber}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">{res.class}</span>
                          </div>
                          <div className={cn(
                            "text-sm font-bold mt-1",
                            res.availability.includes('AVAILABLE') ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {res.availability}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">₹{res.fare}</div>
                          <button className="text-xs text-indigo-600 font-bold mt-1">Book Now</button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex flex-col h-[calc(100vh-180px)]">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-white border border-slate-100 shadow-sm rounded-tl-none"
                    )}>
                      {msg.text}
                      
                      {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase">
                            <MapIcon className="w-3 h-3" /> Sources
                          </div>
                          {msg.groundingChunks.map((chunk, idx) => (
                            chunk.web && (
                              <a 
                                key={idx} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block text-[11px] text-indigo-600 hover:underline truncate"
                              >
                                {chunk.web.title || chunk.web.uri}
                              </a>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AI is thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-4 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask about journeys, status, or booking..."
                  className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around">
          <NavButton 
            active={activeTab === 'spot'} 
            onClick={() => setActiveTab('spot')} 
            icon={<Navigation className="w-5 h-5" />} 
            label="Spot" 
          />
          <NavButton 
            active={activeTab === 'pnr'} 
            onClick={() => setActiveTab('pnr')} 
            icon={<Ticket className="w-5 h-5" />} 
            label="PNR" 
          />
          <NavButton 
            active={activeTab === 'seats'} 
            onClick={() => setActiveTab('seats')} 
            icon={<Info className="w-5 h-5" />} 
            label="Seats" 
          />
          <NavButton 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
            icon={<MessageSquare className="w-5 h-5" />} 
            label="AI Guide" 
            isSpecial
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, isSpecial }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  isSpecial?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all relative",
        active ? "text-indigo-600" : "text-slate-400",
        isSpecial && "font-bold"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-pill"
          className="absolute inset-0 bg-indigo-50 rounded-xl -z-10"
        />
      )}
      {icon}
      <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      {isSpecial && <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />}
    </button>
  );
}
