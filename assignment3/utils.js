function getWindDirection(degrees) {
    while (degrees > 360) {
        degrees -= 360;
    }

    while(degrees < 0) {
        degrees += 360;
    }

    if (degrees > 337.5) return 'N';
    if (degrees > 292.5) return 'NW';
    if (degrees > 247.5) return 'W';
    if (degrees > 202.5) return 'SW';
    if (degrees > 157.5) return 'S';
    if (degrees > 122.5) return 'SE';
    if (degrees > 67.5) return 'E';
    if (degrees > 22.5) return 'NE';
    return 'N';
}

function getCurrentTimeString() {
    const now = new Date();

    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    return `${timeString}, ${dateString}`;
}

module.exports = {
    getWindDirection, getCurrentTimeString
};

