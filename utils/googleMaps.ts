async function getDistance(start: string, destination: string): Promise<number> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error("Google Maps API-nyckel saknas i miljövariabler.");
    }
  
    // Vi anropar Google Maps Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(start)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
  
    const response = await fetch(url);
    const data = await response.json();
  
    if (data.status !== "OK") {
      throw new Error(`Google Maps API fel: ${data.status}`);
    }
  
    const element = data.rows[0].elements[0];
  
    if (element.status !== "OK") {
      throw new Error(`Kunde inte beräkna avstånd: ${element.status}. Kontrollera stavning på platserna.`);
    }
  
    // Avståndet kommer i meter, så vi delar med 1000 för att få kilometer
    const distanceInKm = element.distance.value / 1000;
    return distanceInKm;
  }