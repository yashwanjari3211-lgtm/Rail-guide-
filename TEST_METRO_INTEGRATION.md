# Testing Nagpur Metro Integration

## Test Queries

Try these queries in the AI Guide tab to test the Nagpur Metro integration:

### Basic Metro Queries
1. "Show me all Nagpur metro stations"
2. "Which metro line goes to Lokmanya Nagar?"
3. "What are the stations on Aqua Line?"
4. "Is there a metro station near Ajni Railway Station?"

### Journey Planning Queries
1. "How to reach Lokmanya Nagar from Gondia?"
2. "Plan my journey from Gondia to Sitabuldi, Nagpur"
3. "I'm in Gondia, how do I get to Khapri metro station?"
4. "Best route from Gondia Railway Station to Automotive Square, Nagpur"

### Voice Agent Queries
1. Enable voice and say: "Take me from Gondia to Lokmanya Nagar"
2. "What's the nearest metro station to Nagpur Junction?"
3. "How many stops from Sitabuldi to Khapri?"

## Expected Responses

### For "How to reach Lokmanya Nagar from Gondia?"

The AI should respond with:
```
Here's your journey plan from Gondia to Lokmanya Nagar, Nagpur:

1. Take an auto or Uber from your location in Gondia to Gondia Railway Station (approximately 5 km, 15 minutes)

2. Board a train from Gondia to Nagpur Junction (NGP)
   - Check available trains using the Spot tab
   - Journey time: approximately 2-3 hours

3. From Nagpur Junction, take an auto to Ajni Square Metro Station (approximately 2 km, 10 minutes)

4. Take the Aqua Line metro towards Sitabuldi
   - Board at Ajni Square (AJN)
   - Travel 3 stops northbound
   - Get off at Lokmanya Nagar (LNR)

5. Walk to your final destination (approximately 300 meters)

Total estimated time: 3-4 hours
```

## Verification Steps

1. **Check Metro Data Loading**
   - Open browser console
   - Look for any import errors from `nagpurMetroStations.ts`

2. **Test Station Lookup**
   - Ask "What is Lokmanya Nagar metro station?"
   - Should return station details with code LNR/LKN

3. **Test Journey Planning**
   - Ask journey from Gondia to any Nagpur metro station
   - Should include: Auto → Train → Metro steps

4. **Test Voice Agent**
   - Click microphone button
   - Say "How to reach Sitabuldi from Gondia"
   - Should hear voice response with journey plan

## Common Issues

### Issue: Metro stations not recognized
**Solution**: Check if `nagpurMetroStations.ts` is properly imported in `gemini.ts`

### Issue: Journey plan doesn't include metro
**Solution**: Ensure query mentions Nagpur or a Nagpur metro station name

### Issue: Voice agent doesn't mention metro
**Solution**: Check system instruction in `connectLive` function includes metro data

## Success Criteria

✅ AI recognizes all 17 Nagpur metro stations
✅ AI can differentiate between Aqua and Orange lines
✅ Journey plans include multi-modal routing (Auto → Train → Metro)
✅ Voice agent provides metro information naturally
✅ Distance calculations work for metro stations
✅ Interchange station (Lokmanya Nagar) is properly identified
