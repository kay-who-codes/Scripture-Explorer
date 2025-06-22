let verses = [];
let availableVersions = [];
let currentMode = 'verse';
let selectedVersion = 'all';

// Fetch the verses from the JSON file on load
fetch('bibles.json')
    .then(response => response.json())
    .then(data => {
        // Convert the data structure into a usable array
        verses = data.slice(1).map(verseEntry => {
            const location = verseEntry["Unnamed: 0"];
            const versions = Object.keys(verseEntry).filter(
                key => key !== "Unnamed: 0" && key !== "Unnamed: 4"
            );

            return {
                location: location,
                greek: verseEntry["Unnamed: 4"],
                versions: versions.map(version => ({
                    version: version,
                    name: data[0][version],
                    text: verseEntry[version],
                }))
            };
        });

        // Extract available versions
        if (verses.length > 0) {
            availableVersions = verses[0].versions.map(v => ({
                key: v.version,
                name: v.name
            }));
            populateVersionSelector();
        }

        console.log(`Loaded ${verses.length} verses with ${availableVersions.length} versions`);
    })
    .catch(error => console.error('Error loading verses:', error));

// Populate version selector dropdown
function populateVersionSelector() {
    const selector = document.getElementById('versionSelect');
    selector.innerHTML = '<option value="all">All Versions</option>';
    
    availableVersions.forEach(version => {
        const option = document.createElement('option');
        option.value = version.key;
        option.textContent = version.name;
        selector.appendChild(option);
    });
}

// Switch between verse and chapter modes
function switchMode(mode) {
    currentMode = mode;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(mode + 'Mode').classList.add('active');
    
    // Show/hide chapter controls
    const chapterControls = document.getElementById('chapterControls');
    const actionButton = document.getElementById('actionButton');
    
    if (mode === 'chapter') {
        chapterControls.style.display = 'block';
        actionButton.innerHTML = '<i class="fas fa-scroll"></i><span>Get Chapter</span>';
    } else {
        chapterControls.style.display = 'none';
        actionButton.innerHTML = '<i class="fas fa-dice"></i><span>Get Random Verse</span>';
    }
    
    clearContent();
}

// Update selected version
function updateVersionSelection() {
    selectedVersion = document.getElementById('versionSelect').value;
}

// Main action function
function performAction() {
    if (!verses.length) {
        showMessage("No verses loaded yet! Please wait...", 'error');
        return;
    }

    if (currentMode === 'verse') {
        getRandomVerse();
    } else {
        // In chapter mode, default to getting a specific chapter
        getSpecificChapter();
    }
}

// Get and display a random verse
function getRandomVerse() {
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    displayVerse(randomVerse);
}

// Get random chapter (called by the "Get Random Chapter" button)
function getRandomChapter() {
    if (!verses.length) {
        showMessage("No verses loaded yet! Please wait...", 'error');
        return;
    }

    // Add loading state to button
    const randomBtn = document.querySelector('.random-chapter');
    const originalContent = randomBtn.innerHTML;
    randomBtn.classList.add('loading');
    randomBtn.innerHTML = '<i class="fas fa-spinner"></i><span>Loading...</span>';
    
    // Group verses by book and chapter
    const chapters = groupVersesByChapter();
    const chapterKeys = Object.keys(chapters);
    
    if (chapterKeys.length === 0) {
        showMessage("No chapters available!", 'error');
        randomBtn.classList.remove('loading');
        randomBtn.innerHTML = originalContent;
        return;
    }
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
        const randomChapterKey = chapterKeys[Math.floor(Math.random() * chapterKeys.length)];
        displayChapter(randomChapterKey, chapters[randomChapterKey]);
        
        // Remove loading state
        randomBtn.classList.remove('loading');
        randomBtn.innerHTML = originalContent;
    }, 500);
}

