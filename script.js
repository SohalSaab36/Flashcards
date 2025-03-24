// DOM Elements
const cardFront = document.getElementById('card-front');
const cardBack = document.getElementById('card-back');
const addCardBtn = document.getElementById('add-card-btn');
const clearBtn = document.getElementById('clear-btn');
const flashcardsList = document.getElementById('flashcards-list');
const cardModal = document.getElementById('card-modal');
const closeModal = document.querySelector('.close-modal');
const flipCardBtn = document.getElementById('flip-card');
const prevCardBtn = document.getElementById('prev-card');
const nextCardBtn = document.getElementById('next-card');
const cardInner = document.querySelector('.card-inner');
const searchInput = document.getElementById('search-cards');
const deckFilter = document.getElementById('deck-filter');

// Flashcards Data
let flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
let currentCardIndex = 0;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    renderFlashcards();
});

addCardBtn.addEventListener('click', addFlashcard);
clearBtn.addEventListener('click', clearInputs);
closeModal.addEventListener('click', closeCardModal);
flipCardBtn.addEventListener('click', flipCard);
prevCardBtn.addEventListener('click', showPreviousCard);
nextCardBtn.addEventListener('click', showNextCard);
searchInput.addEventListener('input', filterFlashcards);
deckFilter.addEventListener('change', filterFlashcards);

// Functions
function addFlashcard() {
    const front = cardFront.value.trim();
    const back = cardBack.value.trim();
    
    if (front === '' || back === '') {
        showNotification('Please fill in both sides of the flashcard.');
        return;
    }
    
    const newCard = {
        id: Date.now(),
        front,
        back,
        date: new Date().toISOString()
    };
    
    flashcards.unshift(newCard);
    saveFlashcards();
    renderFlashcards();
    clearInputs();
    showNotification('Flashcard added successfully!');
}

function clearInputs() {
    cardFront.value = '';
    cardBack.value = '';
    cardFront.focus();
}

function renderFlashcards() {
    if (flashcards.length === 0) {
        flashcardsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <p>No flashcards yet. Create your first one above!</p>
            </div>
        `;
        return;
    }
    
    flashcardsList.innerHTML = '';
    
    flashcards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'flashcard-item';
        cardElement.dataset.id = card.id;
        
        // Create inner content separately for sanitization
        const termElement = document.createElement('div');
        termElement.className = 'flashcard-term';
        termElement.textContent = card.front;
        
        const peekElement = document.createElement('div');
        peekElement.className = 'flashcard-peek';
        peekElement.textContent = 'Click to reveal answer';
        
        const actionsElement = document.createElement('div');
        actionsElement.className = 'card-actions';
        actionsElement.innerHTML = `
            <button class="edit-card" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="delete-card" title="Delete"><i class="fas fa-trash"></i></button>
        `;
        
        cardElement.appendChild(termElement);
        cardElement.appendChild(peekElement);
        cardElement.appendChild(actionsElement);
        
        cardElement.addEventListener('click', (e) => {
            if (!e.target.closest('.edit-card') && !e.target.closest('.delete-card')) {
                openCardModal(index);
            }
        });
        
        const editBtn = cardElement.querySelector('.edit-card');
        const deleteBtn = cardElement.querySelector('.delete-card');
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editFlashcard(card.id);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFlashcard(card.id);
        });
        
        flashcardsList.appendChild(cardElement);
    });
}

function saveFlashcards() {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
}

function deleteFlashcard(id) {
    if (confirm('Are you sure you want to delete this flashcard?')) {
        flashcards = flashcards.filter(card => card.id !== id);
        saveFlashcards();
        renderFlashcards();
        showNotification('Flashcard deleted successfully!');
    }
}

function editFlashcard(id) {
    const card = flashcards.find(card => card.id === id);
    
    if (card) {
        cardFront.value = card.front;
        cardBack.value = card.back;
        
        // Remove the old card
        flashcards = flashcards.filter(c => c.id !== id);
        
        // Focus on the front textarea
        cardFront.focus();
        
        // Scroll to the card creation form
        document.querySelector('.flashcard-creator').scrollIntoView({ behavior: 'smooth' });
    }
}

function openCardModal(index) {
    currentCardIndex = index;
    updateModalCard();
    
    // Reset the flip state
    cardInner.classList.remove('flipped');
    
    // Show the modal
    cardModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCardModal() {
    cardModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function updateModalCard() {
    const card = flashcards[currentCardIndex];
    
    if (card) {
        const frontContent = document.querySelector('.card-front p');
        const backContent = document.querySelector('.card-back p');
        
        // Use innerHTML to allow MathJax rendering
        frontContent.innerHTML = card.front;
        backContent.innerHTML = card.back;
        
        // Trigger MathJax to process new content
        if (window.MathJax) {
            MathJax.typesetPromise([frontContent, backContent]).catch(function (err) {
                console.log('MathJax error:', err);
            });
        }
        
        // Update navigation button states
        prevCardBtn.disabled = currentCardIndex === flashcards.length - 1;
        nextCardBtn.disabled = currentCardIndex === 0;
    }
}

function flipCard() {
    cardInner.classList.toggle('flipped');
}

function showPreviousCard() {
    if (currentCardIndex < flashcards.length - 1) {
        currentCardIndex++;
        cardInner.classList.remove('flipped');
        updateModalCard();
    }
}

function showNextCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        cardInner.classList.remove('flipped');
        updateModalCard();
    }
}

function filterFlashcards() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = deckFilter.value;
    
    let filteredCards = [...flashcards];
    
    // Apply search filter
    if (searchTerm) {
        filteredCards = filteredCards.filter(card => 
            card.front.toLowerCase().includes(searchTerm) || 
            card.back.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply deck filter
    if (filterValue === 'recent') {
        // Sort by date (newest first)
        filteredCards.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // Temporarily set the filtered cards and render
    const originalCards = [...flashcards];
    flashcards = filteredCards;
    renderFlashcards();
    flashcards = originalCards;
}

function showNotification(message) {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Add the necessary CSS for notifications
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background-color: var(--primary-color);
                color: white;
                border-radius: var(--radius);
                box-shadow: var(--shadow);
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
                z-index: 1000;
            }
            .notification.show {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Close the modal when clicking outside of it
window.addEventListener('click', (e) => {
    if (e.target === cardModal) {
        closeCardModal();
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Only handle keyboard shortcuts if the modal is open
    if (cardModal.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeCardModal();
        } else if (e.key === ' ' || e.key === 'Enter') {
            flipCard();
        } else if (e.key === 'ArrowLeft') {
            showPreviousCard();
        } else if (e.key === 'ArrowRight') {
            showNextCard();
        }
    }
}); 