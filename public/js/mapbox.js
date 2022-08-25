// Moved to index.js
// data-locations attrib in the html can be retrieved from dataset
// const locations = JSON.parse(document.getElementById('map').dataset.locations)

export const displayMap = (locations) =>
{
    // Using Leaflet instead
    const map = L.map('map', {zoomControl: false})
     
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',}).addTo(map)
    
    const greenIcon = L.icon({
        iconUrl: '/img/pin.png',
        iconSize: [32, 40],
        iconAnchor: [16, 45],
        popupAnchor: [0, -50],
    })
    
    const points = []
    locations.forEach((loc) => 
    {
        points.push([loc.coordinates[1], loc.coordinates[0]])
        L.marker([loc.coordinates[1], loc.coordinates[0]]/*, {icon: greenIcon}*/)
            .addTo(map)
            .bindPopup(`<h1>Day ${loc.day}: ${loc.description}</h1>`, {autoClose: false})
            .openPopup()
    })
     
    const bounds = L.latLngBounds(points).pad(0.5)
    map.fitBounds(bounds)
    
    // map.scrollWheelZoom.disable()
}