// Get specific chapter (called by the "Get Chapter" button or main action button)
function getSpecificChapter() {
    if (!verses.length) {
        showMessage("No verses loaded yet! Please wait...", 'error');
        return;
    }

    const bookSelect = document.getElementById('bookSelect');
    const chapterInput = document.getElementById('chapterInput');
    const selectedBook = bookSelect.value.trim();
    const chapterNumber = chapterInput.value.trim();
    
    // Add loading state to button if it exists
    const specificBtn = document.querySelector('.specific-chapter');
    let originalContent = '';
    if (specificBtn) {
        originalContent = specificBtn.innerHTML;
        specificBtn.classList.add('loading');
        specificBtn.innerHTML = '<i class="fas fa-spinner"></i><span>Loading...</span>';
    }
    
    if (!selectedBook) {
        showMessage("Please select a book from the dropdown!", 'error');
        if (specificBtn) {
            specificBtn.classList.remove('loading');
            specificBtn.innerHTML = originalContent;
        }
        return;
    }
    
    if (!chapterNumber) {
        showMessage("Please enter a chapter number!", 'error');
        if (specificBtn) {
            specificBtn.classList.remove('loading');
            specificBtn.innerHTML = originalContent;
        }
        return;
    }
    
    const chapters = groupVersesByChapter();
    const searchKey = `${selectedBook.toLowerCase()} ${chapterNumber}`;
    
    // Find matching chapter (case-insensitive)
    const matchingKey = Object.keys(chapters).find(key => {
        const keyLower = key.toLowerCase();
        return keyLower === searchKey || 
               keyLower.startsWith(`${selectedBook.toLowerCase()} ${chapterNumber}`);
    });
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
        if (matchingKey) {
            displayChapter(matchingKey, chapters[matchingKey]);
        } else {
            showMessage(`Chapter not found: ${selectedBook} ${chapterNumber}. Please check the book name and chapter number.`, 'error');
        }
        
        // Remove loading state
        if (specificBtn) {
            specificBtn.classList.remove('loading');
            specificBtn.innerHTML = originalContent;
        }
    }, 300);
}

// Group verses by chapter
function groupVersesByChapter() {
    const chapters = {};
    
    verses.forEach(verse => {
        // Extract book and chapter from location (e.g., "John 3:16" -> "john 3")
        const match = verse.location.match(/^(.+?)\s+(\d+):/);
        if (match) {
            const book = match[1].toLowerCase();
            const chapter = match[2];
            const chapterKey = `${book} ${chapter}`;
            
            if (!chapters[chapterKey]) {
                chapters[chapterKey] = [];
            }
            chapters[chapterKey].push(verse);
        }
    });
    
    return chapters;
}

// Display a single verse
function displayVerse(verseData) {
    document.getElementById('location').innerHTML = `<i class="fas fa-map-marker-alt"></i>${verseData.location}`;
    
    const contentDiv = document.getElementById('versionContent');
    let content = '';
    
    const versionsToShow = selectedVersion === 'all' 
        ? verseData.versions 
        : verseData.versions.filter(v => v.version === selectedVersion);
    
    if (versionsToShow.length === 0) {
        content = '<div class="loading-state"><i class="fas fa-exclamation-triangle"></i><h3>Version Not Available</h3><p>Selected version not available for this verse</p></div>';
    } else {
        versionsToShow.forEach(version => {
            content += `
                <div class="version-block">
                    <div class="version-name">${version.name}</div>
                    <div class="verse-text">${version.text}</div>
                </div>
            `;
        });
        
        if (verseData.greek && verseData.greek.trim()) {
            content += `
                <div class="version-block">
                    <div class="version-name">Original Greek</div>
                    <div class="greek-text">${verseData.greek}</div>
                </div>
            `;
        }
    }
    
    contentDiv.innerHTML = content;
}

