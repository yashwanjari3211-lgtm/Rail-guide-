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
  Info,
  Mic,
  MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType, Message, Train, LiveStatus, SeatAvailability } from './types';
import { getGeneralResponse, getJourneyPlan, connectLive } from './services/gemini';
import { fetchLiveTrainStatus, searchTrains, fetchSeatAvailability, fetchTrainsBetweenStations, fetchPnrStatus, LiveStatusResponse } from './services/railApi';
import { cn } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('spot');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Train[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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
  const [pnrNumber, setPnrNumber] = useState('');
  const [pnrResult, setPnrResult] = useState<any>(null);
  const [isCheckingPnr, setIsCheckingPnr] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatusResponse | null>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [userTranscription, setUserTranscription] = useState('');
  const [aiTranscription, setAiTranscription] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice Refs
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeAudioChunksRef = useRef(0);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation error:", err)
      );
    }
    return () => stopVoice();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      await audioContext.resume();
      nextStartTimeRef.current = audioContext.currentTime;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const sessionPromise = connectLive({
        onopen: () => {
          setIsVoiceActive(true);
          setMessages(prev => [...prev, { role: 'model', text: "Voice session started. I'm listening..." }]);
        },
        onmessage: async (message) => {
          if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
            playAudio(base64Audio);
          }
          
          // Handle AI Transcription
          const modelTurn = message.serverContent?.modelTurn;
          if (modelTurn?.parts) {
            const text = modelTurn.parts.map(p => p.text).join('');
            if (text) {
              setAiTranscription(prev => prev + text);
            }
          }

          // Handle User Transcription (using any to bypass linter for potentially missing fields)
          const userTurn = (message.serverContent as any)?.userTurn;
          if (userTurn?.parts) {
            const text = userTurn.parts.map((p: any) => p.text).join('');
            if (text) {
              setUserTranscription(text);
              setAiTranscription(''); // Clear AI transcription when user starts speaking
            }
          }

          if (message.serverContent?.turnComplete) {
            // Optional: Finalize transcriptions or clear them for next turn
          }

          if (message.serverContent?.interrupted) {
            // Stop current playback on interruption
            nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
            setIsAiSpeaking(false);
            setAiTranscription('');
          }
        },
        onerror: (err) => {
          console.error("Live API Error:", err);
          stopVoice();
        },
        onclose: () => stopVoice(),
      });

      sessionRef.current = await sessionPromise;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visual feedback
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        if (rms > 0.01) {
          setIsUserSpeaking(true);
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => setIsUserSpeaking(false), 500);
        }

        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        // More robust base64 encoding
        const uint8Array = new Uint8Array(pcmData.buffer);
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Data = btoa(binary);

        sessionRef.current?.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (err) {
      console.error("Failed to start voice:", err);
      alert("Please allow microphone access to use voice interaction.");
    }
  };

  const stopVoice = () => {
    setIsVoiceActive(false);
    setIsAiSpeaking(false);
    setIsUserSpeaking(false);
    setUserTranscription('');
    setAiTranscription('');
    activeAudioChunksRef.current = 0;
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    sessionRef.current?.close();
    sessionRef.current = null;
    
    processorRef.current?.disconnect();
    processorRef.current = null;
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    
    audioContextRef.current?.close();
    audioContextRef.current = null;
    nextStartTimeRef.current = 0;
  };

  const playAudio = (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }
    
    const buffer = audioContextRef.current.createBuffer(1, floatData.length, 16000);
    buffer.getChannelData(0).set(floatData);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    // Track AI speaking state
    setIsAiSpeaking(true);
    activeAudioChunksRef.current++;
    source.onended = () => {
      activeAudioChunksRef.current--;
      if (activeAudioChunksRef.current <= 0) {
        setIsAiSpeaking(false);
      }
    };

    // Schedule playback for gapless experience
    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  };

  const handleSearchTrains = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const result = await searchTrains(query);
      if (result.status && result.data) {
        const mappedTrains = result.data.map((t: any) => ({
          number: t.train_number || t.train_no,
          name: t.train_name || t.eng_train_name,
          from: t.src_stn_name || t.source_stn_name || 'N/A',
          to: t.dstn_stn_name || t.dest_stn_name || 'N/A',
          departureTime: t.from_time || 'N/A',
          arrivalTime: t.to_time || 'N/A',
          runningDays: t.run_days || ['Daily']
        }));
        setSearchResults(mappedTrains);
      }
    } catch (error: any) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrain = async (train: Train) => {
    setSelectedTrain(train);
    setIsFetchingStatus(true);
    setLiveStatus(null);
    
    try {
      const status = await fetchLiveTrainStatus(train.number);
      if (status.status) {
        setLiveStatus(status);
      }
    } catch (error: any) {
      console.error("Status fetch error:", error);
    } finally {
      setIsFetchingStatus(false);
    }
  };

  const handleFindSeats = async () => {
    if (!fromStation || !toStation) return;
    setIsSearchingSeats(true);
    setSeatResults([]);
    
    try {
      const result = await fetchTrainsBetweenStations(fromStation, toStation, travelDate);
      if (result.status && result.data) {
        // For now, we'll just show the trains. 
        // We can't fetch all availabilities at once easily without hitting rate limits.
        // We'll map them to a format we can display.
        const mappedTrains = result.data.map((t: any) => ({
          trainNumber: t.train_number,
          class: t.train_type,
          availability: 'Check Availability',
          fare: 0 // Fare is usually not in this list
        }));
        setSeatResults(mappedTrains);
      }
    } catch (error: any) {
      console.error("Seat search error:", error);
    } finally {
      setIsSearchingSeats(false);
    }
  };

  const handleCheckAvailability = async (trainNumber: string, classCode: string) => {
    try {
      const result = await fetchSeatAvailability(trainNumber, fromStation, toStation, travelDate, classCode);
      if (result.status && result.data) {
        setSeatResults(prev => prev.map(res => 
          res.trainNumber === trainNumber && res.class === classCode
            ? { ...res, availability: result.data[0]?.availability || 'N/A', fare: result.data[0]?.fare || 0 }
            : res
        ));
      }
    } catch (error: any) {
      console.error("Check availability error:", error);
    }
  };

  const handleCheckPnr = async () => {
    if (pnrNumber.length !== 10) return;
    setIsCheckingPnr(true);
    setPnrResult(null);
    try {
      const result = await fetchPnrStatus(pnrNumber);
      if (result.status) {
        setPnrResult(result.data);
      }
    } catch (error: any) {
      console.error("PNR check error:", error);
    } finally {
      setIsCheckingPnr(false);
    }
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
                      onChange={(e) => handleSearchTrains(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      {isSearching ? "Searching..." : searchQuery ? "Search Results" : "Enter a train name or number to search"}
                    </h2>
                    {searchResults.map(train => (
                      <motion.div 
                        key={train.number}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectTrain(train)}
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
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
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

                  {isFetchingStatus ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl shadow-md border border-slate-100">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                      <p className="text-slate-500 font-medium">Fetching Live Status...</p>
                    </div>
                  ) : liveStatus ? (
                    <>
                      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-bold">{liveStatus.data.train_name}</h2>
                            <p className="text-indigo-600 font-mono font-bold">{liveStatus.data.train_no}</p>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-sm font-bold",
                            liveStatus.data.delay === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {liveStatus.data.delay === 0 ? 'On Time' : `${liveStatus.data.delay}m Late`}
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
                            <div className="text-[10px] text-slate-400 mt-2">{liveStatus.data.position}</div>
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
                            <Clock className="w-3 h-3" /> Updated {liveStatus.data.last_updated}
                          </div>
                        </div>
                        <div className="h-64 bg-slate-100 relative">
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(liveStatus.data.current_station_name)}+Railway+Station&zoom=12`}
                            allowFullScreen
                          ></iframe>
                          
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/20 to-transparent" />
                          
                          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0">
                              <Navigation className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-500 uppercase">Current Location</div>
                              <div className="font-bold text-indigo-600">{liveStatus.data.current_station_name}</div>
                              <div className="text-[10px] text-slate-400">Next: {liveStatus.data.next_station_name}</div>
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
                              Train is currently at {liveStatus.data.current_station_name} and is running {liveStatus.data.delay === 0 ? 'on time' : liveStatus.data.delay + ' mins late'}.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white p-8 rounded-3xl text-center border border-slate-100">
                      <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Could not fetch live status for this train.</p>
                    </div>
                  )}
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
                  value={pnrNumber}
                  onChange={(e) => setPnrNumber(e.target.value)}
                />
                <button 
                  onClick={handleCheckPnr}
                  disabled={isCheckingPnr || pnrNumber.length !== 10}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {isCheckingPnr ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check Status'}
                </button>
              </div>

              <AnimatePresence>
                {pnrResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-white p-6 rounded-3xl shadow-md border border-slate-100 text-left space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Train</div>
                        <div className="font-bold text-indigo-600">{pnrResult.train_no} - {pnrResult.train_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase">Date</div>
                        <div className="font-bold">{pnrResult.date_of_journey}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">From</div>
                        <div className="font-bold">{pnrResult.source_station}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase">To</div>
                        <div className="font-bold">{pnrResult.destination_station}</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-2">Passenger Status</div>
                      {pnrResult.passenger_count > 0 && (
                        <div className="bg-indigo-50 p-3 rounded-xl flex justify-between items-center">
                          <span className="text-sm font-medium">Passenger 1</span>
                          <span className="font-bold text-indigo-600">{pnrResult.booking_status}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                          {res.fare > 0 ? (
                            <div className="text-lg font-bold text-slate-900">₹{res.fare}</div>
                          ) : (
                            <button 
                              onClick={() => handleCheckAvailability(res.trainNumber, res.class)}
                              className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold hover:bg-indigo-100 transition-colors"
                            >
                              Check Fare
                            </button>
                          )}
                          {res.availability === 'Check Availability' ? (
                            <button 
                              onClick={() => handleCheckAvailability(res.trainNumber, res.class)}
                              className="text-xs text-indigo-600 font-bold mt-1 block w-full text-right"
                            >
                              Check Availability
                            </button>
                          ) : (
                            <button className="text-xs text-indigo-600 font-bold mt-1">Book Now</button>
                          )}
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
                {/* Voice Status Indicator */}
                <AnimatePresence>
                  {isVoiceActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      className="flex flex-col items-center justify-center py-8 bg-white rounded-[2rem] border border-indigo-100 mb-6 shadow-xl shadow-indigo-100/50 relative overflow-hidden"
                    >
                      {/* Subtle Background Glow */}
                      <div className={cn(
                        "absolute inset-0 transition-opacity duration-1000",
                        isAiSpeaking ? "bg-indigo-50/50 opacity-100" : "bg-indigo-50/0 opacity-0"
                      )} />
                      
                      <div className="flex items-center gap-8 relative z-10">
                        {/* User Visualizer */}
                        <div className="flex items-center gap-1.5 h-10">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                height: isUserSpeaking ? [10, 32, 10] : [10, 14, 10],
                                backgroundColor: isUserSpeaking ? "#6366f1" : "#e2e8f0"
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 0.6, 
                                delay: i * 0.1,
                                ease: "easeInOut"
                              }}
                              className="w-1.5 rounded-full"
                            />
                          ))}
                        </div>
                        
                        {/* Central Icon */}
                        <div className="relative">
                          <motion.div 
                            animate={{ 
                              scale: isAiSpeaking ? [1, 1.1, 1] : 1,
                              boxShadow: isAiSpeaking ? "0 0 20px rgba(99, 102, 241, 0.3)" : "0 0 0px rgba(99, 102, 241, 0)"
                            }}
                            className={cn(
                              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                              isAiSpeaking ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
                            )}
                          >
                            <TrainIcon className={cn("w-8 h-8", isAiSpeaking && "animate-pulse")} />
                          </motion.div>
                          
                          {isAiSpeaking && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0.5 }}
                              animate={{ scale: 1.8, opacity: 0 }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute inset-0 bg-indigo-400 rounded-full -z-10"
                            />
                          )}
                        </div>

                        {/* AI Visualizer */}
                        <div className="flex items-center gap-1.5 h-10">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                height: isAiSpeaking ? [10, 32, 10] : [10, 14, 10],
                                backgroundColor: isAiSpeaking ? "#6366f1" : "#e2e8f0"
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 0.6, 
                                delay: i * 0.1,
                                ease: "easeInOut"
                              }}
                              className="w-1.5 rounded-full"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Real-time Transcription Display */}
                      <div className="mt-6 px-6 text-center max-w-xs relative z-10">
                        <AnimatePresence mode="wait">
                          {isAiSpeaking && aiTranscription ? (
                            <motion.p 
                              key="ai-trans"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="text-sm font-medium text-slate-700 italic line-clamp-2"
                            >
                              "{aiTranscription}"
                            </motion.p>
                          ) : isUserSpeaking && userTranscription ? (
                            <motion.p 
                              key="user-trans"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="text-sm font-medium text-indigo-600 line-clamp-2"
                            >
                              {userTranscription}
                            </motion.p>
                          ) : (
                            <motion.p 
                              key="status"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
                            >
                              {isVoiceActive ? "Listening for your voice..." : "Voice Session Active"}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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

              <div className="mt-4 flex gap-2 items-center">
                <button 
                  onClick={isVoiceActive ? stopVoice : startVoice}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg relative",
                    isVoiceActive ? "bg-rose-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {isVoiceActive && (
                    <motion.div 
                      initial={{ scale: 1 }}
                      animate={{ scale: isUserSpeaking ? [1, 1.4, 1] : 1 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute inset-0 bg-rose-400 rounded-full -z-10 opacity-50"
                    />
                  )}
                  {isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
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
                  disabled={isLoading || isVoiceActive}
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
