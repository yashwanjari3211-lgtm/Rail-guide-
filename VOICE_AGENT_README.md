# Enhanced Voice Agent with Gemini 2.5 Flash Native Audio

## 🎯 **What's Been Implemented**

### **1. Advanced Voice Agent Service** (`src/services/voiceAgent.ts`)
- **Gemini 2.5 Flash Native Audio**: Real-time voice conversations
- **Full API Integration**: Access to Railradar and MapTiler APIs
- **Tool System**: 7 specialized tools for railway operations
- **Location Intelligence**: Geocoding and nearby station detection
- **Error Handling**: Robust error management for all API calls

### **2. Voice Agent Tools Available**

#### **Train Operations:**
1. **`getLiveTrainStatus`** - Real-time train position and delay
2. **`searchTrains`** - Find trains by name or number
3. **`checkSeatAvailability`** - Seat availability for specific journeys
4. **`findTrainsBetweenStations`** - All trains between two stations
5. **`checkPnrStatus`** - PNR confirmation and seat allocation

#### **Location Services:**
6. **`getNearbyStations`** - Find stations near coordinates
7. **`getLocationName`** - Reverse geocoding with MapTiler

### **3. Enhanced App Integration** (`src/App.tsx`)
- **Updated Voice Session**: Uses enhanced agent with tool calls
- **Tool Call UI**: Shows tool execution in chat
- **Real-time Feedback**: Visual indicators for tool processing
- **Error Recovery**: Graceful handling of API failures

## 🚀 **How It Works**

### **Voice Agent Flow:**
1. User speaks to the voice assistant
2. Gemini 2.5 Flash processes speech in real-time
3. Agent identifies intent and calls appropriate tools
4. Tools fetch real data from Railradar/MapTiler APIs
5. Results are formatted and spoken back to user
6. Conversation continues naturally

### **Example Conversations:**
- "What's the status of train 12951?"
- "Find seats from Delhi to Mumbai tomorrow"
- "Check my PNR 1234567890"
- "What stations are near me?"
- "Plan a journey from my location to Bangalore"

## 🔧 **Technical Implementation**

### **Core Components:**
1. **Gemini 2.5 Flash Native Audio**: 
   - Real-time audio streaming
   - Natural voice responses (Puck voice)
   - Audio transcription in/out
   - Tool calling capability

2. **Railradar API Integration**:
   - Live train status
   - Seat availability
   - PNR checking
   - Train search
   - Station-to-station routing

3. **MapTiler API Integration**:
   - Reverse geocoding (coordinates to address)
   - Location-based services
   - (Future: Map visualization in voice context)

### **Tool Calling System:**
```typescript
// Tool definition in Gemini
{
  name: "getLiveTrainStatus",
  description: "Get real-time status of a train",
  parameters: {
    trainNumber: "string"
  }
}

// Tool implementation
const getLiveTrainStatus = async (trainNumber: string) => {
  const result = await fetchLiveTrainStatus(trainNumber);
  return { success: true, data: result };
};
```

## 📊 **API Key Configuration**

### **Required Environment Variables:**
```bash
# Gemini AI (for voice)
GEMINI_API_KEY=your_gemini_key

# Railradar (train data)
VITE_RAILRADAR_API_KEY=rr_r5iofpd4wq9orefqtza40jhe39s9wann

# MapTiler (location services)
VITE_MAPTILER_API_KEY=your_maptiler_key
```

### **Key Features Enabled:**
- ✅ **Real-time Voice**: Gemini 2.5 Flash native audio
- ✅ **Live Train Data**: Railradar API integration
- ✅ **Location Services**: MapTiler geocoding
- ✅ **Tool Calling**: Dynamic API access from voice
- ✅ **Error Handling**: Graceful degradation
- ✅ **UI Integration**: Visual feedback in app

## 🎤 **Voice Agent Capabilities**

### **What Users Can Ask:**
1. **Train Information**:
   - "Is train 12951 on time?"
   - "Where is the Rajdhani Express right now?"
   - "What's the schedule for Mumbai to Delhi trains?"