// Display a chapter
function displayChapter(chapterKey, chapterVerses) {
    const [book, chapterNum] = chapterKey.split(' ');
    const formattedTitle = `${book.charAt(0).toUpperCase() + book.slice(1)} Chapter ${chapterNum}`;
    
    document.getElementById('location').innerHTML = `<i class="fas fa-scroll"></i>${formattedTitle}`;
    
    const contentDiv = document.getElementById('versionContent');
    let content = '';
    
    // Sort verses by verse number
    chapterVerses.sort((a, b) => {
        const aVerse = parseInt(a.location.split(':')[1]) || 0;
        const bVerse = parseInt(b.location.split(':')[1]) || 0;
        return aVerse - bVerse;
    });
    
    if (selectedVersion === 'all') {
        // Show all versions for each verse
        chapterVerses.forEach(verse => {
            content += `<div class="version-block">`;
            content += `<div class="version-name">${verse.location}</div>`;
            
            verse.versions.forEach(version => {
                content += `
                    <div style="margin-bottom: 15px;">
                        <strong>${version.name}:</strong><br>
                        <span class="verse-text">${version.text}</span>
                    </div>
                `;
            });
            content += `</div>`;
        });
    } else {
        // Show selected version only
        const selectedVersionName = availableVersions.find(v => v.key === selectedVersion)?.name || selectedVersion;
        content += `<div class="version-block">`;
        content += `<div class="version-name">${selectedVersionName}</div>`;
        
        chapterVerses.forEach(verse => {
            const versionData = verse.versions.find(v => v.version === selectedVersion);
            if (versionData) {
                const verseNum = verse.location.split(':')[1];
                content += `
                    <p class="verse-text">
                        <strong>${verseNum}</strong> ${versionData.text}
                    </p>
                `;
            }
        });
        content += `</div>`;
    }
    
    if (!content) {
        content = '<div class="loading-state"><i class="fas fa-exclamation-triangle"></i><h3>No Verses Found</h3><p>No verses found for this chapter</p></div>';
    }
    
    contentDiv.innerHTML = content;
}

// Clear content
function clearContent() {
    const locationElement = document.getElementById('location');
    const contentElement = document.getElementById('versionContent');
    
    if (currentMode === 'verse') {
        locationElement.innerHTML = '<i class="fas fa-map-marker-alt"></i>Welcome to Scripture Explorer';
        contentElement.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-dove"></i>
                <h3>Ready to explore Scripture</h3>
                <p>Click the button below to get a random verse</p>
            </div>
        `;
    } else {
        locationElement.innerHTML = '<i class="fas fa-scroll"></i>Chapter Explorer';
        contentElement.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-book-open"></i>
                <h3>Chapter Mode Active</h3>
                <p>Select a book and chapter, then click a button to begin</p>
            </div>
        `;
    }
}

// Show message
function showMessage(message, type = 'info') {
    const contentDiv = document.getElementById('versionContent');
    const icon = type === 'error' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';
    const title = type === 'error' ? 'Error' : 'Information';
    
    contentDiv.innerHTML = `
        <div class="loading-state">
            <i class="${icon}"></i>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}

// Validate chapter input when book is selected
function validateChapterInput() {
    const bookSelect = document.getElementById('bookSelect');
    const chapterInput = document.getElementById('chapterInput');
    const specificBtn = document.querySelector('.specific-chapter');
    
    const hasBook = bookSelect.value.trim() !== '';
    const hasChapter = chapterInput.value.trim() !== '';
    
    if (specificBtn) {
        specificBtn.disabled = !hasBook || !hasChapter;
    }
}

// Add event listeners for real-time validation
document.addEventListener('DOMContentLoaded', () => {
    clearContent();
    
    // Add event listeners for validation
    const bookSelect = document.getElementById('bookSelect');
    const chapterInput = document.getElementById('chapterInput');
    
    if (bookSelect) {
        bookSelect.addEventListener('change', validateChapterInput);
    }
    
    if (chapterInput) {
        chapterInput.addEventListener('input', validateChapterInput);
        
        // Allow Enter key to trigger get chapter
        chapterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && currentMode === 'chapter') {
                getSpecificChapter();
            }
        });
    }
});

// Background click functionality (only for verse mode)
document.body.addEventListener('click', (event) => {
    if (currentMode === 'verse' && !document.getElementById('verseContainer').contains(event.target)) {
        getRandomVerse();
    }
});