2. **Booking & Availability**:
   - "Are there seats available on Shatabdi tomorrow?"
   - "Check availability from Chennai to Bangalore"
   - "What classes are available on train 12627?"

3. **PNR & Bookings**:
   - "Check my PNR status 1234567890"
   - "Is my ticket confirmed?"
   - "What's my seat number?"

4. **Location Services**:
   - "What stations are near me?"
   - "Where am I located?"
   - "Find the nearest railway station"

5. **Journey Planning**:
   - "How do I get from here to Kolkata?"
   - "Plan a trip from Delhi to Mumbai"
   - "What's the best train for tomorrow?"

## 🔍 **Error Handling & Fallbacks**

### **Graceful Degradation:**
1. **API Unavailable**: Uses mock data with clear indication
2. **Network Issues**: Retry logic with user feedback
3. **Permission Denied**: Clear instructions for enabling
4. **Invalid Input**: Helpful error messages with suggestions

### **Fallback Data:**
- Mock train schedules when API fails
- Estimated station distances
- Sample PNR responses
- Generic journey planning advice

## 📱 **User Experience**

### **Visual Feedback:**
- **Voice Activity**: Animated indicators for speaking/listening
- **Tool Processing**: "Checking train status..." messages
- **Results Display**: Formatted data in chat
- **Error States**: Clear error messages with recovery steps

### **Audio Experience:**
- **Natural Voice**: Gemini's Puck voice model
- **Real-time**: No noticeable latency
- **Clear Audio**: Proper encoding/decoding
- **Background Noise**: Handles ambient sound

## 🛠 **Development & Testing**

### **Testing Voice Agent:**
```bash
# Start the app
npm run dev

# Test voice features:
1. Click microphone button
2. Ask about train status
3. Check seat availability
4. Test PNR checking
5. Try location queries
```

### **Debug Tools:**
- Console logs for tool calls
- Network tab for API requests
- Audio context monitoring
- Transcription display in UI

## 🔮 **Future Enhancements**

### **Planned Features:**
1. **Map Integration**: Show train locations on map during voice call
2. **Multi-language**: Support for Hindi and regional languages
3. **Offline Mode**: Cache frequently accessed data
4. **Voice Commands**: "Book ticket", "Set reminder", etc.
5. **Integration**: Connect with IRCTC booking system

### **Advanced Tools:**
- Fare prediction
- Platform information
- Coach position maps
- Food service availability
- Station amenities

## ⚠️ **Limitations & Considerations**

### **Current Limitations:**
1. **API Rate Limits**: Railradar/MapTiler may have usage limits
2. **Audio Quality**: Depends on microphone and network
3. **Real-time Data**: Some APIs may have slight delays
4. **Geographic Coverage**: Station data primarily for major cities

### **Best Practices:**
1. **Clear Speech**: Speak clearly for better transcription
2. **Specific Queries**: Include train numbers when possible
3. **Location Permission**: Allow browser location access
4. **Microphone Quality**: Use good quality microphone

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **No Voice Response**: Check Gemini API key
2. **No Train Data**: Verify Railradar API key
3. **Location Errors**: Ensure MapTiler API key
4. **Microphone Issues**: Check browser permissions
5. **Network Errors**: Verify internet connection

### **Debug Steps:**
1. Check browser console for errors
2. Verify environment variables
3. Test API keys independently
4. Check microphone permissions
5. Monitor network requests

## 📈 **Performance Metrics**

### **Expected Performance:**
- **Voice Latency**: < 2 seconds response time
- **API Calls**: < 1 second for most queries
- **Audio Quality**: 16kHz PCM encoding
- **Memory Usage**: Efficient streaming implementation

### **Optimization:**
- Lazy loading of voice agent
- Efficient audio processing
- API response caching
- Connection pooling

---

**The enhanced voice agent transforms your app into a fully-featured railway assistant that can access real-time data, provide location-based services, and handle complex queries through natural voice conversations.**